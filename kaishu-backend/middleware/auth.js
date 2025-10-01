/**
 * 认证中间件
 * 处理JWT token验证和权限检查
 */

const jwt = require('jsonwebtoken');
const { verifyToken } = require('../utils/tokenUtils');
const logger = require('../utils/logger');

/**
 * JWT token验证中间件
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: '访问被拒绝',
        message: '需要提供有效的访问令牌' 
      });
    }

    // 验证token
    const decoded = verifyToken(token);
    req.user = decoded;
    
    logger.debug(`用户认证成功 - ${decoded.username} (${decoded.userId})`);
    next();
  } catch (error) {
    logger.warn('Token验证失败:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token已过期',
        message: '请重新登录' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token无效',
        message: '请提供有效的访问令牌' 
      });
    }
    
    return res.status(401).json({ 
      error: '认证失败',
      message: '无法验证访问令牌' 
    });
  }
};

/**
 * 管理员权限检查中间件
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: '未认证',
      message: '请先登录' 
    });
  }

  if (!req.user.isAdmin) {
    logger.warn(`非管理员用户尝试访问管理员功能 - ${req.user.username}`);
    return res.status(403).json({ 
      error: '权限不足',
      message: '需要管理员权限' 
    });
  }

  logger.debug(`管理员权限验证通过 - ${req.user.username}`);
  next();
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
      logger.debug(`可选认证成功 - ${decoded.username}`);
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求，但记录日志
    logger.debug('可选认证失败:', error.message);
    next();
  }
};

/**
 * 资源所有者权限检查中间件
 * 检查用户是否有权限访问特定资源
 */
const requireOwnershipOrAdmin = (resourceIdParam = 'id', userIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: '未认证',
          message: '请先登录' 
        });
      }

      // 管理员可以访问所有资源
      if (req.user.isAdmin) {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        return res.status(400).json({ 
          error: '参数错误',
          message: '缺少资源ID' 
        });
      }

      // 将资源ID和用户ID存储到req对象中，供后续中间件使用
      req.resourceId = resourceId;
      req.userIdField = userIdField;
      
      next();
    } catch (error) {
      logger.error('权限检查失败:', error);
      res.status(500).json({ 
        error: '权限检查失败',
        message: '服务器内部错误' 
      });
    }
  };
};

/**
 * 速率限制中间件
 * 基于用户ID或IP地址限制请求频率
 */
const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15分钟
    maxRequests = 100, // 最大请求数
    message = '请求过于频繁，请稍后再试'
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
    const now = Date.now();
    
    // 清理过期记录
    const userRequests = requests.get(key) || [];
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      logger.warn(`请求频率超限 - ${key}`);
      return res.status(429).json({ 
        error: '请求过于频繁',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

/**
 * 角色权限检查中间件
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: '未认证',
        message: '请先登录' 
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => 
      userRoles.includes(role) || (role === 'admin' && req.user.isAdmin)
    );

    if (!hasRequiredRole) {
      logger.warn(`用户角色权限不足 - ${req.user.username}, 需要角色: ${roles.join(', ')}`);
      return res.status(403).json({ 
        error: '权限不足',
        message: `需要以下角色之一: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  requireOwnershipOrAdmin,
  rateLimit,
  requireRole
};