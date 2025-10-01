/**
 * 阴影系统 - 楷书字库项目
 * 定义统一的阴影效果和层级
 */

// 基础阴影定义
const shadows = {
  // 无阴影
  none: 'none',
  
  // 基础阴影系列
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // 内阴影
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
  
  // 特殊阴影
  outline: '0 0 0 3px rgba(59, 130, 246, 0.5)', // 焦点轮廓
  outlineError: '0 0 0 3px rgba(239, 68, 68, 0.5)', // 错误轮廓
  outlineSuccess: '0 0 0 3px rgba(34, 197, 94, 0.5)', // 成功轮廓
  outlineWarning: '0 0 0 3px rgba(245, 158, 11, 0.5)' // 警告轮廓
};

// 语义化阴影
const semantic = {
  // 卡片阴影
  card: {
    rest: shadows.sm,
    hover: shadows.md,
    active: shadows.lg,
    focus: shadows.outline
  },
  
  // 按钮阴影
  button: {
    rest: shadows.xs,
    hover: shadows.sm,
    active: shadows.inner,
    focus: shadows.outline,
    disabled: shadows.none
  },
  
  // 输入框阴影
  input: {
    rest: shadows.inner,
    focus: shadows.outline,
    error: shadows.outlineError,
    success: shadows.outlineSuccess,
    disabled: shadows.none
  },
  
  // 模态框阴影
  modal: {
    backdrop: 'rgba(0, 0, 0, 0.5)',
    content: shadows['2xl']
  },
  
  // 下拉菜单阴影
  dropdown: {
    menu: shadows.lg,
    item: shadows.none,
    itemHover: shadows.xs
  },
  
  // 工具提示阴影
  tooltip: {
    content: shadows.md
  },
  
  // 导航阴影
  navigation: {
    header: shadows.sm,
    sidebar: shadows.lg,
    tab: shadows.xs
  }
};

// 层级阴影（Z轴深度）
const elevation = {
  0: shadows.none,
  1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
  5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
  6: '0 24px 48px rgba(0, 0, 0, 0.35), 0 20px 15px rgba(0, 0, 0, 0.22)'
};

// 彩色阴影
const colored = {
  // 品牌色阴影
  primary: {
    xs: '0 1px 2px 0 rgba(59, 130, 246, 0.1)',
    sm: '0 1px 3px 0 rgba(59, 130, 246, 0.2), 0 1px 2px 0 rgba(59, 130, 246, 0.12)',
    md: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.12)',
    lg: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1)',
    xl: '0 20px 25px -5px rgba(59, 130, 246, 0.2), 0 10px 10px -5px rgba(59, 130, 246, 0.08)'
  },
  
  // 成功色阴影
  success: {
    xs: '0 1px 2px 0 rgba(34, 197, 94, 0.1)',
    sm: '0 1px 3px 0 rgba(34, 197, 94, 0.2), 0 1px 2px 0 rgba(34, 197, 94, 0.12)',
    md: '0 4px 6px -1px rgba(34, 197, 94, 0.2), 0 2px 4px -1px rgba(34, 197, 94, 0.12)',
    lg: '0 10px 15px -3px rgba(34, 197, 94, 0.2), 0 4px 6px -2px rgba(34, 197, 94, 0.1)'
  },
  
  // 警告色阴影
  warning: {
    xs: '0 1px 2px 0 rgba(245, 158, 11, 0.1)',
    sm: '0 1px 3px 0 rgba(245, 158, 11, 0.2), 0 1px 2px 0 rgba(245, 158, 11, 0.12)',
    md: '0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.12)',
    lg: '0 10px 15px -3px rgba(245, 158, 11, 0.2), 0 4px 6px -2px rgba(245, 158, 11, 0.1)'
  },
  
  // 错误色阴影
  error: {
    xs: '0 1px 2px 0 rgba(239, 68, 68, 0.1)',
    sm: '0 1px 3px 0 rgba(239, 68, 68, 0.2), 0 1px 2px 0 rgba(239, 68, 68, 0.12)',
    md: '0 4px 6px -1px rgba(239, 68, 68, 0.2), 0 2px 4px -1px rgba(239, 68, 68, 0.12)',
    lg: '0 10px 15px -3px rgba(239, 68, 68, 0.2), 0 4px 6px -2px rgba(239, 68, 68, 0.1)'
  }
};

// 暗色主题阴影
const darkTheme = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.4)',
  
  outline: '0 0 0 3px rgba(59, 130, 246, 0.6)',
  outlineError: '0 0 0 3px rgba(239, 68, 68, 0.6)',
  outlineSuccess: '0 0 0 3px rgba(34, 197, 94, 0.6)',
  outlineWarning: '0 0 0 3px rgba(245, 158, 11, 0.6)'
};

// 特殊效果阴影
const effects = {
  // 发光效果
  glow: {
    primary: '0 0 20px rgba(59, 130, 246, 0.5)',
    success: '0 0 20px rgba(34, 197, 94, 0.5)',
    warning: '0 0 20px rgba(245, 158, 11, 0.5)',
    error: '0 0 20px rgba(239, 68, 68, 0.5)',
    white: '0 0 20px rgba(255, 255, 255, 0.5)'
  },
  
  // 霓虹效果
  neon: {
    blue: '0 0 5px #00f, 0 0 10px #00f, 0 0 15px #00f, 0 0 20px #00f',
    pink: '0 0 5px #f0f, 0 0 10px #f0f, 0 0 15px #f0f, 0 0 20px #f0f',
    green: '0 0 5px #0f0, 0 0 10px #0f0, 0 0 15px #0f0, 0 0 20px #0f0'
  },
  
  // 浮雕效果
  emboss: {
    raised: '1px 1px 2px rgba(0, 0, 0, 0.3), -1px -1px 2px rgba(255, 255, 255, 0.8)',
    inset: 'inset 1px 1px 2px rgba(0, 0, 0, 0.3), inset -1px -1px 2px rgba(255, 255, 255, 0.8)'
  },
  
  // 纸张效果
  paper: {
    flat: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    lifted: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    floating: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)'
  }
};

// 动画阴影（用于过渡效果）
const animated = {
  // 悬停效果
  hover: {
    from: shadows.sm,
    to: shadows.lg,
    transition: 'box-shadow 0.2s ease-in-out'
  },
  
  // 点击效果
  press: {
    from: shadows.md,
    to: shadows.inner,
    transition: 'box-shadow 0.1s ease-in-out'
  },
  
  // 焦点效果
  focus: {
    from: shadows.none,
    to: shadows.outline,
    transition: 'box-shadow 0.15s ease-in-out'
  }
};

// 阴影工具函数
const utils = {
  // 创建自定义阴影
  create: ({
    offsetX = 0,
    offsetY = 4,
    blurRadius = 6,
    spreadRadius = 0,
    color = 'rgba(0, 0, 0, 0.1)',
    inset = false
  }) => {
    const insetPrefix = inset ? 'inset ' : '';
    return `${insetPrefix}${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${color}`;
  },
  
  // 组合多个阴影
  combine: (...shadowValues) => {
    return shadowValues.filter(Boolean).join(', ');
  },
  
  // 调整阴影透明度
  opacity: (shadowValue, opacity) => {
    return shadowValue.replace(/rgba?\([^)]+\)/g, (match) => {
      const values = match.match(/\d+(\.\d+)?/g);
      if (values && values.length >= 3) {
        return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
      }
      return match;
    });
  },
  
  // 根据主题获取阴影
  getThemed: (shadowKey, theme = 'light') => {
    if (theme === 'dark' && darkTheme[shadowKey]) {
      return darkTheme[shadowKey];
    }
    return shadows[shadowKey] || shadowKey;
  }
};

// 导出阴影系统
const shadowSystem = {
  shadows,
  semantic,
  elevation,
  colored,
  darkTheme,
  effects,
  animated,
  utils
};

export default shadowSystem;

// 导出常用阴影
export {
  shadows,
  semantic,
  elevation,
  utils
};

// 导出工具函数
export const getShadow = (key, theme = 'light') => {
  return utils.getThemed(key, theme);
};

export const createShadow = utils.create;
export const combineShadows = utils.combine;
export const adjustShadowOpacity = utils.opacity;

// CSS-in-JS 样式生成器
export const generateShadowCSS = () => {
  const css = {};
  
  // 生成基础阴影类
  Object.entries(shadows).forEach(([key, value]) => {
    css[`.shadow-${key}`] = { boxShadow: value };
  });
  
  // 生成层级阴影类
  Object.entries(elevation).forEach(([key, value]) => {
    css[`.elevation-${key}`] = { boxShadow: value };
  });
  
  // 生成彩色阴影类
  Object.entries(colored).forEach(([colorKey, sizes]) => {
    Object.entries(sizes).forEach(([sizeKey, value]) => {
      css[`.shadow-${colorKey}-${sizeKey}`] = { boxShadow: value };
    });
  });
  
  // 生成效果阴影类
  Object.entries(effects.glow).forEach(([key, value]) => {
    css[`.glow-${key}`] = { boxShadow: value };
  });
  
  return css;
};

// 创建阴影样式的辅助函数
export const createShadowStyle = ({
  shadow,
  elevation: elevationLevel,
  colored: coloredShadow,
  effect,
  theme = 'light',
  hover,
  focus,
  active
}) => {
  const style = {};
  
  // 基础阴影
  if (shadow) {
    style.boxShadow = utils.getThemed(shadow, theme);
  }
  
  // 层级阴影
  if (elevationLevel !== undefined) {
    style.boxShadow = elevation[elevationLevel];
  }
  
  // 彩色阴影
  if (coloredShadow) {
    const [color, size] = coloredShadow.split('.');
    if (colored[color] && colored[color][size]) {
      style.boxShadow = colored[color][size];
    }
  }
  
  // 特效阴影
  if (effect) {
    const [effectType, effectVariant] = effect.split('.');
    if (effects[effectType] && effects[effectType][effectVariant]) {
      style.boxShadow = effects[effectType][effectVariant];
    }
  }
  
  // 交互状态
  if (hover || focus || active) {
    style.transition = 'box-shadow 0.2s ease-in-out';
    
    if (hover) {
      style['&:hover'] = {
        boxShadow: utils.getThemed(hover, theme)
      };
    }
    
    if (focus) {
      style['&:focus'] = {
        boxShadow: utils.getThemed(focus, theme)
      };
    }
    
    if (active) {
      style['&:active'] = {
        boxShadow: utils.getThemed(active, theme)
      };
    }
  }
  
  return style;
};