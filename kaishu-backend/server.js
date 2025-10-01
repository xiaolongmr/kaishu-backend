const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// 导入路由模块
const apiRoutes = require('./routes/index');

// 导入数据库服务
const { databaseService } = require('./services/databaseService');

// 中间件配置 - 修复CORS配置，解决origin通配符与credentials的冲突问题
const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173', // Vite默认端口
  'https://kaishu-frontend-git-main-xiaolongmrs-projects.vercel.app',
  'https://kaishu.z-l.top',
  'https://kaishu-backend-zl.top',
  'https://kaishu-backend.vercel.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

// 在Vercel环境中动态处理origin，解决通配符与credentials的冲突
app.use(cors({
  origin: (origin, callback) => {
    // 如果是Vercel环境且没有origin（如curl等工具调用），或者origin在允许列表中，则允许访问
    if (!origin || allowedOrigins.includes(origin) || process.env.VERCEL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// 使用API路由 - 支持带/api前缀的请求
app.use('/api', apiRoutes);

// 为生产环境兼容性，临时支持不带/api前缀的关键路由
// 直接导入控制器，避免路由嵌套问题
const homepageController = require('./controllers/homepageController');
const commentsController = require('./controllers/commentsController');

// 直接处理不带/api前缀的homepage请求
app.get('/homepage', async (req, res) => {
  try {
    // 调用homepage控制器的主方法
    const result = await homepageController.getHomepageData();
    res.json(result);
  } catch (error) {
    console.error('处理/homepage请求错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取首页数据失败',
      error: error.message 
    });
  }
});

// 直接处理不带/api前缀的comment-settings请求
app.get('/comment-settings', async (req, res) => {
  try {
    // 调用comments控制器的主方法
    const result = await commentsController.getCommentSettings();
    res.json(result);
  } catch (error) {
    console.error('处理/comment-settings请求错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '获取评论设置失败',
      error: error.message 
    });
  }
});

// API专用服务器，不提供静态文件服务
console.log('楷书字库后端API服务启动中...');
console.log('环境:', process.env.NODE_ENV || 'development');
console.log('Vercel环境:', process.env.NOW_REGION ? '是' : '否');

// 监听数据库事件
databaseService.on('connected', () => {
  console.log('[Server] 数据库服务已连接');
});

databaseService.on('error', (error) => {
  console.error('[Server] 数据库服务错误:', error.message);
});

databaseService.on('connectionRestored', () => {
  console.log('[Server] 数据库连接已恢复');
});

databaseService.on('maxRetriesReached', (error) => {
  console.error('[Server] 数据库连接达到最大重试次数:', error.message);
});

// API 404处理
app.get('*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    message: `路径 ${req.path} 不存在`,
    availableEndpoints: [
      '/api/health',
      '/api/auth',
      '/api/works',
      '/api/annotations',
      '/api/ocr',
      '/api/homepage'
    ]
  });
});

// Vercel环境导出app，本地环境启动服务器
if (process.env.NOW_REGION || process.env.VERCEL) {
  // Vercel环境，直接导出app
  module.exports = app;
} else {
  // 本地环境，启动服务器
  app.listen(PORT, async () => {
    console.log(`🚀 楷书字库后端API服务启动成功`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`📚 API文档: 请查看 README.md`);
  });
}