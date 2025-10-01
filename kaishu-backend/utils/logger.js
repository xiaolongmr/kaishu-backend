/**
 * 日志记录工具
 * 提供统一的日志记录功能
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 日志级别名称
const LEVEL_NAMES = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG'
};

// 日志颜色（用于控制台输出）
const COLORS = {
  ERROR: '\x1b[31m', // 红色
  WARN: '\x1b[33m',  // 黄色
  INFO: '\x1b[36m',  // 青色
  DEBUG: '\x1b[37m', // 白色
  RESET: '\x1b[0m'   // 重置
};

class Logger {
  constructor(options = {}) {
    this.level = LOG_LEVELS[options.level?.toUpperCase()] ?? LOG_LEVELS.INFO;
    this.enableConsole = options.enableConsole !== false;
    this.enableFile = options.enableFile !== false;
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.dateFormat = options.dateFormat || 'YYYY-MM-DD HH:mm:ss';
    
    // 确保日志目录存在
    if (this.enableFile) {
      this.ensureLogDirectory();
    }
    
    // 当前日志文件路径
    this.currentLogFile = null;
    this.updateLogFile();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('创建日志目录失败:', error);
      this.enableFile = false;
    }
  }

  /**
   * 更新当前日志文件
   */
  updateLogFile() {
    if (!this.enableFile) return;
    
    const today = new Date().toISOString().split('T')[0];
    this.currentLogFile = path.join(this.logDir, `app-${today}.log`);
  }

  /**
   * 格式化时间戳
   */
  formatTimestamp() {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const levelName = LEVEL_NAMES[level].padEnd(5);
    
    let formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return formattedMessage;
  }

  /**
   * 格式化控制台消息（带颜色）
   */
  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const levelName = LEVEL_NAMES[level];
    const color = COLORS[levelName] || COLORS.RESET;
    
    let formattedMessage = `${color}[${timestamp}] [${levelName}]${COLORS.RESET} ${message}`;
    
    // 添加元数据
    if (Object.keys(meta).length > 0) {
      formattedMessage += ` ${util.inspect(meta, { colors: true, depth: 2 })}`;
    }
    
    return formattedMessage;
  }

  /**
   * 写入日志文件
   */
  async writeToFile(message) {
    if (!this.enableFile || !this.currentLogFile) return;
    
    try {
      // 检查是否需要轮转日志文件
      await this.rotateLogIfNeeded();
      
      // 写入日志
      fs.appendFileSync(this.currentLogFile, message + '\n', 'utf8');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  /**
   * 日志轮转
   */
  async rotateLogIfNeeded() {
    try {
      if (!fs.existsSync(this.currentLogFile)) {
        return;
      }
      
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.maxFileSize) {
        // 重命名当前文件
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
        
        // 清理旧日志文件
        await this.cleanOldLogs();
      }
    } catch (error) {
      console.error('日志轮转失败:', error);
    }
  }

  /**
   * 清理旧日志文件
   */
  async cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // 删除超出数量限制的文件
      if (files.length > this.maxFiles) {
        const filesToDelete = files.slice(this.maxFiles);
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (error) {
      console.error('清理旧日志失败:', error);
    }
  }

  /**
   * 记录日志
   */
  log(level, message, meta = {}) {
    if (level > this.level) return;
    
    // 处理错误对象
    if (message instanceof Error) {
      meta.stack = message.stack;
      message = message.message;
    }
    
    // 控制台输出
    if (this.enableConsole) {
      const consoleMessage = this.formatConsoleMessage(level, message, meta);
      console.log(consoleMessage);
    }
    
    // 文件输出
    if (this.enableFile) {
      const fileMessage = this.formatMessage(level, message, meta);
      this.writeToFile(fileMessage);
    }
  }

  /**
   * 错误日志
   */
  error(message, meta = {}) {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  /**
   * 警告日志
   */
  warn(message, meta = {}) {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  /**
   * 信息日志
   */
  info(message, meta = {}) {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  /**
   * 调试日志
   */
  debug(message, meta = {}) {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }

  /**
   * 创建子日志器
   */
  child(meta = {}) {
    const childLogger = Object.create(this);
    childLogger.defaultMeta = { ...this.defaultMeta, ...meta };
    
    // 重写log方法以包含默认元数据
    const originalLog = this.log.bind(this);
    childLogger.log = (level, message, additionalMeta = {}) => {
      const combinedMeta = { ...childLogger.defaultMeta, ...additionalMeta };
      originalLog(level, message, combinedMeta);
    };
    
    return childLogger;
  }

  /**
   * 记录HTTP请求
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    if (req.user) {
      meta.userId = req.user.userId;
      meta.username = req.user.username;
    }
    
    const level = res.statusCode >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, `${req.method} ${req.url}`, meta);
  }

  /**
   * 记录数据库查询
   */
  logQuery(query, params, duration, error = null) {
    const meta = {
      query: query.substring(0, 200), // 限制查询长度
      params: params ? JSON.stringify(params).substring(0, 100) : null,
      duration: `${duration}ms`
    };
    
    if (error) {
      meta.error = error.message;
      this.log(LOG_LEVELS.ERROR, 'Database query failed', meta);
    } else {
      const level = duration > 1000 ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
      this.log(level, 'Database query executed', meta);
    }
  }

  /**
   * 记录性能指标
   */
  logPerformance(operation, duration, meta = {}) {
    const perfMeta = {
      operation,
      duration: `${duration}ms`,
      ...meta
    };
    
    const level = duration > 5000 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    this.log(level, `Performance: ${operation}`, perfMeta);
  }
}

// 创建默认日志器实例
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  enableConsole: process.env.NODE_ENV !== 'test',
  enableFile: process.env.NODE_ENV === 'production'
});

// 导出默认实例和类
module.exports = defaultLogger;
module.exports.Logger = Logger;
module.exports.LOG_LEVELS = LOG_LEVELS;