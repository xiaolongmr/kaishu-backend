import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import './theme.css'; // 导入全局主题CSS
import ModernHomePage from './components/ModernHomePage'; // 导入新的现代化首页
import SimpleUploadPage from './components/SimpleUploadPage'; // 新的简化上传页面
import PluginAnnotationPage from './components/PluginAnnotationPage'; // 新的插件化标注页面
// 旧组件保留作为备用
// import UploadPage from './components/UploadPage';
// import AdvancedUploadPage from './components/AdvancedUploadPage';
// import OCRWorkflowPage from './components/OCRWorkflowPage';
// import AnnotationPage from './components/AnnotationPage';
import SearchPage from './components/SearchPage';
import AboutPage from './components/AboutPage';
import AdminPage from './components/AdminPage';
import GalleryPage from './components/GalleryPage';
import ImageDebugTool from './components/ImageDebugTool';
import ImageViewer from './components/ImageViewer';
import LoginPage from './components/LoginPage';
import CharacterStatistics from './components/CharacterStatistics'; // 导入字体统计组件
import CommentSettingsPage from './components/CommentSettingsPage'; // 导入评论设置组件
import ChangelogHistoryPage from './components/ChangelogHistoryPage'; // 导入更新历程页面
import { AuthProvider, useAuth } from './components/AuthContext';
import { ThemeProvider, useTheme } from './components/ThemeContext'; // 导入主题上下文
import ProtectedRoute from './components/ProtectedRoute';
import GlobalNavBar from './components/GlobalNavBar'; // 导入全局导航组件

// 导入 Ant Design 组件
import { Layout, message, Button, Menu } from 'antd';
const { Content, Footer, Sider } = Layout;

// 导入图标
import {
  HomeOutlined,
  UploadOutlined,
  FontSizeOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  DashboardOutlined,
  FileImageOutlined,
  BugOutlined,
  UserOutlined,
  LogoutOutlined,
  BarChartOutlined,
  ScanOutlined
} from '@ant-design/icons';

const AppContent = () => {
  const [searchTerm, setSearchTerm] = useState(''); // 用于传递搜索词
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // 使用主题上下文
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // 响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 菜单点击处理
  const handleMenuSelect = ({ key }) => {
    navigate(`/${key}`);
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      disabled: true
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/');
        message.success('已退出登录');
      }
    }
  ];

  // 获取当前路径对应的key
  const getCurrentPathKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    return path.substring(1); // 移除开头的 '/'
  };

  // 菜单项
  const menuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: '返回首页'
    },
    {
      key: 'upload',
      icon: <UploadOutlined />,
      label: '上传作品'
    },
    {
      key: 'annotate',
      icon: <FontSizeOutlined />,
      label: '字体标注'
    },
    {
      key: 'gallery',
      icon: <PictureOutlined />,
      label: '作品展示'
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: '字体统计'
    },
    {
      key: 'changelog',
      icon: <InfoCircleOutlined />,
      label: '更新历程'
    },
    {
      key: 'debug',
      icon: <BugOutlined />,
      label: '图像调试',
      hidden: !isAuthenticated
    },
    {
      key: 'admin',
      icon: <DashboardOutlined />,
      label: '后台管理',
      hidden: !(isAuthenticated && currentUser?.isAdmin)
    },
    {
      key: 'comment-settings',
      icon: <DashboardOutlined />,
      label: '评论设置',
      hidden: !(isAuthenticated && currentUser?.isAdmin)
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: '关于项目'
    }
  ].filter(item => !item.hidden);

  // 处理主页导航
  const handleHomeNavigation = (page, search = '') => {
    // 导航到对应页面
    navigate(`/${page}`);
    
    // 如果提供了搜索词，存储到localStorage
    if (search) {
      localStorage.setItem('lastSearchTerm', search);
      // 触发自定义事件，通知SearchPage更新
      const searchEvent = new CustomEvent('searchTermChanged', { 
        detail: { searchTerm: search } 
      });
      window.dispatchEvent(searchEvent);
    }
  };

  // 渲染主要内容区域
  const renderMainContent = () => {
    const isHomePage = location.pathname === '/' || location.pathname === '/home';

    return (
      <div style={{ marginTop: '57px' }}>
        {isHomePage ? (
          <Routes>
            <Route path="/" element={<ModernHomePage onNavigate={handleHomeNavigation} />} />
            <Route path="/home" element={<ModernHomePage onNavigate={handleHomeNavigation} />} />
          </Routes>
        ) : (
          <Layout style={{ background: '#f0f2f5' }}>
            {isMobile ? (
              <>
                <Content style={{ padding: '0px', background: '#2e7df3ff' }}>
                    <div style={{ background: '#f7fafc', padding: '0px', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)' }}>
                    <Routes>
                      <Route path="/upload" element={isAuthenticated ? <SimpleUploadPage /> : <LoginPage onLoginSuccess={() => navigate('/upload')} />} />
                      <Route path="/annotate" element={<PluginAnnotationPage />} />
                      <Route path="/statistics" element={<CharacterStatistics />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/changelog" element={<ChangelogHistoryPage />} />
                      <Route path="/admin" element={isAuthenticated && currentUser?.isAdmin ? <AdminPage /> : <LoginPage onLoginSuccess={(user) => user.isAdmin ? navigate('/admin') : navigate('/')} />} />
                      <Route path="/comment-settings" element={isAuthenticated && currentUser?.isAdmin ? <CommentSettingsPage /> : <LoginPage onLoginSuccess={(user) => user.isAdmin ? navigate('/comment-settings') : navigate('/')} />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/debug" element={isAuthenticated ? <ImageDebugTool /> : <LoginPage onLoginSuccess={() => navigate('/debug')} />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/viewer" element={<ImageViewer />} />
                      <Route path="/login" element={<LoginPage onLoginSuccess={() => navigate('/')} />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </div>
                </Content>
                <Footer style={{ textAlign: 'center', background: 'white', padding: '10px', fontSize: '12px' }}>
                  楷书库字体管理工具 © {new Date().getFullYear()}
                </Footer>
              </>
            ) : (
              <>
                <Sider 
                  collapsible 
                  collapsed={collapsed} 
                  onCollapse={setCollapsed} 
                  style={{ background: 'white', height: 'calc(100vh - 64px)', position: 'fixed', left: 0, top: 64, bottom: 0, zIndex: 10 }}
                  width={200}
                >
                  <Menu
                    mode="inline"
                    selectedKeys={[getCurrentPathKey()]}
                    onClick={handleMenuSelect}
                    style={{ height: '100vh', overflowY: 'auto', marginTop: '0' }}
                    items={menuItems}
                  />
                </Sider>
                <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.3s', background: '#f0f2f5' }}>
                  <Content style={{ padding: '0' }}>
                    <div style={{ background: 'white', padding: '16px 24px', borderRadius: '0', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)', minHeight: '80vh' }}>
                      <Routes>
                        <Route path="/upload" element={isAuthenticated ? <SimpleUploadPage /> : <LoginPage onLoginSuccess={() => navigate('/upload')} />} />
                        <Route path="/annotate" element={<PluginAnnotationPage />} />
                        <Route path="/statistics" element={<CharacterStatistics />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/changelog" element={<ChangelogHistoryPage />} />
                        <Route path="/admin" element={isAuthenticated && currentUser?.isAdmin ? <AdminPage /> : <LoginPage onLoginSuccess={(user) => user.isAdmin ? navigate('/admin') : navigate('/')} />} />
                        <Route path="/comment-settings" element={isAuthenticated && currentUser?.isAdmin ? <CommentSettingsPage /> : <LoginPage onLoginSuccess={(user) => user.isAdmin ? navigate('/comment-settings') : navigate('/')} />} />
                        <Route path="/gallery" element={<GalleryPage />} />
                        <Route path="/debug" element={isAuthenticated ? <ImageDebugTool /> : <LoginPage onLoginSuccess={() => navigate('/debug')} />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/viewer" element={<ImageViewer />} />
                        <Route path="/login" element={<LoginPage onLoginSuccess={() => navigate('/')} />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </div>
                  </Content>
                  <Footer style={{ textAlign: 'center', background: 'white' }}>
                    楷书库字体管理工具 © {new Date().getFullYear()}
                  </Footer>
                </Layout>
              </>
            )}
          </Layout>
        )}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 全局导航栏 */}
      <GlobalNavBar onNavigate={handleHomeNavigation} />
      
      {renderMainContent()}
    </Layout>
  );
}

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;