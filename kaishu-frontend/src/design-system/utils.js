/**
 * 设计系统工具函数 - 楷书字库项目
 * 提供便捷的样式生成和主题切换功能
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import animations from './animations';
import breakpoints from './breakpoints';
import { lightTheme, darkTheme } from './themes';

// 样式生成工具
export const styleUtils = {
  // 创建响应式样式
  responsive: (styles) => {
    const responsiveStyles = {};
    
    Object.entries(styles).forEach(([breakpoint, style]) => {
      if (breakpoint === 'base') {
        Object.assign(responsiveStyles, style);
      } else {
        const mediaQuery = breakpoints.mediaQueries.up(breakpoint);
        if (mediaQuery) {
          responsiveStyles[mediaQuery] = style;
        }
      }
    });
    
    return responsiveStyles;
  },
  
  // 创建悬停效果
  hover: (styles) => {
    return {
      '&:hover': styles
    };
  },
  
  // 创建焦点效果
  focus: (styles) => {
    return {
      '&:focus': styles
    };
  },
  
  // 创建激活效果
  active: (styles) => {
    return {
      '&:active': styles
    };
  },
  
  // 创建禁用效果
  disabled: (styles) => {
    return {
      '&:disabled, &[disabled]': styles
    };
  },
  
  // 组合多个状态
  states: ({ hover, focus, active, disabled: disabledStyle }) => {
    const stateStyles = {};
    
    if (hover) stateStyles['&:hover'] = hover;
    if (focus) stateStyles['&:focus'] = focus;
    if (active) stateStyles['&:active'] = active;
    if (disabledStyle) stateStyles['&:disabled, &[disabled]'] = disabledStyle;
    
    return stateStyles;
  },
  
  // 创建伪元素样式
  pseudo: (element, styles) => {
    return {
      [`&::${element}`]: styles
    };
  },
  
  // 创建子元素样式
  child: (selector, styles) => {
    return {
      [`& ${selector}`]: styles
    };
  }
};

// 颜色工具
export const colorUtils = {
  // 获取颜色值
  get: (colorPath, theme = 'light') => {
    const themeConfig = theme === 'dark' ? darkTheme : lightTheme;
    const keys = colorPath.split('.');
    
    let result = themeConfig.colors;
    for (const key of keys) {
      result = result[key];
      if (!result) break;
    }
    
    return result || colorPath;
  },
  
  // 创建RGBA颜色
  rgba: (color, alpha) => {
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    
    return color;
  },
  
  // 获取对比色
  getContrast: (backgroundColor) => {
    // 简化的对比度计算
    const isLight = backgroundColor === '#ffffff' || backgroundColor.includes('50') || backgroundColor.includes('100');
    return isLight ? colors.neutral[900] : colors.white;
  },
  
  // 创建渐变
  gradient: (direction, ...colorStops) => {
    return `linear-gradient(${direction}, ${colorStops.join(', ')})`;
  }
};

// 间距工具
export const spacingUtils = {
  // 获取间距值
  get: (size) => {
    return spacing.spacing[size] || size;
  },
  
  // 创建内边距
  padding: (top, right = top, bottom = top, left = right) => {
    const values = [top, right, bottom, left].map(v => spacingUtils.get(v));
    return {
      padding: values.join(' ')
    };
  },
  
  // 创建外边距
  margin: (top, right = top, bottom = top, left = right) => {
    const values = [top, right, bottom, left].map(v => spacingUtils.get(v));
    return {
      margin: values.join(' ')
    };
  },
  
  // 创建间隙
  gap: (size) => {
    return {
      gap: spacingUtils.get(size)
    };
  },
  
  // 创建响应式间距
  responsiveSpacing: (property, sizes) => {
    const styles = {};
    
    Object.entries(sizes).forEach(([breakpoint, size]) => {
      const value = spacingUtils.get(size);
      
      if (breakpoint === 'base') {
        styles[property] = value;
      } else {
        const mediaQuery = breakpoints.mediaQueries.up(breakpoint);
        if (mediaQuery) {
          styles[mediaQuery] = { [property]: value };
        }
      }
    });
    
    return styles;
  }
};

// 字体工具
export const typographyUtils = {
  // 获取文本样式
  getTextStyle: (styleName) => {
    return typography.textStyles[styleName] || {};
  },
  
  // 创建自定义文本样式
  createTextStyle: ({
    fontSize = typography.fontSizes.base,
    fontWeight = typography.fontWeights.normal,
    lineHeight = typography.lineHeights.normal,
    letterSpacing = typography.letterSpacings.normal,
    fontFamily = typography.fontFamilies.primary,
    color,
    ...rest
  }) => {
    const style = {
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      fontFamily,
      ...rest
    };
    
    if (color) {
      style.color = color;
    }
    
    return style;
  },
  
  // 创建响应式字体大小
  responsiveFontSize: (sizes) => {
    return styleUtils.responsive(
      Object.entries(sizes).reduce((acc, [breakpoint, size]) => {
        acc[breakpoint] = { fontSize: typography.fontSizes[size] || size };
        return acc;
      }, {})
    );
  },
  
  // 文本截断
  truncate: (lines = 1) => {
    if (lines === 1) {
      return {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      };
    }
    
    return {
      display: '-webkit-box',
      WebkitLineClamp: lines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    };
  }
};

// 阴影工具
export const shadowUtils = {
  // 获取阴影值
  get: (shadowKey, theme = 'light') => {
    const themeConfig = theme === 'dark' ? darkTheme : lightTheme;
    return themeConfig.shadows[shadowKey] || shadows.shadows[shadowKey] || shadowKey;
  },
  
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
  }
};

// 动画工具
export const animationUtils = {
  // 创建过渡
  transition: (properties, duration = 'normal', easing = 'smooth', delay = 'none') => {
    const props = Array.isArray(properties) ? properties : [properties];
    const durationValue = animations.durations[duration] || duration;
    const easingValue = animations.easings[easing] || easing;
    const delayValue = animations.delays[delay] || delay;
    
    const transitions = props.map(prop => `${prop} ${durationValue} ${easingValue} ${delayValue}`);
    
    return {
      transition: transitions.join(', ')
    };
  },
  
  // 创建动画
  animation: ({
    name,
    duration = 'normal',
    easing = 'smooth',
    delay = 'none',
    iteration = 1,
    direction = 'normal',
    fillMode = 'both'
  }) => {
    const durationValue = animations.durations[duration] || duration;
    const easingValue = animations.easings[easing] || easing;
    const delayValue = animations.delays[delay] || delay;
    
    return {
      animation: `${name} ${durationValue} ${easingValue} ${delayValue} ${iteration} ${direction} ${fillMode}`
    };
  },
  
  // 创建关键帧
  keyframes: (name, frames) => {
    return {
      [`@keyframes ${name}`]: frames
    };
  }
};

// 布局工具
export const layoutUtils = {
  // Flexbox 工具
  flex: ({
    direction = 'row',
    wrap = 'nowrap',
    justify = 'flex-start',
    align = 'stretch',
    gap
  } = {}) => {
    const style = {
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap,
      justifyContent: justify,
      alignItems: align
    };
    
    if (gap) {
      style.gap = spacingUtils.get(gap);
    }
    
    return style;
  },
  
  // Grid 工具
  grid: ({
    columns,
    rows,
    gap,
    columnGap,
    rowGap,
    areas
  } = {}) => {
    const style = {
      display: 'grid'
    };
    
    if (columns) {
      style.gridTemplateColumns = typeof columns === 'number' 
        ? `repeat(${columns}, 1fr)` 
        : columns;
    }
    
    if (rows) {
      style.gridTemplateRows = typeof rows === 'number' 
        ? `repeat(${rows}, 1fr)` 
        : rows;
    }
    
    if (gap) style.gap = spacingUtils.get(gap);
    if (columnGap) style.columnGap = spacingUtils.get(columnGap);
    if (rowGap) style.rowGap = spacingUtils.get(rowGap);
    if (areas) style.gridTemplateAreas = areas;
    
    return style;
  },
  
  // 居中
  center: (type = 'both') => {
    const styles = {
      display: 'flex'
    };
    
    switch (type) {
      case 'horizontal':
        styles.justifyContent = 'center';
        break;
      case 'vertical':
        styles.alignItems = 'center';
        break;
      case 'both':
      default:
        styles.justifyContent = 'center';
        styles.alignItems = 'center';
        break;
    }
    
    return styles;
  },
  
  // 绝对定位居中
  absoluteCenter: () => {
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  },
  
  // 容器
  container: (maxWidth = 'xl', padding = 4) => {
    const maxWidths = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    };
    
    return {
      width: '100%',
      maxWidth: maxWidths[maxWidth] || maxWidth,
      marginLeft: 'auto',
      marginRight: 'auto',
      paddingLeft: spacingUtils.get(padding),
      paddingRight: spacingUtils.get(padding)
    };
  }
};

// 主题工具
export const themeUtils = {
  // 获取主题值
  getValue: (path, theme = 'light') => {
    const themeConfig = theme === 'dark' ? darkTheme : lightTheme;
    const keys = path.split('.');
    
    let result = themeConfig;
    for (const key of keys) {
      result = result[key];
      if (!result) break;
    }
    
    return result;
  },
  
  // 创建主题变体
  variant: (lightStyles, darkStyles) => {
    return {
      ...lightStyles,
      '[data-theme="dark"] &': darkStyles
    };
  },
  
  // 创建主题感知样式
  themed: (styles) => {
    const themedStyles = {};
    
    Object.entries(styles).forEach(([theme, style]) => {
      if (theme === 'light') {
        Object.assign(themedStyles, style);
      } else {
        themedStyles[`[data-theme="${theme}"] &`] = style;
      }
    });
    
    return themedStyles;
  }
};

// 可访问性工具
export const a11yUtils = {
  // 屏幕阅读器专用文本
  srOnly: () => {
    return {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: '0'
    };
  },
  
  // 焦点可见
  focusVisible: (styles) => {
    return {
      '&:focus-visible': styles
    };
  },
  
  // 高对比度模式
  highContrast: (styles) => {
    return {
      '@media (prefers-contrast: high)': styles
    };
  },
  
  // 减少动画
  reduceMotion: (styles) => {
    return {
      '@media (prefers-reduced-motion: reduce)': styles
    };
  }
};

// 工具函数组合
export const createUtilityClasses = () => {
  const utilities = {};
  
  // 间距工具类
  Object.entries(spacing.spacing).forEach(([key, value]) => {
    utilities[`.p-${key}`] = { padding: value };
    utilities[`.m-${key}`] = { margin: value };
    utilities[`.px-${key}`] = { paddingLeft: value, paddingRight: value };
    utilities[`.py-${key}`] = { paddingTop: value, paddingBottom: value };
    utilities[`.mx-${key}`] = { marginLeft: value, marginRight: value };
    utilities[`.my-${key}`] = { marginTop: value, marginBottom: value };
  });
  
  // 字体大小工具类
  Object.entries(typography.fontSizes).forEach(([key, value]) => {
    utilities[`.text-${key}`] = { fontSize: value };
  });
  
  // 字体粗细工具类
  Object.entries(typography.fontWeights).forEach(([key, value]) => {
    utilities[`.font-${key}`] = { fontWeight: value };
  });
  
  // 阴影工具类
  Object.entries(shadows.shadows).forEach(([key, value]) => {
    utilities[`.shadow-${key}`] = { boxShadow: value };
  });
  
  return utilities;
};

// 样式合并工具
export const mergeStyles = (...styles) => {
  return styles.reduce((merged, style) => {
    if (!style) return merged;
    
    Object.entries(style).forEach(([key, value]) => {
      if (key.startsWith('@') || key.startsWith('&') || key.startsWith(':')) {
        // 媒体查询、伪类、伪元素
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    });
    
    return merged;
  }, {});
};

// 条件样式
export const conditionalStyles = (condition, trueStyles, falseStyles = {}) => {
  return condition ? trueStyles : falseStyles;
};

// 导出所有工具
export default {
  style: styleUtils,
  color: colorUtils,
  spacing: spacingUtils,
  typography: typographyUtils,
  shadow: shadowUtils,
  animation: animationUtils,
  layout: layoutUtils,
  theme: themeUtils,
  a11y: a11yUtils,
  mergeStyles,
  conditionalStyles,
  createUtilityClasses
};