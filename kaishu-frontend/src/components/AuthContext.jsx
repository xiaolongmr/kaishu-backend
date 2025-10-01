import React, { createContext, useState, useContext, useEffect } from 'react';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证提供组件
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 在组件挂载时检查本地存储中是否有用户信息
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('检查认证状态时出错:', error);
        // 出错时清除存储的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // 登录方法
  const login = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
  };

  // 登出方法
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，用于在组件中访问认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  
  return context;
};

export default AuthContext;