/**
 * 用户认证路由模块
 * 处理用户登录、注册、权限验证等功能
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 用户登录
router.post('/login', authController.login);

// 用户注册
router.post('/register', authController.register);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 刷新token
router.post('/refresh', authController.refreshToken);

// 用户登出
router.post('/logout', authenticateToken, authController.logout);

// 修改密码
router.put('/password', authenticateToken, authController.changePassword);

// 忘记密码
router.post('/forgot-password', authController.forgotPassword);

// 重置密码
router.post('/reset-password', authController.resetPassword);

// 验证邮箱
router.post('/verify-email', authController.verifyEmail);

// 重新发送验证邮件
router.post('/resend-verification', authController.resendVerification);

module.exports = router;