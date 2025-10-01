/**
 * 动画系统 - 楷书字库项目
 * 定义统一的动画效果和过渡
 */

// 缓动函数
const easings = {
  // 标准缓动
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // 自定义贝塞尔曲线
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.4, 0, 1, 1)',
  bouncy: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  
  // 物理感缓动
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // 快速缓动
  fast: 'cubic-bezier(0.4, 0, 1, 1)',
  slow: 'cubic-bezier(0, 0, 0.2, 1)'
};

// 持续时间
const durations = {
  instant: '0ms',
  fast: '150ms',
  normal: '250ms',
  slow: '350ms',
  slower: '500ms',
  slowest: '750ms'
};

// 延迟时间
const delays = {
  none: '0ms',
  short: '100ms',
  medium: '200ms',
  long: '300ms',
  longer: '500ms'
};

// 基础过渡
const transitions = {
  // 通用过渡
  all: {
    fast: `all ${durations.fast} ${easings.smooth}`,
    normal: `all ${durations.normal} ${easings.smooth}`,
    slow: `all ${durations.slow} ${easings.smooth}`
  },
  
  // 颜色过渡
  colors: {
    fast: `color ${durations.fast} ${easings.smooth}, background-color ${durations.fast} ${easings.smooth}, border-color ${durations.fast} ${easings.smooth}`,
    normal: `color ${durations.normal} ${easings.smooth}, background-color ${durations.normal} ${easings.smooth}, border-color ${durations.normal} ${easings.smooth}`,
    slow: `color ${durations.slow} ${easings.smooth}, background-color ${durations.slow} ${easings.smooth}, border-color ${durations.slow} ${easings.smooth}`
  },
  
  // 变换过渡
  transform: {
    fast: `transform ${durations.fast} ${easings.smooth}`,
    normal: `transform ${durations.normal} ${easings.smooth}`,
    slow: `transform ${durations.slow} ${easings.smooth}`,
    bouncy: `transform ${durations.normal} ${easings.bouncy}`,
    elastic: `transform ${durations.slow} ${easings.elastic}`
  },
  
  // 透明度过渡
  opacity: {
    fast: `opacity ${durations.fast} ${easings.smooth}`,
    normal: `opacity ${durations.normal} ${easings.smooth}`,
    slow: `opacity ${durations.slow} ${easings.smooth}`
  },
  
  // 阴影过渡
  shadow: {
    fast: `box-shadow ${durations.fast} ${easings.smooth}`,
    normal: `box-shadow ${durations.normal} ${easings.smooth}`,
    slow: `box-shadow ${durations.slow} ${easings.smooth}`
  },
  
  // 尺寸过渡
  size: {
    fast: `width ${durations.fast} ${easings.smooth}, height ${durations.fast} ${easings.smooth}`,
    normal: `width ${durations.normal} ${easings.smooth}, height ${durations.normal} ${easings.smooth}`,
    slow: `width ${durations.slow} ${easings.smooth}, height ${durations.slow} ${easings.smooth}`
  }
};

// 关键帧动画
const keyframes = {
  // 淡入淡出
  fadeIn: {
    name: 'fadeIn',
    keyframes: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 }
    }
  },
  
  fadeOut: {
    name: 'fadeOut',
    keyframes: {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 }
    }
  },
  
  // 滑动动画
  slideInUp: {
    name: 'slideInUp',
    keyframes: {
      '0%': { transform: 'translateY(100%)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 }
    }
  },
  
  slideInDown: {
    name: 'slideInDown',
    keyframes: {
      '0%': { transform: 'translateY(-100%)', opacity: 0 },
      '100%': { transform: 'translateY(0)', opacity: 1 }
    }
  },
  
  slideInLeft: {
    name: 'slideInLeft',
    keyframes: {
      '0%': { transform: 'translateX(-100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 }
    }
  },
  
  slideInRight: {
    name: 'slideInRight',
    keyframes: {
      '0%': { transform: 'translateX(100%)', opacity: 0 },
      '100%': { transform: 'translateX(0)', opacity: 1 }
    }
  },
  
  // 缩放动画
  scaleIn: {
    name: 'scaleIn',
    keyframes: {
      '0%': { transform: 'scale(0)', opacity: 0 },
      '100%': { transform: 'scale(1)', opacity: 1 }
    }
  },
  
  scaleOut: {
    name: 'scaleOut',
    keyframes: {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '100%': { transform: 'scale(0)', opacity: 0 }
    }
  },
  
  // 弹跳动画
  bounce: {
    name: 'bounce',
    keyframes: {
      '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
      '40%, 43%': { transform: 'translateY(-30px)' },
      '70%': { transform: 'translateY(-15px)' },
      '90%': { transform: 'translateY(-4px)' }
    }
  },
  
  // 摇摆动画
  shake: {
    name: 'shake',
    keyframes: {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-10px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(10px)' }
    }
  },
  
  // 旋转动画
  spin: {
    name: 'spin',
    keyframes: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    }
  },
  
  // 脉冲动画
  pulse: {
    name: 'pulse',
    keyframes: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 }
    }
  },
  
  // 心跳动画
  heartbeat: {
    name: 'heartbeat',
    keyframes: {
      '0%': { transform: 'scale(1)' },
      '14%': { transform: 'scale(1.3)' },
      '28%': { transform: 'scale(1)' },
      '42%': { transform: 'scale(1.3)' },
      '70%': { transform: 'scale(1)' }
    }
  },
  
  // 闪烁动画
  flash: {
    name: 'flash',
    keyframes: {
      '0%, 50%, 100%': { opacity: 1 },
      '25%, 75%': { opacity: 0 }
    }
  },
  
  // 橡皮筋动画
  rubberBand: {
    name: 'rubberBand',
    keyframes: {
      '0%': { transform: 'scale(1)' },
      '30%': { transform: 'scaleX(1.25) scaleY(0.75)' },
      '40%': { transform: 'scaleX(0.75) scaleY(1.25)' },
      '50%': { transform: 'scaleX(1.15) scaleY(0.85)' },
      '65%': { transform: 'scaleX(0.95) scaleY(1.05)' },
      '75%': { transform: 'scaleX(1.05) scaleY(0.95)' },
      '100%': { transform: 'scale(1)' }
    }
  },
  
  // 摆动动画
  swing: {
    name: 'swing',
    keyframes: {
      '20%': { transform: 'rotate(15deg)' },
      '40%': { transform: 'rotate(-10deg)' },
      '60%': { transform: 'rotate(5deg)' },
      '80%': { transform: 'rotate(-5deg)' },
      '100%': { transform: 'rotate(0deg)' }
    }
  }
};

// 预设动画组合
const presets = {
  // 页面进入动画
  pageEnter: {
    animation: `${keyframes.fadeIn.name} ${durations.normal} ${easings.smooth}`,
    keyframes: keyframes.fadeIn.keyframes
  },
  
  // 页面退出动画
  pageExit: {
    animation: `${keyframes.fadeOut.name} ${durations.fast} ${easings.smooth}`,
    keyframes: keyframes.fadeOut.keyframes
  },
  
  // 模态框进入
  modalEnter: {
    animation: `${keyframes.scaleIn.name} ${durations.normal} ${easings.bouncy}`,
    keyframes: keyframes.scaleIn.keyframes
  },
  
  // 模态框退出
  modalExit: {
    animation: `${keyframes.scaleOut.name} ${durations.fast} ${easings.smooth}`,
    keyframes: keyframes.scaleOut.keyframes
  },
  
  // 下拉菜单进入
  dropdownEnter: {
    animation: `${keyframes.slideInDown.name} ${durations.fast} ${easings.smooth}`,
    keyframes: keyframes.slideInDown.keyframes
  },
  
  // 侧边栏进入
  sidebarEnter: {
    animation: `${keyframes.slideInLeft.name} ${durations.normal} ${easings.smooth}`,
    keyframes: keyframes.slideInLeft.keyframes
  },
  
  // 通知进入
  notificationEnter: {
    animation: `${keyframes.slideInRight.name} ${durations.normal} ${easings.smooth}`,
    keyframes: keyframes.slideInRight.keyframes
  },
  
  // 加载动画
  loading: {
    animation: `${keyframes.spin.name} ${durations.slower} ${easings.linear} infinite`,
    keyframes: keyframes.spin.keyframes
  },
  
  // 按钮点击
  buttonPress: {
    animation: `${keyframes.pulse.name} ${durations.fast} ${easings.smooth}`,
    keyframes: keyframes.pulse.keyframes
  },
  
  // 错误提示
  errorShake: {
    animation: `${keyframes.shake.name} ${durations.normal} ${easings.smooth}`,
    keyframes: keyframes.shake.keyframes
  }
};

// 交互动画
const interactions = {
  // 悬停效果
  hover: {
    scale: {
      transform: 'scale(1.05)',
      transition: transitions.transform.fast
    },
    lift: {
      transform: 'translateY(-2px)',
      transition: transitions.transform.fast
    },
    glow: {
      boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
      transition: transitions.shadow.fast
    }
  },
  
  // 点击效果
  active: {
    scale: {
      transform: 'scale(0.95)',
      transition: transitions.transform.fast
    },
    press: {
      transform: 'translateY(1px)',
      transition: transitions.transform.fast
    }
  },
  
  // 焦点效果
  focus: {
    outline: {
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.5)',
      transition: transitions.shadow.fast
    },
    glow: {
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
      transition: transitions.shadow.fast
    }
  }
};

// 响应式动画（根据用户偏好）
const responsive = {
  // 尊重用户的动画偏好
  respectMotion: {
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none !important',
      transition: 'none !important'
    }
  },
  
  // 性能优化
  performant: {
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    perspective: '1000px'
  }
};

// 动画工具函数
const utils = {
  // 创建关键帧动画
  createKeyframes: (name, keyframes) => {
    return {
      [`@keyframes ${name}`]: keyframes
    };
  },
  
  // 创建动画样式
  createAnimation: ({
    name,
    duration = durations.normal,
    easing = easings.smooth,
    delay = delays.none,
    iteration = 1,
    direction = 'normal',
    fillMode = 'both'
  }) => {
    return {
      animation: `${name} ${duration} ${easing} ${delay} ${iteration} ${direction} ${fillMode}`
    };
  },
  
  // 创建过渡样式
  createTransition: (properties, duration = durations.normal, easing = easings.smooth, delay = delays.none) => {
    const props = Array.isArray(properties) ? properties : [properties];
    const transitions = props.map(prop => `${prop} ${duration} ${easing} ${delay}`);
    return {
      transition: transitions.join(', ')
    };
  },
  
  // 组合动画
  combineAnimations: (...animations) => {
    return {
      animation: animations.join(', ')
    };
  }
};

// 导出动画系统
const animationSystem = {
  easings,
  durations,
  delays,
  transitions,
  keyframes,
  presets,
  interactions,
  responsive,
  utils
};

export default animationSystem;

// 导出常用动画
export {
  easings,
  durations,
  transitions,
  keyframes,
  presets,
  interactions,
  utils
};

// 导出工具函数
export const createAnimation = utils.createAnimation;
export const createTransition = utils.createTransition;
export const createKeyframes = utils.createKeyframes;

// CSS-in-JS 样式生成器
export const generateAnimationCSS = () => {
  const css = {};
  
  // 生成关键帧
  Object.values(keyframes).forEach(({ name, keyframes: frames }) => {
    css[`@keyframes ${name}`] = frames;
  });
  
  // 生成动画类
  Object.entries(presets).forEach(([key, { animation, keyframes: frames }]) => {
    css[`.animate-${key}`] = { animation };
    if (frames) {
      css[`@keyframes ${frames.name || key}`] = frames;
    }
  });
  
  // 生成过渡类
  Object.entries(transitions).forEach(([category, variants]) => {
    Object.entries(variants).forEach(([variant, transition]) => {
      css[`.transition-${category}-${variant}`] = { transition };
    });
  });
  
  // 生成持续时间类
  Object.entries(durations).forEach(([key, value]) => {
    css[`.duration-${key}`] = { animationDuration: value, transitionDuration: value };
  });
  
  // 生成缓动类
  Object.entries(easings).forEach(([key, value]) => {
    css[`.ease-${key}`] = { animationTimingFunction: value, transitionTimingFunction: value };
  });
  
  // 生成延迟类
  Object.entries(delays).forEach(([key, value]) => {
    css[`.delay-${key}`] = { animationDelay: value, transitionDelay: value };
  });
  
  return css;
};

// 创建动画样式的辅助函数
export const createAnimationStyle = ({
  animation,
  transition,
  duration,
  easing,
  delay,
  hover,
  active,
  focus,
  respectMotion = true
}) => {
  const style = {};
  
  // 基础动画
  if (animation) {
    if (typeof animation === 'string') {
      style.animation = animation;
    } else {
      style.animation = utils.createAnimation(animation).animation;
    }
  }
  
  // 基础过渡
  if (transition) {
    style.transition = transition;
  }
  
  // 持续时间
  if (duration) {
    style.animationDuration = durations[duration] || duration;
    style.transitionDuration = durations[duration] || duration;
  }
  
  // 缓动函数
  if (easing) {
    style.animationTimingFunction = easings[easing] || easing;
    style.transitionTimingFunction = easings[easing] || easing;
  }
  
  // 延迟
  if (delay) {
    style.animationDelay = delays[delay] || delay;
    style.transitionDelay = delays[delay] || delay;
  }
  
  // 交互状态
  if (hover) {
    style['&:hover'] = hover;
  }
  
  if (active) {
    style['&:active'] = active;
  }
  
  if (focus) {
    style['&:focus'] = focus;
  }
  
  // 尊重用户动画偏好
  if (respectMotion) {
    Object.assign(style, responsive.respectMotion);
  }
  
  return style;
};