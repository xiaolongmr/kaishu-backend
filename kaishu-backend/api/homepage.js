/**
 * 首页内容API - Vercel无服务器函数
 * 提供首页内容数据，包括默认内容和数据库内容
 */

// 设置CORS头
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
};

// 默认首页内容
const getDefaultContent = () => {
  return {
    hero_title: "楷书字库",
    hero_subtitle: "传承中华书法艺术，数字化楷书字体库",
    hero_description: "专业的楷书字体识别、标注和管理平台，助力书法艺术的传承与发展",
    hero_button_text: "开始使用",
    feature_title: "核心功能",
    feature_subtitle: "为书法爱好者和研究者提供专业工具",
    features: [
      {
        title: "智能识别",
        description: "基于OCR技术的楷书字符自动识别",
        icon: "robot"
      },
      {
        title: "精准标注",
        description: "专业的字符标注和分类管理系统",
        icon: "edit"
      },
      {
        title: "海量字库",
        description: "丰富的楷书字体样本数据库",
        icon: "database"
      },
      {
        title: "便捷搜索",
        description: "快速检索和查找目标字符",
        icon: "search"
      }
    ],
    stats_title: "平台数据",
    stats_subtitle: "持续增长的楷书字库",
    about_title: "关于项目",
    about_content: "楷书字库是一个专注于中华传统楷书艺术的数字化平台，致力于保护和传承优秀的书法文化。通过现代技术手段，我们为书法爱好者、研究者和教育工作者提供专业的工具和资源。",
    contact_title: "联系我们",
    contact_subtitle: "欢迎交流与合作"
  };
};

// 模拟统计数据
const getMockStats = () => {
  return {
    overview: {
      totalWorks: 1250,
      totalAnnotations: 8960,
      uniqueCharacters: 3500,
      activeUsers: 156
    },
    recentWorks: [
      { id: 1, title: "颜真卿楷书作品", author: "颜真卿", uploadDate: "2024-01-15" },
      { id: 2, title: "欧阳询楷书范本", author: "欧阳询", uploadDate: "2024-01-14" },
      { id: 3, title: "柳公权楷书字帖", author: "柳公权", uploadDate: "2024-01-13" }
    ],
    popularCharacters: [
      { character: "书", count: 89 },
      { character: "法", count: 76 },
      { character: "艺", count: 65 },
      { character: "术", count: 58 },
      { character: "楷", count: 52 }
    ]
  };
};

export default async function handler(req, res) {
  // 设置CORS头
  setCorsHeaders(res);
  
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 只支持GET请求
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: '只支持GET请求'
    });
    return;
  }
  
  try {
    // 获取默认内容
    const content = getDefaultContent();
    
    // 获取统计数据
    const stats = getMockStats();
    
    // 返回首页内容
    res.status(200).json({
      success: true,
      data: { 
        content,
        stats 
      },
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        vercelRegion: process.env.VERCEL_REGION || 'unknown',
        vercelUrl: process.env.VERCEL_URL || 'localhost'
      }
    });
    
  } catch (error) {
    console.error('首页API错误:', error);
    
    res.status(500).json({
      success: false,
      error: '获取首页内容失败',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}