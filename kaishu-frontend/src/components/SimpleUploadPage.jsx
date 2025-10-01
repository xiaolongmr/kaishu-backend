import React, { useState, useEffect } from 'react';
import { 
  Card, Input, Button, Upload, message, Typography, Form, 
  Tag, Select, Space, Row, Col, Divider 
} from 'antd';
import { 
  UploadOutlined, FileImageOutlined, CheckCircleOutlined, 
  PlusOutlined, DeleteOutlined 
} from '@ant-design/icons';
import { useAuth } from './AuthContext';
import TwikooComment from './TwikooComment';
import useCommentSettings from './useCommentSettings';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SimpleUploadPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { commentSettings } = useCommentSettings('upload');
  
  // 基础状态
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // 作品信息
  const [description, setDescription] = useState('');
  const [workAuthor, setWorkAuthor] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [groupName, setGroupName] = useState('');
  
  // 数据集成
  const [existingGroups, setExistingGroups] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  
  // 响应式
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 获取网站数据
  useEffect(() => {
    if (isAuthenticated) {
      fetchSiteData();
    }
  }, [isAuthenticated]);
  
  const fetchSiteData = async () => {
    try {
      // 获取现有分组
      const groupsResponse = await fetch('/api/groups');
      const groupsData = await groupsResponse.json();
      const groups = groupsData.groups || [];
      setExistingGroups(groups);
      
      // 获取作品数据用于标签统计
      const worksResponse = await fetch('/api/works');
      const works = await worksResponse.json();
      
      // 获取热门标签
      const allTags = works.flatMap(work => {
        try {
          return Array.isArray(work.tags) ? work.tags : JSON.parse(work.tags || '[]');
        } catch {
          return [];
        }
      });
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      const popular = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tag]) => tag);
      setPopularTags(popular);
    } catch (error) {
      console.error('获取网站数据失败:', error);
    }
  };
  
  // 文件处理
  const handleFileChange = (info) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setFile(selectedFile);
      
      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setFilePreview(null);
    }
    
    // 重置上传状态
    setUploadSuccess(false);
    setUploadedFile(null);
  };
  
  // 标签管理
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const addPopularTag = (tag) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };
  
  // 上传处理
  const handleUpload = async () => {
    if (!file) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    if (!isAuthenticated) {
      message.error('请先登录');
      return;
    }
    
    const formData = new FormData();
    formData.append('calligraphy', file);
    formData.append('description', description);
    formData.append('workAuthor', workAuthor);
    formData.append('tags', JSON.stringify(tags));
    formData.append('groupName', groupName);
    
    try {
      setUploading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }
      
      const result = await response.json();
      setUploadedFile(result);
      setUploadSuccess(true);
      message.success('作品上传成功！');
      
      // 重置表单
      setFile(null);
      setFilePreview(null);
      setDescription('');
      setWorkAuthor('');
      setTags([]);
      setGroupName('');
      
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // 检查认证
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <FileImageOutlined style={{ fontSize: '64px', color: '#ccc', marginBottom: '16px' }} />
            <Title level={3}>请先登录</Title>
            <Text type="secondary">您需要登录后才能上传书法作品</Text>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="上传书法作品" size={isMobile ? 'small' : 'default'}>
            {uploadSuccess ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: '16px' }} />
                <Title level={3}>上传成功！</Title>
                <Text type="secondary">您的作品已成功上传到楷书库</Text>
                <div style={{ marginTop: '24px' }}>
                  <Button type="primary" onClick={() => setUploadSuccess(false)}>
                    继续上传
                  </Button>
                </div>
              </div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* 文件上传区域 */}
                <div>
                  <Title level={4}>选择文件</Title>
                  <Upload.Dragger
                    name="file"
                    multiple={false}
                    accept="image/*"
                    beforeUpload={() => false}
                    onChange={handleFileChange}
                    showUploadList={false}
                    style={{ marginBottom: '16px' }}
                  >
                    {filePreview ? (
                      <div style={{ padding: '20px' }}>
                        <img 
                          src={filePreview} 
                          alt="预览" 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: '200px', 
                            objectFit: 'contain' 
                          }} 
                        />
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">{file?.name}</Text>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '40px 0' }}>
                        <UploadOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                        <div style={{ marginTop: '16px' }}>
                          <Text>点击或拖拽文件到此区域上传</Text>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">支持 JPG、PNG、GIF 等图片格式</Text>
                        </div>
                      </div>
                    )}
                  </Upload.Dragger>
                </div>
                
                {/* 作品信息 */}
                <div>
                  <Title level={4}>作品信息</Title>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <div>
                      <Text strong>作品描述</Text>
                      <TextArea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="请输入作品描述（可选）"
                        rows={3}
                        style={{ marginTop: '8px' }}
                      />
                    </div>
                    
                    <div>
                      <Text strong>作品作者</Text>
                      <Input
                        value={workAuthor}
                        onChange={(e) => setWorkAuthor(e.target.value)}
                        placeholder="请输入作品作者（可选）"
                        style={{ marginTop: '8px' }}
                      />
                    </div>
                    
                    <div>
                      <Text strong>分组名称</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Select
                          value={isCreatingNewGroup ? undefined : groupName}
                          onChange={(value) => {
                            if (value === '__create_new__') {
                              setIsCreatingNewGroup(true);
                              setGroupName('');
                            } else {
                              setIsCreatingNewGroup(false);
                              setGroupName(value);
                            }
                          }}
                          placeholder="选择现有分组（可选）"
                          style={{ width: '100%' }}
                          allowClear
                          disabled={isCreatingNewGroup}
                        >
                          {existingGroups.map(group => {
                            const displayName = group.parent_id 
                              ? `${existingGroups.find(p => p.id === group.parent_id)?.name || ''} / ${group.name}`
                              : group.name;
                            return (
                              <Option key={group.id} value={group.name}>
                                {displayName} ({group.work_count || 0}个作品)
                              </Option>
                            );
                          })}
                          <Option value="__create_new__" style={{ borderTop: '1px solid #f0f0f0' }}>
                            <PlusOutlined /> 创建新分组
                          </Option>
                        </Select>
                        
                        {isCreatingNewGroup && (
                          <div style={{ marginTop: '8px' }}>
                            <Input
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              placeholder="输入新分组名称"
                              suffix={
                                <Space>
                                  <Button 
                                    type="text" 
                                    size="small"
                                    onClick={() => {
                                      setIsCreatingNewGroup(false);
                                      setNewGroupName('');
                                    }}
                                  >
                                    取消
                                  </Button>
                                  <Button 
                                    type="primary" 
                                    size="small"
                                    onClick={() => {
                                      if (newGroupName.trim()) {
                                        setGroupName(newGroupName.trim());
                                        setIsCreatingNewGroup(false);
                                        setNewGroupName('');
                                        message.success('新分组将在上传时创建');
                                      }
                                    }}
                                  >
                                    确定
                                  </Button>
                                </Space>
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Text strong>标签</Text>
                      <div style={{ marginTop: '8px' }}>
                        <Space wrap>
                          {tags.map(tag => (
                            <Tag
                              key={tag}
                              closable
                              onClose={() => removeTag(tag)}
                            >
                              {tag}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="输入标签"
                          onPressEnter={addTag}
                          style={{ flex: 1 }}
                        />
                        <Button icon={<PlusOutlined />} onClick={addTag}>
                          添加
                        </Button>
                      </div>
                      {popularTags.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>热门标签：</Text>
                          <div style={{ marginTop: '4px' }}>
                            <Space wrap>
                              {popularTags.map(tag => (
                                <Tag
                                  key={tag}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => addPopularTag(tag)}
                                >
                                  {tag}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        </div>
                      )}
                    </div>
                  </Space>
                </div>
                
                {/* 上传按钮 */}
                <div style={{ textAlign: 'center', paddingTop: '16px' }}>
                  <Button
                    type="primary"
                    size="large"
                    loading={uploading}
                    onClick={handleUpload}
                    disabled={!file}
                    icon={<UploadOutlined />}
                  >
                    {uploading ? '上传中...' : '上传作品'}
                  </Button>
                </div>
              </Space>
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="使用说明" size={isMobile ? 'small' : 'default'}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Title level={5}>📝 上传步骤</Title>
                <ol style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>选择书法作品图片文件</li>
                  <li>填写作品信息（可选）</li>
                  <li>点击上传按钮</li>
                  <li>上传完成后可前往字体标注页面进行标注</li>
                </ol>
              </div>
              
              <Divider />
              
              <div>
                <Title level={5}>🎯 下一步操作</Title>
                <Text type="secondary">
                  上传完成后，您可以前往字体标注页面对作品进行字符标注，
                  系统支持OCR自动识别和手动标注两种方式。
                </Text>
              </div>
              
              <Divider />
              
              <div>
                <Title level={5}>💡 温馨提示</Title>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  <li>建议上传清晰的书法作品图片</li>
                  <li>支持JPG、PNG、GIF等常见图片格式</li>
                  <li>添加标签有助于后续搜索和管理</li>
                  <li>分组功能可以帮您更好地组织作品</li>
                </ul>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
      
      {/* 评论区域 */}
      {commentSettings?.enabled && (
        <div style={{ marginTop: '24px' }}>
          <Card title="评论区">
            <TwikooComment pagePath="upload" />
          </Card>
        </div>
      )}
    </div>
  );
};

export default SimpleUploadPage;