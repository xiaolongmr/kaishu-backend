import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Input, Button, Upload, message, Alert, Typography, Form, Result, 
  Checkbox, Tag, Select, Radio, Space, Row, Col, Slider, Switch, Modal,
  List, Avatar, Tooltip, Badge, Collapse, Descriptions, Tabs
} from 'antd';
import { 
  UploadOutlined, FileImageOutlined, CheckCircleOutlined, PlusOutlined,
  DragOutlined, ZoomInOutlined, ZoomOutOutlined, RotateLeftOutlined,
  RotateRightOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  DownloadOutlined, SaveOutlined, ConsoleSqlOutlined, InfoCircleOutlined,
  WarningOutlined, CheckCircleFilled, CloseCircleFilled, LoadingOutlined,
  ScanOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthContext';
import TwikooComment from './TwikooComment';
import useCommentSettings from './useCommentSettings';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const AdvancedUploadPage = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { commentSettings } = useCommentSettings('upload');
  
  // 文件和上传状态
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [workAuthor, setWorkAuthor] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // OCR相关状态
  const [enableOCR, setEnableOCR] = useState(true);
  const [ocrSource, setOcrSource] = useState('external');
  const [ocrResults, setOcrResults] = useState([]);
  const [processedOcrResults, setProcessedOcrResults] = useState([]);
  const [showOcrResults, setShowOcrResults] = useState(false);
  
  // OCR工作流程状态
  const [ocrWorkflowStep, setOcrWorkflowStep] = useState(0); // 0: 上传, 1: OCR识别, 2: 标注确认, 3: 完成
  const [confirmedAnnotations, setConfirmedAnnotations] = useState([]);
  const [currentAnnotationIndex, setCurrentAnnotationIndex] = useState(0);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 1000, height: 1000 });
  
  // 图像处理状态
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isEditingAnnotation, setIsEditingAnnotation] = useState(false);
  
  // UI状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewAnnotation, setPreviewAnnotation] = useState(null);
  
  // 控制台状态
  const [consoleVisible, setConsoleVisible] = useState(false);
  const [ocrLogs, setOcrLogs] = useState([]);
  const [ocrMetrics, setOcrMetrics] = useState({});
  const [ocrDebugInfo, setOcrDebugInfo] = useState({});
  
  // refs
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  
  // 数据集成状态
  const [existingGroups, setExistingGroups] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [userStats, setUserStats] = useState({});
  
  // 响应式处理
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
  
  // 获取网站相关数据
  const fetchSiteData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 获取现有分组
      const groupsResponse = await fetch('/api/works/groups', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setExistingGroups(groupsData.groups || []);
      }
      
      // 获取热门标签
      const tagsResponse = await fetch('/api/works/popular-tags', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setPopularTags(tagsData.tags || []);
      }
      
      // 获取用户统计
      const statsResponse = await fetch('/api/works/user-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData || {});
      }
    } catch (error) {
      console.error('获取网站数据失败:', error);
    }
  };
  
  // OCR标注确认处理函数
  const handleAnnotationConfirm = (annotation, confirmed = true) => {
    if (confirmed) {
      setConfirmedAnnotations([...confirmedAnnotations, {
        ...annotation,
        confirmed: true,
        confirmedAt: new Date().toISOString()
      }]);
    }
    
    // 移动到下一个标注
    if (currentAnnotationIndex < ocrResults.length - 1) {
      setCurrentAnnotationIndex(currentAnnotationIndex + 1);
    } else {
      // 所有标注确认完成
      message.success('所有字符标注确认完成，可以进行上传');
      setOcrWorkflowStep(3); // 进入完成步骤
    }
  };
  
  // 编辑标注
  const handleEditAnnotation = (annotation) => {
    setEditingAnnotation({ ...annotation });
    setShowEditModal(true);
  };
  
  // 保存编辑的标注
  const handleSaveEditedAnnotation = () => {
    if (editingAnnotation) {
      // 更新OCR结果
      const updatedResults = ocrResults.map(item => 
        item.id === editingAnnotation.id ? editingAnnotation : item
      );
      setOcrResults(updatedResults);
      
      // 如果已确认，也更新确认列表
      const updatedConfirmed = confirmedAnnotations.map(item =>
        item.id === editingAnnotation.id ? editingAnnotation : item
      );
      setConfirmedAnnotations(updatedConfirmed);
      
      setShowEditModal(false);
      setEditingAnnotation(null);
      message.success('标注已更新');
    }
  };
  
  // 图片加载处理
  const handleImageLoad = (e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };
  
  // 文件处理
  const handleFileChange = (info) => {
    if (info.fileList.length > 0) {
      const selectedFile = info.fileList[0].originFileObj;
      setFile(selectedFile);
      
      // 生成预览URL
      if (selectedFile) {
        const previewUrl = URL.createObjectURL(selectedFile);
        setFilePreview(previewUrl);
      }
    } else {
      setFile(null);
      setFilePreview(null);
    }
    
    // 重置状态
    setUploadSuccess(false);
    setOcrResults([]);
    setProcessedOcrResults([]);
    setShowOcrResults(false);
    setAnnotations([]);
  };
  
  // 拖拽上传处理
  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFile = files[0];
      if (imageFile.type.startsWith('image/')) {
        setFile(imageFile);
        const previewUrl = URL.createObjectURL(imageFile);
        setFilePreview(previewUrl);
      } else {
        message.error('请上传图片文件');
      }
    }
  };
  
  // 标签处理
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // 图像操作
  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.1, 0.5));
  };
  
  const handleRotateLeft = () => {
    setImageRotation(prev => (prev - 90) % 360);
  };
  
  const handleRotateRight = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };
  
  // OCR处理
  const handleRunOCR = async () => {
    if (!file) {
      message.warning('请先选择要处理的文件');
      return;
    }
    
    try {
      setUploading(true);
      // 清空之前的日志
      setOcrLogs([]);
      setOcrMetrics({});
      setOcrDebugInfo({});
      
      // 添加日志
      const newLogs = [{
        timestamp: new Date().toLocaleTimeString(),
        message: '开始执行OCR识别...',
        type: 'info'
      }];
      setOcrLogs(newLogs);
      
      const formData = new FormData();
      formData.append('calligraphy', file);
      formData.append('enableOCR', 'true');
      formData.append('ocrSource', ocrSource);
      
      const token = localStorage.getItem('token');
      
      // 添加日志
      const updatedLogs = [...newLogs, {
        timestamp: new Date().toLocaleTimeString(),
        message: '正在发送OCR请求...',
        type: 'info'
      }];
      setOcrLogs(updatedLogs);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      console.log('OCR请求响应:', response);
      
      if (response.ok) {
        const result = await response.json();
        console.log('OCR响应数据:', result);
        
        // 添加日志
        const successLogs = [...updatedLogs, {
          timestamp: new Date().toLocaleTimeString(),
          message: `OCR识别完成，识别到 ${result.ocrResults?.length || 0} 个字符`,
          type: 'success'
        }];
        setOcrLogs(successLogs);
        
        // 设置指标
        const totalChars = result.ocrResults?.length || 0;
        const avgConfidence = result.ocrResults?.length ? 
          (result.ocrResults.reduce((sum, item) => sum + item.confidence, 0) / result.ocrResults.length).toFixed(2) : 0;
          
        setOcrMetrics({
          totalCharacters: totalChars,
          confidenceAvg: avgConfidence,
          processingTime: result.processingTime || '未知',
          imageSize: result.imageSize || '未知',
          // 添加更多指标
          highConfidenceChars: result.ocrResults?.filter(item => item.confidence >= 90).length || 0,
          mediumConfidenceChars: result.ocrResults?.filter(item => item.confidence >= 80 && item.confidence < 90).length || 0,
          lowConfidenceChars: result.ocrResults?.filter(item => item.confidence < 80).length || 0
        });
        
        // 设置调试信息
        setOcrDebugInfo({
          apiEndpoint: '/api/upload',
          requestHeaders: {
            'Authorization': token ? 'Bearer ***' + token.substring(token.length - 4) : '未提供'
          },
          requestBody: {
            enableOCR: 'true',
            ocrSource: ocrSource,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          },
          responseStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          responseBody: result,
          // 添加OCR详细结果信息
          ocrDetails: result.ocrResults?.map(item => ({
            text: item.text,
            originalText: item.originalText,
            confidence: item.confidence,
            position: `${item.x}, ${item.y}, ${item.width}x${item.height}`,
            corrected: item.originalText && item.originalText !== item.text
          })) || []
        });
        
        if (result.ocrResults && Array.isArray(result.ocrResults)) {
          setOcrResults(result.ocrResults);
          setProcessedOcrResults(result.ocrResults);
          setAnnotations(result.ocrResults.map(item => ({
            ...item,
            id: item.id,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            text: item.text,
            confidence: item.confidence
          })));
          message.success(`OCR识别完成，识别到 ${result.ocrResults.length} 个字符`);
          
          // 如果有OCR结果，进入标注确认流程
          if (result.ocrResults.length > 0) {
            setOcrWorkflowStep(2); // 进入标注确认步骤
            setCurrentAnnotationIndex(0);
          }
        } else {
          message.warning('未识别到字符');
        }
      } else {
        // 添加错误日志
        const errorLogs = [...updatedLogs, {
          timestamp: new Date().toLocaleTimeString(),
          message: `OCR请求失败: ${response.status} ${response.statusText}`,
          type: 'error'
        }];
        setOcrLogs(errorLogs);
        
        // 尝试获取错误响应体
        let errorText = `${response.status} ${response.statusText}`;
        try {
          const errorResult = await response.json();
          errorText = errorResult.error || errorText;
        } catch (e) {
          // 如果无法解析JSON，使用文本响应
          try {
            errorText = await response.text();
          } catch (e2) {
            // 如果无法获取文本，使用状态信息
          }
        }
        
        // 设置调试信息
        setOcrDebugInfo({
          apiEndpoint: '/api/upload',
          requestHeaders: {
            'Authorization': token ? 'Bearer ***' + token.substring(token.length - 4) : '未提供'
          },
          requestBody: {
            enableOCR: 'true',
            ocrSource: ocrSource,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          },
          responseStatus: response.status,
          responseStatusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`OCR请求失败: ${errorText}`);
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      
      // 添加错误日志
      const errorLogs = [...ocrLogs, {
        timestamp: new Date().toLocaleTimeString(),
        message: `OCR识别失败: ${error.message}`,
        type: 'error'
      }];
      setOcrLogs(errorLogs);
      
      // 设置调试信息
      setOcrDebugInfo(prev => ({
        ...prev,
        error: error.message,
        stack: error.stack
      }));
      
      message.error('OCR识别失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // 标注操作
  const handleAnnotationSelect = (annotation) => {
    setSelectedAnnotation(annotation);
  };
  
  const handleAnnotationEdit = (annotation) => {
    setIsEditingAnnotation(true);
    setSelectedAnnotation(annotation);
  };
  
  const handleAnnotationDelete = (annotationId) => {
    setAnnotations(annotations.filter(ann => ann.id !== annotationId));
    setProcessedOcrResults(processedOcrResults.filter(res => res.id !== annotationId));
  };
  
  const handleAnnotationUpdate = (updatedAnnotation) => {
    setAnnotations(annotations.map(ann => 
      ann.id === updatedAnnotation.id ? updatedAnnotation : ann
    ));
    setProcessedOcrResults(processedOcrResults.map(res => 
      res.id === updatedAnnotation.id ? updatedAnnotation : res
    ));
    setIsEditingAnnotation(false);
    setSelectedAnnotation(null);
  };
  
  const handleAnnotationCancel = () => {
    setIsEditingAnnotation(false);
    setSelectedAnnotation(null);
  };
  
  // 预览处理
  const handlePreviewAnnotation = (annotation) => {
    setPreviewAnnotation(annotation);
    setShowPreviewModal(true);
  };
  
  // 上传处理
  const handleSubmit = async () => {
    if (!file) {
      message.warning('请选择要上传的文件');
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('calligraphy', file);
      formData.append('description', description);
      formData.append('workAuthor', workAuthor);
      formData.append('tags', JSON.stringify(tags));
      formData.append('groupName', groupName);
      formData.append('enableOCR', enableOCR);
      formData.append('ocrSource', ocrSource);
      
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
        setUploadSuccess(true);
        setUploadedFile(result);
        message.success(`作品已成功保存到云端数据库: ${result.originalFilename || result.filename}`);
        
        // 重置表单
        setFile(null);
        setFilePreview(null);
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
  
  // 重新上传
  const handleReUpload = () => {
    setUploadSuccess(false);
    setUploadedFile(null);
    setOcrResults([]);
    setProcessedOcrResults([]);
    setShowOcrResults(false);
    setAnnotations([]);
    setSelectedAnnotation(null);
  };
  
  // 前往标注页面
  const goToAnnotationPage = () => {
    if (uploadedFile) {
      window.location.href = `/annotate?workId=${uploadedFile.fileId}`;
    }
  };
  
  // 如果未认证，显示登录提示
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
  
  // 上传成功页面
  if (uploadSuccess) {
    return (
      <div style={{ padding: isMobile ? '16px' : '24px' }}>
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
                <div>文件 "{uploadedFile?.originalFilename || uploadedFile?.filename}" 已成功保存到云端数据库</div>
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
  }
  
  // 主要上传页面
  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      {/* 页面标题 */}
       <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={isMobile ? 3 : 2}>
           上传书法作品
         </Title>
      </div>
      
      {/* 主要内容区域 */}
       <Row gutter={[16, 16]}>
         {/* 左侧：上传和预览区域 */}
         <Col xs={24} lg={14}>
           <Card>
            {!file ? (
              /* 文件上传区域 */
              <div 
                 style={{ 
                   height: '400px', 
                   display: 'flex', 
                   flexDirection: 'column',
                   justifyContent: 'center',
                   alignItems: 'center',
                   border: '2px dashed #d9d9d9',
                   backgroundColor: '#fafafa'
                 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.backgroundColor = '#f0f8ff';
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  handleDrop(e);
                }}
              >
                <div style={{ textAlign: 'center' }}>
                   <UploadOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                   <Paragraph style={{ textAlign: 'center', marginTop: '16px' }}>
                     拖拽图片到此处或点击下方按钮上传
                   </Paragraph>
                  <Upload
                    beforeUpload={() => false}
                    onChange={handleFileChange}
                    fileList={file ? [file] : []}
                    accept="image/*"
                    multiple={false}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />}>选择图片</Button>
                  </Upload>

                </div>
              </div>
            ) : (
              /* 图片预览和OCR区域 */
              <div>
                <div style={{ 
                  position: 'relative', 
                  textAlign: 'center',
                  marginBottom: '24px'
                }}>
                  <img
                    src={filePreview}
                    alt="预览"
                    style={{
                        maxWidth: '100%',
                        maxHeight: '400px'
                      }}
                    onLoad={handleImageLoad}
                  />
                </div>
                
                {/* OCR操作按钮 */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Space size="large">
                    <Button 
                      type="primary" 
                      icon={<EyeOutlined />}
                      onClick={handleRunOCR}
                      loading={uploading}
                      disabled={!file}
                    >
                      运行OCR识别
                    </Button>
                    <Button 
                      onClick={() => {
                        setFile(null);
                        setFilePreview(null);
                        setOcrResults([]);
                        setOcrWorkflowStep(0);
                      }}
                    >
                       重新选择
                     </Button>
                  </Space>
                </div>
              </div>
            )}
          </Card>
        </Col>
        
        {/* 右侧：OCR设置和结果 */}
         <Col xs={24} lg={10}>
           <Card title="OCR识别设置">
            <Form layout="vertical">
              <Form.Item label="启用OCR识别">
                <Switch 
                  checked={enableOCR} 
                  onChange={setEnableOCR}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    开启后将自动识别图片中的文字并生成标注
                  </Text>
                </div>
              </Form.Item>
              
              {enableOCR && (
                <Form.Item label="识别引擎">
                  <Radio.Group value={ocrSource} onChange={(e) => setOcrSource(e.target.value)}>
                    <Radio value="external">百度OCR（推荐）</Radio>
                    <Radio value="internal">内置引擎</Radio>
                  </Radio.Group>
                </Form.Item>
              )}
            </Form>
          </Card>
          
          {/* 用户统计信息 */}
            {Object.keys(userStats).length > 0 && (
              <Card title="我的统计">
               <Row gutter={[16, 16]}>
                 <Col span={12}>
                   <div style={{ textAlign: 'center', padding: '12px', background: '#f0f8ff', borderRadius: '4px' }}>
                     <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                       {userStats.totalWorks || 0}
                     </div>
                     <div style={{ color: '#666', fontSize: '12px' }}>总作品数</div>
                   </div>
                 </Col>
                 <Col span={12}>
                   <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                     <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                       {userStats.totalAnnotations || 0}
                     </div>
                     <div style={{ color: '#666', fontSize: '12px' }}>总标注数</div>
                   </div>
                 </Col>
               </Row>
             </Card>
           )}
           
           {/* OCR结果统计 */}
            {ocrResults.length > 0 && (
              <Card title="识别结果统计">
               <Row gutter={[16, 16]}>
                 <Col span={12}>
                   <div style={{ textAlign: 'center', padding: '12px', background: '#f0f8ff', borderRadius: '4px' }}>
                     <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                       {ocrResults.length}
                     </div>
                     <div style={{ color: '#666', fontSize: '12px' }}>识别字符数</div>
                   </div>
                 </Col>
                 <Col span={12}>
                   <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '4px' }}>
                     <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                       {confirmedAnnotations.length}
                     </div>
                     <div style={{ color: '#666', fontSize: '12px' }}>已确认字符</div>
                   </div>
                 </Col>
               </Row>
             </Card>
           )}
        </Col>
      </Row>
      
      {/* 调试控制台（可选显示） */}
      {false && (
        <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ConsoleSqlOutlined style={{ marginRight: '8px', color: '#4ec9b0' }} />
              <span style={{ fontWeight: 'bold', color: '#000000ff' }}>OCR调试控制台</span>
            </div>
            <Button 
              size="small" 
              onClick={() => {
                setOcrLogs([]);
                setOcrMetrics({});
                setOcrDebugInfo({});
              }}
              style={{ backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #555555' }}
            >
              清空日志
            </Button>
          </div>
          
          <Tabs 
            defaultActiveKey="1" 
            tabBarStyle={{ 
              borderBottom: '1px solid #3c3c3c',
              marginBottom: '12px'
            }}
            items={[
              {
                key: '1',
                label: (
                  <span>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    识别概览
                  </span>
                ),
                children: (
                  <div style={{ padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                    <Descriptions column={2} size="small" labelStyle={{ color: '#9cdcfe' }} contentStyle={{ color: '#d4d4d4' }}>
                      <Descriptions.Item label="识别字符数">
                        <span style={{ color: '#4ec9b0' }}>{ocrMetrics.totalCharacters || 0}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="平均置信度">
                        <span style={{ color: '#4ec9b0' }}>{ocrMetrics.confidenceAvg || 0}%</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="高置信度字符">
                        <span style={{ color: '#73c991' }}>{ocrMetrics.highConfidenceChars || 0}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="中等置信度字符">
                        <span style={{ color: '#e2c08d' }}>{ocrMetrics.mediumConfidenceChars || 0}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="低置信度字符">
                        <span style={{ color: '#f48771' }}>{ocrMetrics.lowConfidenceChars || 0}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="处理时间">
                        <span style={{ color: '#4ec9b0' }}>{ocrMetrics.processingTime || '未知'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="图像尺寸">
                        <span style={{ color: '#4ec9b0' }}>{ocrMetrics.imageSize || '未知'}</span>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              },
              {
                key: '2',
                label: (
                  <span>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    识别详情
                  </span>
                ),
                children: (
                  <div style={{ padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                    {ocrDebugInfo.ocrDetails && ocrDebugInfo.ocrDetails.length > 0 ? (
                      <List
                        dataSource={ocrDebugInfo.ocrDetails}
                        renderItem={(item, index) => (
                          <List.Item style={{ 
                            backgroundColor: '#1e1e1e', 
                            marginBottom: '8px', 
                            borderRadius: '4px',
                            border: '1px solid #3c3c3c'
                          }}>
                            <List.Item.Meta
                              avatar={
                                <Avatar 
                                  style={{ 
                                    backgroundColor: item.confidence >= 90 ? '#73c991' : 
                                                   item.confidence >= 80 ? '#e2c08d' : '#f48771'
                                  }}
                                >
                                  {item.confidence}%
                                </Avatar>
                              }
                              title={
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <span style={{ color: '#d4d4d4', marginRight: '8px' }}>{item.text}</span>
                                  {item.corrected && (
                                    <span style={{ 
                                      color: '#ce9178', 
                                      fontSize: '12px',
                                      textDecoration: 'line-through'
                                    }}>
                                      ({item.originalText})
                                    </span>
                                  )}
                                  {item.corrected && (
                                    <Tag color="blue" style={{ marginLeft: '8px' }}>已纠正</Tag>
                                  )}
                                </div>
                              }
                              description={
                                <div style={{ color: '#9cdcfe' }}>
                                  <div>位置: {item.position}</div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    ) : (
                      <div style={{ color: '#808080', fontStyle: 'italic', textAlign: 'center' }}>
                        暂无识别详情
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: '3',
                label: (
                  <span>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    请求信息
                  </span>
                ),
                children: (
                  <div style={{ padding: '12px', backgroundColor: '#2d2d2d', borderRadius: '4px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#9cdcfe', marginBottom: '8px' }}>请求信息</div>
                      <div style={{ paddingLeft: '16px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>API端点:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.apiEndpoint || '未知'}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>文件名:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.requestBody?.fileName || '未知'}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>文件大小:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.requestBody?.fileSize || '未知'} 字节</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>文件类型:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.requestBody?.fileType || '未知'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#9cdcfe', marginBottom: '8px' }}>响应信息</div>
                      <div style={{ paddingLeft: '16px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>响应状态:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.responseStatus || '未知'}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>识别字符数:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.responseBody?.ocrResults?.length || 0}</span>
                        </div>
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#d7ba7d' }}>处理时间:</span> 
                          <span style={{ color: '#d4d4d4', marginLeft: '8px' }}>{ocrDebugInfo.responseBody?.processingTime || '未知'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: '4',
                label: (
                  <span>
                    <InfoCircleOutlined style={{ marginRight: '4px' }} />
                    详细日志
                  </span>
                ),
                children: (
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto', 
                    backgroundColor: '#1e1e1e',
                    borderRadius: '4px',
                    padding: '12px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px'
                  }}>
                    {ocrLogs.length > 0 ? (
                      ocrLogs.map((log, index) => (
                        <div key={index} style={{ 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{ 
                            color: '#569cd6',
                            marginRight: '8px',
                            minWidth: '80px'
                          }}>
                            [{log.timestamp}]
                          </span>
                          {log.type === 'error' ? (
                            <CloseCircleFilled style={{ color: '#f48771', marginRight: '8px', marginTop: '3px' }} />
                          ) : log.type === 'success' ? (
                            <CheckCircleFilled style={{ color: '#73c991', marginRight: '8px', marginTop: '3px' }} />
                          ) : log.type === 'warning' ? (
                            <WarningOutlined style={{ color: '#e2c08d', marginRight: '8px', marginTop: '3px' }} />
                          ) : log.type === 'info' ? (
                            <InfoCircleOutlined style={{ color: '#569cd6', marginRight: '8px', marginTop: '3px' }} />
                          ) : log.type === 'loading' ? (
                            <LoadingOutlined style={{ color: '#569cd6', marginRight: '8px', marginTop: '3px' }} />
                          ) : null}
                          <span style={{ 
                            color: log.type === 'error' ? '#f48771' : 
                                  log.type === 'success' ? '#73c991' : 
                                  log.type === 'warning' ? '#e2c08d' : 
                                  log.type === 'info' ? '#569cd6' : 
                                  log.type === 'loading' ? '#569cd6' : '#d4d4d4'
                          }}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#808080', fontStyle: 'italic' }}>暂无日志信息</div>
                    )}
                  </div>
                )
              }
            ]}
          />
        </Card>
      )}
      
      <Row gutter={[16, 16]}>
        {/* 左侧：图像预览和操作区域 */}
        <Col xs={24} lg={14}>
          <Card 
            title="作品预览" 
            extra={
              <Space>
                <Button 
                  icon={<ZoomInOutlined />} 
                  onClick={handleZoomIn}
                  size="small"
                />
                <Text>{Math.round(imageScale * 100)}%</Text>
                <Button 
                  icon={<ZoomOutOutlined />} 
                  onClick={handleZoomOut}
                  size="small"
                />
                <Button 
                  icon={<RotateLeftOutlined />} 
                  onClick={handleRotateLeft}
                  size="small"
                />
                <Button 
                  icon={<RotateRightOutlined />} 
                  onClick={handleRotateRight}
                  size="small"
                />
              </Space>
            }
            style={{ height: '100%' }}
          >
            {/* OCR标注确认界面 */}
            {ocrWorkflowStep === 2 && ocrResults.length > 0 && currentAnnotationIndex < ocrResults.length && (
              <Card title={`字符确认 (${currentAnnotationIndex + 1}/${ocrResults.length})`} style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Text>进度: {currentAnnotationIndex + 1} / {ocrResults.length}</Text>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <div 
                      style={{ 
                        width: `${((currentAnnotationIndex + 1) / ocrResults.length) * 100}%`, 
                        height: '100%', 
                        backgroundColor: '#1890ff', 
                        borderRadius: '4px' 
                      }}
                    />
                  </div>
                </div>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ position: 'relative', textAlign: 'center' }}>
                      <img
                        src={filePreview}
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                        onLoad={handleImageLoad}
                        alt="OCR标注"
                      />
                      {ocrResults[currentAnnotationIndex] && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `${(ocrResults[currentAnnotationIndex].x / imageDimensions.width) * 100}%`,
                            top: `${(ocrResults[currentAnnotationIndex].y / imageDimensions.height) * 100}%`,
                            width: `${(ocrResults[currentAnnotationIndex].width / imageDimensions.width) * 100}%`,
                            height: `${(ocrResults[currentAnnotationIndex].height / imageDimensions.height) * 100}%`,
                            border: '2px solid #ff4d4f',
                            backgroundColor: 'rgba(255, 77, 79, 0.2)',
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                    </div>
                  </Col>
                  
                  <Col span={12}>
                    {ocrResults[currentAnnotationIndex] && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div>
                          <Text strong>识别文字：</Text>
                          <Tag color={ocrResults[currentAnnotationIndex].confidence >= 90 ? 'green' : ocrResults[currentAnnotationIndex].confidence >= 80 ? 'orange' : 'red'}>
                            {ocrResults[currentAnnotationIndex].text}
                          </Tag>
                        </div>
                        
                        <div>
                          <Text strong>置信度：</Text>
                          <Text>{ocrResults[currentAnnotationIndex].confidence.toFixed(2)}%</Text>
                        </div>
                        
                        <div>
                          <Text strong>位置：</Text>
                          <Text>({ocrResults[currentAnnotationIndex].x}, {ocrResults[currentAnnotationIndex].y}) {ocrResults[currentAnnotationIndex].width}×{ocrResults[currentAnnotationIndex].height}</Text>
                        </div>
                        
                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, marginTop: 16 }}>
                          <Space>
                            <Button 
                              type="primary" 
                              icon={<CheckCircleOutlined />}
                              onClick={() => handleAnnotationConfirm(ocrResults[currentAnnotationIndex], true)}
                            >
                              确认正确
                            </Button>
                            
                            <Button 
                              icon={<EditOutlined />}
                              onClick={() => handleEditAnnotation(ocrResults[currentAnnotationIndex])}
                            >
                              编辑
                            </Button>
                            
                            <Button 
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleAnnotationConfirm(ocrResults[currentAnnotationIndex], false)}
                            >
                              跳过
                            </Button>
                          </Space>
                        </div>
                        
                        <div style={{ marginTop: 16 }}>
                          <Button 
                            size="small"
                            disabled={currentAnnotationIndex === 0}
                            onClick={() => setCurrentAnnotationIndex(currentAnnotationIndex - 1)}
                          >
                            上一个
                          </Button>
                          <Button 
                            size="small"
                            style={{ marginLeft: 8 }}
                            disabled={currentAnnotationIndex === ocrResults.length - 1}
                            onClick={() => setCurrentAnnotationIndex(currentAnnotationIndex + 1)}
                          >
                            下一个
                          </Button>
                        </div>
                      </Space>
                    )}
                  </Col>
                </Row>
              </Card>
            )}
            
            {/* 作品信息填写区域 */}
            {ocrWorkflowStep === 3 && (
              <Card title="填写作品信息">
                <Form layout="vertical">
                  <Form.Item label="作品描述">
                    <TextArea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="请描述这幅书法作品的特点、风格、创作背景等..."
                    />
                  </Form.Item>
                  
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="作者">
                        <Input
                          value={workAuthor}
                          onChange={(e) => setWorkAuthor(e.target.value)}
                          placeholder="作者姓名"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                       <Form.Item label="分组">
                         <Select
                           value={groupName}
                           onChange={setGroupName}
                           placeholder="选择或输入分组"
                           showSearch
                           allowClear
                           mode="combobox"
                           style={{ width: '100%' }}
                         >
                           {existingGroups.map(group => (
                             <Option key={group} value={group}>{group}</Option>
                           ))}
                         </Select>
                       </Form.Item>
                     </Col>
                  </Row>
                  
                  <Form.Item label="标签">
                     <div style={{ marginBottom: '8px' }}>
                       {tags.map(tag => (
                         <Tag 
                           key={tag} 
                           closable 
                           onClose={() => setTags(tags.filter(t => t !== tag))}
                           style={{ marginBottom: '4px' }}
                         >
                           {tag}
                         </Tag>
                       ))}
                     </div>
                     
                     {/* 热门标签快速选择 */}
                     {popularTags.length > 0 && (
                       <div style={{ marginBottom: '12px' }}>
                         <Text type="secondary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                           热门标签（点击添加）：
                         </Text>
                         {popularTags.slice(0, 8).map(tag => (
                           <Tag 
                             key={tag}
                             style={{ 
                               cursor: 'pointer', 
                               marginBottom: '4px',
                               opacity: tags.includes(tag) ? 0.5 : 1
                             }}
                             onClick={() => {
                               if (!tags.includes(tag)) {
                                 setTags([...tags, tag]);
                               }
                             }}
                           >
                             {tag}
                           </Tag>
                         ))}
                       </div>
                     )}
                     
                     <Input
                       value={newTag}
                       onChange={(e) => setNewTag(e.target.value)}
                       onPressEnter={() => {
                         if (newTag && !tags.includes(newTag)) {
                           setTags([...tags, newTag]);
                           setNewTag('');
                         }
                       }}
                       placeholder="输入标签后按回车添加"
                     />
                   </Form.Item>
                  
                  <div style={{ 
                    background: '#f0f8ff', 
                    padding: '16px', 
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}>
                    <Text strong>📊 标注统计：</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Text>已确认字符：{confirmedAnnotations.length} 个</Text>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center' }}>
                    <Button 
                       type="primary" 
                       loading={uploading}
                       onClick={handleUpload}
                     >
                       完成上传
                     </Button>
                  </div>
                </Form>
              </Card>
            )}
          </Card>
        </Col>
        
        {/* 右侧：信息输入和控制区域 */}
        <Col xs={24} lg={10}>
          {ocrWorkflowStep !== 3 && (
            <Card title="作品信息" style={{ height: '100%' }}>
            <Form layout="vertical">
              <Form.Item label="作品描述">
                <TextArea
                  rows={isMobile ? 3 : 4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请输入作品描述（可选）"
                />
              </Form.Item>
              
              <Form.Item label="作品作者">
                <Input
                  value={workAuthor}
                  onChange={(e) => setWorkAuthor(e.target.value)}
                  placeholder="请输入作品作者（可选）"
                />
              </Form.Item>
              
              <Form.Item label="作品分组">
                <Input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="请输入分组名称（可选）"
                />
              </Form.Item>
              
              <Form.Item label="标签">
                <div style={{ marginBottom: '10px' }}>
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
                <div style={{ display: 'flex' }}>
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="输入标签名称"
                    onPressEnter={addTag}
                    style={{ flex: 1, marginRight: '8px' }}
                  />
                  <Button icon={<PlusOutlined />} onClick={addTag}>
                    添加
                  </Button>
                </div>
              </Form.Item>
              
              <Form.Item label="OCR设置">
                <div style={{ marginBottom: '10px' }}>
                  <Checkbox
                    checked={enableOCR}
                    onChange={(e) => setEnableOCR(e.target.checked)}
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
                      value="external"
                      disabled
                    >
                      <Radio value="external">
                        百度OCR服务
                      </Radio>
                    </Radio.Group>
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '5px' }}>
                      本地OCR引擎已移除，只支持百度OCR服务
                    </Text>
                  </div>
                )}
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={uploading}
                  disabled={!file}
                  block
                >
                  {uploading ? '上传中...' : '上传作品'}
                </Button>
              </Form.Item>
            </Form>
          </Card>
          )}
          
          {/* OCR结果列表 */}
          {annotations.length > 0 && (
            <Card 
              title="识别结果" 
              style={{ marginTop: '16px' }}
              extra={<Text type="secondary">{annotations.length} 个字符</Text>}
            >
              <List
                dataSource={annotations}
                renderItem={item => (
                  <List.Item
                    actions={[
                      <Button 
                        size="small" 
                        icon={<EyeOutlined />} 
                        onClick={() => handlePreviewAnnotation(item)}
                      />,
                      <Button 
                        size="small" 
                        icon={<EditOutlined />} 
                        onClick={() => handleAnnotationEdit(item)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: item.confidence >= 90 ? '#52c41a' : item.confidence >= 80 ? '#faad14' : '#ff4d4f' }}>
                          {item.text}
                        </Avatar>
                      }
                      title={item.text}
                      description={
                        <Space>
                          <Text type="secondary">置信度: {item.confidence}%</Text>
                          <Text type="secondary">位置: ({Math.round(item.x)}, {Math.round(item.y)})</Text>
                          <Text type="secondary">尺寸: {Math.round(item.width)}×{Math.round(item.height)}</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>
      
      {/* 编辑标注模态框 */}
      <Modal
        title="编辑标注"
        open={isEditingAnnotation}
        onCancel={handleAnnotationCancel}
        footer={[
          <Button key="cancel" onClick={handleAnnotationCancel}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={() => selectedAnnotation && handleAnnotationUpdate(selectedAnnotation)}
          >
            保存
          </Button>
        ]}
      >
        {selectedAnnotation && (
          <Form layout="vertical">
            <Form.Item label="字符内容">
              <Input
                value={selectedAnnotation.text}
                onChange={(e) => setSelectedAnnotation({
                  ...selectedAnnotation,
                  text: e.target.value
                })}
              />
            </Form.Item>
            <Form.Item label="位置 (X, Y)">
              <Space>
                <Input
                  type="number"
                  value={selectedAnnotation.x}
                  onChange={(e) => setSelectedAnnotation({
                    ...selectedAnnotation,
                    x: parseInt(e.target.value) || 0
                  })}
                  style={{ width: '100px' }}
                />
                <Input
                  type="number"
                  value={selectedAnnotation.y}
                  onChange={(e) => setSelectedAnnotation({
                    ...selectedAnnotation,
                    y: parseInt(e.target.value) || 0
                  })}
                  style={{ width: '100px' }}
                />
              </Space>
            </Form.Item>
            <Form.Item label="尺寸 (宽, 高)">
              <Space>
                <Input
                  type="number"
                  value={selectedAnnotation.width}
                  onChange={(e) => setSelectedAnnotation({
                    ...selectedAnnotation,
                    width: parseInt(e.target.value) || 0
                  })}
                  style={{ width: '100px' }}
                />
                <Input
                  type="number"
                  value={selectedAnnotation.height}
                  onChange={(e) => setSelectedAnnotation({
                    ...selectedAnnotation,
                    height: parseInt(e.target.value) || 0
                  })}
                  style={{ width: '100px' }}
                />
              </Space>
            </Form.Item>
            <Form.Item label="置信度">
              <Slider
                value={selectedAnnotation.confidence}
                onChange={(value) => setSelectedAnnotation({
                  ...selectedAnnotation,
                  confidence: value
                })}
                min={0}
                max={100}
              />
              <Text>{selectedAnnotation.confidence}%</Text>
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 预览模态框 */}
      <Modal
        title="字符预览"
        open={showPreviewModal}
        onCancel={() => setShowPreviewModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowPreviewModal(false)}>
            关闭
          </Button>
        ]}
      >
        {previewAnnotation && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-block',
              border: '1px solid #ddd',
              padding: '20px',
              margin: '20px 0'
            }}>
              <img
                src={filePreview}
                alt="字符预览"
                style={{
                  maxWidth: '300px',
                  maxHeight: '300px',
                  clipPath: `inset(${previewAnnotation.y}px ${previewAnnotation.x}px calc(100% - ${previewAnnotation.y + previewAnnotation.height}px) calc(100% - ${previewAnnotation.x + previewAnnotation.width}px))`
                }}
              />
            </div>
            <div>
              <Text strong>字符: {previewAnnotation.text}</Text>
              <br />
              <Text type="secondary">置信度: {previewAnnotation.confidence}%</Text>
            </div>
          </div>
        )}
      </Modal>
      
      {/* 编辑标注模态框 */}
      <Modal
        title="编辑标注"
        open={showEditModal}
        onOk={handleSaveEditedAnnotation}
        onCancel={() => setShowEditModal(false)}
      >
        {editingAnnotation && (
          <Form layout="vertical">
            <Form.Item label="识别文字">
              <Input
                value={editingAnnotation.text}
                onChange={(e) => setEditingAnnotation({...editingAnnotation, text: e.target.value})}
              />
            </Form.Item>
            <Form.Item label="置信度">
              <Input
                type="number"
                min={0}
                max={100}
                value={editingAnnotation.confidence}
                onChange={(e) => setEditingAnnotation({...editingAnnotation, confidence: parseFloat(e.target.value)})}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
      
      {/* 评论区 */}
      {commentSettings?.enabled && (
        <Card 
          title="评论区" 
          style={{ 
            marginTop: '20px',
            maxWidth: isMobile ? '100%' : '100%',
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

export default AdvancedUploadPage;