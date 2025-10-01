/**
 * 路由入口文件
 * 统一管理所有路由模块
 */

const express = require('express');
const router = express.Router();

// 导入各个路由模块
const authRoutes = require('./auth');
const worksRoutes = require('./works');
const annotationsRoutes = require('./annotations');
const adminRoutes = require('./admin');
const healthRoutes = require('./health');
const ocrRoutes = require('./ocr');
const homepageRoutes = require('./homepage');
const commentRoutes = require('./comments');
const groupsRoutes = require('./groups');

// 注册路由
router.use('/auth', authRoutes);
router.use('/works', worksRoutes);
router.use('/annotations', annotationsRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/ocr', ocrRoutes);
router.use('/baidu-ocr', ocrRoutes); // 兼容旧路径
router.use('/homepage', homepageRoutes);
router.use('/comment-settings', commentRoutes);
router.use('/groups', groupsRoutes);

// 兼容性路由 - 前端使用的旧API端点
router.use('/upload', worksRoutes); // 将 /api/upload 重定向到 works 路由
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
      comments: '/api/comment-settings'
    }
  });
});

module.exports = router;