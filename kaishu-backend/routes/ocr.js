/**
 * OCR识别路由模块
 * 处理百度OCR相关的API端点
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ocrController = require('../controllers/ocrController');
const { authenticateToken, rateLimit } = require('../middleware/auth');
const logger = require('../utils/logger');

// 配置multer用于OCR图片上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../临时图片'));
  },
  filename: function (req, file, cb) {
    // 处理中文文件名并保存到req对象
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    if (!req.originalFilenames) {
      req.originalFilenames = {};
    }
    req.originalFilenames[file.fieldname] = originalName;
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `ocr_${timestamp}_${randomSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，请上传图片文件'), false);
    }
  }
});

// 获取百度OCR访问令牌
router.get('/token', authenticateToken, rateLimit({ maxRequests: 10, windowMs: 60 * 1000 }), ocrController.getToken);

// OCR图像识别
router.post('/recognize', authenticateToken, rateLimit({ maxRequests: 20, windowMs: 60 * 1000 }), upload.single('image'), ocrController.recognizeImage);

// OCR文字检测（兼容旧接口）
router.post('/detect', authenticateToken, rateLimit({ maxRequests: 20, windowMs: 60 * 1000 }), upload.single('calligraphy'), ocrController.detectText);

// 批量OCR识别
router.post('/batch', authenticateToken, rateLimit({ maxRequests: 5, windowMs: 60 * 1000 }), upload.array('images', 5), ocrController.batchRecognize);

// OCR识别历史
router.get('/history', authenticateToken, ocrController.getRecognitionHistory);

// OCR识别统计
router.get('/stats', authenticateToken, ocrController.getRecognitionStats);

// 删除OCR识别记录
router.delete('/history/:id', authenticateToken, ocrController.deleteRecognitionRecord);

// 导出OCR识别结果
router.get('/export', authenticateToken, ocrController.exportRecognitionResults);

// OCR配置管理
router.get('/config', authenticateToken, ocrController.getOcrConfig);
router.put('/config', authenticateToken, ocrController.updateOcrConfig);

// OCR服务状态检查
router.get('/status', ocrController.checkOcrStatus);

module.exports = router;