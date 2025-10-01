/**
 * 楷书字库项目统一设计系统
 * 定义全局的设计规范和样式变量
 */

// 导入所有设计系统模块
import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import breakpoints from './breakpoints';
import shadows from './shadows';
import animations from './animations';
import components from './components';
import tokens from './tokens';
import { lightTheme, darkTheme, themeUtils, themeProvider } from './themes';
import utils from './utils';

// 导出所有设计系统模块
export { default as colors } from './colors';
export { default as typography } from './typography';
export { default as spacing } from './spacing';
export { default as breakpoints } from './breakpoints';
export { default as shadows } from './shadows';
export { default as animations } from './animations';
export { default as components } from './components';
export { default as tokens } from './tokens';
export { default as utils } from './utils';

// 导出主题配置
export { lightTheme, darkTheme, themeUtils, themeProvider } from './themes';

// 导出工具函数
export * from './utils';

// 设计系统配置
const designSystemConfig = {
  // 版本信息
  version: '1.0.0',
  name: '楷书字库设计系统',
  
  // 核心模块
  colors,
  typography,
  spacing,
  breakpoints,
  shadows,
  animations,
  components,
  tokens,
  utils,
  
  // 主题系统
  themes: {
    light: lightTheme,
    dark: darkTheme
  },
  themeUtils,
  themeProvider,
  
  // 快捷访问
  theme: {
    current: 'light',
    get: themeUtils.getCurrentTheme,
    set: themeUtils.setTheme,
    toggle: themeUtils.toggleTheme,
    config: themeUtils.getThemeConfig
  }
};

// 初始化设计系统
const initDesignSystem = () => {
  // 应用默认主题
  const currentTheme = themeUtils.getCurrentTheme();
  themeUtils.applyTheme(currentTheme);
  
  // 设置CSS变量
  const variables = themeUtils.generateCSSVariables(currentTheme);
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }
  
  return currentTheme;
};

// 创建设计系统实例
const createDesignSystem = (config = {}) => {
  return {
    ...designSystemConfig,
    ...config,
    init: initDesignSystem
  };
};

// 默认导出完整的设计系统
const designSystem = createDesignSystem();

export default designSystem;

// 导出创建函数
export { createDesignSystem, initDesignSystem };

// 导出常用组合
export const ds = designSystem; // 简短别名
export const theme = designSystem.theme;
export const ui = {
  colors: colors.semantic,
  spacing: spacing.semantic,
  shadows: shadows.semantic,
  typography: typography.textStyles
};

// 全局样式生成器
export const generateGlobalStyles = (themeName = 'light') => {
  const themeConfig = themeUtils.getThemeConfig(themeName);
  
  return {
    '*': {
      boxSizing: 'border-box',
      margin: 0,
      padding: 0
    },
    
    'html, body': {
      fontFamily: themeConfig.typography.fontFamily.primary,
      fontSize: themeConfig.typography.fontSize.base,
      lineHeight: themeConfig.typography.lineHeight.normal,
      color: themeConfig.colors.textPrimary,
      backgroundColor: themeConfig.colors.backgroundPrimary,
      transition: 'color 0.2s ease, background-color 0.2s ease'
    },
    
    'h1, h2, h3, h4, h5, h6': {
      fontWeight: typography.fontWeights.semibold,
      lineHeight: typography.lineHeights.tight
    },
    
    'a': {
      color: themeConfig.colors.textLink,
      textDecoration: 'none',
      transition: 'color 0.2s ease',
      
      '&:hover': {
        color: themeConfig.colors.textLinkHover
      }
    },
    
    'button': {
      fontFamily: 'inherit',
      cursor: 'pointer'
    },
    
    'input, textarea, select': {
      fontFamily: 'inherit'
    },
    
    // 可访问性
    '@media (prefers-reduced-motion: reduce)': {
      '*': {
        animationDuration: '0.01ms !important',
        animationIterationCount: '1 !important',
        transitionDuration: '0.01ms !important'
      }
    }
  };
};

// CSS-in-JS 样式表生成器
export const generateStylesheet = (themeName = 'light') => {
  const globalStyles = generateGlobalStyles(themeName);
  const utilityClasses = utils.createUtilityClasses();
  
  return {
    ...globalStyles,
    ...utilityClasses
  };
};