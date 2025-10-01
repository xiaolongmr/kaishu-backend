import React, { createContext, useContext, useEffect } from 'react';

// 创建主题上下文
const ThemeContext = createContext();

// 主题提供者组件
export const ThemeProvider = ({ children }) => {
  // 固定使用浅色模式
  const isDarkMode = false;
  const theme = 'light';

  // 应用浅色主题到DOM
  useEffect(() => {
    // 保存主题设置到localStorage
    localStorage.setItem('theme', 'light');
    
    // 更新body的类名以应用全局主题
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    document.documentElement.style.colorScheme = 'light';
    
    // 设置元数据标签颜色（用于移动设备状态栏）
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#ffffff');
    } else {
      // 如果不存在，创建一个
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#ffffff';
      document.head.appendChild(meta);
    }
    
    // 触发自定义事件，通知其他组件主题已更改
    const themeChangeEvent = new CustomEvent('themeChange', { 
      detail: { isDarkMode: false, theme: 'light' } 
    });
    window.dispatchEvent(themeChangeEvent);
  }, []);

  // 提供主题状态（固定为浅色模式）
  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 自定义钩子用于访问主题上下文
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};