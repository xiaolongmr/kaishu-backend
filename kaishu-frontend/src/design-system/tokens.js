/**
 * 设计令牌系统 - 楷书字库项目
 * 定义统一的设计令牌和配置
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import animations from './animations';
import breakpoints from './breakpoints';

// 核心设计令牌
const tokens = {
  // 颜色令牌
  color: {
    // 品牌色
    brand: {
      primary: colors.primary[500],
      secondary: colors.secondary[500],
      accent: colors.brand.kaishu.accent
    },
    
    // 语义色
    semantic: {
      success: colors.success[500],
      warning: colors.warning[500],
      error: colors.error[500],
      info: colors.info[500]
    },
    
    // 文本色
    text: {
      primary: colors.semantic.text.primary,
      secondary: colors.semantic.text.secondary,
      tertiary: colors.semantic.text.tertiary,
      disabled: colors.semantic.text.disabled,
      inverse: colors.semantic.text.inverse,
      link: colors.semantic.text.link
    },
    
    // 背景色
    background: {
      primary: colors.semantic.background.primary,
      secondary: colors.semantic.background.secondary,
      tertiary: colors.semantic.background.tertiary,
      overlay: colors.semantic.background.overlay
    },
    
    // 边框色
    border: {
      primary: colors.semantic.border.primary,
      secondary: colors.semantic.border.secondary,
      focus: colors.semantic.border.focus,
      error: colors.semantic.border.error,
      success: colors.semantic.border.success,
      warning: colors.semantic.border.warning
    }
  },
  
  // 字体令牌
  typography: {
    // 字体族
    fontFamily: {
      primary: typography.fontFamilies.primary,
      kaishu: typography.fontFamilies.kaishu,
      mono: typography.fontFamilies.mono,
      system: typography.fontFamilies.system
    },
    
    // 字体大小
    fontSize: {
      xs: typography.fontSizes.xs,
      sm: typography.fontSizes.sm,
      base: typography.fontSizes.base,
      lg: typography.fontSizes.lg,
      xl: typography.fontSizes.xl,
      '2xl': typography.fontSizes['2xl'],
      '3xl': typography.fontSizes['3xl'],
      '4xl': typography.fontSizes['4xl']
    },
    
    // 字体粗细
    fontWeight: {
      light: typography.fontWeights.light,
      normal: typography.fontWeights.normal,
      medium: typography.fontWeights.medium,
      semibold: typography.fontWeights.semibold,
      bold: typography.fontWeights.bold
    },
    
    // 行高
    lineHeight: {
      tight: typography.lineHeights.tight,
      normal: typography.lineHeights.normal,
      relaxed: typography.lineHeights.relaxed
    }
  },
  
  // 间距令牌
  spacing: {
    // 基础间距
    base: {
      xs: spacing.spacing[1],
      sm: spacing.spacing[2],
      md: spacing.spacing[4],
      lg: spacing.spacing[6],
      xl: spacing.spacing[8],
      xxl: spacing.spacing[12]
    },
    
    // 组件间距
    component: {
      xs: spacing.semantic.component.xs,
      sm: spacing.semantic.component.sm,
      md: spacing.semantic.component.md,
      lg: spacing.semantic.component.lg,
      xl: spacing.semantic.component.xl
    },
    
    // 布局间距
    layout: {
      xs: spacing.semantic.layout.xs,
      sm: spacing.semantic.layout.sm,
      md: spacing.semantic.layout.md,
      lg: spacing.semantic.layout.lg,
      xl: spacing.semantic.layout.xl,
      xxl: spacing.semantic.layout.xxl
    }
  },
  
  // 阴影令牌
  shadow: {
    // 基础阴影
    base: {
      xs: shadows.shadows.xs,
      sm: shadows.shadows.sm,
      md: shadows.shadows.md,
      lg: shadows.shadows.lg,
      xl: shadows.shadows.xl,
      '2xl': shadows.shadows['2xl']
    },
    
    // 语义阴影
    semantic: {
      card: shadows.semantic.card.rest,
      cardHover: shadows.semantic.card.hover,
      button: shadows.semantic.button.rest,
      buttonHover: shadows.semantic.button.hover,
      modal: shadows.semantic.modal.content,
      dropdown: shadows.semantic.dropdown.menu
    }
  },
  
  // 动画令牌
  animation: {
    // 持续时间
    duration: {
      fast: animations.durations.fast,
      normal: animations.durations.normal,
      slow: animations.durations.slow
    },
    
    // 缓动函数
    easing: {
      smooth: animations.easings.smooth,
      bouncy: animations.easings.bouncy,
      elastic: animations.easings.elastic
    },
    
    // 过渡
    transition: {
      all: animations.transitions.all.normal,
      colors: animations.transitions.colors.normal,
      transform: animations.transitions.transform.normal,
      opacity: animations.transitions.opacity.normal
    }
  },
  
  // 断点令牌
  breakpoint: {
    xs: breakpoints.breakpoints.xs,
    sm: breakpoints.breakpoints.sm,
    md: breakpoints.breakpoints.md,
    lg: breakpoints.breakpoints.lg,
    xl: breakpoints.breakpoints.xl,
    xxl: breakpoints.breakpoints.xxl
  },
  
  // 边框令牌
  border: {
    width: {
      none: '0',
      thin: '1px',
      medium: '2px',
      thick: '4px'
    },
    
    radius: {
      none: '0',
      sm: '4px',
      md: '6px',
      lg: '8px',
      xl: '12px',
      full: '9999px'
    },
    
    style: {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted'
    }
  },
  
  // Z轴层级令牌
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
  },
  
  // 尺寸令牌
  size: {
    // 图标尺寸
    icon: {
      xs: '12px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    
    // 头像尺寸
    avatar: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '64px',
      xxl: '96px'
    },
    
    // 按钮高度
    button: {
      xs: '24px',
      sm: '32px',
      md: '40px',
      lg: '48px',
      xl: '56px'
    },
    
    // 输入框高度
    input: {
      sm: '32px',
      md: '40px',
      lg: '48px'
    }
  }
};

// 主题特定令牌
const themeTokens = {
  light: {
    color: {
      text: {
        primary: colors.neutral[900],
        secondary: colors.neutral[600],
        tertiary: colors.neutral[500],
        disabled: colors.neutral[400],
        inverse: colors.white
      },
      background: {
        primary: colors.white,
        secondary: colors.neutral[50],
        tertiary: colors.neutral[100]
      },
      border: {
        primary: colors.neutral[200],
        secondary: colors.neutral[300]
      }
    },
    shadow: {
      base: shadows.shadows,
      semantic: shadows.semantic
    }
  },
  
  dark: {
    color: {
      text: {
        primary: colors.neutral[100],
        secondary: colors.neutral[300],
        tertiary: colors.neutral[400],
        disabled: colors.neutral[600],
        inverse: colors.neutral[900]
      },
      background: {
        primary: colors.neutral[900],
        secondary: colors.neutral[800],
        tertiary: colors.neutral[700]
      },
      border: {
        primary: colors.neutral[700],
        secondary: colors.neutral[600]
      }
    },
    shadow: {
      base: shadows.darkTheme,
      semantic: {
        ...shadows.semantic,
        card: {
          rest: shadows.darkTheme.sm,
          hover: shadows.darkTheme.md,
          active: shadows.darkTheme.lg
        }
      }
    }
  }
};

// 组件特定令牌
const componentTokens = {
  button: {
    borderRadius: tokens.border.radius.md,
    fontWeight: tokens.typography.fontWeight.medium,
    transition: tokens.animation.transition.all,
    
    size: {
      xs: {
        height: tokens.size.button.xs,
        fontSize: tokens.typography.fontSize.xs,
        padding: `${tokens.spacing.base.xs} ${tokens.spacing.base.sm}`
      },
      sm: {
        height: tokens.size.button.sm,
        fontSize: tokens.typography.fontSize.sm,
        padding: `${tokens.spacing.base.sm} ${tokens.spacing.base.md}`
      },
      md: {
        height: tokens.size.button.md,
        fontSize: tokens.typography.fontSize.base,
        padding: `${tokens.spacing.base.sm} ${tokens.spacing.base.lg}`
      },
      lg: {
        height: tokens.size.button.lg,
        fontSize: tokens.typography.fontSize.lg,
        padding: `${tokens.spacing.base.md} ${tokens.spacing.base.xl}`
      },
      xl: {
        height: tokens.size.button.xl,
        fontSize: tokens.typography.fontSize.xl,
        padding: `${tokens.spacing.base.lg} ${tokens.spacing.base.xxl}`
      }
    }
  },
  
  input: {
    borderRadius: tokens.border.radius.md,
    borderWidth: tokens.border.width.thin,
    transition: tokens.animation.transition.all,
    
    size: {
      sm: {
        height: tokens.size.input.sm,
        fontSize: tokens.typography.fontSize.sm,
        padding: `${tokens.spacing.base.xs} ${tokens.spacing.base.sm}`
      },
      md: {
        height: tokens.size.input.md,
        fontSize: tokens.typography.fontSize.base,
        padding: `${tokens.spacing.base.sm} ${tokens.spacing.base.md}`
      },
      lg: {
        height: tokens.size.input.lg,
        fontSize: tokens.typography.fontSize.lg,
        padding: `${tokens.spacing.base.md} ${tokens.spacing.base.lg}`
      }
    }
  },
  
  card: {
    borderRadius: tokens.border.radius.lg,
    borderWidth: tokens.border.width.thin,
    shadow: tokens.shadow.semantic.card,
    padding: tokens.spacing.component.lg,
    transition: tokens.animation.transition.all
  },
  
  modal: {
    borderRadius: tokens.border.radius.xl,
    shadow: tokens.shadow.semantic.modal,
    padding: tokens.spacing.layout.lg,
    zIndex: tokens.zIndex.modal
  }
};

// 应用特定令牌
const appTokens = {
  // 楷书字库特定
  kaishu: {
    // 字符展示
    character: {
      fontSize: {
        sm: '24px',
        md: '32px',
        lg: '48px',
        xl: '64px',
        xxl: '96px'
      },
      fontFamily: tokens.typography.fontFamily.kaishu,
      lineHeight: tokens.typography.lineHeight.relaxed
    },
    
    // 标注框
    annotation: {
      borderColor: tokens.color.brand.primary,
      borderWidth: tokens.border.width.medium,
      borderStyle: tokens.border.style.solid,
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderRadius: tokens.border.radius.sm
    },
    
    // 画布
    canvas: {
      backgroundColor: tokens.color.background.primary,
      borderColor: tokens.color.border.primary,
      borderWidth: tokens.border.width.thin,
      borderRadius: tokens.border.radius.md
    },
    
    // 工具栏
    toolbar: {
      backgroundColor: tokens.color.background.secondary,
      borderColor: tokens.color.border.primary,
      borderRadius: tokens.border.radius.md,
      padding: tokens.spacing.component.md,
      gap: tokens.spacing.component.sm
    }
  }
};

// 令牌工具函数
const tokenUtils = {
  // 获取令牌值
  get: (path, theme = 'light') => {
    const keys = path.split('.');
    let result = theme === 'dark' ? themeTokens.dark : themeTokens.light;
    
    // 首先尝试主题特定令牌
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) break;
    }
    
    // 如果没有找到，尝试通用令牌
    if (result === undefined) {
      result = tokens;
      for (const key of keys) {
        result = result?.[key];
        if (result === undefined) break;
      }
    }
    
    return result;
  },
  
  // 创建CSS变量
  createCSSVariables: (tokenObj, prefix = '--') => {
    const variables = {};
    
    const flatten = (obj, path = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}-${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, newPath);
        } else {
          variables[`${prefix}${newPath}`] = value;
        }
      });
    };
    
    flatten(tokenObj);
    return variables;
  },
  
  // 生成主题CSS
  generateThemeCSS: (theme = 'light') => {
    const themeData = theme === 'dark' ? themeTokens.dark : themeTokens.light;
    const allTokens = { ...tokens, ...themeData };
    
    return tokenUtils.createCSSVariables(allTokens);
  }
};

// 导出设计令牌系统
const tokenSystem = {
  tokens,
  themeTokens,
  componentTokens,
  appTokens,
  tokenUtils
};

export default tokenSystem;

// 导出常用令牌
export {
  tokens,
  themeTokens,
  componentTokens,
  appTokens,
  tokenUtils
};

// 导出工具函数
export const getToken = tokenUtils.get;
export const createCSSVariables = tokenUtils.createCSSVariables;
export const generateThemeCSS = tokenUtils.generateThemeCSS;

// 预定义的CSS变量
export const cssVariables = {
  light: tokenUtils.generateThemeCSS('light'),
  dark: tokenUtils.generateThemeCSS('dark')
};

// 令牌验证函数
export const validateTokens = () => {
  const errors = [];
  
  // 检查必需的令牌
  const requiredTokens = [
    'color.brand.primary',
    'typography.fontSize.base',
    'spacing.base.md',
    'animation.duration.normal'
  ];
  
  requiredTokens.forEach(path => {
    if (tokenUtils.get(path) === undefined) {
      errors.push(`Missing required token: ${path}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 令牌文档生成器
export const generateTokenDocs = () => {
  const docs = {
    colors: Object.keys(tokens.color),
    typography: Object.keys(tokens.typography),
    spacing: Object.keys(tokens.spacing),
    shadows: Object.keys(tokens.shadow),
    animations: Object.keys(tokens.animation),
    breakpoints: Object.keys(tokens.breakpoint),
    borders: Object.keys(tokens.border),
    sizes: Object.keys(tokens.size)
  };
  
  return docs;
};