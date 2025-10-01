/**
 * 作品管理路由模块
 * 处理作品上传、查看、编辑、删除等功能
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const worksController = require('../controllers/worksController');
const { authenticateToken, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');
const { validateInput } = require('../utils/validators');
const logger = require('../utils/logger');

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
    
    // 生成安全的文件名（避免特殊字符和路径问题）
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    
    // 使用时间戳和随机数生成唯一文件名，避免中文字符在文件系统中的问题
    const safeFilename = `upload_${timestamp}_${randomSuffix}${ext}`;
    
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // 最多5个文件
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 上传作品
router.post('/', authenticateToken, upload.single('calligraphy'), worksController.uploadWork);

// 批量上传作品
router.post('/batch', authenticateToken, upload.array('files', 10), worksController.batchUploadWorks);

// 获取所有作品列表
router.get('/', optionalAuth, worksController.getWorks);

// 获取用户的作品
router.get('/user/:userId', optionalAuth, worksController.getUserWorks);

// 获取我的作品
router.get('/my', authenticateToken, worksController.getMyWorks);

// 获取单个作品详情
router.get('/:id', optionalAuth, worksController.getWorkById);

// 更新作品信息
router.put('/:id', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), worksController.updateWork);

// 删除作品
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), worksController.deleteWork);

// 获取作品的标注
router.get('/:id/annotations', optionalAuth, worksController.getWorkAnnotations);

// 作品统计信息
router.get('/:id/stats', optionalAuth, worksController.getWorkStats);

// 设置作品隐私
router.patch('/:id/privacy', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), worksController.setWorkPrivacy);

// 作品分享
router.post('/:id/share', authenticateToken, worksController.shareWork);

// 收藏作品
router.post('/:id/favorite', authenticateToken, worksController.favoriteWork);

// 取消收藏
router.delete('/:id/favorite', authenticateToken, worksController.unfavoriteWork);

// 获取收藏的作品
router.get('/favorites/list', authenticateToken, worksController.getFavoriteWorks);

// 作品搜索
router.get('/search/query', optionalAuth, worksController.searchWorks);

// 获取热门作品
router.get('/trending/list', optionalAuth, worksController.getTrendingWorks);

// 获取最新作品
router.get('/recent/list', optionalAuth, worksController.getRecentWorks);

// 作品标签管理
router.post('/:id/tags', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), worksController.addWorkTags);
router.delete('/:id/tags', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), worksController.removeWorkTags);

// 获取所有标签
router.get('/tags/list', worksController.getAllTags);

// 按标签获取作品
router.get('/tags/:tag', optionalAuth, worksController.getWorksByTag);

module.exports = router;