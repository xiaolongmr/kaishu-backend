/**
 * 用户认证控制器
 * 处理用户认证相关的业务逻辑
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { databaseService } = require('../services/databaseService');
const { validateInput } = require('../utils/validators');
const { generateToken, verifyToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

class AuthController {
  /**
   * 用户登录
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // 输入验证
      const validation = validateInput({ username, password }, {
        username: { required: true, type: 'string', minLength: 3 },
        password: { required: true, type: 'string', minLength: 6 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }

      // 查找用户
      const result = await databaseService.query(
        'SELECT id, username, password, is_admin FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        logger.warn(`登录失败：用户不存在 - ${username}`);
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      const user = result.rows[0];

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logger.warn(`登录失败：密码错误 - ${username}`);
        return res.status(401).json({ error: '用户名或密码错误' });
      }

      // 生成token
      const token = generateToken({
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin
      });

      // 更新最后登录时间
      await databaseService.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      logger.info(`用户登录成功 - ${username}`);
      
      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin
        }
      });
    } catch (error) {
      logger.error('登录失败:', error);
      res.status(500).json({ error: '登录失败，请稍后重试' });
    }
  }

  /**
   * 用户注册
   */
  async register(req, res) {
    try {
      const { username, password, email } = req.body;
      
      // 输入验证
      const validation = validateInput({ username, password, email }, {
        username: { required: true, type: 'string', minLength: 3, maxLength: 50 },
        password: { required: true, type: 'string', minLength: 6, maxLength: 100 },
        email: { required: false, type: 'email' }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }

      // 检查用户名是否已存在
      const existingUser = await databaseService.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: '用户名已存在' });
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);

      // 创建用户
      const result = await databaseService.query(
        'INSERT INTO users (username, password, email, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, is_admin',
        [username, hashedPassword, email || null]
      );

      const newUser = result.rows[0];

      // 生成token
      const token = generateToken({
        userId: newUser.id,
        username: newUser.username,
        isAdmin: newUser.is_admin
      });

      logger.info(`新用户注册成功 - ${username}`);
      
      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          isAdmin: newUser.is_admin
        }
      });
    } catch (error) {
      logger.error('注册失败:', error);
      res.status(500).json({ error: '注册失败，请稍后重试' });
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.userId;
      
      const result = await databaseService.query(
        'SELECT id, username, email, is_admin, created_at, last_login FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const user = result.rows[0];
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.is_admin,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      logger.error('获取用户信息失败:', error);
      res.status(500).json({ error: '获取用户信息失败' });
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: '缺少token' });
      }

      // 验证token
      const decoded = verifyToken(token);
      
      // 检查用户是否仍然存在
      const result = await databaseService.query(
        'SELECT id, username, is_admin FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: '用户不存在' });
      }

      const user = result.rows[0];

      // 生成新token
      const newToken = generateToken({
        userId: user.id,
        username: user.username,
        isAdmin: user.is_admin
      });

      res.json({
        message: 'Token刷新成功',
        token: newToken
      });
    } catch (error) {
      logger.error('Token刷新失败:', error);
      res.status(401).json({ error: 'Token无效或已过期' });
    }
  }

  /**
   * 用户登出
   */
  async logout(req, res) {
    try {
      // 这里可以实现token黑名单机制
      // 目前简单返回成功
      logger.info(`用户登出 - ${req.user.username}`);
      res.json({ message: '登出成功' });
    } catch (error) {
      logger.error('登出失败:', error);
      res.status(500).json({ error: '登出失败' });
    }
  }

  /**
   * 修改密码
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      
      // 输入验证
      const validation = validateInput({ currentPassword, newPassword }, {
        currentPassword: { required: true, type: 'string' },
        newPassword: { required: true, type: 'string', minLength: 6, maxLength: 100 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }

      // 获取当前密码
      const result = await databaseService.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      const user = result.rows[0];

      // 验证当前密码
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: '当前密码错误' });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // 更新密码
      await databaseService.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedNewPassword, userId]
      );

      logger.info(`用户修改密码成功 - ${req.user.username}`);
      res.json({ message: '密码修改成功' });
    } catch (error) {
      logger.error('修改密码失败:', error);
      res.status(500).json({ error: '修改密码失败' });
    }
  }

  /**
   * 忘记密码
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: '请提供邮箱地址' });
      }

      // 查找用户
      const result = await databaseService.query(
        'SELECT id, username FROM users WHERE email = $1',
        [email]
      );

      // 无论用户是否存在，都返回成功消息（安全考虑）
      res.json({ message: '如果邮箱存在，重置密码链接已发送' });

      if (result.rows.length > 0) {
        // TODO: 实现发送重置密码邮件的逻辑
        logger.info(`密码重置请求 - ${email}`);
      }
    } catch (error) {
      logger.error('忘记密码处理失败:', error);
      res.status(500).json({ error: '处理失败，请稍后重试' });
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      // 输入验证
      const validation = validateInput({ token, newPassword }, {
        token: { required: true, type: 'string' },
        newPassword: { required: true, type: 'string', minLength: 6, maxLength: 100 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }

      // TODO: 验证重置token并更新密码
      res.json({ message: '密码重置成功' });
    } catch (error) {
      logger.error('重置密码失败:', error);
      res.status(500).json({ error: '重置密码失败' });
    }
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: '缺少验证token' });
      }

      // TODO: 实现邮箱验证逻辑
      res.json({ message: '邮箱验证成功' });
    } catch (error) {
      logger.error('邮箱验证失败:', error);
      res.status(500).json({ error: '邮箱验证失败' });
    }
  }

  /**
   * 重新发送验证邮件
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: '请提供邮箱地址' });
      }

      // TODO: 实现重新发送验证邮件的逻辑
      res.json({ message: '验证邮件已重新发送' });
    } catch (error) {
      logger.error('重新发送验证邮件失败:', error);
      res.status(500).json({ error: '发送失败，请稍后重试' });
    }
  }
}

module.exports = new AuthController();