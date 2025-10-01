/**
 * API响应格式化中间件
 * 统一API响应格式和数据结构
 */

const logger = require('../utils/logger');

/**
 * 标准响应格式
 */
class ApiResponse {
  constructor(success = true, data = null, message = null, meta = null) {
    this.success = success;
    this.timestamp = new Date().toISOString();
    
    if (data !== null) {
      this.data = data;
    }
    
    if (message !== null) {
      this.message = message;
    }
    
    if (meta !== null) {
      this.meta = meta;
    }
  }
  
  /**
   * 成功响应
   */
  static success(data = null, message = null, meta = null) {
    return new ApiResponse(true, data, message, meta);
  }
  
  /**
   * 错误响应
   */
  static error(message, errorCode = null, details = null) {
    const response = new ApiResponse(false, null, message);
    
    if (errorCode) {
      response.errorCode = errorCode;
    }
    
    if (details) {
      response.details = details;
    }
    
    return response;
  }
  
  /**
   * 分页响应
   */
  static paginated(data, pagination, message = null) {
    return new ApiResponse(true, data, message, { pagination });
  }
  
  /**
   * 列表响应
   */
  static list(items, total = null, message = null) {
    const meta = {};
    
    if (total !== null) {
      meta.total = total;
    }
    
    if (Array.isArray(items)) {
      meta.count = items.length;
    }
    
    return new ApiResponse(true, items, message, meta);
  }
  
  /**
   * 创建响应
   */
  static created(data, message = '创建成功') {
    return new ApiResponse(true, data, message);
  }
  
  /**
   * 更新响应
   */
  static updated(data = null, message = '更新成功') {
    return new ApiResponse(true, data, message);
  }
  
  /**
   * 删除响应
   */
  static deleted(message = '删除成功') {
    return new ApiResponse(true, null, message);
  }
  
  /**
   * 无内容响应
   */
  static noContent(message = '操作成功') {
    return new ApiResponse(true, null, message);
  }
}

/**
 * 响应格式化中间件
 */
const responseFormatter = (req, res, next) => {
  // 保存原始的json方法
  const originalJson = res.json;
  
  // 重写json方法
  res.json = function(data) {
    // 如果数据已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
      return originalJson.call(this, data);
    }
    
    // 如果是错误响应（状态码 >= 400）
    if (res.statusCode >= 400) {
      const errorResponse = ApiResponse.error(
        data?.error || data?.message || '请求失败',
        data?.errorCode,
        data?.details
      );
      return originalJson.call(this, errorResponse);
    }
    
    // 成功响应
    let response;
    
    if (data && typeof data === 'object') {
      // 如果包含分页信息
      if (data.pagination) {
        response = ApiResponse.paginated(
          data.data || data.items || data.results,
          data.pagination,
          data.message
        );
      }
      // 如果是列表数据
      else if (Array.isArray(data.items) || Array.isArray(data.data)) {
        response = ApiResponse.list(
          data.items || data.data,
          data.total,
          data.message
        );
      }
      // 普通对象响应
      else {
        response = ApiResponse.success(data.data || data, data.message);
      }
    } else {
      // 简单数据类型
      response = ApiResponse.success(data);
    }
    
    return originalJson.call(this, response);
  };
  
  // 添加便捷方法
  res.success = function(data, message, meta) {
    return this.json(ApiResponse.success(data, message, meta));
  };
  
  res.error = function(message, statusCode = 400, errorCode = null, details = null) {
    this.status(statusCode);
    return this.json(ApiResponse.error(message, errorCode, details));
  };
  
  res.paginated = function(data, pagination, message) {
    return this.json(ApiResponse.paginated(data, pagination, message));
  };
  
  res.list = function(items, total, message) {
    return this.json(ApiResponse.list(items, total, message));
  };
  
  res.created = function(data, message) {
    this.status(201);
    return this.json(ApiResponse.created(data, message));
  };
  
  res.updated = function(data, message) {
    return this.json(ApiResponse.updated(data, message));
  };
  
  res.deleted = function(message) {
    return this.json(ApiResponse.deleted(message));
  };
  
  res.noContent = function(message) {
    this.status(204);
    return this.json(ApiResponse.noContent(message));
  };
  
  next();
};

/**
 * 性能监控中间件
 */
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  // 监听响应结束
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    
    // 记录性能指标
    const performanceData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      contentLength: res.get('Content-Length') || 0,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };
    
    // 慢请求警告（超过1秒）
    if (duration > 1000) {
      logger.warn('慢请求检测', performanceData);
    } else {
      logger.debug('请求性能', performanceData);
    }
    
    // 设置性能头部
    res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
  });
  
  next();
};

/**
 * CORS中间件
 */
const corsHandler = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  // 检查来源是否被允许
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小时
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

/**
 * 请求大小限制中间件
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.error('请求体过大', 413, 'REQUEST_TOO_LARGE');
    }
    
    next();
  };
};

/**
 * 解析大小字符串（如 '10mb', '1gb'）
 */
function parseSize(size) {
  if (typeof size === 'number') return size;
  
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
}

/**
 * 缓存控制中间件
 */
const cacheControl = (options = {}) => {
  const {
    maxAge = 0,
    noCache = false,
    noStore = false,
    mustRevalidate = false,
    public: isPublic = false,
    private: isPrivate = false
  } = options;
  
  return (req, res, next) => {
    const cacheDirectives = [];
    
    if (noCache) {
      cacheDirectives.push('no-cache');
    }
    
    if (noStore) {
      cacheDirectives.push('no-store');
    }
    
    if (mustRevalidate) {
      cacheDirectives.push('must-revalidate');
    }
    
    if (isPublic) {
      cacheDirectives.push('public');
    }
    
    if (isPrivate) {
      cacheDirectives.push('private');
    }
    
    if (maxAge > 0) {
      cacheDirectives.push(`max-age=${maxAge}`);
    }
    
    if (cacheDirectives.length > 0) {
      res.setHeader('Cache-Control', cacheDirectives.join(', '));
    }
    
    next();
  };
};

/**
 * API版本控制中间件
 */
const apiVersioning = (req, res, next) => {
  // 从头部或查询参数获取API版本
  const version = req.headers['api-version'] || req.query.version || 'v1';
  
  // 验证版本格式
  if (!/^v\d+$/.test(version)) {
    return res.error('无效的API版本格式', 400, 'INVALID_API_VERSION');
  }
  
  // 设置版本信息
  req.apiVersion = version;
  res.setHeader('API-Version', version);
  
  next();
};

/**
 * 健康检查响应中间件
 */
const healthCheck = (req, res, next) => {
  if (req.path === '/health' || req.path === '/ping') {
    return res.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }, '服务正常运行');
  }
  
  next();
};

module.exports = {
  ApiResponse,
  responseFormatter,
  performanceMonitor,
  corsHandler,
  requestSizeLimit,
  cacheControl,
  apiVersioning,
  healthCheck
};