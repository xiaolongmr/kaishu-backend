import React, { useState } from 'react';
import {
  Card, Button, Upload, message, Typography, Steps, Row, Col,
  Image, Tag, Modal, Input, Form, Space, Alert, Progress,
  Badge, Divider
} from 'antd';
import {
  UploadOutlined, CheckOutlined, EditOutlined,
  DeleteOutlined, ScanOutlined
} from '@ant-design/icons';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

const OCRWorkflowPage = () => {
  const { isAuthenticated } = useAuth();
  
  // 工作流程状态
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // OCR识别状态
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResults, setOcrResults] = useState([]);
  const [ocrMetrics, setOcrMetrics] = useState({});
  
  // 标注确认状态
  const [confirmedAnnotations, setConfirmedAnnotations] = useState([]);
  const [currentAnnotationIndex, setCurrentAnnotationIndex] = useState(0);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // 作品信息状态
  const [workInfo, setWorkInfo] = useState({
    description: '',
    workAuthor: '',
    tags: [],
    groupName: ''
  });
  
  // 上传状态
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // 检查用户认证
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Alert
            message="请先登录"
            description="您需要登录后才能使用OCR识别功能。"
            type="warning"
            showIcon
          />
        </Card>
      </div>
    );
  }
  
  // 步骤1: 文件上传
  const handleFileUpload = (info) => {
    if (info.fileList.length > 0) {
      const uploadedFile = info.fileList[0].originFileObj;
      setFile(uploadedFile);
      
      // 生成预览URL
      const previewUrl = URL.createObjectURL(uploadedFile);
      setFilePreview(previewUrl);
      
      message.success('文件上传成功，可以进行下一步');
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };
  
  // 步骤2: OCR识别
  const handleOCRRecognition = async () => {
    if (!file) {
      message.error('请先上传文件');
      return;
    }
    
    try {
      setOcrLoading(true);
      
      const formData = new FormData();
      formData.append('calligraphy', file);
      formData.append('ocrSource', 'external');
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ocr/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.ocrResults && Array.isArray(result.ocrResults)) {
          setOcrResults(result.ocrResults);
          setOcrMetrics({
            totalCharacters: result.ocrResults.length,
            avgConfidence: result.ocrResults.reduce((sum, item) => sum + item.confidence, 0) / result.ocrResults.length,
            highConfidence: result.ocrResults.filter(item => item.confidence >= 90).length,
            mediumConfidence: result.ocrResults.filter(item => item.confidence >= 80 && item.confidence < 90).length,
            lowConfidence: result.ocrResults.filter(item => item.confidence < 80).length
          });
          
          message.success(`OCR识别完成，识别到 ${result.ocrResults.length} 个字符`);
          setCurrentStep(1);
        } else {
          message.warning('未识别到字符，请检查图片质量');
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'OCR识别失败');
      }
    } catch (error) {
      console.error('OCR识别失败:', error);
      message.error('OCR识别失败: ' + error.message);
    } finally {
      setOcrLoading(false);
    }
  };
  
  // 步骤3: 标注确认
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
      message.success('所有字符标注确认完成，可以进行下一步');
      setCurrentStep(2);
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
  
  // 步骤4: 最终上传
  const handleFinalUpload = async () => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('calligraphy', file);
      formData.append('description', workInfo.description);
      formData.append('workAuthor', workInfo.workAuthor);
      formData.append('tags', JSON.stringify(workInfo.tags));
      formData.append('groupName', workInfo.groupName);
      formData.append('enableOCR', 'false'); // OCR已完成，不需要重复处理
      
      // 添加确认的标注数据
      formData.append('confirmedAnnotations', JSON.stringify(confirmedAnnotations));
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadedFile(result);
        setUploadSuccess(true);
        setCurrentStep(3);
        message.success('作品上传成功！');
      } else {
        const error = await response.json();
        throw new Error(error.error || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      message.error('上传失败: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  // 重新开始
  const handleRestart = () => {
    setCurrentStep(0);
    setFile(null);
    setFilePreview(null);
    setOcrResults([]);
    setConfirmedAnnotations([]);
    setCurrentAnnotationIndex(0);
    setWorkInfo({ description: '', workAuthor: '', tags: [], groupName: '' });
    setUploadSuccess(false);
    setUploadedFile(null);
  };
  
  // 渲染当前标注
  const renderCurrentAnnotation = () => {
    if (currentAnnotationIndex >= ocrResults.length) return null;
    
    const annotation = ocrResults[currentAnnotationIndex];
    const progress = ((currentAnnotationIndex + 1) / ocrResults.length) * 100;
    
    // 创建图片元素来获取实际显示尺寸
    const [imageElement, setImageElement] = useState(null);
    const [imageDimensions, setImageDimensions] = useState({ width: 1000, height: 1000 });
    
    const handleImageLoad = (e) => {
      const img = e.target;
      setImageElement(img);
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    return (
      <Card title={`字符确认 (${currentAnnotationIndex + 1}/${ocrResults.length})`}>
        <Progress percent={Math.round(progress)} style={{ marginBottom: 16 }} />
        
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <Image
                src={filePreview}
                style={{ maxWidth: '100%', maxHeight: '400px' }}
                preview={false}
                onLoad={handleImageLoad}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${(annotation.x / imageDimensions.width) * 100}%`,
                  top: `${(annotation.y / imageDimensions.height) * 100}%`,
                  width: `${(annotation.width / imageDimensions.width) * 100}%`,
                  height: `${(annotation.height / imageDimensions.height) * 100}%`,
                  border: '2px solid #ff4d4f',
                  backgroundColor: 'rgba(255, 77, 79, 0.2)',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </Col>
          
          <Col span={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>识别文字：</Text>
                <Tag color={annotation.confidence >= 90 ? 'green' : annotation.confidence >= 80 ? 'orange' : 'red'}>
                  {annotation.text}
                </Tag>
              </div>
              
              <div>
                <Text strong>置信度：</Text>
                <Text>{annotation.confidence.toFixed(2)}%</Text>
              </div>
              
              <div>
                <Text strong>位置：</Text>
                <Text>({annotation.x}, {annotation.y}) {annotation.width}×{annotation.height}</Text>
              </div>
              
              <Divider />
              
              <Space>
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={() => handleAnnotationConfirm(annotation, true)}
                >
                  确认正确
                </Button>
                
                <Button 
                  icon={<EditOutlined />}
                  onClick={() => handleEditAnnotation(annotation)}
                >
                  编辑
                </Button>
                
                <Button 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleAnnotationConfirm(annotation, false)}
                >
                  跳过
                </Button>
              </Space>
              
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
          </Col>
        </Row>
      </Card>
    );
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>OCR识别工作流程</Title>
      
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        <Step title="上传图片" description="选择要识别的书法作品" />
        <Step title="OCR识别" description="自动识别图片中的文字" />
        <Step title="标注确认" description="逐个确认识别的字符" />
        <Step title="作品信息" description="填写作品信息并上传" />
        <Step title="完成" description="上传成功" />
      </Steps>
      
      {/* 步骤0: 文件上传 */}
      {currentStep === 0 && (
        <Card title="步骤1: 上传图片">
          <Upload.Dragger
            name="file"
            multiple={false}
            accept="image/*"
            beforeUpload={() => false}
            onChange={handleFileUpload}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持单个图片文件上传，建议使用高清图片以获得更好的识别效果</p>
          </Upload.Dragger>
          
          {filePreview && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Image
                src={filePreview}
                style={{ maxWidth: '100%', maxHeight: '300px' }}
                preview={true}
              />
              <div style={{ marginTop: 16 }}>
                <Button 
                  type="primary" 
                  size="large"
                  loading={ocrLoading}
                  onClick={handleOCRRecognition}
                >
                  开始OCR识别
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      
      {/* 步骤1: OCR识别结果 */}
      {currentStep === 1 && (
        <div>
          <Card title="步骤2: OCR识别结果" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                      {ocrMetrics.totalCharacters}
                    </div>
                    <div>总字符数</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {ocrMetrics.avgConfidence?.toFixed(1)}%
                    </div>
                    <div>平均置信度</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                      {ocrMetrics.highConfidence}
                    </div>
                    <div>高置信度(≥90%)</div>
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                      {ocrMetrics.lowConfidence}
                    </div>
                    <div>低置信度(&lt;80%)</div>
                  </div>
                </Card>
              </Col>
            </Row>
            
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                onClick={() => setCurrentStep(2)}
              >
                开始标注确认
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* 步骤2: 标注确认 */}
      {currentStep === 2 && renderCurrentAnnotation()}
      
      {/* 步骤3: 作品信息填写 */}
      {currentStep === 3 && (
        <Card title="步骤3: 填写作品信息">
          <Form layout="vertical">
            <Form.Item label="作品描述">
              <TextArea
                rows={4}
                value={workInfo.description}
                onChange={(e) => setWorkInfo({...workInfo, description: e.target.value})}
                placeholder="请描述这幅书法作品..."
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="作者">
                  <Input
                    value={workInfo.workAuthor}
                    onChange={(e) => setWorkInfo({...workInfo, workAuthor: e.target.value})}
                    placeholder="作者姓名"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="分组">
                  <Input
                    value={workInfo.groupName}
                    onChange={(e) => setWorkInfo({...workInfo, groupName: e.target.value})}
                    placeholder="作品分组"
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <div style={{ marginTop: 16 }}>
              <Text strong>确认的标注数量：</Text>
              <Badge count={confirmedAnnotations.length} style={{ marginLeft: 8 }} />
            </div>
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large"
                loading={uploading}
                onClick={handleFinalUpload}
              >
                完成上传
              </Button>
            </div>
          </Form>
        </Card>
      )}
      
      {/* 步骤4: 上传成功 */}
      {currentStep === 4 && uploadSuccess && (
        <Card>
          <div style={{ textAlign: 'center' }}>
            <CheckOutlined style={{ fontSize: '64px', color: '#52c41a', marginBottom: 16 }} />
            <Title level={3}>上传成功！</Title>
            <Text>作品已成功保存，包含 {confirmedAnnotations.length} 个确认的字符标注</Text>
            
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button type="primary" onClick={handleRestart}>
                  继续上传新作品
                </Button>
                <Button onClick={() => window.location.href = '/gallery'}>
                  查看作品库
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      )}
      
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
    </div>
  );
};

export default OCRWorkflowPage;