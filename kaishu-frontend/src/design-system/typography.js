/**
 * 字体系统 - 楷书字库项目
 * 定义统一的字体规范和排版样式
 */

// 字体族定义
const fontFamilies = {
  // 主要字体 - 适合中文显示
  primary: [
    'PingFang SC',
    'Hiragino Sans GB',
    'Microsoft YaHei',
    'WenQuanYi Micro Hei',
    'sans-serif'
  ].join(', '),
  
  // 楷书字体 - 用于展示楷书内容
  kaishu: [
    'KaiTi',
    'STKaiti',
    'BiauKai',
    'cursive'
  ].join(', '),
  
  // 等宽字体 - 用于代码和数据
  mono: [
    'SF Mono',
    'Monaco',
    'Inconsolata',
    'Roboto Mono',
    'Source Code Pro',
    'Menlo',
    'Consolas',
    'monospace'
  ].join(', '),
  
  // 衬线字体 - 用于正式文档
  serif: [
    'Georgia',
    'Times New Roman',
    'serif'
  ].join(', '),
  
  // 系统字体 - 用于界面元素
  system: [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'Noto Sans',
    'sans-serif'
  ].join(', ')
};

// 字体大小系统 (rem)
const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
  '9xl': '8rem'     // 128px
};

// 字体粗细
const fontWeights = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900
};

// 行高系统
const lineHeights = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2
};

// 字母间距
const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
};

// 文本样式预设
const textStyles = {
  // 标题样式
  h1: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    fontFamily: fontFamilies.primary
  },
  
  h2: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    fontFamily: fontFamilies.primary
  },
  
  h3: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  h5: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  h6: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  // 正文样式
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary
  },
  
  // 楷书样式
  kaishuLarge: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.wide,
    fontFamily: fontFamilies.kaishu
  },
  
  kaishuMedium: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.kaishu
  },
  
  kaishuSmall: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.kaishu
  },
  
  // 界面元素样式
  button: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  buttonSmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  buttonLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  // 标签和说明文字
  label: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  // 代码样式
  code: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono
  },
  
  codeBlock: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.mono
  },
  
  // 链接样式
  link: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.primary,
    textDecoration: 'underline'
  },
  
  // 导航样式
  nav: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  // 表格样式
  tableHeader: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  },
  
  tableCell: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    fontFamily: fontFamilies.system
  }
};

// 响应式字体大小
const responsiveFontSizes = {
  xs: {
    base: fontSizes.xs,
    sm: fontSizes.sm,
    md: fontSizes.sm,
    lg: fontSizes.base,
    xl: fontSizes.base
  },
  sm: {
    base: fontSizes.sm,
    sm: fontSizes.base,
    md: fontSizes.base,
    lg: fontSizes.lg,
    xl: fontSizes.lg
  },
  base: {
    base: fontSizes.base,
    sm: fontSizes.lg,
    md: fontSizes.lg,
    lg: fontSizes.xl,
    xl: fontSizes.xl
  },
  lg: {
    base: fontSizes.lg,
    sm: fontSizes.xl,
    md: fontSizes.xl,
    lg: fontSizes['2xl'],
    xl: fontSizes['2xl']
  },
  xl: {
    base: fontSizes.xl,
    sm: fontSizes['2xl'],
    md: fontSizes['2xl'],
    lg: fontSizes['3xl'],
    xl: fontSizes['3xl']
  }
};

// 文本截断样式
const textTruncate = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
};

const textTruncateMultiline = (lines = 2) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden'
});

// 导出字体系统
const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  textStyles,
  responsiveFontSizes,
  textTruncate,
  textTruncateMultiline
};

export default typography;

// 导出工具函数
export const getTextStyle = (styleName) => {
  return textStyles[styleName] || {};
};

export const getResponsiveFontSize = (size, breakpoint = 'base') => {
  return responsiveFontSizes[size]?.[breakpoint] || fontSizes[size] || fontSizes.base;
};

export const createTextStyle = ({
  fontSize = fontSizes.base,
  fontWeight = fontWeights.normal,
  lineHeight = lineHeights.normal,
  letterSpacing = letterSpacings.normal,
  fontFamily = fontFamilies.primary,
  ...rest
}) => ({
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  fontFamily,
  ...rest
});

// CSS-in-JS 样式生成器
export const generateTypographyCSS = () => {
  const css = {};
  
  Object.entries(textStyles).forEach(([key, style]) => {
    css[`.text-${key}`] = style;
  });
  
  Object.entries(fontSizes).forEach(([key, size]) => {
    css[`.text-${key}`] = { fontSize: size };
  });
  
  Object.entries(fontWeights).forEach(([key, weight]) => {
    css[`.font-${key}`] = { fontWeight: weight };
  });
  
  return css;
};