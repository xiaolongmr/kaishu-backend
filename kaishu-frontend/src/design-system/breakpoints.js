/**
 * 断点系统 - 楷书字库项目
 * 定义响应式设计的断点规范
 */

// 断点定义 (px)
const breakpoints = {
  xs: 0,      // 超小屏幕 (手机竖屏)
  sm: 576,    // 小屏幕 (手机横屏)
  md: 768,    // 中等屏幕 (平板竖屏)
  lg: 992,    // 大屏幕 (平板横屏/小桌面)
  xl: 1200,   // 超大屏幕 (桌面)
  xxl: 1400   // 超超大屏幕 (大桌面)
};

// 容器最大宽度
const containerMaxWidths = {
  sm: '540px',
  md: '720px',
  lg: '960px',
  xl: '1140px',
  xxl: '1320px'
};

// 媒体查询生成器
const mediaQueries = {
  // 最小宽度查询 (移动优先)
  up: (breakpoint) => {
    const value = breakpoints[breakpoint];
    return value === 0 ? '' : `@media (min-width: ${value}px)`;
  },
  
  // 最大宽度查询
  down: (breakpoint) => {
    const keys = Object.keys(breakpoints);
    const index = keys.indexOf(breakpoint);
    if (index === -1 || index === 0) return '';
    
    const prevKey = keys[index - 1];
    const value = breakpoints[prevKey];
    return `@media (max-width: ${value - 0.02}px)`;
  },
  
  // 区间查询
  between: (start, end) => {
    const startValue = breakpoints[start];
    const endValue = breakpoints[end];
    
    if (startValue === 0) {
      return `@media (max-width: ${endValue - 0.02}px)`;
    }
    
    return `@media (min-width: ${startValue}px) and (max-width: ${endValue - 0.02}px)`;
  },
  
  // 仅当前断点
  only: (breakpoint) => {
    const keys = Object.keys(breakpoints);
    const index = keys.indexOf(breakpoint);
    
    if (index === -1) return '';
    if (index === keys.length - 1) {
      // 最后一个断点
      return mediaQueries.up(breakpoint);
    }
    
    const nextKey = keys[index + 1];
    return mediaQueries.between(breakpoint, nextKey);
  }
};

// 设备类型定义
const devices = {
  mobile: {
    portrait: '@media (max-width: 575.98px) and (orientation: portrait)',
    landscape: '@media (max-width: 767.98px) and (orientation: landscape)'
  },
  tablet: {
    portrait: '@media (min-width: 576px) and (max-width: 991.98px) and (orientation: portrait)',
    landscape: '@media (min-width: 768px) and (max-width: 1199.98px) and (orientation: landscape)'
  },
  desktop: {
    small: '@media (min-width: 992px) and (max-width: 1199.98px)',
    medium: '@media (min-width: 1200px) and (max-width: 1399.98px)',
    large: '@media (min-width: 1400px)'
  },
  // 特殊设备
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  print: '@media print',
  screen: '@media screen'
};

// 响应式工具类
const responsive = {
  // 显示/隐藏工具
  display: {
    hideOn: (breakpoint) => ({
      [mediaQueries.up(breakpoint)]: {
        display: 'none'
      }
    }),
    showOn: (breakpoint) => ({
      display: 'none',
      [mediaQueries.up(breakpoint)]: {
        display: 'block'
      }
    }),
    hideBelow: (breakpoint) => ({
      [mediaQueries.down(breakpoint)]: {
        display: 'none'
      }
    }),
    showBelow: (breakpoint) => ({
      display: 'none',
      [mediaQueries.down(breakpoint)]: {
        display: 'block'
      }
    })
  },
  
  // 容器工具
  container: {
    fluid: {
      width: '100%',
      paddingLeft: '15px',
      paddingRight: '15px',
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    fixed: {
      width: '100%',
      paddingLeft: '15px',
      paddingRight: '15px',
      marginLeft: 'auto',
      marginRight: 'auto',
      [mediaQueries.up('sm')]: {
        maxWidth: containerMaxWidths.sm
      },
      [mediaQueries.up('md')]: {
        maxWidth: containerMaxWidths.md
      },
      [mediaQueries.up('lg')]: {
        maxWidth: containerMaxWidths.lg
      },
      [mediaQueries.up('xl')]: {
        maxWidth: containerMaxWidths.xl
      },
      [mediaQueries.up('xxl')]: {
        maxWidth: containerMaxWidths.xxl
      }
    }
  },
  
  // 栅格系统
  grid: {
    container: {
      display: 'grid',
      gap: '1rem',
      gridTemplateColumns: 'repeat(12, 1fr)',
      [mediaQueries.up('sm')]: {
        gap: '1.5rem'
      },
      [mediaQueries.up('lg')]: {
        gap: '2rem'
      }
    },
    
    // 列宽度生成器
    column: (cols, total = 12) => ({
      gridColumn: `span ${cols}`,
      [mediaQueries.up('sm')]: {
        gridColumn: `span ${Math.min(cols, total)}`
      }
    })
  }
};

// 响应式值生成器
const createResponsiveValue = (values) => {
  const style = {};
  const breakpointKeys = Object.keys(breakpoints);
  
  breakpointKeys.forEach((key, index) => {
    if (values[key] !== undefined) {
      if (index === 0) {
        // 基础值（xs）
        style.value = values[key];
      } else {
        // 响应式值
        style[mediaQueries.up(key)] = {
          value: values[key]
        };
      }
    }
  });
  
  return style;
};

// 断点检测工具
const breakpointUtils = {
  // 获取当前断点
  getCurrentBreakpoint: () => {
    if (typeof window === 'undefined') return 'lg'; // SSR 默认值
    
    const width = window.innerWidth;
    const keys = Object.keys(breakpoints).reverse();
    
    for (const key of keys) {
      if (width >= breakpoints[key]) {
        return key;
      }
    }
    
    return 'xs';
  },
  
  // 检查是否匹配断点
  matches: (breakpoint, direction = 'up') => {
    if (typeof window === 'undefined') return false;
    
    const width = window.innerWidth;
    const value = breakpoints[breakpoint];
    
    switch (direction) {
      case 'up':
        return width >= value;
      case 'down':
        return width < value;
      case 'only':
        const keys = Object.keys(breakpoints);
        const index = keys.indexOf(breakpoint);
        if (index === keys.length - 1) {
          return width >= value;
        }
        const nextValue = breakpoints[keys[index + 1]];
        return width >= value && width < nextValue;
      default:
        return false;
    }
  },
  
  // 监听断点变化
  watchBreakpoint: (callback) => {
    if (typeof window === 'undefined') return () => {};
    
    let currentBreakpoint = breakpointUtils.getCurrentBreakpoint();
    
    const handleResize = () => {
      const newBreakpoint = breakpointUtils.getCurrentBreakpoint();
      if (newBreakpoint !== currentBreakpoint) {
        currentBreakpoint = newBreakpoint;
        callback(newBreakpoint);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }
};

// 常用响应式样式预设
const presets = {
  // 响应式文字大小
  responsiveText: {
    fontSize: '14px',
    [mediaQueries.up('sm')]: {
      fontSize: '16px'
    },
    [mediaQueries.up('lg')]: {
      fontSize: '18px'
    }
  },
  
  // 响应式间距
  responsivePadding: {
    padding: '1rem',
    [mediaQueries.up('sm')]: {
      padding: '1.5rem'
    },
    [mediaQueries.up('lg')]: {
      padding: '2rem'
    }
  },
  
  // 响应式栅格
  responsiveGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    [mediaQueries.up('sm')]: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1.5rem'
    },
    [mediaQueries.up('md')]: {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    [mediaQueries.up('lg')]: {
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '2rem'
    }
  },
  
  // 响应式导航
  responsiveNav: {
    flexDirection: 'column',
    [mediaQueries.up('md')]: {
      flexDirection: 'row'
    }
  }
};

// 导出断点系统
const breakpointSystem = {
  breakpoints,
  containerMaxWidths,
  mediaQueries,
  devices,
  responsive,
  breakpointUtils,
  presets,
  createResponsiveValue
};

export default breakpointSystem;

// 导出常用工具
export {
  breakpoints,
  mediaQueries,
  devices,
  breakpointUtils,
  createResponsiveValue
};

// 导出工具函数
export const up = mediaQueries.up;
export const down = mediaQueries.down;
export const between = mediaQueries.between;
export const only = mediaQueries.only;

// CSS-in-JS 样式生成器
export const generateBreakpointCSS = () => {
  const css = {};
  
  // 生成显示/隐藏工具类
  Object.keys(breakpoints).forEach(bp => {
    css[`.hidden-${bp}-up`] = responsive.display.hideOn(bp);
    css[`.visible-${bp}-up`] = responsive.display.showOn(bp);
    css[`.hidden-${bp}-down`] = responsive.display.hideBelow(bp);
    css[`.visible-${bp}-down`] = responsive.display.showBelow(bp);
  });
  
  // 生成容器类
  css['.container'] = responsive.container.fixed;
  css['.container-fluid'] = responsive.container.fluid;
  
  return css;
};

// React Hook 示例（如果使用 React）
export const useBreakpoint = () => {
  if (typeof window === 'undefined') {
    return { current: 'lg', matches: () => false };
  }
  
  const [current, setCurrent] = React.useState(breakpointUtils.getCurrentBreakpoint());
  
  React.useEffect(() => {
    const unwatch = breakpointUtils.watchBreakpoint(setCurrent);
    return unwatch;
  }, []);
  
  return {
    current,
    matches: (bp, direction) => breakpointUtils.matches(bp, direction),
    up: (bp) => breakpointUtils.matches(bp, 'up'),
    down: (bp) => breakpointUtils.matches(bp, 'down'),
    only: (bp) => breakpointUtils.matches(bp, 'only')
  };
};