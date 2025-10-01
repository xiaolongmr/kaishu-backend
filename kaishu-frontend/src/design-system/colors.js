/**
 * 颜色系统 - 楷书字库项目
 * 定义统一的颜色变量和调色板
 */

// 基础颜色调色板
const palette = {
  // 主色调 - 传统中国风配色
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // 主色
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // 辅助色 - 墨色系
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // 辅助色
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  
  // 成功色 - 竹绿
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // 成功色
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  // 警告色 - 金黄
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // 警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  // 错误色 - 朱红
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // 错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  
  // 信息色 - 青蓝
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // 信息色
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // 中性色 - 灰度系统
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  
  // 特殊颜色
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  current: 'currentColor'
};

// 语义化颜色映射
const semantic = {
  // 文本颜色
  text: {
    primary: palette.neutral[900],
    secondary: palette.neutral[600],
    tertiary: palette.neutral[500],
    disabled: palette.neutral[400],
    inverse: palette.white,
    link: palette.primary[600],
    linkHover: palette.primary[700]
  },
  
  // 背景颜色
  background: {
    primary: palette.white,
    secondary: palette.neutral[50],
    tertiary: palette.neutral[100],
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: palette.white,
    tooltip: palette.neutral[800]
  },
  
  // 边框颜色
  border: {
    primary: palette.neutral[200],
    secondary: palette.neutral[300],
    focus: palette.primary[500],
    error: palette.error[500],
    success: palette.success[500],
    warning: palette.warning[500]
  },
  
  // 状态颜色
  status: {
    success: palette.success[500],
    warning: palette.warning[500],
    error: palette.error[500],
    info: palette.info[500]
  },
  
  // 交互颜色
  interactive: {
    primary: palette.primary[500],
    primaryHover: palette.primary[600],
    primaryActive: palette.primary[700],
    primaryDisabled: palette.neutral[300],
    
    secondary: palette.secondary[500],
    secondaryHover: palette.secondary[600],
    secondaryActive: palette.secondary[700],
    secondaryDisabled: palette.neutral[300]
  }
};

// 暗色主题颜色
const darkTheme = {
  text: {
    primary: palette.neutral[100],
    secondary: palette.neutral[300],
    tertiary: palette.neutral[400],
    disabled: palette.neutral[600],
    inverse: palette.neutral[900],
    link: palette.primary[400],
    linkHover: palette.primary[300]
  },
  
  background: {
    primary: palette.neutral[900],
    secondary: palette.neutral[800],
    tertiary: palette.neutral[700],
    overlay: 'rgba(0, 0, 0, 0.7)',
    modal: palette.neutral[800],
    tooltip: palette.neutral[700]
  },
  
  border: {
    primary: palette.neutral[700],
    secondary: palette.neutral[600],
    focus: palette.primary[400],
    error: palette.error[400],
    success: palette.success[400],
    warning: palette.warning[400]
  },
  
  status: {
    success: palette.success[400],
    warning: palette.warning[400],
    error: palette.error[400],
    info: palette.info[400]
  },
  
  interactive: {
    primary: palette.primary[400],
    primaryHover: palette.primary[300],
    primaryActive: palette.primary[200],
    primaryDisabled: palette.neutral[600],
    
    secondary: palette.secondary[400],
    secondaryHover: palette.secondary[300],
    secondaryActive: palette.secondary[200],
    secondaryDisabled: palette.neutral[600]
  }
};

// 品牌颜色
const brand = {
  // 楷书字库品牌色
  kaishu: {
    primary: '#1a365d', // 深蓝墨色
    secondary: '#2d3748', // 深灰墨色
    accent: '#e53e3e', // 朱砂红
    gold: '#d69e2e' // 金色
  },
  
  // 传统中国色彩
  traditional: {
    ink: '#2d3748', // 墨色
    vermillion: '#e53e3e', // 朱砂
    gold: '#d69e2e', // 金色
    jade: '#38a169', // 翡翠绿
    azure: '#3182ce', // 天青
    ivory: '#fffaf0' // 象牙白
  }
};

// 功能性颜色
const functional = {
  // 表单状态
  form: {
    valid: palette.success[500],
    invalid: palette.error[500],
    focus: palette.primary[500],
    disabled: palette.neutral[300]
  },
  
  // 数据可视化
  chart: [
    palette.primary[500],
    palette.success[500],
    palette.warning[500],
    palette.error[500],
    palette.info[500],
    palette.secondary[500],
    palette.primary[300],
    palette.success[300],
    palette.warning[300],
    palette.error[300]
  ],
  
  // 优先级颜色
  priority: {
    high: palette.error[500],
    medium: palette.warning[500],
    low: palette.success[500],
    none: palette.neutral[400]
  }
};

// 导出颜色系统
const colors = {
  palette,
  semantic,
  darkTheme,
  brand,
  functional,
  
  // 快捷访问
  primary: palette.primary,
  secondary: palette.secondary,
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  info: palette.info,
  neutral: palette.neutral,
  white: palette.white,
  black: palette.black,
  transparent: palette.transparent
};

export default colors;

// 导出工具函数
export const getColor = (colorPath, theme = 'light') => {
  const themeColors = theme === 'dark' ? darkTheme : semantic;
  const keys = colorPath.split('.');
  
  let result = themeColors;
  for (const key of keys) {
    result = result[key];
    if (!result) break;
  }
  
  return result || colorPath;
};

export const rgba = (color, alpha) => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
};

export const lighten = (color, amount) => {
  // 简化的颜色变亮函数
  return color;
};

export const darken = (color, amount) => {
  // 简化的颜色变暗函数
  return color;
};