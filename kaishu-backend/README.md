# 楷书字库后端API

基于Node.js + Express构建的楷书字库管理系统后端API服务。

## 🚀 功能特性

- **RESTful API设计**：标准的REST API接口
- **用户认证系统**：JWT token认证
- **文件上传管理**：支持多种存储方案
- **OCR文字识别**：集成百度OCR API
- **数据库管理**：PostgreSQL数据库支持
- **云存储集成**：支持Cloudinary和Supabase
- **错误处理**：完善的错误处理机制
- **健康检查**：API和数据库健康监控

## 🛠️ 技术栈

- **运行时**：Node.js 16+
- **框架**：Express.js 4.x
- **数据库**：PostgreSQL (Neon)
- **认证**：JWT + bcrypt
- **文件处理**：Multer + Sharp
- **云存储**：Cloudinary / Supabase
- **OCR服务**：百度OCR API
- **部署**：Vercel Serverless

## 📦 安装和运行

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL数据库

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@host:port/database

# JWT密钥
JWT_SECRET=your-super-secret-jwt-key-here

# 百度OCR配置
BAIDU_OCR_API_KEY=your-baidu-ocr-api-key
BAIDU_OCR_SECRET_KEY=your-baidu-ocr-secret-key

# 云存储配置（可选）
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# 前端URL配置
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://your-frontend-app.vercel.app
```

### 数据库初始化

运行数据库迁移脚本：

```bash
npm run db:migrate
npm run db:fix
```

### 开发模式

```bash
npm run dev
```

API服务将在 http://localhost:3005 启动

### 生产模式

```bash
npm start
```

## 🚀 部署

### Vercel部署

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 配置环境变量（所有.env中的变量）
4. 部署完成

### 环境变量配置

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL连接字符串 | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | ✅ | JWT签名密钥 | `your-secret-key` |
| `BAIDU_OCR_API_KEY` | ✅ | 百度OCR API Key | `your-api-key` |
| `BAIDU_OCR_SECRET_KEY` | ✅ | 百度OCR Secret Key | `your-secret-key` |
| `FRONTEND_URL` | ✅ | 前端应用地址 | `https://app.example.com` |
| `CLOUDINARY_CLOUD_NAME` | ❌ | Cloudinary云名称 | `your-cloud-name` |
| `SUPABASE_URL` | ❌ | Supabase项目URL | `https://xxx.supabase.co` |

## 📚 API文档

### 认证接口

```
POST /api/auth/login      # 用户登录
POST /api/auth/register   # 用户注册
POST /api/auth/logout     # 用户登出
GET  /api/auth/profile    # 获取用户信息
```

### 作品管理

```
GET    /api/works         # 获取作品列表
GET    /api/works/:id     # 获取作品详情
POST   /api/works         # 创建作品
PUT    /api/works/:id     # 更新作品
DELETE /api/works/:id     # 删除作品
POST   /api/works/upload  # 上传作品文件
```

### 标注管理

```
GET    /api/annotations/:workId  # 获取作品标注
POST   /api/annotations          # 创建标注
PUT    /api/annotations/:id      # 更新标注
DELETE /api/annotations/:id      # 删除标注
```

### OCR识别

```
POST /api/ocr/recognize   # 单张图片OCR识别
POST /api/ocr/batch       # 批量OCR识别
```

### 健康检查

```
GET /api/health           # API健康检查
GET /api/health/database  # 数据库健康检查
```

## 📁 项目结构

```
├── controllers/         # 控制器
│   ├── authController.js
│   ├── worksController.js
│   └── ...
├── routes/             # 路由定义
│   ├── auth.js
│   ├── works.js
│   └── index.js
├── services/           # 服务层
│   ├── databaseService.js
│   ├── cloudinaryService.js
│   └── ...
├── middleware/         # 中间件
│   ├── auth.js
│   ├── errorHandler.js
│   └── ...
├── utils/             # 工具函数
├── scripts/           # 数据库脚本
├── server.js          # 应用入口
└── vercel.json        # Vercel配置
```

## 🔧 开发指南

### 添加新的API接口

1. 在 `controllers/` 中创建控制器函数
2. 在 `routes/` 中定义路由
3. 在 `routes/index.js` 中注册路由
4. 添加必要的中间件和验证

### 数据库操作

使用统一的数据库服务：

```javascript
const { databaseService } = require('./services/databaseService');

// 查询数据
const result = await databaseService.query(
  'SELECT * FROM works WHERE id = $1',
  [workId]
);

// 事务操作
await databaseService.transaction(async (client) => {
  await client.query('INSERT INTO ...');
  await client.query('UPDATE ...');
});
```

### 错误处理

使用统一的错误处理中间件：

```javascript
const { asyncHandler, DatabaseError } = require('./middleware/errorHandler');

const controller = asyncHandler(async (req, res) => {
  // 业务逻辑
  if (error) {
    throw new DatabaseError('数据库操作失败');
  }
});
```

## 🧪 测试

运行测试：

```bash
npm test
```

运行代码检查：

```bash
npm run lint
npm run lint:fix
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 问题反馈

如果遇到问题，请在GitHub Issues中提交问题报告。

## 🔗 相关链接

- [前端应用](https://github.com/your-username/kaishu-frontend)
- [Express.js文档](https://expressjs.com/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Vercel部署文档](https://vercel.com/docs)