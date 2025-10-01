/**
 * 评论设置路由模块
 * 处理Twikoo评论系统的配置管理
 */

const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// 获取所有页面的评论设置
router.get('/', optionalAuth, commentsController.getAllCommentSettings);

// 获取特定页面的评论设置
router.get('/:pagePath', optionalAuth, commentsController.getCommentSettings);

// 更新页面评论设置（管理员）
router.put('/:pagePath', authenticateToken, requireAdmin, commentsController.updateCommentSettings);

// 批量更新评论设置（管理员）
router.post('/batch', authenticateToken, requireAdmin, commentsController.batchUpdateCommentSettings);

// 重置评论设置为默认值（管理员）
router.post('/reset', authenticateToken, requireAdmin, commentsController.resetCommentSettings);

// 获取评论统计
router.get('/stats/overview', authenticateToken, requireAdmin, commentsController.getCommentStats);

// 评论系统健康检查
router.get('/health/check', commentsController.checkCommentSystemHealth);

// 评论配置验证
router.post('/validate', authenticateToken, requireAdmin, commentsController.validateCommentConfig);

// 导出评论设置
router.get('/export/settings', authenticateToken, requireAdmin, commentsController.exportCommentSettings);

// 导入评论设置
router.post('/import/settings', authenticateToken, requireAdmin, commentsController.importCommentSettings);

module.exports = router;