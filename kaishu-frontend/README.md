# 楷书字库前端应用

基于React + Vite构建的现代化楷书字库管理系统前端应用。

## 🚀 功能特性

- **现代化UI设计**：基于Ant Design组件库
- **字体标注系统**：支持Canvas绘制和插件化标注
- **OCR文字识别**：集成百度OCR API
- **图片管理**：支持上传、预览、搜索
- **用户认证**：完整的登录注册系统
- **响应式设计**：适配各种屏幕尺寸
- **主题切换**：支持明暗主题切换

## 🛠️ 技术栈

- **框架**：React 18 + Vite
- **UI库**：Ant Design 5.x
- **路由**：React Router DOM 7.x
- **Canvas**：Konva + React-Konva
- **HTTP客户端**：Axios
- **状态管理**：React Context API
- **样式**：CSS Modules + 主题变量

## 📦 安装和运行

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量示例文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置后端API地址：

```env
# 开发环境API地址
VITE_API_URL=http://localhost:3005

# 生产环境API地址
VITE_PRODUCTION_API_URL=https://your-backend-app.vercel.app
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 生产构建

```bash
npm run build
```

构建文件将输出到 `dist/` 目录

### 预览构建

```bash
npm run preview
```

## 🚀 部署

### Vercel部署

1. 将代码推送到GitHub仓库
2. 在Vercel中导入项目
3. 配置环境变量：
   - `VITE_API_URL`: 后端API地址
   - `VITE_APP_TITLE`: 应用标题
4. 部署完成

### 环境变量配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `VITE_API_URL` | 后端API地址 | `https://api.example.com` |
| `VITE_APP_TITLE` | 应用标题 | `楷书字库管理系统` |
| `VITE_ENABLE_DEBUG` | 开启调试模式 | `true/false` |

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── pages/          # 页面组件
│   ├── common/         # 通用组件
│   └── design-system/  # 设计系统组件
├── utils/              # 工具函数
│   ├── api.js         # API配置
│   └── helpers.js     # 辅助函数
├── assets/            # 静态资源
├── App.jsx           # 应用主组件
├── main.jsx          # 应用入口
└── index.css         # 全局样式
```

## 🔧 开发指南

### 组件开发

- 使用函数式组件和Hooks
- 遵循Ant Design设计规范
- 组件文件使用PascalCase命名
- 添加PropTypes类型检查

### API调用

使用统一的API工具：

```javascript
import { apiEndpoints } from '@/utils/api';

// 获取作品列表
const works = await apiEndpoints.works.list({ page: 1, limit: 10 });

// 上传文件
const result = await apiEndpoints.works.upload(formData, (progress) => {
  console.log('上传进度:', progress);
});
```

### 样式开发

- 使用CSS变量定义主题
- 遵循BEM命名规范
- 优先使用Ant Design组件样式
- 响应式设计使用媒体查询

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

- [后端API文档](https://github.com/your-username/kaishu-backend)
- [设计规范](https://ant.design/)
- [React文档](https://react.dev/)
- [Vite文档](https://vitejs.dev/)