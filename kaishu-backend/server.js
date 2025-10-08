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
// 导入管理员初始化脚本
const adminInitializer = require('./scripts/initializeAdminUser');

// 中间件配置 - 修复CORS配置，解决origin通配符与credentials的冲突问题
const allowedOrigins = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173', // Vite默认端口
  'https://kaishu-frontend-git-main-xiaolongmrs-projects.vercel.app',
  'https://kaishu.z-l.top',
  'https://kaishu-backend.z-l.top',
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

// 配置静态文件服务，提供作品图片访问
const serveStatic = require('serve-static');

// 映射 /images 路径到 楷书库 目录
const imagesDir = path.join(__dirname, '../楷书库');
app.use('/images', serveStatic(imagesDir, {
  maxAge: '1d', // 缓存1天
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// 使用API路由 - 支持带/api前缀的请求
app.use('/api', apiRoutes);

// 创建一个全新的测试端点，使用不同的路径名称，确保它不受任何中间件的影响
app.post('/api/test-upload-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Test upload endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

// 同时创建一个GET版本用于简单测试
app.get('/api/test-upload-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Test upload endpoint GET is working!',
    timestamp: new Date().toISOString()
  });
});

// 配置multer用于文件上传
const multer = require('multer');
const worksController = require('./controllers/worksController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../楷书库'));
  },
  filename: function (req, file, cb) {
    // 处理中文文件名 - 确保正确解码
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    
    // 保存原始文件名到req对象中，供控制器使用
    if (!req.originalFilenames) {
      req.originalFilenames = {};
    }
    req.originalFilenames[file.fieldname] = originalName;
    
    // 生成安全的文件名
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    
    const safeFilename = `upload_${timestamp}_${randomSuffix}${ext}`;
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

// 添加实际的文件上传端点
// 暂时不添加认证中间件，确保上传功能正常工作后再考虑添加
app.post('/api/upload', upload.single('calligraphy'), worksController.uploadWork);

// 同时添加不带api前缀的版本以兼容可能的前端调用
app.post('/upload', upload.single('calligraphy'), worksController.uploadWork);

// 创建一个全新的测试端点，使用不同的路径名称，确保它不受任何中间件的影响
app.post('/api/test-upload-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Test upload endpoint is working!',
    timestamp: new Date().toISOString()
  });
});

// 同时创建一个GET版本用于简单测试
app.get('/api/test-upload-endpoint', (req, res) => {
  res.json({
    success: true,
    message: 'Test upload endpoint GET is working!',
    timestamp: new Date().toISOString()
  });
});

// 稍后再配置实际的upload端点，先确保路由机制正常工作

// 为生产环境兼容性，临时支持不带/api前缀的关键路由
// 直接导入控制器，避免路由嵌套问题
const homepageController = require('./controllers/homepageController');

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


// API专用服务器，不提供静态文件服务
console.log('楷书字库后端API服务启动中...');
console.log('环境:', process.env.NODE_ENV || 'development');
console.log('Vercel环境:', process.env.NOW_REGION ? '是' : '否');

// 监听数据库事件 - 使用一次性初始化逻辑
const initializeAdminOnce = async () => {
  console.log('[Server] 数据库服务已连接');
  // 只执行一次初始化
  try {
    await adminInitializer.initializeAdminUser();
    console.log('[Server] 管理员初始化检查完成');
  } catch (error) {
    console.error('初始化管理员用户失败:', error);
  } finally {
    // 移除监听器，防止再次触发
    databaseService.removeListener('connected', initializeAdminOnce);
  }
};

// 只绑定一次监听器
databaseService.once('connected', initializeAdminOnce);

databaseService.on('error', (error) => {
  console.error('[Server] 数据库服务错误:', error.message);
});

databaseService.on('connectionRestored', () => {
  console.log('[Server] 数据库连接已恢复');
});

databaseService.on('maxRetriesReached', (error) => {
  console.error('[Server] 数据库连接达到最大重试次数:', error.message);
});

// API 404处理 - 只处理不存在的GET请求
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
      '/api/homepage',
      '/api/upload',  // 添加上传端点
      '/api/images'
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