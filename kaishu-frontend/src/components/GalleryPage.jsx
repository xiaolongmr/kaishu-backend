import React, { useState, useEffect } from 'react';
import { 
  Layout, Tree, Breadcrumb, Button, Input, Space, Card, List, Image, 
  Typography, Spin, Empty, Tooltip, Row, Col, Modal, Form, message, 
  Badge, Divider, Dropdown, Menu, Splitter
} from 'antd';
import {
  FolderOutlined, FolderOpenOutlined, FileImageOutlined, 
  SearchOutlined, ReloadOutlined, UpOutlined, HomeOutlined,
  AppstoreOutlined, UnorderedListOutlined, MoreOutlined,
  EditOutlined, DeleteOutlined, ScissorOutlined, EyeOutlined,
  PlusOutlined, ArrowLeftOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import TwikooComment from './TwikooComment';
import useCommentSettings from './useCommentSettings';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const GalleryPage = () => {
  // 基础状态
  const [works, setWorks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { commentSettings } = useCommentSettings('gallery');
  
  // 资源管理器状态
  const [currentPath, setCurrentPath] = useState([{ key: 'root', title: '根目录' }]);
  const [selectedKeys, setSelectedKeys] = useState(['root']);
  const [expandedKeys, setExpandedKeys] = useState(['root']);
  const [viewType, setViewType] = useState('grid'); // 'grid' | 'list'
  const [searchText, setSearchText] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [form] = Form.useForm();
  
  // 响应式
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [siderCollapsed, setSiderCollapsed] = useState(window.innerWidth < 768);

  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSiderCollapsed(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 数据获取
  useEffect(() => {
    fetchWorks();
    fetchGroups();
  }, []);

  // 获取作品数据
  const fetchWorks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/works');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.error) {
        console.error('API错误:', data);
        message.error(`${data.error}${data.details ? ': ' + data.details : ''}`);
        setWorks([]);
        return;
      }
      
      if (data.works && Array.isArray(data.works)) {
        console.log('✓ 成功获取作品数据:', data.works.length, '个作品');
        setWorks(data.works);
      } else if (Array.isArray(data)) {
        console.log('✓ 成功获取作品数据(旧格式):', data.length, '个作品');
        setWorks(data);
      } else {
        console.error('API返回的数据格式不正确:', data);
        setWorks([]);
      }
    } catch (error) {
      console.error('获取作品列表失败:', error);
      setWorks([]);
      message.error('获取作品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取分组数据
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('获取分组列表失败:', error);
    }
  };

  // 构建文件夹树数据
  const buildTreeData = () => {
    const rootNode = {
      title: '根目录',
      key: 'root',
      icon: <HomeOutlined />,
      children: []
    };

    // 添加分组作为文件夹
    groups.forEach(group => {
      const workCount = works.filter(work => work.group_name === group.name).length;
      rootNode.children.push({
        title: `${group.name} (${workCount})`,
        key: `group-${group.id}`,
        icon: <FolderOutlined />,
        isLeaf: true,
        groupData: group
      });
    });

    // 添加未分组作品文件夹
    const ungroupedCount = works.filter(work => !work.group_name || work.group_name === '' || work.group_name === null).length;
    if (ungroupedCount > 0) {
      rootNode.children.push({
        title: `未分组 (${ungroupedCount})`,
        key: 'ungrouped',
        icon: <FolderOutlined />,
        isLeaf: true
      });
    }

    return [rootNode];
  };

  // 获取当前路径的作品
  const getCurrentWorks = () => {
    const currentKey = selectedKeys[0];
    
    if (currentKey === 'root') {
      return works;
    } else if (currentKey === 'ungrouped') {
      return works.filter(work => !work.group_name || work.group_name === '' || work.group_name === null);
    } else if (currentKey.startsWith('group-')) {
      const groupId = currentKey.replace('group-', '');
      const group = groups.find(g => g.id.toString() === groupId);
      return group ? works.filter(work => work.group_name === group.name) : [];
    }
    
    return [];
  };

  // 过滤搜索结果
  const getFilteredWorks = () => {
    const currentWorks = getCurrentWorks();
    if (!searchText) return currentWorks;
    
    return currentWorks.filter(work => {
      const filename = work.original_filename || work.filename || '';
      const author = work.work_author || '';
      return filename.toLowerCase().includes(searchText.toLowerCase()) ||
             author.toLowerCase().includes(searchText.toLowerCase());
    });
  };

  // 处理文件夹选择
  const handleFolderSelect = (selectedKeys, info) => {
    setSelectedKeys(selectedKeys);
    
    // 更新面包屑路径
    const key = selectedKeys[0];
    if (key === 'root') {
      setCurrentPath([{ key: 'root', title: '根目录' }]);
    } else if (key === 'ungrouped') {
      setCurrentPath([
        { key: 'root', title: '根目录' },
        { key: 'ungrouped', title: '未分组' }
      ]);
    } else if (key.startsWith('group-')) {
      const groupId = key.replace('group-', '');
      const group = groups.find(g => g.id.toString() === groupId);
      if (group) {
        setCurrentPath([
          { key: 'root', title: '根目录' },
          { key: key, title: group.name }
        ]);
      }
    }
  };

  // 处理作品选择
  const handleWorkSelect = async (work) => {
    setSelectedWork(work);
    try {
      const response = await fetch(`/api/works/${work.id}/annotations`);
      const data = await response.json();
      setAnnotations(data);
    } catch (error) {
      console.error('获取标注信息失败:', error);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: { ...item, type }
    });
  };

  // 关闭右键菜单
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };

  // 创建新文件夹
  const createFolder = () => {
    setModalType('createFolder');
    setModalVisible(true);
    closeContextMenu();
  };

  // 处理模态框提交
  const handleModalSubmit = async (values) => {
    try {
      const token = localStorage.getItem('token');
      
      if (modalType === 'createFolder') {
        const response = await fetch('/api/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: values.name,
            description: values.description || ''
          })
        });
        
        if (response.ok) {
          message.success('文件夹创建成功');
          fetchGroups();
        } else {
          const error = await response.json();
          message.error(error.error || '创建失败');
        }
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };

  // 跳转到标注页面
  const goToAnnotationPage = (workId) => {
    navigate(`/annotate?workId=${workId}`);
  };

  // 工具栏菜单
  const toolbarMenuItems = [
    {
      key: 'refresh',
      icon: <ReloadOutlined />,
      label: '刷新',
      onClick: () => { fetchWorks(); fetchGroups(); }
    },
    {
      key: 'newFolder',
      icon: <PlusOutlined />,
      label: '新建文件夹',
      onClick: createFolder
    }
  ];

  // 右键菜单
  const getContextMenuItems = () => {
    const { item } = contextMenu;
    if (!item) return [];

    if (item.type === 'work') {
      return [
        {
          key: 'view',
          icon: <EyeOutlined />,
          label: '查看详情',
          onClick: () => {
            handleWorkSelect(item);
            closeContextMenu();
          }
        },
        {
          key: 'annotate',
          icon: <ScissorOutlined />,
          label: '标注',
          onClick: () => {
            goToAnnotationPage(item.id);
            closeContextMenu();
          }
        }
      ];
    }

    return [];
  };

  // 渲染作品网格
  const renderWorksGrid = () => {
    const filteredWorks = getFilteredWorks();
    
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large">
            <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
          </Spin>
        </div>
      );
    }

    if (filteredWorks.length === 0) {
      return (
        <Empty 
          description="此文件夹为空" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" icon={<PlusOutlined />} onClick={createFolder}>
            新建文件夹
          </Button>
        </Empty>
      );
    }

    if (viewType === 'grid') {
      return (
        <Row gutter={[16, 16]} style={{ padding: '16px' }}>
          {filteredWorks.map(work => (
            <Col key={work.id} xs={12} sm={8} md={6} lg={4} xl={3}>
              <Card
                hoverable
                size="small"
                style={{ textAlign: 'center' }}
                bodyStyle={{ padding: '8px' }}
                cover={
                  <div style={{ height: '120px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
                    <Image
                      src={`/images/${encodeURIComponent(work.filename)}`}
                      alt={work.original_filename || work.filename}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      preview={false}
                      fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+"
                    />
                  </div>
                }
                onClick={() => handleWorkSelect(work)}
                onContextMenu={(e) => handleContextMenu(e, work, 'work')}
              >
                <Tooltip title={work.original_filename || work.filename}>
                  <Text ellipsis style={{ fontSize: '12px' }}>
                    {(work.original_filename || work.filename || '未知文件').replace(/\.[^/.]+$/, '')}
                  </Text>
                </Tooltip>
                {work.work_author && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    {work.work_author}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      );
    } else {
      return (
        <List
          style={{ padding: '16px' }}
          dataSource={filteredWorks}
          renderItem={work => (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 16px' }}
              onClick={() => handleWorkSelect(work)}
              onContextMenu={(e) => handleContextMenu(e, work, 'work')}
            >
              <List.Item.Meta
                avatar={<FileImageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                title={work.original_filename || work.filename || '未知文件'}
                description={`作者: ${work.work_author || '未知'} | 上传时间: ${new Date(work.upload_time).toLocaleDateString()}`}
              />
            </List.Item>
          )}
        />
      );
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 左侧文件夹树 */}
      <Sider 
        width={280} 
        collapsed={siderCollapsed}
        collapsedWidth={0}
        style={{ 
          backgroundColor: '#fafafa',
          borderRight: '1px solid #e8e8e8'
        }}
      >
        <div style={{ padding: '16px 8px', borderBottom: '1px solid #e8e8e8' }}>
          <Title level={5} style={{ margin: 0, textAlign: 'center' }}>
            📁 文件夹
          </Title>
        </div>
        <Tree
          showIcon
          selectedKeys={selectedKeys}
          expandedKeys={expandedKeys}
          onSelect={handleFolderSelect}
          onExpand={setExpandedKeys}
          treeData={buildTreeData()}
          style={{ padding: '8px' }}
        />
      </Sider>

      <Layout>
        {/* 顶部工具栏 */}
        <Header style={{ 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #e8e8e8',
          padding: '0 16px',
          height: 'auto',
          lineHeight: 'normal'
        }}>
          <div style={{ padding: '8px 0' }}>
            {/* 导航栏 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  size="small"
                  disabled
                />
                <Button 
                  icon={<ArrowRightOutlined />} 
                  size="small"
                  disabled
                />
                <Button 
                  icon={<UpOutlined />} 
                  size="small"
                  onClick={() => {
                    if (selectedKeys[0] !== 'root') {
                      setSelectedKeys(['root']);
                      setCurrentPath([{ key: 'root', title: '根目录' }]);
                    }
                  }}
                  disabled={selectedKeys[0] === 'root'}
                />
                {!siderCollapsed && isMobile && (
                  <Button 
                    icon={<FolderOutlined />}
                    size="small"
                    onClick={() => setSiderCollapsed(false)}
                  >
                    文件夹
                  </Button>
                )}
              </Space>
              
              <div style={{ flex: 1, margin: '0 16px' }}>
                 <Breadcrumb
                   items={currentPath.map(item => ({
                     key: item.key,
                     title: (
                       <span
                         onClick={() => {
                           if (item.key !== selectedKeys[0]) {
                             setSelectedKeys([item.key]);
                             if (item.key === 'root') {
                               setCurrentPath([{ key: 'root', title: '根目录' }]);
                             }
                           }
                         }}
                         style={{ cursor: 'pointer' }}
                       >
                         {item.title}
                       </span>
                     )
                   }))}
                 />
               </div>

              <Space>
                <Search
                  placeholder="搜索作品..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 200 }}
                  size="small"
                />
                <Space.Compact size="small">
                   <Button 
                     icon={<AppstoreOutlined />}
                     type={viewType === 'grid' ? 'primary' : 'default'}
                     onClick={() => setViewType('grid')}
                   />
                   <Button 
                     icon={<UnorderedListOutlined />}
                     type={viewType === 'list' ? 'primary' : 'default'}
                     onClick={() => setViewType('list')}
                   />
                 </Space.Compact>
                <Dropdown menu={{ items: toolbarMenuItems }} trigger={['click']}>
                   <Button icon={<MoreOutlined />} size="small" />
                 </Dropdown>
              </Space>
            </div>
          </div>
        </Header>

        {/* 主内容区域 */}
        <Content style={{ backgroundColor: '#fff', overflow: 'auto' }}>
          {!selectedWork ? (
            renderWorksGrid()
          ) : (
            // 作品详情视图
            <div style={{ padding: '24px' }}>
              <Card 
                title={`作品详情: ${selectedWork.original_filename ? decodeURIComponent(selectedWork.original_filename) : (selectedWork.filename ? decodeURIComponent(selectedWork.filename) : '未知文件名')}`}
                extra={
                  <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => setSelectedWork(null)}
                  >
                    返回列表
                  </Button>
                }
                style={{ borderRadius: '8px' }}
              >
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <div style={{ textAlign: 'center' }}>
                      <Image
                        src={`/images/${encodeURIComponent(selectedWork.filename)}`}
                        alt={selectedWork.original_filename || selectedWork.filename}
                        style={{ maxWidth: '100%', maxHeight: '500px' }}
                        fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjFGMUYxIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSwgc2Fucy1zZXJpZiIgZmlsbD0iIzk5OTk5OSI+5Zu+54mH5Yqg6L295aSx6LSlPC90ZXh0Pgo8L3N2Zz4="
                      />
                    </div>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div style={{ marginBottom: '20px' }}>
                      <Title level={4}>作品信息</Title>
                      <div style={{ marginTop: '16px' }}>
                        <p><strong>文件名:</strong> {selectedWork.original_filename ? decodeURIComponent(selectedWork.original_filename) : (selectedWork.filename ? decodeURIComponent(selectedWork.filename) : '未知文件名')}</p>
                        <p><strong>上传时间:</strong> {new Date(selectedWork.upload_time).toLocaleString()}</p>
                        <p><strong>作者:</strong> {selectedWork.work_author || '未知'}</p>
                        {selectedWork.group_name && <p><strong>分组:</strong> {selectedWork.group_name}</p>}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                      <Title level={4}>标注字符 ({annotations.length} 个)</Title>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
                        gap: '8px',
                        marginTop: '12px'
                      }}>
                        {annotations.map((annotation, index) => (
                          <Tooltip key={index} title={`字符: ${annotation.character}`}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              border: '1px solid #d9d9d9',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              backgroundColor: '#fafafa'
                            }}>
                              {annotation.character}
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <Button 
                        type="primary" 
                        icon={<EditOutlined />}
                        onClick={() => goToAnnotationPage(selectedWork.id)}
                      >
                        前往标注页面
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
              
              {/* 评论区域 */}
              {commentSettings?.enabled && (
                <Card 
                  title="评论区" 
                  style={{ marginTop: '20px', borderRadius: '8px' }}
                >
                  <TwikooComment 
                    pageId={`gallery-${selectedWork.id}`} 
                    pageTitle={`作品: ${selectedWork.original_filename || selectedWork.filename}`}
                  />
                </Card>
              )}
            </div>
          )}
        </Content>
      </Layout>

      {/* 右键菜单 */}
      {contextMenu.visible && (
        <>
          <div
             style={{
               position: 'fixed',
               top: contextMenu.y,
               left: contextMenu.x,
               zIndex: 1000,
               backgroundColor: 'white',
               border: '1px solid #d9d9d9',
               borderRadius: '6px',
               boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08)',
               minWidth: '120px'
             }}
           >
             <Menu items={getContextMenuItems()} />
           </div>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={closeContextMenu}
          />
        </>
      )}

      {/* 新建文件夹模态框 */}
      <Modal
        title="新建文件夹"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[
              { required: true, message: '请输入文件夹名称' },
              { max: 50, message: '名称不能超过50个字符' }
            ]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入描述（可选）"
              rows={3}
              maxLength={200}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default GalleryPage;