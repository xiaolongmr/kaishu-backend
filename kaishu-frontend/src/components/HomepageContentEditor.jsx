import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  message, 
  Tabs, 
  Table, 
  Popconfirm, 
  Space, 
  Select,
  Collapse,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  EditOutlined, 
  UndoOutlined,
  UploadOutlined, 
  FontSizeOutlined, 
  ScissorOutlined, 
  SearchOutlined,
  PictureOutlined,
  FileImageOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Option } = Select;

const HomepageContentEditor = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
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
  
  // 图标映射
  const iconMap = {
    UploadOutlined: <UploadOutlined />,
    FontSizeOutlined: <FontSizeOutlined />,
    ScissorOutlined: <ScissorOutlined />,
    SearchOutlined: <SearchOutlined />,
    PictureOutlined: <PictureOutlined />,
    FileImageOutlined: <FileImageOutlined />,
    ArrowRightOutlined: <ArrowRightOutlined />
  };

  useEffect(() => {
    fetchHomepageContents();
  }, []);

  const fetchHomepageContents = async () => {
    if (!isAuthenticated || !currentUser?.isAdmin) {
      message.error('您需要管理员权限访问此功能');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/homepage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取数据失败');
      }

      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error('获取首页内容失败:', error);
      message.error('获取首页内容失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, values) => {
    if (!isAuthenticated || !currentUser?.isAdmin) {
      message.error('您需要管理员权限进行此操作');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/homepage/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      const updatedItem = await response.json();
      
      // 更新本地状态
      setContents(prev => 
        prev.map(item => 
          item.content_key === key ? updatedItem : item
        )
      );
      
      message.success('内容已更新');
      setEditingKey('');
    } catch (error) {
      console.error('更新内容失败:', error);
      message.error('更新内容失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const isEditing = (record) => record.content_key === editingKey;
  
  const edit = (record) => {
    form.setFieldsValue({
      content_value: record.content_value,
      content_type: record.content_type,
    });
    setEditingKey(record.content_key);
  };
  
  const cancel = () => {
    setEditingKey('');
  };
  
  const save = async (key) => {
    try {
      const row = await form.validateFields();
      await handleSave(key, row);
    } catch (errInfo) {
      console.log('验证失败:', errInfo);
    }
  };
  
  // 过滤和组织内容
  const heroContents = contents.filter(item => item.content_key.startsWith('hero_'));
  const featureTitles = contents.filter(item => item.content_key.startsWith('feature_section_'));
  const features = [];
  
  // 整理特性数据
  for (let i = 1; i <= 6; i++) {
    const featureItems = contents.filter(item => item.content_key.startsWith(`feature_${i}_`));
    if (featureItems.length > 0) {
      const feature = {
        id: i,
        title: featureItems.find(item => item.content_key === `feature_${i}_title`)?.content_value || '',
        description: featureItems.find(item => item.content_key === `feature_${i}_description`)?.content_value || '',
        icon: featureItems.find(item => item.content_key === `feature_${i}_icon`)?.content_value || 'UploadOutlined',
        color: featureItems.find(item => item.content_key === `feature_${i}_color`)?.content_value || '#1890ff'
      };
      features.push(feature);
    }
  }
  
  // 整理效果图数据
  const galleryTitles = contents.filter(item => item.content_key.startsWith('gallery_section_'));
  const galleryItems = [];
  
  for (let i = 1; i <= 4; i++) {
    const items = contents.filter(item => item.content_key.startsWith(`gallery_${i}_`));
    if (items.length > 0) {
      const item = {
        id: i,
        title: items.find(item => item.content_key === `gallery_${i}_title`)?.content_value || '',
        description: items.find(item => item.content_key === `gallery_${i}_description`)?.content_value || '',
        imageUrl: items.find(item => item.content_key === `gallery_${i}_image`)?.content_value || '/kaishu-icon.png'
      };
      galleryItems.push(item);
    }
  }

  // 定义表格列
  const columns = [
    {
      title: '内容键名',
      dataIndex: 'content_key',
      key: 'content_key',
      width: isMobile ? '30%' : '25%',
      render: (text) => {
        // 将键名转换为更可读的格式
        const parts = text.split('_');
        let readableText = parts.map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
        
        // 特殊处理数字
        readableText = readableText.replace(/(\d+)/, ' $1 ');
        
        return <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>{readableText}</Text>;
      }
    },
    {
      title: '内容',
      dataIndex: 'content_value',
      key: 'content_value',
      width: isMobile ? '40%' : '45%',
      editable: true,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="content_value"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '内容不能为空' }]}
            >
              {record.content_type === 'color' ? (
                <Input type="color" style={{ width: '100%' }} />
              ) : record.content_type === 'icon' ? (
                <Select style={{ width: '100%' }} size={isMobile ? "small" : "default"}>
                  <Option value="UploadOutlined">上传图标</Option>
                  <Option value="FontSizeOutlined">字体图标</Option>
                  <Option value="ScissorOutlined">裁剪图标</Option>
                  <Option value="SearchOutlined">搜索图标</Option>
                  <Option value="PictureOutlined">图片图标</Option>
                  <Option value="FileImageOutlined">文件图标</Option>
                  <Option value="ArrowRightOutlined">箭头图标</Option>
                </Select>
              ) : record.content_value.length > 50 ? (
                <TextArea rows={isMobile ? 3 : 4} />
              ) : (
                <Input />
              )}
            </Form.Item>
          );
        }
        
        if (record.content_type === 'color') {
          return (
            <div>
              <div 
                style={{ 
                  width: isMobile ? 16 : 20, 
                  height: isMobile ? 16 : 20, 
                  backgroundColor: text, 
                  display: 'inline-block',
                  marginRight: 8,
                  border: '1px solid #d9d9d9',
                  borderRadius: 4
                }} 
              />
              <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</span>
            </div>
          );
        }
        
        if (record.content_type === 'icon') {
          return (
            <Space>
              <span style={{ fontSize: isMobile ? '16px' : '20px' }}>
                {iconMap[text] || text}
              </span>
              <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</span>
            </Space>
          );
        }
        
        return <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</span>;
      }
    },
    {
      title: '类型',
      dataIndex: 'content_type',
      key: 'content_type',
      width: isMobile ? '15%' : '15%',
      editable: true,
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.Item
              name="content_type"
              style={{ margin: 0 }}
              rules={[{ required: true, message: '类型不能为空' }]}
            >
              <Select size={isMobile ? "small" : "default"}>
                <Option value="text">文本</Option>
                <Option value="color">颜色</Option>
                <Option value="icon">图标</Option>
                <Option value="image">图片</Option>
              </Select>
            </Form.Item>
          );
        }
        return <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{text}</span>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: isMobile ? '15%' : '15%',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="primary"
              onClick={() => save(record.content_key)}
              loading={saving}
              icon={<SaveOutlined />}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 8px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {isMobile ? '' : '保存'}
            </Button>
            <Popconfirm
              title="确定取消吗？"
              onConfirm={cancel}
            >
              <Button 
                icon={<UndoOutlined />} 
                size={isMobile ? "small" : "default"}
                style={{ 
                  padding: isMobile ? '0 8px' : '0 15px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {isMobile ? '' : '取消'}
              </Button>
            </Popconfirm>
          </Space>
        ) : (
          <Button
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            icon={<EditOutlined />}
            size={isMobile ? "small" : "default"}
            style={{ 
              padding: isMobile ? '0 8px' : '0 15px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            {isMobile ? '' : '编辑'}
          </Button>
        );
      },
    },
  ];
  
  const mergedColumns = columns.map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'content_type' ? 'select' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // 预览组件
  const ContentPreview = () => (
    <div className="modern-dark-theme" style={{ 
      padding: isMobile ? '12px' : '20px', 
      borderRadius: 8, 
      overflow: 'hidden' 
    }}>
      {/* 英雄区块预览 */}
      <section style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <Title level={isMobile ? 4 : 3} style={{ 
          marginBottom: isMobile ? '12px' : '16px',
          fontSize: isMobile ? '18px' : '20px'
        }}>
          首页大标题
        </Title>
        <div style={{ 
          background: '#1a1a1a', 
          padding: isMobile ? '12px' : '24px', 
          borderRadius: 8 
        }}>
          <Title 
            style={{ 
              background: 'linear-gradient(90deg, #1890ff, #9c27b0)', 
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: isMobile ? '12px' : '16px',
              fontSize: isMobile ? '20px' : '32px'
            }}
          >
            {heroContents.find(item => item.content_key === 'hero_title')?.content_value || '绍楷字库 字体管理工具'}
          </Title>
          <Paragraph style={{ 
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            {heroContents.find(item => item.content_key === 'hero_subtitle')?.content_value || '一个专业的楷书字体管理解决方案...'}
          </Paragraph>
        </div>
      </section>
      
      {/* 特性区块预览 */}
      <section style={{ marginBottom: isMobile ? '20px' : '40px' }}>
        <Title level={isMobile ? 4 : 3} style={{ 
          marginBottom: isMobile ? '12px' : '16px',
          fontSize: isMobile ? '18px' : '20px'
        }}>
          特性区块
        </Title>
        <div style={{ 
          background: '#1a1a1a', 
          padding: isMobile ? '12px' : '24px', 
          borderRadius: 8 
        }}>
          <Title level={isMobile ? 5 : 4} style={{ 
            color: 'white', 
            textAlign: 'center', 
            marginBottom: isMobile ? '12px' : '16px',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            {featureTitles.find(item => item.content_key === 'feature_section_title')?.content_value || '主要特性'}
          </Title>
          <Paragraph style={{ 
            color: 'rgba(255, 255, 255, 0.65)', 
            textAlign: 'center', 
            marginBottom: isMobile ? '16px' : '24px',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            {featureTitles.find(item => item.content_key === 'feature_section_subtitle')?.content_value || '绍楷字库字体管理工具提供全面的功能...'}
          </Paragraph>
          
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {features.slice(0, isMobile ? 2 : 3).map(feature => (
              <Col span={isMobile ? 12 : 8} key={feature.id}>
                <Card 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: isMobile ? 36 : 48, 
                      height: isMobile ? 36 : 48, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                      border: `1px solid ${feature.color}30`,
                      borderRadius: 12
                    }}>
                      <span style={{ fontSize: isMobile ? '16px' : '20px' }}>
                        {iconMap[feature.icon] || <UploadOutlined />}
                      </span>
                    </div>
                    <Title level={isMobile ? 5 : 5} style={{ 
                      color: 'white',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ 
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontSize: isMobile ? '10px' : '12px'
                    }}>
                      {feature.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>
      
      {/* 效果图区块预览 */}
      <section>
        <Title level={isMobile ? 4 : 3} style={{ 
          marginBottom: isMobile ? '12px' : '16px',
          fontSize: isMobile ? '18px' : '20px'
        }}>
          效果展示区块
        </Title>
        <div style={{ 
          background: '#1a1a1a', 
          padding: isMobile ? '12px' : '24px', 
          borderRadius: 8 
        }}>
          <Title level={isMobile ? 5 : 4} style={{ 
            color: 'white', 
            textAlign: 'center', 
            marginBottom: isMobile ? '12px' : '16px',
            fontSize: isMobile ? '16px' : '18px'
          }}>
            {galleryTitles.find(item => item.content_key === 'gallery_section_title')?.content_value || '效果展示'}
          </Title>
          <Paragraph style={{ 
            color: 'rgba(255, 255, 255, 0.65)', 
            textAlign: 'center', 
            marginBottom: isMobile ? '16px' : '24px',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            {galleryTitles.find(item => item.content_key === 'gallery_section_subtitle')?.content_value || '看看绍楷字库字体管理工具的实际使用效果'}
          </Paragraph>
          
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {galleryItems.slice(0, isMobile ? 2 : 4).map(item => (
              <Col span={isMobile ? 12 : 6} key={item.id}>
                <Card 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  cover={
                    <div style={{ 
                      height: isMobile ? 80 : 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%', 
                          objectFit: 'contain' 
                        }}
                      />
                    </div>
                  }
                >
                  <Card.Meta
                    title={<span style={{ 
                      color: 'white',
                      fontSize: isMobile ? '12px' : '14px'
                    }}>
                      {item.title}
                    </span>}
                    description={<span style={{ 
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontSize: isMobile ? '10px' : '12px'
                    }}>
                      {item.description}
                    </span>}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>
    </div>
  );

  if (!isAuthenticated || !currentUser?.isAdmin) {
    return (
      <Card>
        <div style={{ padding: isMobile ? '20px' : '40px', textAlign: 'center' }}>
          <Title level={isMobile ? 4 : 3} style={{ marginBottom: isMobile ? '16px' : '24px' }}>
            无权访问
          </Title>
          <Paragraph style={{ marginBottom: isMobile ? '20px' : '32px', fontSize: isMobile ? '14px' : '16px' }}>
            您需要管理员权限才能访问此页面
          </Paragraph>
          <Button 
            type="primary" 
            onClick={() => window.history.back()}
            size={isMobile ? "middle" : "large"}
          >
            返回
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Card
        title={
          <Space size={isMobile ? "small" : "middle"}>
            <Title level={isMobile ? 4 : 3} style={{ 
              marginBottom: 0,
              fontSize: isMobile ? '18px' : '20px'
            }}>
              首页内容管理
            </Title>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={fetchHomepageContents} 
              loading={loading}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 12px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {isMobile ? '' : '刷新'}
            </Button>
            <Button 
              onClick={() => setPreviewMode(!previewMode)} 
              type={previewMode ? 'primary' : 'default'}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 12px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {previewMode ? (isMobile ? '编辑' : '返回编辑') : (isMobile ? '预览' : '预览效果')}
            </Button>
          </Space>
        }
        style={{ 
          padding: isMobile ? '12px' : '16px'
        }}
      >
        {previewMode ? (
          <ContentPreview />
        ) : (
          <Tabs defaultActiveKey="hero" size={isMobile ? "small" : "default"}>
            <TabPane tab="首页大标题" key="hero">
              <Form form={form} component={false}>
                <Table
                  components={{
                    body: {
                      cell: EditableCell,
                    },
                  }}
                  bordered
                  dataSource={heroContents}
                  columns={mergedColumns}
                  rowClassName="editable-row"
                  pagination={false}
                  rowKey="content_key"
                  loading={loading}
                  scroll={isMobile ? { x: 600 } : undefined}
                  size={isMobile ? "small" : "default"}
                />
              </Form>
            </TabPane>
            
            <TabPane tab="特性区块" key="features">
              <Collapse defaultActiveKey={['section', 'feature1']} size={isMobile ? "small" : "default"}>
                <Panel header="区块标题" key="section">
                  <Form form={form} component={false}>
                    <Table
                      components={{
                        body: {
                          cell: EditableCell,
                        },
                      }}
                      bordered
                      dataSource={featureTitles}
                      columns={mergedColumns}
                      rowClassName="editable-row"
                      pagination={false}
                      rowKey="content_key"
                      loading={loading}
                      scroll={isMobile ? { x: 600 } : undefined}
                      size={isMobile ? "small" : "default"}
                    />
                  </Form>
                </Panel>
                
                {features.map((feature, index) => (
                  <Panel header={`特性 ${index + 1}: ${feature.title}`} key={`feature${index + 1}`}>
                    <Form form={form} component={false}>
                      <Table
                        components={{
                          body: {
                            cell: EditableCell,
                          },
                        }}
                        bordered
                        dataSource={contents.filter(item => item.content_key.startsWith(`feature_${index + 1}_`))}
                        columns={mergedColumns}
                        rowClassName="editable-row"
                        pagination={false}
                        rowKey="content_key"
                        loading={loading}
                        scroll={isMobile ? { x: 600 } : undefined}
                        size={isMobile ? "small" : "default"}
                      />
                    </Form>
                  </Panel>
                ))}
              </Collapse>
            </TabPane>
            
            <TabPane tab="效果展示" key="gallery">
              <Collapse defaultActiveKey={['section', 'gallery1']} size={isMobile ? "small" : "default"}>
                <Panel header="区块标题" key="section">
                  <Form form={form} component={false}>
                    <Table
                      components={{
                        body: {
                          cell: EditableCell,
                        },
                      }}
                      bordered
                      dataSource={galleryTitles}
                      columns={mergedColumns}
                      rowClassName="editable-row"
                      pagination={false}
                      rowKey="content_key"
                      loading={loading}
                      scroll={isMobile ? { x: 600 } : undefined}
                      size={isMobile ? "small" : "default"}
                    />
                  </Form>
                </Panel>
                
                {galleryItems.map((item, index) => (
                  <Panel header={`展示项 ${index + 1}: ${item.title}`} key={`gallery${index + 1}`}>
                    <Form form={form} component={false}>
                      <Table
                        components={{
                          body: {
                            cell: EditableCell,
                          },
                        }}
                        bordered
                        dataSource={contents.filter(item => item.content_key.startsWith(`gallery_${index + 1}_`))}
                        columns={mergedColumns}
                        rowClassName="editable-row"
                        pagination={false}
                        rowKey="content_key"
                        loading={loading}
                        scroll={isMobile ? { x: 600 } : undefined}
                        size={isMobile ? "small" : "default"}
                      />
                    </Form>
                  </Panel>
                ))}
              </Collapse>
            </TabPane>
            
            <TabPane tab="所有内容" key="all">
              <Form form={form} component={false}>
                <Table
                  components={{
                    body: {
                      cell: EditableCell,
                    },
                  }}
                  bordered
                  dataSource={contents}
                  columns={mergedColumns}
                  rowClassName="editable-row"
                  pagination={{ pageSize: isMobile ? 5 : 10 }}
                  rowKey="content_key"
                  loading={loading}
                  scroll={isMobile ? { x: 800 } : undefined}
                  size={isMobile ? "small" : "default"}
                />
              </Form>
            </TabPane>
          </Tabs>
        )}
      </Card>
    </div>
  );
};

// 可编辑单元格组件
const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === 'select' ? <Select size="small" /> : <Input size="small" />;
  
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `请输入 ${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

export default HomepageContentEditor;