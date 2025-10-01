# 楷书库字体管理工具

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fkaishu&env=DATABASE_URL,CLOUDINARY_CLOUD_NAME,CLOUDINARY_API_KEY,CLOUDINARY_API_SECRET,SUPABASE_URL,SUPABASE_KEY,SUPABASE_BUCKET,STORAGE_PROVIDERS,BAIDU_OCR_API_KEY,BAIDU_OCR_SECRET_KEY,JWT_SECRET&envDescription=配置应用所需的环境变量&envLink=https%3A%2F%2Fgithub.com%2Fyour-username%2Fkaishu%23环境变量)

## 项目简介

楷书库字体管理工具是一个专门用于管理楷书书法作品的 Web 应用，支持上传书法作品、字体标注、字符裁剪和搜索功能。该项目旨在帮助书法爱好者和研究者建立、管理和使用完整的楷书字库。

## 功能特性

- **作品上传**：上传书法作品到"楷书库"目录或者用户自定义本地文件夹，或者是云储存
- **字体标注**：对上传的作品进行字符标注
- **字符裁剪**：裁剪单字并标注字名
- **搜索功能**：根据字名搜索单字图片
- **作品展示**：浏览所有上传的书法作品
- **后台管理**：管理系统中的作品和标注
- **OCR 自动识别**：自动识别并标注字符
- **透视校正**：对有透视变形的作品进行校正
- **用户管理**：支持多用户和权限管理
- **数据导出**：支持数据备份和恢复
- **评论系统**：集成 Twikoo 评论系统
- **数据统计**：提供字体统计和分析功能

## 技术架构

本项目采用现代化的前后端分离架构：

- **前端**：React + Vite + Ant Design 5.x
- **后端**：Node.js + Express
- **数据库**：Neon PostgreSQL
- **文件存储**：
  - 本地文件系统（楷书库目录）
  - Cloudinary 云存储
  - Supabase Storage
- **图像处理**：Sharp 库
- **OCR 识别**：百度 OCR
- **路由管理**：React Router
- **部署**：Vercel

## 项目结构

有关详细的项目结构说明，请参阅 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) 文件。

```
kaishu/
├── backend/              # 后端服务
├── frontend/             # 前端应用
│   ├── src/
│   │   ├── components/   # React组件
│   │   ├── App.jsx       # 应用入口
│   │   └── main.jsx      # 渲染入口
├── 楷书库/               # 图像资源目录
├── tools/                # 工具脚本
└── public/               # 静态资源
```

## 环境要求

- Node.js 18.x 或更高版本
- npm 包管理器
- PostgreSQL 数据库（推荐使用 Neon）

## 安装与运行

### 1. 克隆项目

```bash
git clone <项目地址>
cd kaishu
```

### 2. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd backend
npm install
cd ..

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 配置环境变量

在 `backend/.env` 文件中配置必要的环境变量：

```env
# 数据库配置
DATABASE_URL=postgresql://username:password@host:port/database

# 服务器端口
PORT=3000

# 百度OCR配置
BAIDU_OCR_API_KEY=your_baidu_api_key
BAIDU_OCR_SECRET_KEY=your_baidu_secret_key

# Cloudinary配置
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase配置
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
SUPABASE_BUCKET=kaishu_images

# 存储配置
# 可选值: local, cloudinary, supabase
# 多个值用逗号分隔，按优先级排序
STORAGE_PROVIDERS=local,cloudinary,supabase
```

### 4. 启动项目

#### 开发模式

```bash
# 一键启动前后端服务
npm run dev

# 或者分别启动
npm run dev:backend  # 启动后端服务
npm run dev:frontend # 启动前端开发服务器
```

#### 生产模式

```bash
# 构建前端项目
npm run build

# 启动后端服务
npm start
```

### 5. 访问应用

打开浏览器访问 `http://localhost:3001`

## 部署

### Vercel 部署

```bash
# 安装Vercel CLI
npm install -g vercel

# 部署到Vercel
npm run deploy
```

### GitHub Pages 部署

配置 GitHub 仓库并启用 GitHub Pages 功能。

## 常用命令

```bash
# 启动开发环境
npm run dev

# 构建项目
npm run build

# 清理端口占用
npm run clear-ports

# 诊断系统问题
npm run diagnose

# 数据库连接诊断
npm run db-diagnose

# 本地数据库隧道连接
npm run dev:db-tunnel
```

## 项目规则

本项目遵循一套完整的开发规则，详见 [.qoder/rules/PROJECT_RULES_FULL.md](.qoder/rules/PROJECT_RULES_FULL.md) 文件。

## 数据库连接问题解决方案

### 问题分析

Neon 作为云数据库服务，可能存在以下问题：

1. **连接限制**：Neon 的免费层对连接数有限制
2. **网络延迟**：云数据库访问可能存在网络延迟
3. **超时机制**：Neon 有自动断开空闲连接的机制
4. **地理位置**：Neon 服务器可能距离用户较远

### 解决方案

1. **优化数据库连接配置**：已在后端代码中优化了数据库连接池配置
2. **实现重试机制**：对于所有数据库查询，都实现了重试机制
3. **前端缓存机制**：减少对数据库的请求，在前端实现了缓存机制
4. **本地开发隧道连接**：提供了本地数据库隧道连接脚本

## 更新日志

### v2.0.0

- 重大更新：重构代码结构，优化性能，添加更多实用功能
- 重构前端架构，采用现代化的 React Hooks 和 Context API
- 优化后端 API 性能，提升响应速度
- 添加作品分组和标签功能
- 实现用户权限管理系统
- 添加数据导出和导入功能

### v1.9.0

- 添加数据统计和分析功能
- 添加字体统计页面
- 实现 Unicode 覆盖率统计
- 添加字符使用频率分析
- 支持统计数据导出

### v1.8.0

- 添加评论功能和社交分享
- 集成 Twikoo 评论系统
- 添加评论设置页面
- 实现作品社交分享功能

### v1.7.0

- 优化 UI 界面和用户体验
- 重新设计现代化首页
- 添加暗黑模式支持
- 实现响应式布局

### v1.6.0

- 添加作品作者信息管理
- 添加作品作者字段
- 支持作者信息管理
- 实现作者筛选功能

### v1.5.0

- 添加作品分组和标签功能
- 实现作品分组管理
- 添加标签系统
- 支持分组和标签筛选

### v1.4.0

- 添加数据导出和导入功能
- 支持作品数据导出
- 实现数据导入功能
- 添加数据库备份机制

### v1.3.0

- 添加用户权限管理系统
- 实现用户登录功能
- 添加管理员权限控制
- 支持多用户管理

### v1.2.0

- 添加透视校正功能
- 实现四点定位标注模式
- 添加透视校正预览
- 支持复杂布局作品处理

### v1.1.0

- 添加 OCR 自动识别功能
- 集成百度 OCR 引擎
- 实现自动字符识别
- 添加 OCR 结果编辑功能

### v1.0.0

- 初始版本发布
- 作品上传功能
- 字体标注功能
- 字符裁剪功能
- 搜索功能
- 作品展示功能
- 后台管理功能

## 开发计划

- 添加更多字体样式支持（行书、草书等）
- 优化百度 OCR 识别参数
- 添加字体比较功能
- 实现移动端适配
- 添加字体生成和导出功能
- 实现云同步功能
- 添加 AI 辅助标注功能
- 实现更丰富的数据统计和可视化

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有任何问题或建议，请通过以下方式联系我们：

- 邮箱：zlnp@qq.com
- GitHub：https://github.com/xiaolongmr
- 项目地址：https://kaishu.z-l.top
