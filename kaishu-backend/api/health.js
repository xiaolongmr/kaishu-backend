/**
 * 健康检查无服务器函数
 * 专门为Vercel环境设计的健康检查端点
 */

module.exports = (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 检查内存使用
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  // 返回健康状态
  const healthStatus = {
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
        nodeEnv: process.env.NODE_ENV || 'production'
      }
    },
    checks: {
      memory: memoryUsagePercent < 90,
      server: true
    },
    environment: {
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown'
    }
  };
  
  res.status(200).json(healthStatus);
};