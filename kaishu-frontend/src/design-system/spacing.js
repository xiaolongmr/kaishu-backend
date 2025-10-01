/**
 * 间距系统 - 楷书字库项目
 * 定义统一的间距标准和布局规范
 */

// 基础间距单位 (rem)
const baseUnit = 0.25; // 4px

// 间距比例系统
const spacing = {
  0: '0',
  px: '1px',
  0.5: `${baseUnit * 0.5}rem`,  // 2px
  1: `${baseUnit * 1}rem`,      // 4px
  1.5: `${baseUnit * 1.5}rem`,  // 6px
  2: `${baseUnit * 2}rem`,      // 8px
  2.5: `${baseUnit * 2.5}rem`,  // 10px
  3: `${baseUnit * 3}rem`,      // 12px
  3.5: `${baseUnit * 3.5}rem`,  // 14px
  4: `${baseUnit * 4}rem`,      // 16px
  5: `${baseUnit * 5}rem`,      // 20px
  6: `${baseUnit * 6}rem`,      // 24px
  7: `${baseUnit * 7}rem`,      // 28px
  8: `${baseUnit * 8}rem`,      // 32px
  9: `${baseUnit * 9}rem`,      // 36px
  10: `${baseUnit * 10}rem`,    // 40px
  11: `${baseUnit * 11}rem`,    // 44px
  12: `${baseUnit * 12}rem`,    // 48px
  14: `${baseUnit * 14}rem`,    // 56px
  16: `${baseUnit * 16}rem`,    // 64px
  20: `${baseUnit * 20}rem`,    // 80px
  24: `${baseUnit * 24}rem`,    // 96px
  28: `${baseUnit * 28}rem`,    // 112px
  32: `${baseUnit * 32}rem`,    // 128px
  36: `${baseUnit * 36}rem`,    // 144px
  40: `${baseUnit * 40}rem`,    // 160px
  44: `${baseUnit * 44}rem`,    // 176px
  48: `${baseUnit * 48}rem`,    // 192px
  52: `${baseUnit * 52}rem`,    // 208px
  56: `${baseUnit * 56}rem`,    // 224px
  60: `${baseUnit * 60}rem`,    // 240px
  64: `${baseUnit * 64}rem`,    // 256px
  72: `${baseUnit * 72}rem`,    // 288px
  80: `${baseUnit * 80}rem`,    // 320px
  96: `${baseUnit * 96}rem`     // 384px
};

// 语义化间距
const semantic = {
  // 组件内部间距
  component: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8]     // 32px
  },
  
  // 布局间距
  layout: {
    xs: spacing[4],    // 16px
    sm: spacing[6],    // 24px
    md: spacing[8],    // 32px
    lg: spacing[12],   // 48px
    xl: spacing[16],   // 64px
    xxl: spacing[24]   // 96px
  },
  
  // 容器间距
  container: {
    xs: spacing[4],    // 16px
    sm: spacing[6],    // 24px
    md: spacing[8],    // 32px
    lg: spacing[12],   // 48px
    xl: spacing[16]    // 64px
  },
  
  // 栅格间距
  grid: {
    xs: spacing[2],    // 8px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[12]    // 48px
  }
};

// 特定用途间距
const purpose = {
  // 按钮间距
  button: {
    padding: {
      xs: `${spacing[1]} ${spacing[2]}`,      // 4px 8px
      sm: `${spacing[2]} ${spacing[3]}`,      // 8px 12px
      md: `${spacing[2.5]} ${spacing[4]}`,    // 10px 16px
      lg: `${spacing[3]} ${spacing[6]}`,      // 12px 24px
      xl: `${spacing[4]} ${spacing[8]}`       // 16px 32px
    },
    gap: {
      xs: spacing[1],    // 4px
      sm: spacing[2],    // 8px
      md: spacing[3],    // 12px
      lg: spacing[4],    // 16px
      xl: spacing[6]     // 24px
    }
  },
  
  // 表单间距
  form: {
    fieldGap: spacing[4],        // 16px
    labelGap: spacing[2],        // 8px
    inputPadding: spacing[3],    // 12px
    groupGap: spacing[6],        // 24px
    sectionGap: spacing[8]       // 32px
  },
  
  // 卡片间距
  card: {
    padding: {
      xs: spacing[3],    // 12px
      sm: spacing[4],    // 16px
      md: spacing[6],    // 24px
      lg: spacing[8],    // 32px
      xl: spacing[12]    // 48px
    },
    gap: {
      xs: spacing[2],    // 8px
      sm: spacing[4],    // 16px
      md: spacing[6],    // 24px
      lg: spacing[8],    // 32px
      xl: spacing[12]    // 48px
    }
  },
  
  // 导航间距
  navigation: {
    itemPadding: `${spacing[2]} ${spacing[4]}`,  // 8px 16px
    itemGap: spacing[1],                         // 4px
    sectionGap: spacing[6],                      // 24px
    dropdownPadding: spacing[2]                  // 8px
  },
  
  // 列表间距
  list: {
    itemPadding: spacing[3],     // 12px
    itemGap: spacing[2],         // 8px
    groupGap: spacing[6],        // 24px
    indent: spacing[6]           // 24px
  },
  
  // 表格间距
  table: {
    cellPadding: `${spacing[2]} ${spacing[3]}`,  // 8px 12px
    headerPadding: `${spacing[3]} ${spacing[3]}`, // 12px 12px
    rowGap: spacing[1],                          // 4px
    sectionGap: spacing[4]                       // 16px
  },
  
  // 模态框间距
  modal: {
    padding: spacing[6],         // 24px
    headerPadding: spacing[6],   // 24px
    bodyPadding: spacing[6],     // 24px
    footerPadding: spacing[6],   // 24px
    buttonGap: spacing[3]        // 12px
  },
  
  // 工具提示间距
  tooltip: {
    padding: `${spacing[2]} ${spacing[3]}`,  // 8px 12px
    arrowSize: spacing[2]                    // 8px
  }
};

// 响应式间距
const responsive = {
  xs: {
    container: spacing[4],   // 16px
    section: spacing[6],     // 24px
    component: spacing[3]    // 12px
  },
  sm: {
    container: spacing[6],   // 24px
    section: spacing[8],     // 32px
    component: spacing[4]    // 16px
  },
  md: {
    container: spacing[8],   // 32px
    section: spacing[12],    // 48px
    component: spacing[6]    // 24px
  },
  lg: {
    container: spacing[12],  // 48px
    section: spacing[16],    // 64px
    component: spacing[8]    // 32px
  },
  xl: {
    container: spacing[16],  // 64px
    section: spacing[20],    // 80px
    component: spacing[10]   // 40px
  }
};

// 特殊间距值
const special = {
  auto: 'auto',
  full: '100%',
  screen: '100vh',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content'
};

// 负间距（用于重叠效果）
const negative = {};
Object.entries(spacing).forEach(([key, value]) => {
  if (key !== '0' && key !== 'px') {
    negative[`-${key}`] = `-${value}`;
  }
});

// 间距工具类
const utilities = {
  // 内边距工具类
  padding: {
    all: (size) => ({ padding: spacing[size] }),
    x: (size) => ({ paddingLeft: spacing[size], paddingRight: spacing[size] }),
    y: (size) => ({ paddingTop: spacing[size], paddingBottom: spacing[size] }),
    top: (size) => ({ paddingTop: spacing[size] }),
    right: (size) => ({ paddingRight: spacing[size] }),
    bottom: (size) => ({ paddingBottom: spacing[size] }),
    left: (size) => ({ paddingLeft: spacing[size] })
  },
  
  // 外边距工具类
  margin: {
    all: (size) => ({ margin: spacing[size] }),
    x: (size) => ({ marginLeft: spacing[size], marginRight: spacing[size] }),
    y: (size) => ({ marginTop: spacing[size], marginBottom: spacing[size] }),
    top: (size) => ({ marginTop: spacing[size] }),
    right: (size) => ({ marginRight: spacing[size] }),
    bottom: (size) => ({ marginBottom: spacing[size] }),
    left: (size) => ({ marginLeft: spacing[size] })
  },
  
  // 间隙工具类
  gap: {
    all: (size) => ({ gap: spacing[size] }),
    x: (size) => ({ columnGap: spacing[size] }),
    y: (size) => ({ rowGap: spacing[size] })
  }
};

// 导出间距系统
const spacingSystem = {
  spacing,
  semantic,
  purpose,
  responsive,
  special,
  negative,
  utilities,
  baseUnit
};

export default spacingSystem;

// 导出工具函数
export const getSpacing = (size) => {
  return spacing[size] || size;
};

export const getSemanticSpacing = (category, size) => {
  return semantic[category]?.[size] || spacing[size] || size;
};

export const getPurposeSpacing = (purpose, type, size) => {
  return purpose[purpose]?.[type]?.[size] || spacing[size] || size;
};

export const getResponsiveSpacing = (breakpoint, type) => {
  return responsive[breakpoint]?.[type] || spacing[4];
};

// CSS-in-JS 样式生成器
export const generateSpacingCSS = () => {
  const css = {};
  
  // 生成内边距类
  Object.entries(spacing).forEach(([key, value]) => {
    css[`.p-${key}`] = { padding: value };
    css[`.px-${key}`] = { paddingLeft: value, paddingRight: value };
    css[`.py-${key}`] = { paddingTop: value, paddingBottom: value };
    css[`.pt-${key}`] = { paddingTop: value };
    css[`.pr-${key}`] = { paddingRight: value };
    css[`.pb-${key}`] = { paddingBottom: value };
    css[`.pl-${key}`] = { paddingLeft: value };
  });
  
  // 生成外边距类
  Object.entries(spacing).forEach(([key, value]) => {
    css[`.m-${key}`] = { margin: value };
    css[`.mx-${key}`] = { marginLeft: value, marginRight: value };
    css[`.my-${key}`] = { marginTop: value, marginBottom: value };
    css[`.mt-${key}`] = { marginTop: value };
    css[`.mr-${key}`] = { marginRight: value };
    css[`.mb-${key}`] = { marginBottom: value };
    css[`.ml-${key}`] = { marginLeft: value };
  });
  
  // 生成间隙类
  Object.entries(spacing).forEach(([key, value]) => {
    css[`.gap-${key}`] = { gap: value };
    css[`.gap-x-${key}`] = { columnGap: value };
    css[`.gap-y-${key}`] = { rowGap: value };
  });
  
  return css;
};

// 创建间距样式的辅助函数
export const createSpacingStyle = ({
  padding,
  paddingX,
  paddingY,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginX,
  marginY,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  gap,
  gapX,
  gapY
}) => {
  const style = {};
  
  if (padding !== undefined) style.padding = getSpacing(padding);
  if (paddingX !== undefined) {
    style.paddingLeft = getSpacing(paddingX);
    style.paddingRight = getSpacing(paddingX);
  }
  if (paddingY !== undefined) {
    style.paddingTop = getSpacing(paddingY);
    style.paddingBottom = getSpacing(paddingY);
  }
  if (paddingTop !== undefined) style.paddingTop = getSpacing(paddingTop);
  if (paddingRight !== undefined) style.paddingRight = getSpacing(paddingRight);
  if (paddingBottom !== undefined) style.paddingBottom = getSpacing(paddingBottom);
  if (paddingLeft !== undefined) style.paddingLeft = getSpacing(paddingLeft);
  
  if (margin !== undefined) style.margin = getSpacing(margin);
  if (marginX !== undefined) {
    style.marginLeft = getSpacing(marginX);
    style.marginRight = getSpacing(marginX);
  }
  if (marginY !== undefined) {
    style.marginTop = getSpacing(marginY);
    style.marginBottom = getSpacing(marginY);
  }
  if (marginTop !== undefined) style.marginTop = getSpacing(marginTop);
  if (marginRight !== undefined) style.marginRight = getSpacing(marginRight);
  if (marginBottom !== undefined) style.marginBottom = getSpacing(marginBottom);
  if (marginLeft !== undefined) style.marginLeft = getSpacing(marginLeft);
  
  if (gap !== undefined) style.gap = getSpacing(gap);
  if (gapX !== undefined) style.columnGap = getSpacing(gapX);
  if (gapY !== undefined) style.rowGap = getSpacing(gapY);
  
  return style;
};