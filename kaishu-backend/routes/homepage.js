/**
 * 首页内容管理路由模块
 * 处理首页内容的获取和管理
 */

const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// 获取首页内容（公开接口）
router.get('/', optionalAuth, homepageController.getHomepageContent);

// 获取首页配置（管理员）
router.get('/admin', authenticateToken, requireAdmin, homepageController.getAdminHomepageContent);

// 更新首页内容项（管理员）
router.put('/admin/:contentKey', authenticateToken, requireAdmin, homepageController.updateHomepageContent);

// 批量更新首页内容（管理员）
router.post('/admin/batch', authenticateToken, requireAdmin, homepageController.batchUpdateHomepage);

// 重置首页内容为默认值（管理员）
router.post('/admin/reset', authenticateToken, requireAdmin, homepageController.resetHomepageContent);

// 预览首页内容（管理员）
router.post('/admin/preview', authenticateToken, requireAdmin, homepageController.previewHomepageContent);

// 获取首页统计数据
router.get('/stats', optionalAuth, homepageController.getHomepageStats);

// 获取首页推荐内容
router.get('/recommendations', optionalAuth, homepageController.getRecommendations);

// 获取首页轮播图
router.get('/carousel', optionalAuth, homepageController.getCarouselItems);

// 管理轮播图（管理员）
router.post('/admin/carousel', authenticateToken, requireAdmin, homepageController.addCarouselItem);
router.put('/admin/carousel/:id', authenticateToken, requireAdmin, homepageController.updateCarouselItem);
router.delete('/admin/carousel/:id', authenticateToken, requireAdmin, homepageController.deleteCarouselItem);

module.exports = router;