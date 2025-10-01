/**
 * 主题配置 - 楷书字库项目
 * 定义浅色和深色主题配置
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import animations from './animations';
import { tokens } from './tokens';

// 浅色主题
export const lightTheme = {
  name: 'light',
  
  // 颜色配置
  colors: {
    // 品牌色
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryActive: colors.primary[700],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[800],
    
    secondary: colors.secondary[500],
    secondaryHover: colors.secondary[600],
    secondaryActive: colors.secondary[700],
    
    // 语义色
    success: colors.success[500],
    successLight: colors.success[100],
    successDark: colors.success[700],
    
    warning: colors.warning[500],
    warningLight: colors.warning[100],
    warningDark: colors.warning[700],
    
    error: colors.error[500],
    errorLight: colors.error[100],
    errorDark: colors.error[700],
    
    info: colors.info[500],
    infoLight: colors.info[100],
    infoDark: colors.info[700],
    
    // 文本色
    textPrimary: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textTertiary: colors.neutral[500],
    textDisabled: colors.neutral[400],
    textInverse: colors.white,
    textLink: colors.primary[600],
    textLinkHover: colors.primary[700],
    
    // 背景色
    backgroundPrimary: colors.white,
    backgroundSecondary: colors.neutral[50],
    backgroundTertiary: colors.neutral[100],
    backgroundOverlay: 'rgba(0, 0, 0, 0.5)',
    backgroundModal: colors.white,
    backgroundTooltip: colors.neutral[800],
    
    // 边框色
    borderPrimary: colors.neutral[200],
    borderSecondary: colors.neutral[300],
    borderFocus: colors.primary[500],
    borderError: colors.error[500],
    borderSuccess: colors.success[500],
    borderWarning: colors.warning[500],
    
    // 表面色（卡片、面板等）
    surfacePrimary: colors.white,
    surfaceSecondary: colors.neutral[50],
    surfaceElevated: colors.white,
    
    // 交互色
    interactivePrimary: colors.primary[500],
    interactivePrimaryHover: colors.primary[600],
    interactivePrimaryActive: colors.primary[700],
    interactivePrimaryDisabled: colors.neutral[300],
    
    interactiveSecondary: colors.neutral[100],
    interactiveSecondaryHover: colors.neutral[200],
    interactiveSecondaryActive: colors.neutral[300],
    
    // 楷书特定色彩
    kaishuInk: colors.brand.traditional.ink,
    kaishuVermillion: colors.brand.traditional.vermillion,
    kaishuGold: colors.brand.traditional.gold,
    kaishuJade: colors.brand.traditional.jade,
    kaishuAzure: colors.brand.traditional.azure,
    kaishuIvory: colors.brand.traditional.ivory
  },
  
  // 阴影配置
  shadows: {
    none: shadows.shadows.none,
    xs: shadows.shadows.xs,
    sm: shadows.shadows.sm,
    md: shadows.shadows.md,
    lg: shadows.shadows.lg,
    xl: shadows.shadows.xl,
    '2xl': shadows.shadows['2xl'],
    inner: shadows.shadows.inner,
    outline: shadows.shadows.outline,
    
    // 语义阴影
    card: shadows.semantic.card.rest,
    cardHover: shadows.semantic.card.hover,
    cardActive: shadows.semantic.card.active,
    
    button: shadows.semantic.button.rest,
    buttonHover: shadows.semantic.button.hover,
    buttonActive: shadows.semantic.button.active,
    
    input: shadows.semantic.input.rest,
    inputFocus: shadows.semantic.input.focus,
    inputError: shadows.semantic.input.error,
    
    modal: shadows.semantic.modal.content,
    dropdown: shadows.semantic.dropdown.menu,
    tooltip: shadows.semantic.tooltip.content
  },
  
  // 字体配置
  typography: {
    fontFamily: {
      primary: typography.fontFamilies.primary,
      kaishu: typography.fontFamilies.kaishu,
      mono: typography.fontFamilies.mono,
      system: typography.fontFamilies.system
    },
    
    fontSize: typography.fontSizes,
    fontWeight: typography.fontWeights,
    lineHeight: typography.lineHeights,
    letterSpacing: typography.letterSpacings
  },
  
  // 间距配置
  spacing: spacing.spacing,
  
  // 动画配置
  animations: {
    duration: animations.durations,
    easing: animations.easings,
    transition: {
      fast: animations.transitions.all.fast,
      normal: animations.transitions.all.normal,
      slow: animations.transitions.all.slow
    }
  },
  
  // 边框配置
  borders: {
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px'
    },
    radius: {
      none: '0',
      xs: '2px',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      '2xl': '16px',
      full: '9999px'
    }
  },
  
  // Z轴层级
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800
  }
};

// 深色主题
export const darkTheme = {
  name: 'dark',
  
  // 颜色配置
  colors: {
    // 品牌色（在深色主题中稍微调亮）
    primary: colors.primary[400],
    primaryHover: colors.primary[300],
    primaryActive: colors.primary[200],
    primaryLight: colors.primary[900],
    primaryDark: colors.primary[100],
    
    secondary: colors.secondary[400],
    secondaryHover: colors.secondary[300],
    secondaryActive: colors.secondary[200],
    
    // 语义色
    success: colors.success[400],
    successLight: colors.success[900],
    successDark: colors.success[200],
    
    warning: colors.warning[400],
    warningLight: colors.warning[900],
    warningDark: colors.warning[200],
    
    error: colors.error[400],
    errorLight: colors.error[900],
    errorDark: colors.error[200],
    
    info: colors.info[400],
    infoLight: colors.info[900],
    infoDark: colors.info[200],
    
    // 文本色
    textPrimary: colors.neutral[100],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    textDisabled: colors.neutral[600],
    textInverse: colors.neutral[900],
    textLink: colors.primary[400],
    textLinkHover: colors.primary[300],
    
    // 背景色
    backgroundPrimary: colors.neutral[900],
    backgroundSecondary: colors.neutral[800],
    backgroundTertiary: colors.neutral[700],
    backgroundOverlay: 'rgba(0, 0, 0, 0.7)',
    backgroundModal: colors.neutral[800],
    backgroundTooltip: colors.neutral[700],
    
    // 边框色
    borderPrimary: colors.neutral[700],
    borderSecondary: colors.neutral[600],
    borderFocus: colors.primary[400],
    borderError: colors.error[400],
    borderSuccess: colors.success[400],
    borderWarning: colors.warning[400],
    
    // 表面色
    surfacePrimary: colors.neutral[800],
    surfaceSecondary: colors.neutral[700],
    surfaceElevated: colors.neutral[750] || colors.neutral[700],
    
    // 交互色
    interactivePrimary: colors.primary[400],
    interactivePrimaryHover: colors.primary[300],
    interactivePrimaryActive: colors.primary[200],
    interactivePrimaryDisabled: colors.neutral[600],
    
    interactiveSecondary: colors.neutral[700],
    interactiveSecondaryHover: colors.neutral[600],
    interactiveSecondaryActive: colors.neutral[500],
    
    // 楷书特定色彩（深色主题调整）
    kaishuInk: colors.neutral[200],
    kaishuVermillion: colors.error[400],
    kaishuGold: colors.warning[400],
    kaishuJade: colors.success[400],
    kaishuAzure: colors.info[400],
    kaishuIvory: colors.neutral[100]
  },
  
  // 阴影配置（深色主题使用更深的阴影）
  shadows: {
    none: shadows.darkTheme.none || shadows.shadows.none,
    xs: shadows.darkTheme.xs,
    sm: shadows.darkTheme.sm,
    md: shadows.darkTheme.md,
    lg: shadows.darkTheme.lg,
    xl: shadows.darkTheme.xl,
    '2xl': shadows.darkTheme['2xl'],
    inner: shadows.darkTheme.inner,
    outline: shadows.darkTheme.outline,
    
    // 语义阴影
    card: shadows.darkTheme.sm,
    cardHover: shadows.darkTheme.md,
    cardActive: shadows.darkTheme.lg,
    
    button: shadows.darkTheme.xs,
    buttonHover: shadows.darkTheme.sm,
    buttonActive: shadows.darkTheme.inner,
    
    input: shadows.darkTheme.inner,
    inputFocus: shadows.darkTheme.outline,
    inputError: shadows.darkTheme.outlineError,
    
    modal: shadows.darkTheme['2xl'],
    dropdown: shadows.darkTheme.lg,
    tooltip: shadows.darkTheme.md
  },
  
  // 字体配置（与浅色主题相同）
  typography: lightTheme.typography,
  
  // 间距配置（与浅色主题相同）
  spacing: lightTheme.spacing,
  
  // 动画配置（与浅色主题相同）
  animations: lightTheme.animations,
  
  // 边框配置（与浅色主题相同）
  borders: lightTheme.borders,
  
  // Z轴层级（与浅色主题相同）
  zIndex: lightTheme.zIndex
};

// 主题工具函数
export const themeUtils = {
  // 获取当前主题
  getCurrentTheme: () => {
    if (typeof window === 'undefined') return 'light';
    
    // 检查本地存储
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark'].includes(stored)) {
      return stored;
    }
    
    // 检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  },
  
  // 设置主题
  setTheme: (theme) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    // 触发主题变化事件
    window.dispatchEvent(new CustomEvent('themeChange', { detail: theme }));
  },
  
  // 切换主题
  toggleTheme: () => {
    const current = themeUtils.getCurrentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    themeUtils.setTheme(next);
    return next;
  },
  
  // 监听主题变化
  watchTheme: (callback) => {
    if (typeof window === 'undefined') return () => {};
    
    const handleThemeChange = (event) => {
      callback(event.detail);
    };
    
    const handleSystemThemeChange = (event) => {
      const stored = localStorage.getItem('theme');
      if (!stored) {
        const theme = event.matches ? 'dark' : 'light';
        themeUtils.setTheme(theme);
      }
    };
    
    window.addEventListener('themeChange', handleThemeChange);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  },
  
  // 获取主题配置
  getThemeConfig: (themeName = 'light') => {
    return themeName === 'dark' ? darkTheme : lightTheme;
  },
  
  // 生成CSS变量
  generateCSSVariables: (theme) => {
    const config = themeUtils.getThemeConfig(theme);
    const variables = {};
    
    // 颜色变量
    Object.entries(config.colors).forEach(([key, value]) => {
      variables[`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
    });
    
    // 阴影变量
    Object.entries(config.shadows).forEach(([key, value]) => {
      variables[`--shadow-${key}`] = value;
    });
    
    // 间距变量
    Object.entries(config.spacing).forEach(([key, value]) => {
      variables[`--spacing-${key}`] = value;
    });
    
    // 字体变量
    Object.entries(config.typography.fontSize).forEach(([key, value]) => {
      variables[`--font-size-${key}`] = value;
    });
    
    Object.entries(config.typography.fontWeight).forEach(([key, value]) => {
      variables[`--font-weight-${key}`] = value;
    });
    
    // 边框变量
    Object.entries(config.borders.radius).forEach(([key, value]) => {
      variables[`--border-radius-${key}`] = value;
    });
    
    return variables;
  },
  
  // 应用主题到DOM
  applyTheme: (theme = 'light') => {
    if (typeof document === 'undefined') return;
    
    const variables = themeUtils.generateCSSVariables(theme);
    const root = document.documentElement;
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    root.setAttribute('data-theme', theme);
  }
};

// 主题提供者配置
export const themeProvider = {
  // 初始化主题
  init: () => {
    const theme = themeUtils.getCurrentTheme();
    themeUtils.applyTheme(theme);
    return theme;
  },
  
  // 创建主题上下文
  createContext: (initialTheme = 'light') => {
    return {
      theme: initialTheme,
      config: themeUtils.getThemeConfig(initialTheme),
      setTheme: themeUtils.setTheme,
      toggleTheme: themeUtils.toggleTheme
    };
  }
};

// 预设主题样式
export const themeStyles = {
  // 全局样式
  global: {
    light: {
      body: {
        backgroundColor: lightTheme.colors.backgroundPrimary,
        color: lightTheme.colors.textPrimary,
        fontFamily: lightTheme.typography.fontFamily.primary,
        fontSize: lightTheme.typography.fontSize.base,
        lineHeight: lightTheme.typography.lineHeight.normal
      }
    },
    
    dark: {
      body: {
        backgroundColor: darkTheme.colors.backgroundPrimary,
        color: darkTheme.colors.textPrimary,
        fontFamily: darkTheme.typography.fontFamily.primary,
        fontSize: darkTheme.typography.fontSize.base,
        lineHeight: darkTheme.typography.lineHeight.normal
      }
    }
  },
  
  // 组件样式
  components: {
    // 按钮主题样式
    button: {
      light: {
        primary: {
          backgroundColor: lightTheme.colors.primary,
          color: lightTheme.colors.textInverse,
          '&:hover': {
            backgroundColor: lightTheme.colors.primaryHover
          }
        }
      },
      
      dark: {
        primary: {
          backgroundColor: darkTheme.colors.primary,
          color: darkTheme.colors.textInverse,
          '&:hover': {
            backgroundColor: darkTheme.colors.primaryHover
          }
        }
      }
    }
  }
};

// 导出默认主题
export default {
  light: lightTheme,
  dark: darkTheme,
  utils: themeUtils,
  provider: themeProvider,
  styles: themeStyles
};

// React Hook 示例（如果使用 React）
export const useTheme = () => {
  if (typeof window === 'undefined') {
    return {
      theme: 'light',
      config: lightTheme,
      setTheme: () => {},
      toggleTheme: () => 'light'
    };
  }
  
  const [theme, setThemeState] = React.useState(themeUtils.getCurrentTheme());
  
  React.useEffect(() => {
    const unwatch = themeUtils.watchTheme(setThemeState);
    return unwatch;
  }, []);
  
  const setTheme = React.useCallback((newTheme) => {
    themeUtils.setTheme(newTheme);
    setThemeState(newTheme);
  }, []);
  
  const toggleTheme = React.useCallback(() => {
    const newTheme = themeUtils.toggleTheme();
    setThemeState(newTheme);
    return newTheme;
  }, []);
  
  return {
    theme,
    config: themeUtils.getThemeConfig(theme),
    setTheme,
    toggleTheme
  };
};