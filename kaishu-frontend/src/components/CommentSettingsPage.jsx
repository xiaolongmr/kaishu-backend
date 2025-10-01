import React, { useState, useEffect } from 'react';
import { Card, Table, Switch, Input, Button, message, Typography, Select } from 'antd';
import { useAuth } from './AuthContext';
import { commentAPI } from '../utils/api'; // 导入评论API

const { Title } = Typography;
const { Option } = Select;

// 路由对照表
const PAGE_ROUTES = {
  '': '首页',
  'about': '关于项目',
  'upload': '上传作品',
  'annotate': '字体标注',
  'gallery': '作品展示',
  'statistics': '字体统计',
  'debug': '图像调试',
  'admin': '后台管理'
};

const CommentSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPagePath, setNewPagePath] = useState('');
  const { isAuthenticated, currentUser } = useAuth();
  // 添加移动端检测状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 添加响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // 检查用户是否为管理员
    if (!isAuthenticated || !currentUser?.isAdmin) {
      message.error('您没有权限访问此页面');
      return;
    }

    fetchSettings();
  }, [isAuthenticated, currentUser]);

  // 获取所有评论设置
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getAllCommentSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('获取评论设置出错:', error);
      message.error('获取评论设置出错');
    } finally {
      setLoading(false);
    }
  };

  // 更新评论设置
  const updateSetting = async (pagePath, field, value) => {
    try {
      const setting = settings.find(s => s.page_path === pagePath) || {};
      const updatedSetting = { ...setting, [field]: value };

      const response = await fetch(`/api/comment-settings/${pagePath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled: updatedSetting.enabled,
          shared_path: updatedSetting.shared_path
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(settings.map(s => s.page_path === pagePath ? data : s));
        message.success('更新成功');
        
        // 清除相关页面的缓存 - 修复：确保所有页面都能收到更新通知
        window.dispatchEvent(new CustomEvent('commentSettingsUpdated', { detail: { pagePath } }));
        
        // 如果是共享路径更新，通知所有使用相同共享路径的页面
        if (field === 'shared_path') {
          // 通知所有页面重新加载设置
          window.dispatchEvent(new CustomEvent('commentSettingsUpdated', { detail: { pagePath: 'all' } }));
        }
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      console.error('更新评论设置出错:', error);
      message.error('更新评论设置出错');
    }
  };

  // 添加新页面设置
  const addPageSetting = async () => {
    if (!newPagePath) {
      message.warning('请选择页面路径');
      return;
    }

    try {
      const response = await fetch(`/api/comment-settings/${newPagePath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          enabled: false,
          shared_path: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings([...settings, data]);
        setNewPagePath('');
        message.success('添加成功');
        
        // 清除相关页面的缓存
        window.dispatchEvent(new CustomEvent('commentSettingsUpdated', { detail: { pagePath: newPagePath } }));
      } else {
        message.error('添加失败');
      }
    } catch (error) {
      console.error('添加评论设置出错:', error);
      message.error('添加评论设置出错');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '页面',
      dataIndex: 'page_path',
      key: 'page_path',
      render: (path) => PAGE_ROUTES[path] || path
    },
    {
      title: '启用评论',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => updateSetting(record.page_path, 'enabled', checked)}
          size={isMobile ? "small" : "default"}
        />
      )
    },
    {
      title: '共享评论区',
      dataIndex: 'shared_path',
      key: 'shared_path',
      render: (sharedPath, record) => (
        <Input
          placeholder="留空表示不共享"
          value={sharedPath}
          onChange={(e) => updateSetting(record.page_path, 'shared_path', e.target.value)}
          style={{ width: isMobile ? '120px' : '200px' }}
          size={isMobile ? "small" : "default"}
        />
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date) => new Date(date).toLocaleString()
    }
  ];

  // 计算可添加的页面路径
  const availablePaths = Object.keys(PAGE_ROUTES).filter(
    path => !settings.some(s => s.page_path === path)
  );

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Title level={isMobile ? 3 : 2} style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '16px' : '24px',
        fontSize: isMobile ? '24px' : '30px'
      }}>
        评论设置管理
      </Title>
      
      <Card 
        title="添加页面评论设置" 
        style={{ 
          marginBottom: isMobile ? '16px' : '20px',
          padding: isMobile ? '12px' : '16px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '10px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Select
            placeholder="选择页面路径"
            value={newPagePath}
            onChange={setNewPagePath}
            style={{ 
              width: isMobile ? '100%' : '200px'
            }}
            size={isMobile ? "middle" : "default"}
          >
            {availablePaths.map(path => (
              <Option key={path} value={path}>{PAGE_ROUTES[path] || path}</Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            onClick={addPageSetting}
            size={isMobile ? "middle" : "default"}
            style={{ 
              padding: isMobile ? '0 20px' : '0 40px',
              fontSize: isMobile ? '14px' : '16px',
              height: isMobile ? '36px' : '40px'
            }}
          >
            添加
          </Button>
        </div>
      </Card>
      
      <Card 
        title="评论设置列表"
        style={{ 
          padding: isMobile ? '12px' : '16px'
        }}
      >
        <Table
          dataSource={settings}
          columns={columns}
          rowKey="page_path"
          loading={loading}
          pagination={false}
          scroll={isMobile ? { x: 600 } : undefined}
          size={isMobile ? "small" : "default"}
        />
      </Card>
      
      <Card 
        title="使用说明" 
        style={{ 
          marginTop: isMobile ? '16px' : '20px',
          padding: isMobile ? '12px' : '16px'
        }}
      >
        <ul style={{ 
          paddingLeft: isMobile ? '16px' : '20px',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          <li>在上方表格中可以控制每个页面是否显示评论区</li>
          <li>默认情况下，首页和关于页面已启用评论</li>
          <li>共享评论区：多个页面共用一个评论区，在此处填写相同的名称即可</li>
          <li>如果共享评论区留空，则该页面使用自己的独立评论区</li>
          <li>注：为了节省云端资源，评论设置已启用本地缓存机制，更新设置后会自动刷新缓存</li>
        </ul>
      </Card>
    </div>
  );
};

export default CommentSettingsPage;