/**
 * 全局错误处理中间件
 * 统一处理应用程序中的错误和异常
 */

const logger = require('../utils/logger');
const { validateInput } = require('../utils/validators');

/**
 * 错误类型定义
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证错误类
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 认证错误类
 */
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * 授权错误类
 */
class AuthorizationError extends AppError {
  constructor(message = '权限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * 资源未找到错误类
 */
class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

/**
 * 冲突错误类
 */
class ConflictError extends AppError {
  constructor(message = '资源冲突') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

/**
 * 速率限制错误类
 */
class RateLimitError extends AppError {
  constructor(message = '请求过于频繁') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * 数据库错误类
 */
class DatabaseError extends AppError {
  constructor(message = '数据库操作失败', originalError = null) {
    super(message, 500, 'DATABASE_ERROR', originalError?.message);
    this.originalError = originalError;
  }
}

/**
 * 外部服务错误类
 */
class ExternalServiceError extends AppError {
  constructor(service, message = '外部服务错误', statusCode = 503) {
    super(`${service}: ${message}`, statusCode, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * 错误处理工具函数
 */
class ErrorHandler {
  /**
   * 处理数据库错误
   */
  static handleDatabaseError(error) {
    logger.error('数据库错误:', error);
    
    // PostgreSQL 错误码处理
    if (error.code) {
      switch (error.code) {
        case '23505': // unique_violation
          return new ConflictError('数据已存在，请检查唯一性约束');
        case '23503': // foreign_key_violation
          return new ValidationError('外键约束违反，相关数据不存在');
        case '23502': // not_null_violation
          return new ValidationError('必填字段不能为空');
        case '23514': // check_violation
          return new ValidationError('数据格式不符合要求');
        case '42P01': // undefined_table
          return new DatabaseError('数据表不存在');
        case '42703': // undefined_column
          return new DatabaseError('数据列不存在');
        case '08006': // connection_failure
        case '08001': // sqlclient_unable_to_establish_sqlconnection
          return new DatabaseError('数据库连接失败');
        case '53300': // too_many_connections
          return new DatabaseError('数据库连接数过多');
        default:
          return new DatabaseError('数据库操作失败', error);
      }
    }
    
    return new DatabaseError('数据库操作失败', error);
  }
  
  /**
   * 处理JWT错误
   */
  static handleJWTError(error) {
    logger.warn('JWT错误:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('无效的访问令牌');
    }
    
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('访问令牌已过期');
    }
    
    if (error.name === 'NotBeforeError') {
      return new AuthenticationError('访问令牌尚未生效');
    }
    
    return new AuthenticationError('令牌验证失败');
  }
  
  /**
   * 处理文件上传错误
   */
  static handleMulterError(error) {
    logger.warn('文件上传错误:', error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError('文件大小超出限制');
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return new ValidationError('文件数量超出限制');
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new ValidationError('不支持的文件字段');
    }
    
    return new ValidationError('文件上传失败: ' + error.message);
  }
  
  /**
   * 处理验证错误
   */
  static handleValidationError(error) {
    if (error.details && Array.isArray(error.details)) {
      return new ValidationError('输入验证失败', error.details);
    }
    
    return new ValidationError(error.message || '输入验证失败');
  }
  
  /**
   * 处理网络请求错误
   */
  static handleNetworkError(error, service = '外部服务') {
    logger.error(`${service}网络错误:`, error);
    
    if (error.code === 'ECONNREFUSED') {
      return new ExternalServiceError(service, '服务连接被拒绝', 503);
    }
    
    if (error.code === 'ETIMEDOUT') {
      return new ExternalServiceError(service, '服务请求超时', 504);
    }
    
    if (error.code === 'ENOTFOUND') {
      return new ExternalServiceError(service, '服务地址无法解析', 503);
    }
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText || '服务响应错误';
      return new ExternalServiceError(service, message, status);
    }
    
    return new ExternalServiceError(service, error.message || '网络请求失败');
  }
}

/**
 * 异步错误捕获包装器
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404错误处理中间件
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`路径 ${req.originalUrl} 不存在`);
  next(error);
};

/**
 * 全局错误处理中间件
 */
const globalErrorHandler = (error, req, res, next) => {
  let err = error;
  
  // 记录错误信息
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    username: req.user?.username,
    timestamp: new Date().toISOString()
  };
  
  // 根据错误类型进行特殊处理
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    err = ErrorHandler.handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    err = ErrorHandler.handleJWTError(err);
  } else if (err.code && (err.code.startsWith('23') || err.code.startsWith('42') || err.code.startsWith('08') || err.code.startsWith('53'))) {
    err = ErrorHandler.handleDatabaseError(err);
  } else if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    err = ErrorHandler.handleMulterError(err);
  } else if (err.code && ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code)) {
    err = ErrorHandler.handleNetworkError(err);
  }
  
  // 如果不是操作性错误，转换为通用服务器错误
  if (!err.isOperational) {
    logger.error('非操作性错误:', errorInfo);
    err = new AppError('服务器内部错误', 500, 'INTERNAL_SERVER_ERROR');
  } else {
    // 记录操作性错误
    if (err.statusCode >= 500) {
      logger.error('服务器错误:', errorInfo);
    } else if (err.statusCode >= 400) {
      logger.warn('客户端错误:', errorInfo);
    } else {
      logger.info('请求错误:', errorInfo);
    }
  }
  
  // 构建错误响应
  const errorResponse = {
    success: false,
    error: err.message,
    errorCode: err.errorCode,
    timestamp: new Date().toISOString()
  };
  
  // 在开发环境中包含更多错误信息
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = err.details;
  }
  
  // 包含验证错误的详细信息
  if (err.details && err.statusCode === 400) {
    errorResponse.details = err.details;
  }
  
  // 设置响应头
  res.status(err.statusCode || 500);
  
  // 如果是API请求，返回JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.json(errorResponse);
  }
  
  // 对于非API请求，可以返回HTML错误页面
  res.json(errorResponse);
};

/**
 * 进程级错误处理
 */
const setupProcessErrorHandlers = () => {
  // 处理未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    
    // 优雅关闭服务器
    process.exit(1);
  });
  
  // 处理未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', { reason, promise });
    
    // 优雅关闭服务器
    process.exit(1);
  });
  
  // 处理SIGTERM信号
  process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，正在优雅关闭服务器...');
    process.exit(0);
  });
  
  // 处理SIGINT信号
  process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，正在优雅关闭服务器...');
    process.exit(0);
  });
};

/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('请求开始', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    username: req.user?.username
  });
  
  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel]('请求完成', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.userId,
      username: req.user?.username
    });
  });
  
  next();
};

/**
 * 安全头部中间件
 */
const securityHeaders = (req, res, next) => {
  // 设置安全相关的HTTP头部
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 在生产环境中设置HSTS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

module.exports = {
  // 错误类
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  
  // 错误处理器
  ErrorHandler,
  
  // 中间件
  asyncHandler,
  notFoundHandler,
  globalErrorHandler,
  requestLogger,
  securityHeaders,
  
  // 工具函数
  setupProcessErrorHandlers
};