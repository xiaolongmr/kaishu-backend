import React, { useState, useEffect, useRef, createRef } from 'react';
import { Button, Switch, Modal, Input, List, Empty, Typography, Spin, Drawer, Menu, message } from 'antd';
import { 
  SearchOutlined, 
  UserOutlined,
  CloseOutlined,
  EnterOutlined,
  UpOutlined,
  DownOutlined,
  MenuOutlined,
  HistoryOutlined // 添加HistoryOutlined图标
} from '@ant-design/icons';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useNavigate } from 'react-router-dom';
import { annotationsAPI, homepageAPI } from '../utils/api';
import './ModernHomePage.css'; // 复用现有的CSS
import './SearchStyles.css'; // 导入搜索相关样式

const { Text, Paragraph } = Typography;

const GlobalNavBar = ({ onNavigate }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  // 使用主题上下文（仅获取主题状态）
  const { isDarkMode } = useTheme();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]); // 添加搜索历史记录
  const [searchSuggestions, setSearchSuggestions] = useState([]); // 添加搜索建议
  const [selectedIndex, setSelectedIndex] = useState(-1); // 当前选中项索引
  const searchInputRef = useRef(null);
  const searchResultsContainerRef = useRef(null); // 添加搜索结果容器引用
  const itemRefs = useRef([]); // 添加引用数组来追踪每个搜索结果项
  const [contents, setContents] = useState({});
  const [loading, setLoading] = useState(true);
  const [annotationCount, setAnnotationCount] = useState(0);
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  // 获取首页内容
  useEffect(() => {
    fetchHomepageContents();
    fetchAnnotationCount();
  }, []);

  // 每次页面焦点回到窗口时刷新标注数量
  useEffect(() => {
    const handleFocus = () => {
      fetchAnnotationCount();
    };

    window.addEventListener('focus', handleFocus);
    // 也监听路由变化
    const handleRouteChange = () => {
      fetchAnnotationCount();
    };
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // 监听自定义事件，当标注数量变化时刷新
  useEffect(() => {
    const handleAnnotationChange = () => {
      fetchAnnotationCount();
    };

    window.addEventListener('annotationChanged', handleAnnotationChange);
    
    return () => {
      window.removeEventListener('annotationChanged', handleAnnotationChange);
    };
  }, []);

  // 监听键盘事件，Ctrl+K 打开搜索弹窗
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 检测 Ctrl+K 组合键
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalVisible(true);
      }
      
      // ESC 键关闭搜索弹窗
      if (e.key === 'Escape' && searchModalVisible) {
        setSearchModalVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchModalVisible]);

  // 添加键盘导航功能 - 完全重写逻辑
  const handleKeyNavigation = (e) => {
    // 当按上下键时，需要确定当前的导航上下文
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); // 防止页面滚动
      
      // 确定当前可导航项目类型和数量
      let items = [];
      let itemType = '';
      
      // 按显示优先级确定导航上下文
      if (searchResults.length > 0) {
        items = searchResults;
        itemType = 'results';
      } else if (searchSuggestions.length > 0) {
        items = searchSuggestions;
        itemType = 'suggestions';
      } else if (searchHistory.length > 0) {
        items = searchHistory.slice(0, 3); // 只使用显示的前3条
        itemType = 'history';
      } else {
        return; // 没有可导航的项目
      }
      
      const maxIndex = items.length - 1;
      
      // 计算新的选中索引
      let newIndex;
      if (e.key === 'ArrowDown') {
        // 向下导航
        newIndex = selectedIndex === -1 || selectedIndex >= maxIndex ? 0 : selectedIndex + 1;
      } else {
        // 向上导航
        newIndex = selectedIndex <= 0 ? maxIndex : selectedIndex - 1;
      }
      
      console.log(`键盘导航: ${e.key}, 类型: ${itemType}, 当前索引: ${selectedIndex}, 新索引: ${newIndex}, 项目数: ${items.length}`);
      setSelectedIndex(newIndex);
    }
    
    // 当按Enter键时，根据当前选中索引执行相应操作
    else if (e.key === 'Enter' && selectedIndex !== -1) {
      e.preventDefault();
      
      // 确定当前选中的是哪种类型的项目
      if (searchResults.length > 0 && selectedIndex < searchResults.length) {
        console.log(`选中搜索结果: ${selectedIndex}`);
        handleSearchResultClick(searchResults[selectedIndex]);
      } else if (searchSuggestions.length > 0 && selectedIndex < searchSuggestions.length) {
        console.log(`选中搜索建议: ${selectedIndex}`);
        setSearchTerm(searchSuggestions[selectedIndex]);
      } else if (searchHistory.length > 0 && selectedIndex < searchHistory.length) {
        console.log(`选中搜索历史: ${selectedIndex}`);
        setSearchTerm(searchHistory[selectedIndex]);
      }
    }
  };

  // 当searchResults改变时，更新itemRefs
  useEffect(() => {
    // 当搜索结果改变时，重新创建足够数量的引用
    itemRefs.current = Array(searchResults.length)
      .fill()
      .map((_, i) => itemRefs.current[i] || createRef());
  }, [searchResults]);

  // 当selectedIndex变化时，处理滚动和视觉反馈
  useEffect(() => {
    if (selectedIndex !== -1) {
      console.log(`选中索引已更新: ${selectedIndex}`);
      
      // 确保选中项在视图中可见
      if (itemRefs.current[selectedIndex] && itemRefs.current[selectedIndex].current && searchResultsContainerRef.current) {
        // 获取容器和选中项的位置信息
        const container = searchResultsContainerRef.current;
        const item = itemRefs.current[selectedIndex].current;
        
        // 获取容器和选中项的位置信息
        const containerRect = container.getBoundingClientRect();
        const itemRect = item.getBoundingClientRect();
        
        // 检查选中项是否在容器的可视范围内
        const isVisible = (
          itemRect.top >= containerRect.top &&
          itemRect.bottom <= containerRect.bottom
        );
        
        // 如果不在可视范围内，滚动容器使选中项可见
        if (!isVisible) {
          if (itemRect.top < containerRect.top) {
            // 向上滚动，使选中项出现在容器顶部
            container.scrollTop -= (containerRect.top - itemRect.top);
          } else if (itemRect.bottom > containerRect.bottom) {
            // 向下滚动，使选中项出现在容器底部
            container.scrollTop += (itemRect.bottom - containerRect.bottom);
          }
          
          console.log('已滚动使选中项可见');
        }
      }
    }
  }, [selectedIndex]);

  // 加载搜索历史记录
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('解析搜索历史记录失败:', e);
        setSearchHistory([]);
      }
    }
  }, []);

  // 保存搜索历史记录
  useEffect(() => {
    if (searchTerm && !searchHistory.includes(searchTerm)) {
      const newHistory = [searchTerm, ...searchHistory.slice(0, 9)]; // 限制历史记录数量为10条
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  }, [searchTerm, searchHistory]);

  // 当搜索弹窗打开时，自动聚焦搜索输入框（简化版）
  useEffect(() => {
    if (searchModalVisible) {
      console.log('🔍 搜索弹窗已打开，准备聚焦输入框...');

      const focusTimer = setTimeout(() => {
        if (searchInputRef.current) {
          console.log('✅ 正在聚焦输入框:', searchInputRef.current);
          searchInputRef.current.focus();
          searchInputRef.current.select();
        } else {
          console.warn('❌ 输入框引用为空，可能未正确渲染');
        }
      }, 50);

      return () => clearTimeout(focusTimer);
    }
  }, [searchModalVisible]);

  // 当搜索词改变时，执行搜索
  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
      // 获取搜索建议
      getSearchSuggestions(searchTerm);
    } else {
      setSearchResults([]);
      setSearchSuggestions([]);
    }
  }, [searchTerm]);

  // 获取首页内容的方法
  const fetchHomepageContents = async () => {
    try {
      setLoading(true);
      const response = await homepageAPI.getHomepageData();
      
      // 处理API响应数据
      if (response.data && response.data.success && response.data.data) {
        // 新格式：后端返回 { success: true, data: { content: {...} } }
        setContents(response.data.data.content || {});
      } else if (Array.isArray(response.data)) {
        // 旧格式：直接返回数组
        const contentsMap = {};
        response.data.forEach(item => {
          contentsMap[item.content_key] = item.content_value;
        });
        setContents(contentsMap);
      } else {
        console.warn('未知的首页数据格式:', response.data);
        setContents({});
      }
    } catch (error) {
      console.error('获取首页内容失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取已标注字符数量
  const fetchAnnotationCount = async () => {
    try {
      console.log('开始获取标注数量');
      const data = await annotationsAPI.getAnnotationCount();
      console.log('获取到标注数量:', data.count);
      setAnnotationCount(data.count || 0);
    } catch (error) {
      console.error('获取标注数量失败:', error);
    }
  };

  // 获取搜索建议
  const getSearchSuggestions = async (term) => {
    if (!term.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      // 从搜索历史中获取建议
      const historySuggestions = searchHistory.filter(item => 
        item.toLowerCase().includes(term.toLowerCase())
      ).slice(0, 3);
      
      // 从热门搜索中获取建议（这里简单地使用最近的搜索记录）
      const popularSuggestions = searchHistory.slice(0, 3);
      
      // 合并并去重
      const allSuggestions = [...new Set([...historySuggestions, ...popularSuggestions])].slice(0, 5);
      
      setSearchSuggestions(allSuggestions);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      setSearchSuggestions([]);
    }
  };

  // 处理搜索
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setSelectedIndex(-1); // 重置选中索引
      return;
    }

    try {
      setSearchLoading(true);
      // 使用标准搜索API
      const response = await fetch(`/api/search/${encodeURIComponent(term)}`);
      console.log('搜索请求URL:', `/api/search/${encodeURIComponent(term)}`);
      
      // 记录响应状态
      console.log('搜索响应状态:', response.status);
      
      // 尝试读取响应内容
      let data;
      try {
        const text = await response.text();
        console.log('搜索响应原始文本:', text);
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('解析搜索响应JSON失败:', parseError);
        data = [];
      }
      
      console.log('搜索结果数量:', Array.isArray(data) ? data.length : '非数组');
      
      if (Array.isArray(data)) {
        setSearchResults(data);
        setSelectedIndex(-1); // 重置选中索引
        
        // 如果没有结果，尝试使用备用搜索
        if (data.length === 0) {
          console.log('尝试使用备用搜索');
          // 尝试获取所有标注并在客户端过滤
          try {
            const allAnnotations = await annotationsAPI.searchAnnotations();
            
            if (Array.isArray(allAnnotations)) {
              // 客户端过滤搜索结果
              const filteredResults = allAnnotations.filter(ann => 
                ann && ann.character_name && (
                  ann.character_name.includes(term) || 
                  (ann.character_name.toLowerCase().includes(term.toLowerCase()))
                )
              );
              console.log('备用搜索结果数量:', filteredResults.length);
              if (filteredResults.length > 0) {
                setSearchResults(filteredResults);
              }
            }
          } catch (backupError) {
            console.error('备用搜索出错:', backupError);
          }
        }
      } else {
        console.error('搜索结果不是数组:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('搜索出错:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 根据内容键获取值，如果不存在则使用默认值
  const getContent = (key, defaultValue) => {
    return contents[key] || defaultValue;
  };

  // 打开搜索弹窗
  const openSearchModal = () => {
    setSearchModalVisible(true);
    setSelectedIndex(-1); // 重置选中索引

    // 确保在 DOM 更新后聚焦
    requestAnimationFrame(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      } else {
        // 如果未找到输入框，增加一个延迟保障
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        }, 100);
      }
    });
  };

  // 处理搜索结果点击
  const handleSearchResultClick = (result) => {
    if (!result || !result.character_name) {
      console.error('搜索结果数据不完整:', result);
      message.warning('标注信息不完整，无法查看详情');
      return;
    }

    setSearchModalVisible(false);
    // 重置选中索引
    setSelectedIndex(-1);
    // 导航到搜索页面
    navigate('/search');
    // 使用全局状态或localStorage存储搜索词，确保页面切换后能够保持
    localStorage.setItem('lastSearchTerm', result.character_name);
    // 触发自定义事件，通知SearchPage更新
    const searchEvent = new CustomEvent('searchTermChanged', { 
      detail: { searchTerm: result.character_name } 
    });
    window.dispatchEvent(searchEvent);
  };

  // 处理页面导航
  const handlePageNavigation = (page) => {
    navigate(`/${page}`);
    setDrawerVisible(false);
  };

  // 菜单项
  const menuItems = [
    {
      key: 'home',
      label: '返回首页',
      onClick: () => handlePageNavigation(''),
    },
    {
      key: 'upload',
      label: '上传作品',
      onClick: () => handlePageNavigation('upload'),
    },
    {
      key: 'annotate',
      label: '字体标注',
      onClick: () => handlePageNavigation('annotate'),
    },
    {
      key: 'gallery',
      label: '作品展示',
      onClick: () => handlePageNavigation('gallery'),
    },
    {
      key: 'statistics',
      label: '字体统计',
      onClick: () => handlePageNavigation('statistics'),
    },
    {
      key: 'changelog',
      label: '更新历程',
      onClick: () => handlePageNavigation('changelog'),
    },
    {
      key: 'about',
      label: '关于项目',
      onClick: () => handlePageNavigation('about'),
    },
  ];
  
  // 管理员菜单项
  const adminMenuItems = [
    {
      key: 'debug',
      label: '图像调试',
      onClick: () => handlePageNavigation('debug'),
    },
    {
      key: 'admin',
      label: '后台管理',
      onClick: () => handlePageNavigation('admin'),
    },
    {
      key: 'comment-settings',
      label: '评论设置',
      onClick: () => handlePageNavigation('comment-settings'),
    }
  ];
  
  // 用户菜单项
  const userMenuItems = [
    {
      key: 'login',
      label: isAuthenticated ? '退出登录' : '登录',
      onClick: () => {
        if (isAuthenticated) {
          logout();
          navigate('/');
          setDrawerVisible(false);
        } else {
          navigate('/login');
          setDrawerVisible(false);
        }
      },
    }
  ];

  return (
    <>
      <div className="top-nav" style={{ display: 'flex', alignItems: 'center' }}>
        <div className="top-nav-logo" onClick={() => navigate('/')}>
          <span className="logo-gradient" style={{ position: 'relative' }}>
            {getContent('site_name', '绍楷字库')}
            <span style={{ 
              position: 'absolute', 
              top: '-8px', 
              right: '-28px', 
              fontSize: '10px', 
              fontWeight: 'normal',
              background: '#1890ff',
              color: 'white',
              padding: '0 4px',
              borderRadius: '4px',
              transform: 'scale(0.8)',
              opacity: '0.9'
            }}>
              BETA
            </span>
          </span>
        </div>
        
        <div className="annotation-count" style={{ 
          marginLeft: '16px', 
          fontSize: '12px', 
          color: 'rgba(0,0,0,0.65)', 
          display: 'flex', 
          alignItems: 'flex-end',
          height: '20px'
        }}>
          <span>已标注:</span> <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{annotationCount}</span> 字
        </div>
        
        {isMobile ? (
          <>
            <div style={{ flex: 1 }}></div>
            <Button 
              type="text" 
              icon={<SearchOutlined style={{ fontSize: '20px', color: isDarkMode ? 'white' : 'black' }} />} 
              onClick={openSearchModal}
              style={{ marginRight: '8px' }}
              className="icon-only-button"
            />
            <Button 
              type="text" 
              icon={<MenuOutlined style={{ fontSize: '20px', color: isDarkMode ? 'white' : 'black' }} />} 
              onClick={() => setDrawerVisible(true)}
              className="icon-only-button"
            />
          </>
        ) : (
          <>
            <div style={{ flex: 1 }}></div>
            <div className="search-box" onClick={openSearchModal}>
              <SearchOutlined style={{ marginRight: 8, fontSize: '14px', opacity: 0.7 }} />
              <span style={{ color: 'rgba(0,0,0,0.45)' }}>Search</span>
              <span className="keyboard-shortcut">Ctrl K</span>
            </div>
            <div className="top-nav-links">
              {/* 登录/用户信息 */}
              {isAuthenticated ? (
                <span>
                  <UserOutlined /> {currentUser?.username || '用户'}
                </span>
              ) : (
                <Button 
                  type="primary" 
                  size="small" 
                  onClick={() => navigate('/login')}
                  icon={<UserOutlined />}
                >
                  {getContent('login_text', '登录')}
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 移动端侧边栏抽屉 */}
      <Drawer 
        title={getContent('site_name', '绍楷字库')}
        placement="right"
        closable={true}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={250}
        styles={{ body: { padding: 0 } }}
        style={{ boxShadow: 'none' }}
      >
        {/* 用户信息区 */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          {isAuthenticated ? currentUser?.username || '用户' : '未登录'}
        </div>
        
        {/* 主菜单 */}
        <Menu 
          mode="vertical"
          style={{ borderRight: 'none' }}
          items={menuItems}
        />
        
        {/* 管理员菜单，仅在登录且是管理员时显示 */}
        {isAuthenticated && currentUser?.isAdmin && (
          <>
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', color: '#999' }}>
              管理员功能
            </div>
            <Menu 
              mode="vertical"
              style={{ borderRight: 'none' }}
              items={adminMenuItems}
            />
          </>
        )}
        
        {/* 用户菜单 */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', color: '#999' }}>
          用户操作
        </div>
        <Menu 
          mode="vertical"
          style={{ borderRight: 'none' }}
          items={userMenuItems}
        />
      </Drawer>

      {/* 搜索弹窗 */}
      <Modal
        className="search-modal"
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        closable={false} // 移除右上角关闭按钮
        maskClosable={true} // 确保点击蒙层可以关闭
        width={600}
        destroyOnHidden={true}
        centered
      >
        <div className="search-modal-container">
          <div className="search-input-wrapper">
            <SearchOutlined className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="搜索字符..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) {
                  setSelectedIndex(-1); // 清空搜索内容时重置选中索引
                }
              }}
              autoFocus
              onKeyDown={(e) => {
                // 处理上下键和Enter键
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || 
                    (e.key === 'Enter' && selectedIndex !== -1)) {
                  handleKeyNavigation(e);
                  return;
                }
                
                // 只有当没有选中项且有搜索结果时，才处理Enter键的默认行为
                if (e.key === 'Enter' && selectedIndex === -1 && searchResults.length > 0 && 
                    searchResults[0] && searchResults[0].character_name) {
                  handleSearchResultClick(searchResults[0]);
                }
              }}
            />
            {searchTerm && (
              <CloseOutlined
                className="close-icon"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndex(-1); // 清空搜索内容时重置选中索引
                }}
              />
            )}
          </div>
          
          {searchLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Spin>
                    <div style={{ padding: '10px', textAlign: 'center' }}>
                      搜索中...
                    </div>
                  </Spin>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="search-results-container" ref={searchResultsContainerRef} style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <List
                dataSource={searchResults}
                renderItem={(result, index) => (
                  <div
                    key={`result-${index}`}
                    ref={itemRefs.current[index]}
                    className="search-result-item"
                    onClick={() => {
                      // 确保有效的结果才能点击
                      if (result && (result.character_name || result.filename)) {
                        handleSearchResultClick(result);
                      }
                    }}
                    style={{
                      backgroundColor: selectedIndex === index ? 
                        (isDarkMode ? 'rgba(24, 144, 255, 0.15)' : 'rgba(24, 144, 255, 0.08)') : 
                        'transparent',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                      padding: '4px 6px',
                      margin: '1px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ marginRight: '12px', width: '36px', height: '36px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                          src={`/api/crop-image?filename=${result && result.filename ? encodeURIComponent(result.filename) : ''}&x=${result && result.position_x !== undefined ? result.position_x : 0}&y=${result && result.position_y !== undefined ? result.position_y : 0}&width=${result && result.width ? result.width : 50}&height=${result && result.height ? result.height : 50}`}
                          alt={result && result.character_name ? result.character_name : '未命名字符'}
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UsIHNhbnMtc2VyaWYiIGZpbGw9IiM5OTk5OTkiPj88L3RleHQ+PC9zdmc+';
                            console.error('裁剪图像加载失败');
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          color: selectedIndex === index ? 
                            (isDarkMode ? '#1890ff' : '#1890ff') :
                            (isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)')
                        }}>
                          {result && result.character_name ? result.character_name : '未命名字符'}
                        </div>
                        <div style={{ fontSize: '12px', color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)' }}>
                          出自：{result && (result.original_filename || result.filename) ? (result.original_filename ? decodeURIComponent(result.original_filename) : decodeURIComponent(result.filename)) : '未知文件'}
                        </div>
                      </div>
                      <EnterOutlined style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', fontSize: '14px', opacity: 0.7 }} />
                    </div>
                  </div>
                )}
              />
            </div>
          ) : searchTerm && !searchLoading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <Empty description="未找到相关字符" />
            </div>
          ) : (
            <div style={{ padding: '12px' }}>
              {/* 搜索历史 - 更加简约的水平标签 */}
              {searchHistory.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', 
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>最近搜索</span>
                    <span 
                      style={{ cursor: 'pointer', fontSize: '10px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchHistory([]);
                        localStorage.removeItem('searchHistory');
                      }}
                    >
                      清空
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {searchHistory.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSearchTerm(item);
                        }}
                        style={{
                          padding: '2px 6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          borderRadius: '10px',
                          backgroundColor: selectedIndex === index ? 
                            (isDarkMode ? 'rgba(24, 144, 255, 0.15)' : 'rgba(24, 144, 255, 0.08)') :
                            (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
                          color: selectedIndex === index ?
                            (isDarkMode ? '#1890ff' : '#1890ff') :
                            (isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'),
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <HistoryOutlined style={{ fontSize: '10px', marginRight: '2px', opacity: 0.7 }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 搜索建议 - 简化为列表，但保留更多上下文 */}
              {searchSuggestions.length > 0 && (
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', 
                    marginBottom: '4px'
                  }}>
                    搜索建议
                  </div>
                  <div>
                    {searchSuggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSearchTerm(item);
                        }}
                        style={{
                          padding: '4px 6px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          marginBottom: '1px',
                          backgroundColor: selectedIndex === (searchHistory.length > 0 ? index + Math.min(searchHistory.length, 3) : index) ? 
                            (isDarkMode ? 'rgba(24, 144, 255, 0.15)' : 'rgba(24, 144, 255, 0.08)') : 
                            'transparent',
                          color: selectedIndex === (searchHistory.length > 0 ? index + Math.min(searchHistory.length, 3) : index) ?
                            (isDarkMode ? '#1890ff' : '#1890ff') :
                            (isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'),
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <SearchOutlined style={{ 
                          fontSize: '11px', 
                          marginRight: '6px',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
                          opacity: 0.7
                        }} />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 默认提示 */}
              {!searchTerm && searchHistory.length === 0 && searchSuggestions.length === 0 && (
                <div style={{ textAlign: 'center' }}>
                  <Paragraph style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>
                    输入字符名称或拼音搜索
                  </Paragraph>
                </div>
              )}
            </div>
          )}
          
          {!isMobile && (
            <div className="search-shortcuts" style={{
              display: 'flex',
              justifyContent: 'center',
              borderTop: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                color: 'rgba(0, 0, 0, 0.45)',
                fontSize: '14px'
              }}>
                <div style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  marginRight: '8px',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <UpOutlined style={{ fontSize: '12px' }} />
                </div>
                <div style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  marginRight: '8px',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <DownOutlined style={{ fontSize: '12px' }} />
                </div>
                <span style={{ marginRight: '20px' }}>上下选择</span>
                
                <div style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  marginRight: '8px',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <EnterOutlined style={{ fontSize: '12px' }} />
                </div>
                <span style={{ marginRight: '20px' }}>确认选择</span>
                
                <div style={{
                  padding: '4px 8px',
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  marginRight: '8px',
                  minWidth: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontFamily: 'monospace'
                }}>
                  <span className="esc-key">esc</span>
                </div>
                <span>关闭窗口</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default GlobalNavBar;