/**
 * JWT Token 工具函数
 * 处理token的生成、验证和管理
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'kaishu_secret_key_please_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * 生成访问token
 * @param {Object} payload - token载荷
 * @param {Object} options - 选项
 * @returns {string} JWT token
 */
const generateToken = (payload, options = {}) => {
  const {
    expiresIn = JWT_EXPIRES_IN,
    issuer = 'kaishu-app',
    audience = 'kaishu-users'
  } = options;

  try {
    const token = jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID() // JWT ID，用于token唯一标识
      },
      JWT_SECRET,
      {
        expiresIn,
        issuer,
        audience,
        algorithm: 'HS256'
      }
    );

    return token;
  } catch (error) {
    throw new Error(`Token生成失败: ${error.message}`);
  }
};

/**
 * 生成刷新token
 * @param {Object} payload - token载荷
 * @returns {string} 刷新token
 */
const generateRefreshToken = (payload) => {
  return generateToken(
    { ...payload, type: 'refresh' },
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * 验证token
 * @param {string} token - JWT token
 * @param {Object} options - 验证选项
 * @returns {Object} 解码后的载荷
 */
const verifyToken = (token, options = {}) => {
  const {
    issuer = 'kaishu-app',
    audience = 'kaishu-users'
  } = options;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer,
      audience,
      algorithms: ['HS256']
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token已过期');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Token格式无效');
    }
    if (error.name === 'NotBeforeError') {
      throw new Error('Token尚未生效');
    }
    
    throw new Error(`Token验证失败: ${error.message}`);
  }
};

/**
 * 解码token（不验证签名）
 * @param {string} token - JWT token
 * @returns {Object} 解码后的载荷
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    throw new Error(`Token解码失败: ${error.message}`);
  }
};

/**
 * 检查token是否即将过期
 * @param {string} token - JWT token
 * @param {number} thresholdMinutes - 阈值（分钟）
 * @returns {boolean} 是否即将过期
 */
const isTokenExpiringSoon = (token, thresholdMinutes = 30) => {
  try {
    const decoded = decodeToken(token);
    const exp = decoded.payload.exp;
    const now = Math.floor(Date.now() / 1000);
    const threshold = thresholdMinutes * 60;
    
    return (exp - now) <= threshold;
  } catch (error) {
    return true; // 如果无法解码，认为需要刷新
  }
};

/**
 * 从请求头中提取token
 * @param {Object} req - Express请求对象
 * @returns {string|null} token或null
 */
const extractTokenFromRequest = (req) => {
  // 从Authorization头中提取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从查询参数中提取
  if (req.query.token) {
    return req.query.token;
  }
  
  // 从cookie中提取
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
};

/**
 * 生成API密钥
 * @param {number} length - 密钥长度
 * @returns {string} API密钥
 */
const generateApiKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * 生成安全的随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
const generateSecureRandom = (length = 16) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * 创建token黑名单管理器
 */
class TokenBlacklist {
  constructor() {
    this.blacklist = new Set();
    this.cleanup();
  }

  /**
   * 将token加入黑名单
   * @param {string} token - JWT token
   */
  add(token) {
    try {
      const decoded = decodeToken(token);
      const jti = decoded.payload.jti;
      if (jti) {
        this.blacklist.add(jti);
      }
    } catch (error) {
      // 忽略无效token
    }
  }

  /**
   * 检查token是否在黑名单中
   * @param {string} token - JWT token
   * @returns {boolean} 是否在黑名单中
   */
  isBlacklisted(token) {
    try {
      const decoded = decodeToken(token);
      const jti = decoded.payload.jti;
      return jti ? this.blacklist.has(jti) : false;
    } catch (error) {
      return true; // 无效token视为黑名单
    }
  }

  /**
   * 清理过期的黑名单条目
   */
  cleanup() {
    // 每小时清理一次过期的黑名单条目
    setInterval(() => {
      // 这里可以实现更复杂的清理逻辑
      // 目前简单地清空所有条目（在生产环境中应该使用数据库存储）
      if (this.blacklist.size > 10000) {
        this.blacklist.clear();
      }
    }, 60 * 60 * 1000);
  }
}

// 创建全局黑名单实例
const tokenBlacklist = new TokenBlacklist();

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  isTokenExpiringSoon,
  extractTokenFromRequest,
  generateApiKey,
  generateSecureRandom,
  tokenBlacklist,
  TokenBlacklist
};