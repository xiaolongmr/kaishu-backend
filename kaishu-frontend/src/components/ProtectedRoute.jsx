import React from 'react';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';

// 受保护路由组件，只有认证用户才能访问
const ProtectedRoute = ({ component: Component, requireAdmin = false }) => {
  const { isAuthenticated, currentUser, login } = useAuth();
  
  // 检查是否有访问权限
  const hasAccess = isAuthenticated && (!requireAdmin || currentUser?.isAdmin);

  // 如果用户有访问权限，则渲染组件
  if (hasAccess) {
    return <Component />;
  }
  
  // 否则显示登录页面
  return <LoginPage onLoginSuccess={login} />;
};

export default ProtectedRoute;