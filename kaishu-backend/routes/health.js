/**
 * 健康检查路由模块
 * 提供系统健康状态检查API
 */

const express = require('express');
const router = express.Router();
const { databaseService } = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * 数据库健康检查
 */
router.get('/database', async (req, res) => {
  try {
    const healthStatus = await databaseService.getHealthStatus();
    
    if (healthStatus.status === 'healthy') {
      res.json({
        ...healthStatus,
        message: '数据库连接正常'
      });
    } else {
      res.status(503).json({
        ...healthStatus,
        message: '数据库连接异常'
      });
    }
  } catch (error) {
    logger.error('数据库健康检查失败:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: '数据库健康检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 数据库连接池状态
 */
router.get('/database/pool', async (req, res) => {
  try {
    const poolStatus = databaseService.getPoolStatus();
    res.json({
      status: 'success',
      data: poolStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('获取连接池状态失败:', error);
    res.status(500).json({
      status: 'error',
      message: '获取连接池状态失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 系统综合健康检查 - 简化版本，优先保证服务可用性
 */
router.get('/', async (req, res) => {
  try {
    // 检查内存使用
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // 基础健康状态
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        server: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
            usagePercent: Math.round(memoryUsagePercent)
          },
          version: process.version,
          platform: process.platform,
          nodeEnv: process.env.NODE_ENV
        }
      },
      checks: {
        memory: memoryUsagePercent < 90
      }
    };
    
    // 尝试检查数据库，但不阻塞健康检查
    try {
      const dbHealthPromise = Promise.race([
        databaseService.getHealthStatus(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timeout')), 3000)
        )
      ]);
      
      const dbHealth = await dbHealthPromise;
      systemHealth.services.database = {
        status: dbHealth.status,
        responseTime: dbHealth.responseTime,
        isConnected: dbHealth.isConnected
      };
      systemHealth.checks.database = dbHealth.status === 'healthy';
    } catch (dbError) {
      logger.warn('数据库健康检查超时或失败:', dbError.message);
      systemHealth.services.database = {
        status: 'timeout',
        error: dbError.message
      };
      systemHealth.checks.database = false;
    }
    
    // 即使数据库检查失败，只要服务器本身正常，就返回200
    // 这样可以确保Vercel不会因为数据库问题而认为整个服务不可用
    res.status(200).json(systemHealth);
  } catch (error) {
    logger.error('系统健康检查失败:', error);
    res.status(200).json({
      status: 'partial',
      message: '服务器运行正常，但健康检查部分失败',
      error: error.message,
      timestamp: new Date().toISOString(),
      services: {
        server: {
          status: 'healthy',
          uptime: process.uptime()
        }
      }
    });
  }
});

/**
 * 简单的存活检查
 */
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

/**
 * 就绪检查（包含依赖服务检查）
 */
router.get('/ready', async (req, res) => {
  try {
    // 检查数据库连接
    const dbHealth = await databaseService.getHealthStatus();
    
    if (dbHealth.status === 'healthy') {
      res.json({
        status: 'ready',
        message: '服务已就绪',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'healthy'
        }
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        message: '服务未就绪',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: 'unhealthy'
        }
      });
    }
  } catch (error) {
    logger.error('就绪检查失败:', error);
    res.status(503).json({
      status: 'not_ready',
      message: '就绪检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 获取系统信息
 */
router.get('/info', (req, res) => {
  const packageInfo = require('../../package.json');
  
  res.json({
    application: {
      name: packageInfo.name || '楷书字库',
      version: packageInfo.version || '2.0.0',
      description: packageInfo.description || '楷书字体管理工具',
      author: packageInfo.author
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 获取磁盘使用情况
 */
async function getDiskUsage() {
  try {
    const fs = require('fs');
    const stats = fs.statSync(process.cwd());
    
    // 这是一个简化的实现，实际生产环境可能需要更复杂的磁盘检查
    return {
      status: 'healthy',
      usagePercent: 0, // 简化实现
      available: 'unknown',
      total: 'unknown'
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

module.exports = router;