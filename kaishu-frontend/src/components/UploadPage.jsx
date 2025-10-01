import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Upload, message, Alert, Typography, Form, Result, Checkbox, Tag, Select, Radio, Space } from 'antd';
import { UploadOutlined, FileImageOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from './AuthContext';
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook
import OcrCanvasViewer from './OcrCanvasViewer'; // 导入OCR Canvas查看器

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const UploadPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [workAuthor, setWorkAuthor] = useState(''); // 作品作者
  const [tags, setTags] = useState([]); // 标签
  const [newTag, setNewTag] = useState(''); // 新标签输入
  const [groupName, setGroupName] = useState(''); // 分组名
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [enableOCR, setEnableOCR] = useState(true); // 默认启用OCR
  const [ocrSource, setOcrSource] = useState('external'); // OCR来源：只使用百度OCR
  const [ocrResults, setOcrResults] = useState([]); // OCR识别结果
  const [showOcrResults, setShowOcrResults] = useState(false); // 是否显示OCR结果
  const { commentSettings } = useCommentSettings('upload'); // 获取上传作品页面评论设置
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

  const handleFileChange = (info) => {
    if (info.fileList.length > 0) {
      setFile(info.fileList[0].originFileObj);
    } else {
      setFile(null);
    }
    // 重置上传状态
    setUploadSuccess(false);
    setOcrResults([]);
    setShowOcrResults(false);
  };

  // 添加标签
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  // 删除标签
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // 处理OCR结果确认
  const handleConfirmOcrResults = async (confirmedResults) => {
    // 更新OCR结果状态
    if (confirmedResults && confirmedResults.length > 0) {
      setOcrResults(confirmedResults);
    }
    // 继续上传流程
    await submitUpload();
  };

  const submitUpload = async () => {
    if (!file) {
      message.warning('请选择要上传的文件');
      return;
    }

    const formData = new FormData();
    formData.append('calligraphy', file);
    formData.append('description', description);
    formData.append('workAuthor', workAuthor); // 添加作品作者
    formData.append('tags', JSON.stringify(tags)); // 添加标签
    formData.append('groupName', groupName); // 添加分组名
    // 添加OCR选项到表单数据
    formData.append('enableOCR', enableOCR);
    formData.append('ocrSource', ocrSource); // 添加OCR来源

    try {
      setUploading(true);
      
      // 获取认证令牌
      const token = localStorage.getItem('token');
      
      message.info('正在上传作品到云端数据库...');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        // 设置上传成功状态
        setUploadSuccess(true);
        setUploadedFile(result);
        
        // 显示原始文件名（中文），并对文件名进行解码处理
        const displayFilename = result.originalFilename ? 
          decodeURIComponent(result.originalFilename) : 
          (result.filename ? decodeURIComponent(result.filename) : '未知文件名');
        message.success(`作品已成功保存到云端数据库: ${displayFilename}`);
        setFile(null);
        setDescription('');
        setWorkAuthor('');
        setTags([]);
        setGroupName('');
      } else {
        message.error(`上传失败: ${result.error}`);
      }
    } catch (error) {
      message.error(`上传出错: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      message.warning('请选择要上传的文件');
      return;
    }

    // 如果启用了OCR，先显示OCR结果供用户确认
    if (enableOCR) {
      try {
        setUploading(true);
        message.info('正在执行OCR识别...');
        
        // 创建FormData对象用于OCR请求
        const ocrFormData = new FormData();
        ocrFormData.append('calligraphy', file);
        ocrFormData.append('ocrSource', ocrSource); // 添加OCR来源
        
        // 获取认证令牌
        const token = localStorage.getItem('token');
        
        // 调用新的OCR检测API（只检测不上传）
        const ocrResponse = await fetch('/api/ocr/detect', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: ocrFormData,
        });

        if (ocrResponse.ok) {
          const ocrResult = await ocrResponse.json();
          
          // 如果后端返回了OCR结果，使用实际结果
          if (ocrResult.ocrResults && Array.isArray(ocrResult.ocrResults)) {
            setOcrResults(ocrResult.ocrResults);
          } else {
            // 如果没有OCR结果，使用模拟数据
            const mockOcrResults = [
              { id: 1, text: '永', confidence: 95, x: 100, y: 100, width: 50, height: 50 },
              { id: 2, text: '字', confidence: 87, x: 200, y: 100, width: 50, height: 50 },
              { id: 3, text: '八', confidence: 92, x: 300, y: 100, width: 50, height: 50 },
              { id: 4, text: '法', confidence: 89, x: 400, y: 100, width: 50, height: 50 }
            ];
            setOcrResults(mockOcrResults);
          }
          
          setShowOcrResults(true);
          setUploading(false);
        } else {
          throw new Error('OCR请求失败');
        }
      } catch (error) {
        console.error('OCR识别失败:', error);
        message.error('OCR识别失败，将直接上传作品');
        setUploading(false);
        await submitUpload();
      }
    } else {
      // 如果没有启用OCR，直接上传
      await submitUpload();
    }
  };

  // 重新上传
  const handleReUpload = () => {
    setUploadSuccess(false);
    setUploadedFile(null);
    setOcrResults([]);
    setShowOcrResults(false);
  };

  // 去标注页面
  const goToAnnotationPage = () => {
    if (uploadedFile) {
      // 使用React Router导航到标注页面，传递作品ID作为参数
      window.location.href = `/annotate?workId=${uploadedFile.fileId}`;
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: isMobile ? '16px' : '24px' }}>
        <Card>
          <Title level={isMobile ? 3 : 2}>上传作品</Title>
          <Alert
            message="请先登录"
            description="您需要登录后才能上传作品。"
            type="warning"
            showIcon
          />
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Button type="primary" onClick={() => window.location.href = '/login'}>
              前往登录
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Title level={isMobile ? 3 : 2} style={{ textAlign: 'center' }}>
        上传书法作品
      </Title>
      
      {uploadSuccess ? (
        <Card style={{ 
          maxWidth: isMobile ? '100%' : '600px', 
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px'
        }}>
          <Result
            status="success"
            title="作品上传成功!"
            subTitle={
              <>
                <div>文件 "{uploadedFile?.originalFilename ? decodeURIComponent(uploadedFile.originalFilename) : (uploadedFile?.filename ? decodeURIComponent(uploadedFile.filename) : '未知文件名')}" 已成功保存到云端数据库</div>
                {uploadedFile?.fileUrl && (
                  <div style={{ marginTop: '10px' }}>
                    <Text strong>存储位置: </Text>
                    <Text type="secondary">{uploadedFile.storageProvider || '本地存储'}</Text>
                    <br />
                    <Text strong>文件链接: </Text>
                    <a href={uploadedFile.fileUrl} target="_blank" rel="noopener noreferrer">
                      {uploadedFile.fileUrl}
                    </a>
                  </div>
                )}
              </>
            }
            extra={[
              <Button 
                type="primary" 
                key="annotate"
                onClick={goToAnnotationPage}
                size={isMobile ? 'small' : 'default'}
              >
                前往标注页面
              </Button>,
              <Button 
                key="reupload" 
                onClick={handleReUpload}
                size={isMobile ? 'small' : 'default'}
              >
                重新上传
              </Button>
            ]}
          />
        </Card>
      ) : showOcrResults ? (
        <OcrCanvasViewer 
          imageUrl={file ? URL.createObjectURL(file) : ''}
          ocrResults={ocrResults}
          onConfirm={handleConfirmOcrResults}
        />
      ) : (
        <Card style={{ 
          maxWidth: isMobile ? '100%' : '600px', 
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px'
        }}>
          <Form layout="vertical">
            <Form.Item 
              label="选择作品文件" 
              required
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <Upload
                beforeUpload={() => false}
                onChange={handleFileChange}
                fileList={file ? [file] : []}
                accept="image/*"
                multiple={false}
                showUploadList={{
                  showPreviewIcon: false,
                  showRemoveIcon: true
                }}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  size={isMobile ? 'small' : 'default'}
                >
                  {isMobile ? '选择图片' : '选择书法作品图片'}
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                支持 JPG、PNG、JPEG 格式，建议分辨率不低于 1920x1080
              </Text>
            </Form.Item>
            
            <Form.Item 
              label="作品描述" 
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <TextArea
                rows={isMobile ? 3 : 4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入作品描述（可选）"
                style={{ fontSize: isMobile ? '14px' : '16px' }}
              />
            </Form.Item>
            
            <Form.Item 
              label="作品作者" 
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <Input
                value={workAuthor}
                onChange={(e) => setWorkAuthor(e.target.value)}
                placeholder="请输入作品作者（可选）"
                style={{ fontSize: isMobile ? '14px' : '16px' }}
              />
            </Form.Item>
            
            <Form.Item 
              label="作品分组" 
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="请输入分组名称（可选）"
                style={{ fontSize: isMobile ? '14px' : '16px' }}
              />
            </Form.Item>
            
            <Form.Item 
              label="标签" 
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <div style={{ marginBottom: '10px' }}>
                <Space wrap>
                  {tags.map(tag => (
                    <Tag 
                      key={tag} 
                      closable 
                      onClose={() => removeTag(tag)}
                      style={{ fontSize: isMobile ? '12px' : '14px' }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
              <div style={{ display: 'flex' }}>
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="输入标签名称"
                  onPressEnter={addTag}
                  style={{ 
                    flex: 1,
                    fontSize: isMobile ? '14px' : '16px',
                    marginRight: '8px'
                  }}
                />
                <Button 
                  icon={<PlusOutlined />} 
                  onClick={addTag}
                  size={isMobile ? 'small' : 'default'}
                >
                  添加
                </Button>
              </div>
            </Form.Item>
            
            <Form.Item 
              label="OCR设置" 
              style={{ marginBottom: isMobile ? '16px' : '24px' }}
            >
              <div style={{ marginBottom: '10px' }}>
                <Checkbox
                  checked={enableOCR}
                  onChange={(e) => setEnableOCR(e.target.checked)}
                  style={{ fontSize: isMobile ? '14px' : '16px' }}
                >
                  启用OCR自动识别
                </Checkbox>
              </div>
              
              {enableOCR && (
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    OCR识别来源:
                  </Text>
                  <Radio.Group
                    value="external" // 只使用百度OCR
                    disabled // 禁用切换
                    style={{ fontSize: isMobile ? '14px' : '16px' }}
                  >
                    <Radio value="external" style={{ display: 'block', marginBottom: '5px' }}>
                      百度OCR服务
                    </Radio>
                  </Radio.Group>
                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '5px' }}>
                    本地OCR引擎已移除，只支持百度OCR服务
                  </Text>
                </div>
              )}
            </Form.Item>
            
            <Form.Item style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={uploading}
                size={isMobile ? 'small' : 'default'}
                style={{ 
                  padding: isMobile ? '0 20px' : '0 40px',
                  fontSize: isMobile ? '14px' : '16px'
                }}
              >
                {uploading ? '上传中...' : '上传作品'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
      
      {/* 评论区 */}
      {commentSettings?.enabled && (
        <Card 
          title="评论区" 
          style={{ 
            marginTop: '20px',
            maxWidth: isMobile ? '100%' : '800px',
            margin: '20px auto 0',
            padding: isMobile ? '16px' : '24px'
          }}
        >
          <TwikooComment 
            pageId="upload" 
            pageTitle="上传作品页面"
          />
        </Card>
      )}
    </div>
  );
};

export default UploadPage;