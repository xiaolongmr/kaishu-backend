/**
 * 管理员路由模块
 * 处理管理员权限相关的功能
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// 配置multer用于数据库文件上传
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 用户管理
router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);
router.post('/users', authenticateToken, requireAdmin, adminController.createUser);
router.put('/users/:id', authenticateToken, requireAdmin, adminController.updateUser);
router.put('/users/:id/password', authenticateToken, requireAdmin, adminController.updateUserPassword);
router.delete('/users/:id', authenticateToken, requireAdmin, adminController.deleteUser);
router.patch('/users/:id/status', authenticateToken, requireAdmin, adminController.updateUserStatus);

// 作品管理
router.get('/works', authenticateToken, requireAdmin, adminController.getAllWorks);
router.delete('/works/:id', authenticateToken, requireAdmin, adminController.deleteWork);
router.patch('/works/:id/featured', authenticateToken, requireAdmin, adminController.setWorkFeatured);
router.patch('/works/:id/privacy', authenticateToken, requireAdmin, adminController.setWorkPrivacy);

// 系统统计
router.get('/stats/overview', authenticateToken, requireAdmin, adminController.getSystemOverview);
router.get('/stats/users', authenticateToken, requireAdmin, adminController.getUserStats);

// 数据导入导出
router.get('/export', authenticateToken, requireAdmin, adminController.exportData);
router.post('/import', authenticateToken, requireAdmin, upload.single('database'), adminController.importData);

// 首页内容管理
router.get('/homepage', authenticateToken, requireAdmin, adminController.getHomepageContent);
router.put('/homepage/:contentKey', authenticateToken, requireAdmin, adminController.updateHomepageContent);
router.post('/homepage/batch', authenticateToken, requireAdmin, adminController.batchUpdateHomepage);

// 系统设置
router.get('/settings', authenticateToken, requireAdmin, adminController.getSystemSettings);
router.put('/settings', authenticateToken, requireAdmin, adminController.updateSystemSettings);

// 数据库管理
router.get('/database/status', authenticateToken, requireAdmin, adminController.getDatabaseStatus);
router.post('/database/optimize', authenticateToken, requireAdmin, adminController.optimizeDatabase);

module.exports = router;