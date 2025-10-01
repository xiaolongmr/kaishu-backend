/**
 * 评论设置动态路由API - Vercel无服务器函数
 * 处理特定页面的评论设置获取和更新
 */

// 设置CORS头
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
};

// 默认评论设置
const getDefaultCommentSettings = () => ({
  enabled: true,
  shared_path: null,
  config: {
    envId: 'kaishu-9g8aqjqy8b8b8b8b', // Twikoo环境ID
    region: 'ap-shanghai',
    lang: 'zh-CN'
  }
});

// 模拟评论设置数据（在实际项目中应该从数据库获取）
const mockCommentSettings = {
  '': { // 首页
    page_path: '',
    enabled: true,
    shared_path: null,
    config: getDefaultCommentSettings().config,
    updated_at: new Date().toISOString()
  },
  'about': {
    page_path: 'about',
    enabled: true,
    shared_path: null,
    config: getDefaultCommentSettings().config,
    updated_at: new Date().toISOString()
  },
  'upload': {
    page_path: 'upload',
    enabled: false,
    shared_path: null,
    config: getDefaultCommentSettings().config,
    updated_at: new Date().toISOString()
  }
};

export default async function handler(req, res) {
  // 设置CORS头
  setCorsHeaders(res);
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { query } = req;
  const pagePath = query.pagePath || '';
  
  try {
    if (req.method === 'GET') {
      // 获取特定页面的评论设置
      const settings = mockCommentSettings[pagePath] || {
        page_path: pagePath,
        enabled: getDefaultCommentSettings().enabled,
        shared_path: null,
        config: getDefaultCommentSettings().config,
        updated_at: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        data: settings,
        timestamp: new Date().toISOString()
      });
      
    } else if (req.method === 'PUT') {
      // 更新评论设置
      const { enabled, shared_path, config } = req.body;
      
      const updatedSettings = {
        page_path: pagePath,
        enabled: enabled !== undefined ? enabled : getDefaultCommentSettings().enabled,
        shared_path: shared_path || null,
        config: config || getDefaultCommentSettings().config,
        updated_at: new Date().toISOString()
      };
      
      // 更新模拟数据
      mockCommentSettings[pagePath] = updatedSettings;
      
      res.status(200).json({
        success: true,
        data: updatedSettings,
        message: '评论设置更新成功',
        timestamp: new Date().toISOString()
      });
      
    } else {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
        message: '只支持GET和PUT请求'
      });
    }
    
  } catch (error) {
    console.error('评论设置API错误:', error);
    
    res.status(500).json({
      success: false,
      error: '获取评论设置失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}