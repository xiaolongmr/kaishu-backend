/**
 * 数据库服务模块
 * 提供稳定的数据库连接、查询重试机制和连接监控
 */

const { Pool } = require('pg');
const EventEmitter = require('events');

class DatabaseService extends EventEmitter {
  constructor() {
    super();
    this.pool = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 10;
    this.reconnectInterval = 5000; // 5秒
    this.healthCheckInterval = 30000; // 30秒
    this.queryStats = {
      total: 0,
      successful: 0,
      failed: 0,
      retries: 0
    };
    
    this.initializePool();
    this.startHealthCheck();
  }

  /**
   * 初始化数据库连接池
   */
  initializePool() {
    // 确保数据库连接字符串存在
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const config = {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      // 优化连接池配置
      max: 15, // 减少最大连接数，避免超出Neon限制
      min: 2, // 最小连接数
      idleTimeoutMillis: 20000, // 减少空闲超时时间
      connectionTimeoutMillis: 15000, // 连接超时时间
      query_timeout: 20000, // 查询超时时间
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // 添加应用名称用于监控
      application_name: 'kaishu-app',
      // 启用语句超时
      statement_timeout: 25000,
      // 空闲会话超时
      idle_in_transaction_session_timeout: 30000
    };

    this.pool = new Pool(config);
    this.setupPoolEventHandlers();
  }

  /**
   * 设置连接池事件处理器
   */
  setupPoolEventHandlers() {
    this.pool.on('connect', (client) => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log(`[DB] 数据库连接已建立 (PID: ${client.processID})`);
      this.emit('connected', client);
    });

    this.pool.on('acquire', (client) => {
      console.log(`[DB] 获取连接 (PID: ${client.processID})`);
    });

    this.pool.on('remove', (client) => {
      console.log(`[DB] 移除连接 (PID: ${client.processID})`);
    });

    this.pool.on('error', (err, client) => {
      this.isConnected = false;
      console.error(`[DB] 数据库连接池错误:`, err);
      this.emit('error', err, client);
      
      // 尝试重新连接
      this.handleConnectionError(err);
    });
  }

  /**
   * 处理连接错误
   */
  async handleConnectionError(error) {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error(`[DB] 达到最大重连次数 (${this.maxConnectionAttempts})，停止重连`);
      this.emit('maxRetriesReached', error);
      return;
    }

    this.connectionAttempts++;
    console.log(`[DB] 尝试重新连接... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
    
    setTimeout(() => {
      this.testConnection();
    }, this.reconnectInterval * this.connectionAttempts); // 指数退避
  }

  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as version');
      this.isConnected = true;
      this.connectionAttempts = 0;
      console.log(`[DB] 连接测试成功:`, result.rows[0]);
      this.emit('connectionRestored');
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error(`[DB] 连接测试失败:`, error.message);
      this.handleConnectionError(error);
      return false;
    }
  }

  /**
   * 带重试机制的查询函数
   */
  async query(text, params = [], options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 20000
    } = options;

    this.queryStats.total++;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        // 如果不是第一次尝试，等待一段时间
        if (attempt > 1) {
          this.queryStats.retries++;
          const delay = retryDelay * Math.pow(2, attempt - 2); // 指数退避
          console.log(`[DB] 查询重试 ${attempt - 1}/${maxRetries}，等待 ${delay}ms`);
          await this.sleep(delay);
        }

        // 检查连接状态
        if (!this.isConnected) {
          await this.testConnection();
        }

        // 执行查询
        const startTime = Date.now();
        const result = await Promise.race([
          this.pool.query(text, params),
          this.createTimeoutPromise(timeout)
        ]);
        
        const duration = Date.now() - startTime;
        
        // 记录慢查询
        if (duration > 5000) {
          console.warn(`[DB] 慢查询检测 (${duration}ms):`, text.substring(0, 100));
        }

        this.queryStats.successful++;
        return result;

      } catch (error) {
        lastError = error;
        console.error(`[DB] 查询失败 (尝试 ${attempt}/${maxRetries + 1}):`, {
          error: error.message,
          code: error.code,
          query: text.substring(0, 100)
        });

        // 判断是否应该重试
        if (attempt > maxRetries || !this.shouldRetry(error)) {
          break;
        }

        // 如果是连接相关错误，尝试重新建立连接
        if (this.isConnectionError(error)) {
          this.isConnected = false;
          await this.testConnection();
        }
      }
    }

    this.queryStats.failed++;
    throw new Error(`数据库查询在 ${maxRetries + 1} 次尝试后失败: ${lastError.message}`);
  }

  /**
   * 判断错误是否应该重试
   */
  shouldRetry(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ENOTFOUND', 
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EPIPE',
      '08006', // connection_failure
      '08001', // sqlclient_unable_to_establish_sqlconnection
      '08004', // sqlserver_rejected_establishment_of_sqlconnection
      '53300', // too_many_connections
      '57P01', // admin_shutdown
    ];

    const retryableMessages = [
      'timeout',
      'connection',
      'network',
      'server closed the connection',
      'Connection terminated unexpectedly'
    ];

    return retryableCodes.includes(error.code) ||
           retryableMessages.some(msg => 
             error.message.toLowerCase().includes(msg.toLowerCase())
           );
  }

  /**
   * 判断是否为连接错误
   */
  isConnectionError(error) {
    const connectionCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];
    return connectionCodes.includes(error.code) ||
           error.message.toLowerCase().includes('connection');
  }

  /**
   * 创建超时Promise
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`查询超时 (${timeout}ms)`));
      }, timeout);
    });
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 开始健康检查
   */
  startHealthCheck() {
    setInterval(async () => {
      try {
        await this.testConnection();
      } catch (error) {
        console.error(`[DB] 健康检查失败:`, error.message);
      }
    }, this.healthCheckInterval);
  }

  /**
   * 获取连接池状态
   */
  getPoolStatus() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      queryStats: { ...this.queryStats }
    };
  }

  /**
   * 获取数据库健康状态
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      const result = await this.query('SELECT NOW() as current_time');
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        isConnected: this.isConnected,
        responseTime,
        currentTime: result.rows[0].current_time,
        poolStatus: this.getPoolStatus(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        isConnected: false,
        error: error.message,
        poolStatus: this.getPoolStatus(),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 优雅关闭连接池
   */
  async close() {
    try {
      console.log('[DB] 正在关闭数据库连接池...');
      await this.pool.end();
      console.log('[DB] 数据库连接池已关闭');
    } catch (error) {
      console.error('[DB] 关闭连接池时出错:', error);
    }
  }

  /**
   * 事务处理
   */
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// 创建单例实例
const databaseService = new DatabaseService();

// 导出实例和类
module.exports = {
  databaseService,
  DatabaseService
};