/**
 * 组件样式系统 - 楷书字库项目
 * 定义统一的组件样式规范
 */

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import shadows from './shadows';
import animations from './animations';

// 按钮组件样式
const button = {
  // 基础样式
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: typography.fontFamilies.system,
    fontWeight: typography.fontWeights.medium,
    lineHeight: typography.lineHeights.none,
    textDecoration: 'none',
    border: '1px solid transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: animations.transitions.all.fast,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    
    '&:focus': {
      outline: 'none',
      boxShadow: shadows.semantic.button.focus
    },
    
    '&:disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
      boxShadow: shadows.semantic.button.disabled
    }
  },
  
  // 尺寸变体
  sizes: {
    xs: {
      fontSize: typography.fontSizes.xs,
      padding: spacing.purpose.button.padding.xs,
      minHeight: '24px',
      gap: spacing.purpose.button.gap.xs
    },
    sm: {
      fontSize: typography.fontSizes.sm,
      padding: spacing.purpose.button.padding.sm,
      minHeight: '32px',
      gap: spacing.purpose.button.gap.sm
    },
    md: {
      fontSize: typography.fontSizes.base,
      padding: spacing.purpose.button.padding.md,
      minHeight: '40px',
      gap: spacing.purpose.button.gap.md
    },
    lg: {
      fontSize: typography.fontSizes.lg,
      padding: spacing.purpose.button.padding.lg,
      minHeight: '48px',
      gap: spacing.purpose.button.gap.lg
    },
    xl: {
      fontSize: typography.fontSizes.xl,
      padding: spacing.purpose.button.padding.xl,
      minHeight: '56px',
      gap: spacing.purpose.button.gap.xl
    }
  },
  
  // 颜色变体
  variants: {
    primary: {
      backgroundColor: colors.semantic.interactive.primary,
      color: colors.semantic.text.inverse,
      borderColor: colors.semantic.interactive.primary,
      boxShadow: shadows.semantic.button.rest,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.semantic.interactive.primaryHover,
        borderColor: colors.semantic.interactive.primaryHover,
        boxShadow: shadows.semantic.button.hover
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: colors.semantic.interactive.primaryActive,
        borderColor: colors.semantic.interactive.primaryActive,
        boxShadow: shadows.semantic.button.active
      }
    },
    
    secondary: {
      backgroundColor: colors.semantic.background.primary,
      color: colors.semantic.text.primary,
      borderColor: colors.semantic.border.primary,
      boxShadow: shadows.semantic.button.rest,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.semantic.background.secondary,
        borderColor: colors.semantic.border.secondary,
        boxShadow: shadows.semantic.button.hover
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: colors.semantic.background.tertiary,
        boxShadow: shadows.semantic.button.active
      }
    },
    
    outline: {
      backgroundColor: 'transparent',
      color: colors.semantic.interactive.primary,
      borderColor: colors.semantic.interactive.primary,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.semantic.interactive.primary,
        color: colors.semantic.text.inverse,
        boxShadow: shadows.semantic.button.hover
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: colors.semantic.interactive.primaryActive,
        borderColor: colors.semantic.interactive.primaryActive
      }
    },
    
    ghost: {
      backgroundColor: 'transparent',
      color: colors.semantic.text.primary,
      border: 'none',
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.semantic.background.secondary,
        boxShadow: shadows.semantic.button.hover
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: colors.semantic.background.tertiary
      }
    },
    
    danger: {
      backgroundColor: colors.semantic.status.error,
      color: colors.semantic.text.inverse,
      borderColor: colors.semantic.status.error,
      
      '&:hover:not(:disabled)': {
        backgroundColor: colors.error[600],
        borderColor: colors.error[600],
        boxShadow: shadows.semantic.button.hover
      },
      
      '&:active:not(:disabled)': {
        backgroundColor: colors.error[700],
        borderColor: colors.error[700]
      }
    }
  }
};

// 输入框组件样式
const input = {
  // 基础样式
  base: {
    display: 'block',
    width: '100%',
    fontFamily: typography.fontFamilies.primary,
    fontSize: typography.fontSizes.base,
    lineHeight: typography.lineHeights.normal,
    color: colors.semantic.text.primary,
    backgroundColor: colors.semantic.background.primary,
    border: `1px solid ${colors.semantic.border.primary}`,
    borderRadius: '6px',
    padding: spacing.purpose.form.inputPadding,
    transition: animations.transitions.all.fast,
    
    '&::placeholder': {
      color: colors.semantic.text.tertiary
    },
    
    '&:focus': {
      outline: 'none',
      borderColor: colors.semantic.border.focus,
      boxShadow: shadows.semantic.input.focus
    },
    
    '&:disabled': {
      backgroundColor: colors.semantic.background.tertiary,
      color: colors.semantic.text.disabled,
      cursor: 'not-allowed',
      boxShadow: shadows.semantic.input.disabled
    }
  },
  
  // 尺寸变体
  sizes: {
    sm: {
      fontSize: typography.fontSizes.sm,
      padding: `${spacing.spacing[2]} ${spacing.spacing[3]}`,
      minHeight: '32px'
    },
    md: {
      fontSize: typography.fontSizes.base,
      padding: spacing.purpose.form.inputPadding,
      minHeight: '40px'
    },
    lg: {
      fontSize: typography.fontSizes.lg,
      padding: `${spacing.spacing[4]} ${spacing.spacing[4]}`,
      minHeight: '48px'
    }
  },
  
  // 状态变体
  states: {
    error: {
      borderColor: colors.semantic.border.error,
      boxShadow: shadows.semantic.input.error,
      
      '&:focus': {
        borderColor: colors.semantic.border.error,
        boxShadow: shadows.semantic.input.error
      }
    },
    
    success: {
      borderColor: colors.semantic.border.success,
      boxShadow: shadows.semantic.input.success,
      
      '&:focus': {
        borderColor: colors.semantic.border.success,
        boxShadow: shadows.semantic.input.success
      }
    },
    
    warning: {
      borderColor: colors.semantic.border.warning,
      boxShadow: shadows.semantic.input.warning,
      
      '&:focus': {
        borderColor: colors.semantic.border.warning,
        boxShadow: shadows.semantic.input.warning
      }
    }
  }
};

// 卡片组件样式
const card = {
  // 基础样式
  base: {
    backgroundColor: colors.semantic.background.primary,
    border: `1px solid ${colors.semantic.border.primary}`,
    borderRadius: '8px',
    boxShadow: shadows.semantic.card.rest,
    transition: animations.transitions.all.fast,
    overflow: 'hidden'
  },
  
  // 交互变体
  interactive: {
    cursor: 'pointer',
    
    '&:hover': {
      boxShadow: shadows.semantic.card.hover,
      transform: 'translateY(-1px)'
    },
    
    '&:active': {
      boxShadow: shadows.semantic.card.active,
      transform: 'translateY(0)'
    }
  },
  
  // 内容区域
  content: {
    padding: spacing.purpose.card.padding.md
  },
  
  // 头部
  header: {
    padding: spacing.purpose.card.padding.md,
    borderBottom: `1px solid ${colors.semantic.border.primary}`,
    backgroundColor: colors.semantic.background.secondary
  },
  
  // 底部
  footer: {
    padding: spacing.purpose.card.padding.md,
    borderTop: `1px solid ${colors.semantic.border.primary}`,
    backgroundColor: colors.semantic.background.secondary
  }
};

// 模态框组件样式
const modal = {
  // 遮罩层
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.semantic.background.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.spacing[4]
  },
  
  // 内容容器
  content: {
    backgroundColor: colors.semantic.background.modal,
    borderRadius: '12px',
    boxShadow: shadows.semantic.modal.content,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative'
  },
  
  // 头部
  header: {
    padding: spacing.purpose.modal.headerPadding,
    borderBottom: `1px solid ${colors.semantic.border.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  // 主体
  body: {
    padding: spacing.purpose.modal.bodyPadding
  },
  
  // 底部
  footer: {
    padding: spacing.purpose.modal.footerPadding,
    borderTop: `1px solid ${colors.semantic.border.primary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.purpose.modal.buttonGap
  },
  
  // 关闭按钮
  closeButton: {
    position: 'absolute',
    top: spacing.spacing[4],
    right: spacing.spacing[4],
    background: 'none',
    border: 'none',
    fontSize: typography.fontSizes.xl,
    color: colors.semantic.text.secondary,
    cursor: 'pointer',
    padding: spacing.spacing[2],
    borderRadius: '4px',
    transition: animations.transitions.colors.fast,
    
    '&:hover': {
      backgroundColor: colors.semantic.background.secondary,
      color: colors.semantic.text.primary
    }
  }
};

// 导航组件样式
const navigation = {
  // 主导航
  navbar: {
    backgroundColor: colors.semantic.background.primary,
    borderBottom: `1px solid ${colors.semantic.border.primary}`,
    boxShadow: shadows.semantic.navigation.header,
    padding: `${spacing.spacing[3]} ${spacing.spacing[6]}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  
  // 导航项
  navItem: {
    padding: spacing.purpose.navigation.itemPadding,
    color: colors.semantic.text.secondary,
    textDecoration: 'none',
    borderRadius: '6px',
    transition: animations.transitions.colors.fast,
    fontWeight: typography.fontWeights.medium,
    
    '&:hover': {
      backgroundColor: colors.semantic.background.secondary,
      color: colors.semantic.text.primary
    },
    
    '&.active': {
      backgroundColor: colors.semantic.interactive.primary,
      color: colors.semantic.text.inverse
    }
  },
  
  // 侧边栏
  sidebar: {
    backgroundColor: colors.semantic.background.primary,
    borderRight: `1px solid ${colors.semantic.border.primary}`,
    boxShadow: shadows.semantic.navigation.sidebar,
    width: '280px',
    height: '100vh',
    overflow: 'auto',
    padding: spacing.spacing[6]
  }
};

// 表单组件样式
const form = {
  // 表单组
  group: {
    marginBottom: spacing.purpose.form.fieldGap
  },
  
  // 标签
  label: {
    display: 'block',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.semantic.text.primary,
    marginBottom: spacing.purpose.form.labelGap
  },
  
  // 帮助文本
  helpText: {
    fontSize: typography.fontSizes.xs,
    color: colors.semantic.text.tertiary,
    marginTop: spacing.spacing[1]
  },
  
  // 错误文本
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.semantic.status.error,
    marginTop: spacing.spacing[1]
  },
  
  // 成功文本
  successText: {
    fontSize: typography.fontSizes.xs,
    color: colors.semantic.status.success,
    marginTop: spacing.spacing[1]
  }
};

// 表格组件样式
const table = {
  // 表格容器
  container: {
    overflow: 'auto',
    border: `1px solid ${colors.semantic.border.primary}`,
    borderRadius: '8px'
  },
  
  // 表格
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: colors.semantic.background.primary
  },
  
  // 表头
  header: {
    backgroundColor: colors.semantic.background.secondary
  },
  
  // 表头单元格
  headerCell: {
    padding: spacing.purpose.table.headerPadding,
    textAlign: 'left',
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.semantic.text.primary,
    borderBottom: `1px solid ${colors.semantic.border.primary}`
  },
  
  // 表格行
  row: {
    '&:nth-child(even)': {
      backgroundColor: colors.semantic.background.secondary
    },
    
    '&:hover': {
      backgroundColor: colors.semantic.background.tertiary
    }
  },
  
  // 表格单元格
  cell: {
    padding: spacing.purpose.table.cellPadding,
    fontSize: typography.fontSizes.sm,
    color: colors.semantic.text.primary,
    borderBottom: `1px solid ${colors.semantic.border.primary}`
  }
};

// 工具提示组件样式
const tooltip = {
  // 容器
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  
  // 内容
  content: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: colors.semantic.background.tooltip,
    color: colors.semantic.text.inverse,
    padding: spacing.purpose.tooltip.padding,
    borderRadius: '6px',
    fontSize: typography.fontSizes.xs,
    whiteSpace: 'nowrap',
    boxShadow: shadows.semantic.tooltip.content,
    zIndex: 1000,
    marginBottom: spacing.spacing[2],
    
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      border: `${spacing.purpose.tooltip.arrowSize} solid transparent`,
      borderTopColor: colors.semantic.background.tooltip
    }
  }
};

// 加载组件样式
const loading = {
  // 旋转器
  spinner: {
    width: '20px',
    height: '20px',
    border: `2px solid ${colors.semantic.border.primary}`,
    borderTopColor: colors.semantic.interactive.primary,
    borderRadius: '50%',
    animation: animations.presets.loading.animation
  },
  
  // 骨架屏
  skeleton: {
    backgroundColor: colors.semantic.background.secondary,
    borderRadius: '4px',
    animation: `${animations.keyframes.pulse.name} ${animations.durations.slower} ${animations.easings.ease} infinite`
  }
};

// 导出组件样式系统
const components = {
  button,
  input,
  card,
  modal,
  navigation,
  form,
  table,
  tooltip,
  loading
};

export default components;

// 导出单个组件样式
export {
  button,
  input,
  card,
  modal,
  navigation,
  form,
  table,
  tooltip,
  loading
};

// 工具函数
export const getComponentStyle = (component, variant = 'base', size = 'md') => {
  const componentStyles = components[component];
  if (!componentStyles) return {};
  
  let style = { ...componentStyles.base };
  
  if (componentStyles.variants && componentStyles.variants[variant]) {
    style = { ...style, ...componentStyles.variants[variant] };
  }
  
  if (componentStyles.sizes && componentStyles.sizes[size]) {
    style = { ...style, ...componentStyles.sizes[size] };
  }
  
  return style;
};

export const createComponentVariant = (baseStyle, variantStyle) => {
  return { ...baseStyle, ...variantStyle };
};

// CSS-in-JS 样式生成器
export const generateComponentCSS = () => {
  const css = {};
  
  // 生成按钮样式
  css['.btn'] = button.base;
  Object.entries(button.variants).forEach(([variant, style]) => {
    css[`.btn-${variant}`] = style;
  });
  Object.entries(button.sizes).forEach(([size, style]) => {
    css[`.btn-${size}`] = style;
  });
  
  // 生成输入框样式
  css['.input'] = input.base;
  Object.entries(input.sizes).forEach(([size, style]) => {
    css[`.input-${size}`] = style;
  });
  Object.entries(input.states).forEach(([state, style]) => {
    css[`.input-${state}`] = style;
  });
  
  // 生成卡片样式
  css['.card'] = card.base;
  css['.card-interactive'] = card.interactive;
  css['.card-content'] = card.content;
  css['.card-header'] = card.header;
  css['.card-footer'] = card.footer;
  
  return css;
};