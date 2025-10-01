# 楷书字库设计系统

一个专为楷书字库项目设计的统一设计系统，提供完整的设计规范、组件样式和主题支持。

## 🎨 特性

- **统一的设计语言** - 完整的颜色、字体、间距、阴影规范
- **主题支持** - 内置浅色/深色主题，支持自定义主题
- **响应式设计** - 完整的断点系统和响应式工具
- **可访问性** - 遵循WCAG指南的可访问性设计
- **楷书特色** - 专为中文楷书展示优化的设计元素
- **TypeScript支持** - 完整的类型定义
- **CSS-in-JS友好** - 支持各种CSS-in-JS库

## 📦 安装

```bash
# 设计系统已内置在项目中
import designSystem from './design-system';
```

## 🚀 快速开始

### 基础使用

```javascript
import { colors, typography, spacing, shadows } from './design-system';

// 使用颜色
const buttonStyle = {
  backgroundColor: colors.semantic.interactive.primary,
  color: colors.semantic.text.inverse,
  padding: spacing.semantic.component.md,
  boxShadow: shadows.semantic.button.rest
};
```

### 主题系统

```javascript
import { themeUtils, lightTheme, darkTheme } from './design-system';

// 获取当前主题
const currentTheme = themeUtils.getCurrentTheme();

// 切换主题
themeUtils.toggleTheme();

// 设置特定主题
themeUtils.setTheme('dark');

// 获取主题配置
const themeConfig = themeUtils.getThemeConfig('light');
```

### 工具函数

```javascript
import { styleUtils, colorUtils, spacingUtils } from './design-system';

// 创建响应式样式
const responsiveStyle = styleUtils.responsive({
  base: { fontSize: '16px' },
  md: { fontSize: '18px' },
  lg: { fontSize: '20px' }
});

// 创建悬停效果
const hoverStyle = styleUtils.hover({
  backgroundColor: colors.primary[600]
});

// 创建RGBA颜色
const transparentColor = colorUtils.rgba('#3b82f6', 0.5);
```

## 🎨 设计令牌

### 颜色系统

```javascript
import { colors } from './design-system';

// 品牌色
colors.primary[500]     // 主色
colors.secondary[500]   // 辅助色

// 语义色
colors.semantic.text.primary      // 主要文本色
colors.semantic.background.primary // 主要背景色
colors.semantic.border.primary     // 主要边框色

// 状态色
colors.semantic.status.success  // 成功色
colors.semantic.status.error    // 错误色
colors.semantic.status.warning  // 警告色
```

### 字体系统

```javascript
import { typography } from './design-system';

// 字体族
typography.fontFamilies.primary  // 主要字体
typography.fontFamilies.kaishu   // 楷书字体
typography.fontFamilies.mono     // 等宽字体

// 预设文本样式
typography.textStyles.h1         // 标题1样式
typography.textStyles.body       // 正文样式
typography.textStyles.kaishuLarge // 大号楷书样式
```

### 间距系统

```javascript
import { spacing } from './design-system';

// 基础间距
spacing.spacing[4]              // 16px
spacing.spacing[8]              // 32px

// 语义间距
spacing.semantic.component.md   // 组件中等间距
spacing.semantic.layout.lg      // 布局大间距

// 特定用途间距
spacing.purpose.button.padding.md  // 按钮中等内边距
spacing.purpose.form.fieldGap      // 表单字段间距
```

### 阴影系统

```javascript
import { shadows } from './design-system';

// 基础阴影
shadows.shadows.sm              // 小阴影
shadows.shadows.lg              // 大阴影

// 语义阴影
shadows.semantic.card.rest      // 卡片静态阴影
shadows.semantic.button.hover   // 按钮悬停阴影
```

## 🎭 主题定制

### 创建自定义主题

```javascript
import { createDesignSystem } from './design-system';

const customTheme = {
  name: 'custom',
  colors: {
    primary: '#your-primary-color',
    // ... 其他颜色配置
  }
};

const customDesignSystem = createDesignSystem({
  themes: {
    custom: customTheme
  }
});
```

### 主题切换组件示例

```jsx
import React from 'react';
import { themeUtils } from './design-system';

const ThemeToggle = () => {
  const [theme, setTheme] = React.useState(themeUtils.getCurrentTheme());
  
  const handleToggle = () => {
    const newTheme = themeUtils.toggleTheme();
    setTheme(newTheme);
  };
  
  return (
    <button onClick={handleToggle}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
```

## 🧩 组件样式

### 按钮组件

```javascript
import { components } from './design-system';

// 基础按钮样式
const buttonStyle = {
  ...components.button.base,
  ...components.button.variants.primary,
  ...components.button.sizes.md
};
```

### 输入框组件

```javascript
// 基础输入框样式
const inputStyle = {
  ...components.input.base,
  ...components.input.sizes.md
};

// 错误状态输入框
const errorInputStyle = {
  ...inputStyle,
  ...components.input.states.error
};
```

## 📱 响应式设计

### 断点系统

```javascript
import { breakpoints } from './design-system';

// 媒体查询
const responsiveStyle = {
  fontSize: '16px',
  [breakpoints.mediaQueries.up('md')]: {
    fontSize: '18px'
  },
  [breakpoints.mediaQueries.up('lg')]: {
    fontSize: '20px'
  }
};
```

### 响应式工具

```javascript
import { styleUtils } from './design-system';

// 创建响应式样式
const style = styleUtils.responsive({
  base: { padding: '16px' },
  md: { padding: '24px' },
  lg: { padding: '32px' }
});
```

## 🎯 楷书特色功能

### 楷书字符展示

```javascript
import { tokens } from './design-system';

// 楷书字符样式
const kaishuCharacterStyle = {
  fontFamily: tokens.appTokens.kaishu.character.fontFamily,
  fontSize: tokens.appTokens.kaishu.character.fontSize.lg,
  lineHeight: tokens.appTokens.kaishu.character.lineHeight
};
```

### 标注框样式

```javascript
// 标注框样式
const annotationStyle = {
  ...tokens.appTokens.kaishu.annotation,
  position: 'absolute'
};
```

### 画布样式

```javascript
// 画布容器样式
const canvasStyle = {
  ...tokens.appTokens.kaishu.canvas,
  width: '100%',
  height: '400px'
};
```

## 🛠 工具函数详解

### 布局工具

```javascript
import { layoutUtils } from './design-system';

// Flexbox布局
const flexStyle = layoutUtils.flex({
  direction: 'row',
  justify: 'center',
  align: 'center',
  gap: 4
});

// Grid布局
const gridStyle = layoutUtils.grid({
  columns: 3,
  gap: 4
});

// 居中
const centerStyle = layoutUtils.center('both');
```

### 动画工具

```javascript
import { animationUtils } from './design-system';

// 创建过渡
const transitionStyle = animationUtils.transition(
  ['opacity', 'transform'],
  'normal',
  'smooth'
);

// 创建动画
const animationStyle = animationUtils.animation({
  name: 'fadeIn',
  duration: 'normal',
  easing: 'smooth'
});
```

## ♿ 可访问性

### 可访问性工具

```javascript
import { a11yUtils } from './design-system';

// 屏幕阅读器专用文本
const srOnlyStyle = a11yUtils.srOnly();

// 焦点可见样式
const focusStyle = a11yUtils.focusVisible({
  outline: '2px solid blue'
});

// 减少动画
const reducedMotionStyle = a11yUtils.reduceMotion({
  animation: 'none'
});
```

## 📚 最佳实践

### 1. 使用语义化令牌

```javascript
// ✅ 推荐：使用语义化令牌
color: colors.semantic.text.primary

// ❌ 不推荐：直接使用原始值
color: colors.neutral[900]
```

### 2. 保持一致性

```javascript
// ✅ 推荐：使用设计系统的间距
padding: spacing.semantic.component.md

// ❌ 不推荐：使用任意值
padding: '15px'
```

### 3. 响应式优先

```javascript
// ✅ 推荐：移动优先的响应式设计
const style = styleUtils.responsive({
  base: { fontSize: '14px' },    // 移动端
  md: { fontSize: '16px' },      // 平板
  lg: { fontSize: '18px' }       // 桌面
});
```

### 4. 主题感知

```javascript
// ✅ 推荐：使用主题感知的颜色
const style = themeUtils.variant(
  { backgroundColor: lightTheme.colors.backgroundPrimary },
  { backgroundColor: darkTheme.colors.backgroundPrimary }
);
```

## 🔧 开发工具

### CSS变量生成

```javascript
import { themeUtils } from './design-system';

// 生成CSS变量
const cssVariables = themeUtils.generateCSSVariables('light');

// 应用到DOM
themeUtils.applyTheme('light');
```

### 样式调试

```javascript
import { mergeStyles, conditionalStyles } from './design-system';

// 合并样式
const mergedStyle = mergeStyles(
  baseStyle,
  conditionalStyles(isActive, activeStyle),
  hoverStyle
);
```

## 📖 API参考

详细的API文档请参考各个模块的JSDoc注释。

## 🤝 贡献指南

1. 遵循现有的设计令牌结构
2. 保持向后兼容性
3. 添加适当的文档和示例
4. 确保可访问性标准

## 📄 许可证

本设计系统遵循项目的开源许可证。