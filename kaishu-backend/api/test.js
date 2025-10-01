/**
 * 最简单的测试API端点
 * 用于验证Vercel部署是否正常工作
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
  
  // 返回简单的测试响应
  res.status(200).json({
    status: 'success',
    message: 'Vercel后端部署测试成功',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: {
      'user-agent': req.headers['user-agent'],
      'host': req.headers.host
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      vercelRegion: process.env.VERCEL_REGION || 'unknown',
      vercelUrl: process.env.VERCEL_URL || 'unknown'
    }
  });
};