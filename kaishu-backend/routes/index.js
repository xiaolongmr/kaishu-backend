/**
 * 路由入口文件
 * 统一管理所有路由模块
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// 导入各个路由模块
const authRoutes = require('./auth');
const worksRoutes = require('./works');
const annotationsRoutes = require('./annotations');
const adminRoutes = require('./admin');
const healthRoutes = require('./health');
const ocrRoutes = require('./ocr');
const homepageRoutes = require('./homepage');
const groupsRoutes = require('./groups');
const imageRoutes = require('./image'); // 导入图片路由

// 导入控制器和中间件
const worksController = require('../controllers/worksController');
const { authenticateToken } = require('../middleware/auth');

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../楷书库'));
  },
  filename: function (req, file, cb) {
    // 处理中文文件名 - 确保正确解码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // 保存原始文件名到req对象中，供控制器使用
    if (!req.originalFilenames) {
      req.originalFilenames = {};
    }
    req.originalFilenames[file.fieldname] = originalName;
    
    // 生成安全的文件名
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    
    const safeFilename = `upload_${timestamp}_${randomSuffix}${ext}`;
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 注册路由
router.use('/auth', authRoutes);
router.use('/works', worksRoutes);
router.use('/annotations', annotationsRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/ocr', ocrRoutes);
router.use('/baidu-ocr', ocrRoutes); // 兼容旧路径
router.use('/homepage', homepageRoutes);
router.use('/groups', groupsRoutes);
router.use('/images', imageRoutes); // 注册图片路由

// 已在server.js中直接注册/upload端点，这里不再重复注册

// 兼容性路由 - 前端使用的旧API端点
router.use('/search', annotationsRoutes); // 将 /api/search 重定向到 annotations 路由
router.use('/annotate', annotationsRoutes); // 将 /api/annotate 重定向到 annotations 路由
router.use('/crop-image', worksRoutes); // 将 /api/crop-image 重定向到 works 路由

// 根路径健康检查
router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '楷书字库 API 服务正常运行',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      works: '/api/works',
      annotations: '/api/annotations',
      admin: '/api/admin',
      health: '/api/health',
      ocr: '/api/ocr',
      homepage: '/api/homepage',
      images: '/api/images',
      upload: '/api/upload'  // 添加上传端点
    }
  });
});

module.exports = router;