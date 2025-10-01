/**
 * 插件化字体标注页面
 * 基于插件架构重构的新标注页面
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Row, Col, Card, List, Button, Typography, message, Spin, 
  Alert, Space, Tooltip, Switch, Layout, Divider, Badge, Image
} from 'antd';
import { 
  SearchOutlined, DeleteOutlined, EditOutlined, PlusOutlined,
  SettingOutlined, ExpandOutlined, CompressOutlined,
  InfoCircleOutlined, BugOutlined, ZoomInOutlined
} from '@ant-design/icons';
import { useTheme } from './ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import TwikooComment from './TwikooComment';
import useCommentSettings from './useCommentSettings';

// 导入插件化架构组件
import AnnotationCore from './design-system/AnnotationCore';
import OCRPlugin from './design-system/plugins/OCRPlugin';
import ErrorBoundary from './design-system/ErrorBoundary';

const { Title, Text } = Typography;
const { Header, Content, Sider } = Layout;

const PluginAnnotationPage = () => {
  // 基础状态
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // UI状态
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  
  // 插件系统状态
  const [annotationCore, setAnnotationCore] = useState(null);
  const [plugins, setPlugins] = useState([]);
  const [activePlugins, setActivePlugins] = useState(new Set());
  
  // Refs
  const canvasContainerRef = useRef(null);
  const annotationCoreRef = useRef(null);
  
  // Hooks
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { commentSettings } = useCommentSettings('annotate');
  
  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 初始化插件系统
  useEffect(() => {
    if (canvasContainerRef.current && !annotationCore) {
      initializeAnnotationSystem();
    }
    
    return () => {
      // 异步清理，避免竞态条件
      setTimeout(() => {
        if (annotationCoreRef.current) {
          try {
            annotationCoreRef.current.destroy();
          } catch (error) {
            console.warn('清理AnnotationCore时出错:', error);
          }
          annotationCoreRef.current = null;
        }
      }, 100); // 给React一些时间完成当前渲染
    };
  }, []);
  
  // 获取作品列表
  useEffect(() => {
    fetchWorks();
    
    // 检查URL参数中是否有作品ID
    const urlParams = new URLSearchParams(location.search);
    const workIdFromUrl = urlParams.get('workId');
    
    if (workIdFromUrl) {
      const interval = setInterval(() => {
        if (works.length > 0) {
          const work = works.find(w => w.id.toString() === workIdFromUrl.toString());
          if (work) {
            handleWorkSelect(work);
            message.success('已自动加载来自图库的作品');
          }
          clearInterval(interval);
        }
      }, 100);
      
      setTimeout(() => clearInterval(interval), 5000);
    }
  }, [works.length, location.search]);
  
  /**
   * 初始化标注系统
   */
  const initializeAnnotationSystem = () => {
    try {
      if (!canvasContainerRef.current) {
        console.error('Canvas容器未找到');
        return;
      }
      
      // 异步清理之前的实例
      if (annotationCoreRef.current) {
        const oldCore = annotationCoreRef.current;
        annotationCoreRef.current = null;
        setTimeout(() => {
          try {
            oldCore.destroy();
          } catch (error) {
            console.warn('清理旧实例时出错:', error);
          }
        }, 50);
      }
      
      // 清空容器内容
      canvasContainerRef.current.innerHTML = '';
      
      // 创建核心系统
      const core = new AnnotationCore(canvasContainerRef.current, {
        width: isMobile ? window.innerWidth - 40 : 800,
        height: isMobile ? 400 : 600,
        theme: theme
      });
      
      annotationCoreRef.current = core;
      setAnnotationCore(core);
      
      // 注册插件
      registerPlugins(core);
      
      // 绑定核心事件
      bindCoreEvents(core);
      
      console.log('插件化标注系统初始化完成');
      
    } catch (error) {
      console.error('初始化标注系统失败:', error);
      message.error('初始化标注系统失败: ' + error.message);
    }
  };
  
  /**
   * 注册插件
   */
  const registerPlugins = (core) => {
    const pluginList = [];
    const successfulPlugins = [];
    
    // 注册OCR插件
    try {
      const ocrPlugin = new OCRPlugin();
      core.registerPlugin(ocrPlugin);
      pluginList.push(ocrPlugin);
      successfulPlugins.push(ocrPlugin);
      console.log('OCR插件注册成功');
    } catch (error) {
      console.error('OCR插件注册失败:', error);
      message.error('OCR插件注册失败: ' + error.message);
    }
    
    // 可以在这里注册更多插件
    // try {
    //   const gridPlugin = new GridPlugin();
    //   core.registerPlugin(gridPlugin);
    //   pluginList.push(gridPlugin);
    //   successfulPlugins.push(gridPlugin);
    // } catch (error) {
    //   console.error('Grid插件注册失败:', error);
    // }
    
    // 只设置成功注册的插件
    setPlugins(successfulPlugins);
    
    // 默认激活所有成功注册的插件
    const activeSet = new Set();
    successfulPlugins.forEach(plugin => {
      try {
        core.activatePlugin(plugin.id);
        activeSet.add(plugin.id);
        console.log(`插件 ${plugin.name} 激活成功`);
      } catch (error) {
        console.error(`插件 ${plugin.name} 激活失败:`, error);
      }
    });
    
    setActivePlugins(activeSet);
    
    if (successfulPlugins.length > 0) {
      message.success(`成功注册 ${successfulPlugins.length} 个插件`);
    }
  };
  
  /**
   * 绑定核心事件
   */
  const bindCoreEvents = (core) => {
    // 监听标注变化
    core.getAPI().events.on('annotations:changed', (annotations) => {
      console.log('标注列表更新:', annotations.length);
    });
    
    // 监听标注选择
    core.getAPI().events.on('annotation:selected', (annotation) => {
      console.log('选中标注:', annotation);
    });
    
    // 监听插件事件
    core.getAPI().events.on('plugin:ocr:activated', () => {
      message.info('OCR插件已激活');
    });
  };
  
  /**
   * 获取作品列表
   */
  const fetchWorks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/works');
      const data = await response.json();
      setWorks(data);
    } catch (error) {
      console.error('获取作品列表失败:', error);
      message.error('获取作品列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 选择作品
   */
  const handleWorkSelect = async (work) => {
    try {
      setSelectedWork(work);
      
      if (annotationCore) {
        // 构建图像URL
        const imageUrl = `/images/${work.filename}`;
        
        // 加载图像到核心系统
        await annotationCore.getAPI().image.load(imageUrl);
        
        // 获取现有标注
        const response = await fetch(`/api/works/${work.id}/annotations`);
        const annotations = await response.json();
        
        // 清除现有标注
        const existingAnnotations = annotationCore.getAPI().annotations.getAll();
        existingAnnotations.forEach(annotation => {
          annotationCore.getAPI().annotations.remove(annotation.id);
        });
        
        // 添加标注到核心系统
        annotations.forEach(annotation => {
          annotationCore.getAPI().annotations.add({
            id: annotation.id.toString(),
            type: annotation.four_points ? 'fourPoint' : 'rectangle',
            data: annotation.four_points ? {
              fourPoint: { points: annotation.four_points }
            } : {
              rectangle: {
                x: annotation.position_x,
                y: annotation.position_y,
                width: annotation.width,
                height: annotation.height
              }
            },
            style: {
              strokeColor: '#1890ff',
              fillColor: 'rgba(24, 144, 255, 0.1)',
              strokeWidth: 2,
              opacity: 1
            },
            metadata: {
              characterName: annotation.character_name,
              userId: annotation.user_id,
              createdAt: annotation.annotation_time
            },
            createdAt: new Date(annotation.annotation_time),
            updatedAt: new Date(annotation.annotation_time)
          });
        });
        
        message.success(`已加载作品：${work.original_filename}`);
      }
      
    } catch (error) {
      console.error('加载作品失败:', error);
      message.error('加载作品失败: ' + error.message);
    }
  };
  
  /**
   * 切换插件状态
   */
  const togglePlugin = (pluginId) => {
    if (!annotationCore) {
      message.error('标注系统未初始化');
      return;
    }
    
    // 检查插件是否存在
    const plugin = annotationCore.getPlugin(pluginId);
    if (!plugin) {
      message.error(`插件 ${pluginId} 不存在`);
      console.error(`Plugin ${pluginId} not found in core system`);
      return;
    }
    
    const newActivePlugins = new Set(activePlugins);
    
    try {
      if (activePlugins.has(pluginId)) {
        annotationCore.deactivatePlugin(pluginId);
        newActivePlugins.delete(pluginId);
        message.info(`插件 ${plugin.name} 已停用`);
      } else {
        annotationCore.activatePlugin(pluginId);
        newActivePlugins.add(pluginId);
        message.info(`插件 ${plugin.name} 已激活`);
      }
      
      setActivePlugins(newActivePlugins);
    } catch (error) {
      console.error(`切换插件 ${pluginId} 状态失败:`, error);
      message.error(`切换插件状态失败: ${error.message}`);
    }
  };
  
  /**
   * 渲染作品列表
   */
  const renderWorksList = () => (
    <Card 
      title="作品列表" 
      size="small"
      extra={
        <Button 
          size="small" 
          icon={<SearchOutlined />}
          onClick={() => navigate('/gallery')}
        >
          浏览
        </Button>
      }
    >
      <List
        size="small"
        loading={loading}
        dataSource={works.slice(0, 10)}
        renderItem={(work) => (
          <List.Item
            className={selectedWork?.id === work.id ? 'selected' : ''}
            style={{
              cursor: 'pointer',
              backgroundColor: selectedWork?.id === work.id ? '#e6f7ff' : 'transparent',
              borderLeft: selectedWork?.id === work.id ? '3px solid #1890ff' : 'none'
            }}
            onClick={() => handleWorkSelect(work)}
          >
            <List.Item.Meta
              avatar={
                <div 
                  className="work-image-container"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Image
                    src={`/images/${work.filename}`}
                    alt={work.original_filename || work.filename}
                    width={50}
                    height={50}
                    preview={{
                      mask: <ZoomInOutlined />,
                      maskClassName: "custom-preview-mask"
                    }}
                    fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ250LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UsIHNhbnMtc2VyaWYiIGZpbGw9IiM5OTk5OTkiPuWbvueJhzwvdGV4dD48L3N2Zz4="
                    onError={(e) => {
                      console.error(`图片加载失败: ${work.filename}`);
                    }}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
              }
              title={
                <Text ellipsis style={{ fontSize: '12px' }}>
                  {(work.original_filename || work.filename).length > 15 ? 
                    (work.original_filename || work.filename).substring(0, 15) + '...' : 
                    (work.original_filename || work.filename)
                  }
                </Text>
              }
              description={
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {work.work_author || new Date(work.upload_time).toLocaleDateString()}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
  
  /**
   * 渲染插件管理面板
   */
  const renderPluginsPanel = () => (
    <Card title="插件管理" size="small">
      <Space direction="vertical" style={{ width: '100%' }}>
        {plugins.map(plugin => (
          <div key={plugin.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px',
            border: '1px solid #f0f0f0',
            borderRadius: '4px'
          }}>
            <div>
              <Text strong style={{ fontSize: '12px' }}>{plugin.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                v{plugin.version}
              </Text>
            </div>
            <Switch
              size="small"
              checked={activePlugins.has(plugin.id)}
              onChange={() => togglePlugin(plugin.id)}
            />
          </div>
        ))}
      </Space>
    </Card>
  );
  
  /**
   * 渲染调试面板
   */
  const renderDebugPanel = () => {
    if (!showDebugPanel || !annotationCore) return null;
    
    const debugInfo = {
      annotations: annotationCore.getAPI().annotations.getAll().length,
      selectedWork: selectedWork?.original_filename || '无',
      plugins: plugins.length,
      activePlugins: activePlugins.size
    };
    
    return (
      <Card title="调试信息" size="small" style={{ marginTop: '8px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '11px' }}>{key}:</Text>
              <Text style={{ fontSize: '11px' }} type="secondary">{value}</Text>
            </div>
          ))}
        </Space>
      </Card>
    );
  };
  
  return (
    <ErrorBoundary>
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Layout style={{ height: '100%' }}>
        {/* 侧边栏 */}
        <Sider
          width={280}
          collapsedWidth={0}
          collapsed={sidebarCollapsed}
          trigger={null}
          style={{
            background: theme === 'dark' ? '#001529' : '#fff',
            borderRight: '1px solid #f0f0f0'
          }}
        >
          <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {renderWorksList()}
              {renderPluginsPanel()}
              {renderDebugPanel()}
            </Space>
          </div>
        </Sider>
        
        {/* 主内容区 */}
        <Layout>
          {/* 顶部工具栏 */}
          <Header style={{ 
            background: theme === 'dark' ? '#001529' : '#fff',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 16px',
            height: '48px',
            lineHeight: '48px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button
                  type="text"
                  icon={sidebarCollapsed ? <ExpandOutlined /> : <CompressOutlined />}
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <Title level={4} style={{ margin: 0, fontSize: '16px' }}>
                  插件化字体标注
                </Title>
                {selectedWork && (
                  <Badge 
                    count={annotationCore?.getAPI().annotations.getAll().length || 0}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedWork.original_filename}
                    </Text>
                  </Badge>
                )}
              </Space>
              
              <Space>
                <Tooltip title="调试面板">
                  <Button
                    type="text"
                    icon={<BugOutlined />}
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                  />
                </Tooltip>
                <Tooltip title="全屏模式">
                  <Button
                    type="text"
                    icon={fullscreenMode ? <CompressOutlined /> : <ExpandOutlined />}
                    onClick={() => setFullscreenMode(!fullscreenMode)}
                  />
                </Tooltip>
                <Tooltip title="设置">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                  />
                </Tooltip>
              </Space>
            </div>
          </Header>
          
          {/* Canvas区域 */}
          <Content style={{ 
            padding: '16px',
            background: theme === 'dark' ? '#141414' : '#f5f5f5',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div 
              ref={canvasContainerRef}
              style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative',
                minHeight: '500px'
              }}
            >
              {!selectedWork && !annotationCore && (
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', 
                  color: '#999' 
                }}>
                  <InfoCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>请从左侧选择一个作品开始标注</div>
                </div>
              )}
              {selectedWork && !annotationCore && (
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center', 
                  color: '#999' 
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '16px' }}>正在初始化标注系统...</div>
                </div>
              )}
            </div>
          </Content>
        </Layout>
      </Layout>
      
      {/* 评论区域 */}
      {commentSettings?.enabled && !fullscreenMode && (
        <ErrorBoundary>
          <div style={{ padding: '16px', background: '#fff' }}>
            <TwikooComment pagePath="annotate" />
          </div>
        </ErrorBoundary>
      )}
      </div>
    </ErrorBoundary>
  );
};

export default PluginAnnotationPage;