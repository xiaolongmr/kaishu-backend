/**
 * 标注管理路由模块
 * 处理字符标注的创建、查看、编辑、删除等功能
 */

const express = require('express');
const router = express.Router();
const annotationsController = require('../controllers/annotationsController');
const { authenticateToken, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/auth');

// 创建标注
router.post('/', authenticateToken, rateLimit({ maxRequests: 100, windowMs: 15 * 60 * 1000 }), annotationsController.createAnnotation);

// 批量创建标注
router.post('/batch', authenticateToken, rateLimit({ maxRequests: 50, windowMs: 15 * 60 * 1000 }), annotationsController.batchCreateAnnotations);

// 获取所有标注
router.get('/', optionalAuth, annotationsController.getAnnotations);

// 获取标注统计
router.get('/stats', optionalAuth, annotationsController.getAnnotationStats);

// 获取标注数量
router.get('/count', optionalAuth, annotationsController.getAnnotationCount);

// 按字符名搜索标注
router.get('/search/:characterName', optionalAuth, annotationsController.searchAnnotationsByCharacter);

// 高级搜索标注
router.get('/search', optionalAuth, annotationsController.advancedSearchAnnotations);

// 获取用户的标注
router.get('/user/:userId', optionalAuth, annotationsController.getUserAnnotations);

// 获取我的标注
router.get('/my', authenticateToken, annotationsController.getMyAnnotations);

// 获取单个标注详情
router.get('/:id', optionalAuth, annotationsController.getAnnotationById);

// 更新标注
router.put('/:id', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), annotationsController.updateAnnotation);

// 删除标注
router.delete('/:id', authenticateToken, requireOwnershipOrAdmin('id', 'user_id'), annotationsController.deleteAnnotation);

// 批量删除标注
router.delete('/batch', authenticateToken, annotationsController.batchDeleteAnnotations);

// 验证标注（管理员功能）
router.patch('/:id/verify', authenticateToken, annotationsController.verifyAnnotation);

// 标注质量评分
router.post('/:id/rate', authenticateToken, annotationsController.rateAnnotation);

// 获取标注的评分
router.get('/:id/ratings', optionalAuth, annotationsController.getAnnotationRatings);

// 导出标注数据
router.get('/export/data', authenticateToken, annotationsController.exportAnnotations);

// 获取字符统计
router.get('/characters/stats', optionalAuth, annotationsController.getCharacterStats);

// 获取热门字符
router.get('/characters/trending', optionalAuth, annotationsController.getTrendingCharacters);

// 获取字符详情
router.get('/characters/:character', optionalAuth, annotationsController.getCharacterDetails);

// 获取相似字符
router.get('/characters/:character/similar', optionalAuth, annotationsController.getSimilarCharacters);

// 标注历史记录
router.get('/:id/history', optionalAuth, annotationsController.getAnnotationHistory);

// 恢复已删除的标注
router.post('/:id/restore', authenticateToken, annotationsController.restoreAnnotation);

module.exports = router;