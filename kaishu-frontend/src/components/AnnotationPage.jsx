import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Image, Input, Button, Typography, message, Spin, Alert, Space, Tooltip, Popover, Switch } from 'antd';
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  RollbackOutlined,
  EnvironmentOutlined,
  ColumnWidthOutlined,
  ZoomInOutlined,
  CloseCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ScanOutlined,
  AlignCenterOutlined
} from '@ant-design/icons';
import CanvasAnnotator from './CanvasAnnotator'; // 使用CanvasAnnotator替换ImageAnnotator
import { useTheme } from './ThemeContext'; // 导入主题上下文
import { useLocation, useNavigate } from 'react-router-dom'; // 添加路由位置钩子和navigate
import { useAuth } from './AuthContext'; // 导入认证上下文
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook

const { Title, Text } = Typography;
const { TextArea } = Input;

const AnnotationPage = () => {
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotationStatus, setAnnotationStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // 新增预览图像状态
  const { theme } = useTheme(); // 获取当前主题
  const location = useLocation(); // 获取路由位置信息
  const navigate = useNavigate(); // 导入navigate函数
  const { currentUser } = useAuth(); // 获取当前登录用户
  const { commentSettings } = useCommentSettings('annotate'); // 获取字体标注页面评论设置
  // 添加移动端检测状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 米字格检测相关状态
  const [enableGridDetection, setEnableGridDetection] = useState(false);
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 });
  const [gridPositions, setGridPositions] = useState([]);

  // 添加响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 获取标注作者名称
  const getAnnotationUser = (userId) => {
    if (!userId) return '未登录用户';
    return '用户 ID: ' + userId;
  };

  // 格式化时间
  const formatDate = (dateString) => {
    if (!dateString) return '未知时间';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return '日期格式错误';
    }
  };

  useEffect(() => {
    fetchWorks();

    // 检查URL参数中是否有作品ID
    const urlParams = new URLSearchParams(location.search);
    const workIdFromUrl = urlParams.get('workId');

    if (workIdFromUrl) {
      // 等待作品列表加载完成后自动选择相应作品
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

      // 设置超时防止无限等待
      setTimeout(() => clearInterval(interval), 5000);
    } else {
      // 检查是否有从GalleryPage传来的作品ID（兼容旧方式）
      const annotationWorkId = localStorage.getItem('annotationWorkId');
      if (annotationWorkId) {
        // 清除此ID，避免下次访问时自动加载
        localStorage.removeItem('annotationWorkId');
        // 等待作品列表加载完成后自动选择相应作品
        const interval = setInterval(() => {
          if (works.length > 0) {
            const work = works.find(w => w.id.toString() === annotationWorkId.toString());
            if (work) {
              handleWorkSelect(work);
              message.success('已自动加载来自图库的作品');
            }
            clearInterval(interval);
          }
        }, 100);

        // 设置超时防止无限等待
        setTimeout(() => clearInterval(interval), 5000);
      }
    }
  }, [works.length, location.search]);

  const fetchWorks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/works', { credentials: 'include' });
      const data = await response.json();
      setWorks(data);
      setLoading(false);
    } catch (error) {
      console.error('获取作品列表失败:', error);
      message.error('获取作品列表失败: ' + error.message);
      setLoading(false);
    }
  };

  // 检测米字格
  const detectGrid = async (imageUrl) => {
    try {
      const response = await fetch('/api/detect-grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setGridSize({ width: data.gridWidth, height: data.gridHeight });
        setGridPositions(data.gridPositions);
        message.success('米字格检测完成');
      } else {
        message.error('米字格检测失败');
      }
    } catch (error) {
      console.error('米字格检测出错:', error);
      message.error('米字格检测出错: ' + error.message);
    }
  };

  const handleWorkSelect = async (work) => {
    setSelectedWork(work);
    setSelectedAnnotation(null);
    setCharacterName('');
    setIsEditMode(false);

    // 更新URL中的workId参数
    navigate(`/annotate?workId=${work.id}`, { replace: true });

    try {
      const response = await fetch(`/api/works/${work.id}/annotations`, { credentials: 'include' });
      const data = await response.json();
      setAnnotations(data);

      // 如果启用了米字格检测，自动检测
      if (enableGridDetection) {
        await detectGrid(`/images/${encodeURIComponent(work.filename)}`);
      }
    } catch (error) {
      console.error('获取标注信息失败:', error);
      message.error('获取标注信息失败: ' + error.message);
    }
  };

  const handleAnnotationSelect = (annotation) => {
    setSelectedAnnotation(annotation);
    // 如果标注有对应的字符名称，则自动填充
    const existingAnnotation = annotations.find(a =>
      a.position_x === annotation.x &&
      a.position_y === annotation.y &&
      a.width === annotation.width &&
      a.height === annotation.height
    );

    if (existingAnnotation) {
      setCharacterName(existingAnnotation.character_name || '');
      setIsEditMode(true);
    } else {
      setCharacterName('');
      setIsEditMode(false);
    }
  };

  const handleAnnotationAdd = (annotation) => {
    // 新添加的标注，暂不设置字符名称
    setSelectedAnnotation(annotation);
    setCharacterName('');
    setIsEditMode(false);
  };

  const handleAnnotation = async () => {
    if (!selectedWork || !selectedAnnotation || !characterName.trim()) {
      message.warning('请选择作品，框选字体区域并输入字符名称');
      return;
    }

    try {
      message.info(`${isEditMode ? '更新' : '保存'}标注到云端数据库...`);

      // 获取当前用户ID（如果有的话）
      let userId = null;
      if (currentUser && currentUser.id) {
        userId = currentUser.id;
        console.log('使用AuthContext提供的用户ID:', userId);
      } else {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            // 解析JWT令牌获取用户信息
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              userId = payload.id;
              console.log('从令牌获取的用户ID:', userId);
            }
          }
        } catch (e) {
          console.error('无法获取用户ID:', e);
        }
      }

      // 构建请求体
      const requestBody = {
        workId: selectedWork.id,
        characterName: characterName.trim(),
        positionX: selectedAnnotation.x,
        positionY: selectedAnnotation.y,
        width: selectedAnnotation.width,
        height: selectedAnnotation.height,
        // 如果有用户ID，也包含进去
        ...(userId && { userId })
      };

      // 如果是透视校正标注，添加相关数据
      if (selectedAnnotation.perspectiveCorrection && selectedAnnotation.fourPoints) {
        requestBody.perspectiveCorrection = true;
        requestBody.fourPoints = selectedAnnotation.fourPoints;
      }

      const response = await fetch('/api/annotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('标注API响应:', result);

      if (response.ok) {
        message.success(`标注已${result.isUpdate ? '更新' : '保存'}到云端数据库: ${characterName}`);

        // 更新标注列表
        const newAnnotation = {
          id: result.annotationId,
          character_name: characterName.trim(),
          position_x: selectedAnnotation.x,
          position_y: selectedAnnotation.y,
          width: selectedAnnotation.width,
          height: selectedAnnotation.height,
          work_id: selectedWork.id,
          annotation_time: new Date().toISOString(),
          // 如果有用户ID，也包含进去
          ...(userId && { user_id: userId }),
          // 如果有透视校正数据，也包含进来
          ...(selectedAnnotation.perspectiveCorrection && {
            perspectiveCorrection: true,
            fourPoints: selectedAnnotation.fourPoints
          })
        };

        const annotationExists = annotations.some(a =>
          a.position_x === selectedAnnotation.x &&
          a.position_y === selectedAnnotation.y &&
          a.width === selectedAnnotation.width &&
          a.height === selectedAnnotation.height
        );

        if (!annotationExists) {
          setAnnotations([...annotations, newAnnotation]);
        } else {
          // 更新现有标注
          setAnnotations(annotations.map(a =>
            (a.position_x === selectedAnnotation.x &&
              a.position_y === selectedAnnotation.y &&
              a.width === selectedAnnotation.width &&
              a.height === selectedAnnotation.height)
              ? newAnnotation : a
          ));
        }

        // 保存到localStorage以防止刷新丢失
        localStorage.setItem(`annotations_${selectedWork.id}`, JSON.stringify([...annotations.filter(a =>
          !(a.position_x === selectedAnnotation.x &&
            a.position_y === selectedAnnotation.y &&
            a.width === selectedAnnotation.width &&
            a.height === selectedAnnotation.height)
        ), newAnnotation]));

        // 触发标注变化事件以更新计数
        const annotationChangedEvent = new CustomEvent('annotationChanged');
        window.dispatchEvent(annotationChangedEvent);

        setCharacterName('');
        setSelectedAnnotation(null);
        setIsEditMode(false);
      } else {
        message.error(`标注失败: ${result.error}`);
      }
    } catch (error) {
      console.error('标注出错:', error);
      message.error(`标注出错: ${error.message}`);
    }
  };

  // 处理删除标注
  const handleDeleteAnnotation = async (annotationId) => {
    try {
      message.info('正在从云端数据库删除标注...');

      const response = await fetch(`/api/annotations/${annotationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // 从列表中移除已删除的标注
        const updatedAnnotations = annotations.filter(a => a.id !== annotationId);
        setAnnotations(updatedAnnotations);

        // 更新localStorage
        if (selectedWork) {
          localStorage.setItem(`annotations_${selectedWork.id}`, JSON.stringify(updatedAnnotations));
        }

        // 触发标注变化事件以更新计数
        const annotationChangedEvent = new CustomEvent('annotationChanged');
        window.dispatchEvent(annotationChangedEvent);

        message.success('标注已从云端数据库成功删除');

        // 如果当前选中的就是被删除的标注，则清除选择
        if (selectedAnnotation && Number(selectedAnnotation.id) === annotationId) {
          setSelectedAnnotation(null);
          setCharacterName('');
          setIsEditMode(false);
        }
      } else {
        const errorData = await response.json();
        message.error(`删除失败: ${errorData.error}`);
      }
    } catch (error) {
      message.error(`删除出错: ${error.message}`);
    }
  };

  // 取消编辑模式
  const handleCancelEdit = () => {
    setSelectedAnnotation(null);
    setCharacterName('');
    setIsEditMode(false);
  };

  // 创建裁剪图像的URL
  const getCroppedImageUrl = (annotation) => {
    if (!selectedWork) return '';

    // 添加时间戳参数避免缓存引起的问题
    const timestamp = new Date().getTime();

    // 如果标注包含透视校正信息，则使用标注ID进行裁剪
    if (annotation.perspectiveCorrection || annotation.four_points) {
      return `/api/crop-image?filename=${encodeURIComponent(selectedWork.filename)}&annotationId=${annotation.id}&t=${timestamp}`;
    }

    // 否则使用普通矩形裁剪
    return `/api/crop-image?filename=${encodeURIComponent(selectedWork.filename)}&x=${annotation.position_x}&y=${annotation.position_y}&width=${annotation.width}&height=${annotation.height}&t=${timestamp}`;
  };

  // 转换后端标注数据格式为标注组件所需格式
  const convertAnnotationsForComponent = () => {
    return annotations.map(annotation => ({
      id: annotation.id.toString(),
      x: annotation.position_x,
      y: annotation.position_y,
      width: annotation.width,
      height: annotation.height,
      characterName: annotation.character_name
    }));
  };

  // 取消选择作品
  const handleDeselectWork = () => {
    setSelectedWork(null);
    setSelectedAnnotation(null);
    setCharacterName('');
    setIsEditMode(false);
    navigate('/annotate', { replace: true });
  };

  return (
    <div>
      <Title level={2}>字体标注</Title>
      <Row gutter={[20, 20]}>
        {/* 左侧作品列表 */}
        <Col xs={24} md={8} lg={6}>
          <Card title="选择作品">
            {loading ? (
              <div>
                <Spin>
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    加载中...
                  </div>
                </Spin>
              </div>
            ) : (
              <div className="works-list">
                <List
                  dataSource={works}
                  renderItem={work => (
                    <List.Item
                      onClick={() => handleWorkSelect(work)}
                      style={{
                        backgroundColor: selectedWork && selectedWork.id === work.id ? '#e6f7ff' : 'transparent',
                        borderLeft: selectedWork && selectedWork.id === work.id ? '3px solid #1890ff' : 'none'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            className="work-image-container"
                            onClick={(e) => {
                              // 阻止事件冒泡，避免触发ListItem的点击事件
                              e.stopPropagation();
                            }}
                          >
                            <Image
                              src={`/images/${encodeURIComponent(work.filename)}`}
                              alt={work.original_filename || work.filename}
                              width={60}
                              height={60}
                              preview={{
                                mask: <ZoomInOutlined />,
                                maskClassName: "custom-preview-mask"
                              }}
                              fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ250LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UsIHNhbnMtc2VyaWYiIGZpbGw9IiM5OTk5OTkiPuWbvueJhzwvdGV4dD48L3N2Zz4="
                              onError={(e) => {
                                console.error(`图片加载失败: ${work.filename}`);
                              }}
                            />
                          </div>
                        }
                        title={(work.original_filename || work.filename).length > 15 ? (work.original_filename || work.filename).substring(0, 15) + '...' : (work.original_filename || work.filename)}
                        description={
                          <Text type="secondary">
                            {new Date(work.upload_time).toLocaleString()}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Card>
        </Col>

        {/* 右侧标注区域 */}
        <Col xs={24} md={16} lg={18}>
          {selectedWork ? (
            <Card title={`标注作品: ${selectedWork.original_filename ? decodeURIComponent(selectedWork.original_filename) : (selectedWork.filename ? decodeURIComponent(selectedWork.filename) : '未知文件名')}`}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <Text strong style={{ marginRight: '10px' }}>
                  当前作品:
                </Text>
                <Text
                  ellipsis={{ tooltip: selectedWork.original_filename ? decodeURIComponent(selectedWork.original_filename) : (selectedWork.filename ? decodeURIComponent(selectedWork.filename) : '未知文件名') }}
                  style={{ maxWidth: '300px' }}
                >
                  {selectedWork.original_filename ? decodeURIComponent(selectedWork.original_filename) : (selectedWork.filename ? decodeURIComponent(selectedWork.filename) : '未知文件名')}
                </Text>
                <Button
                  type="link"
                  onClick={handleDeselectWork}
                  style={{ marginLeft: '10px' }}
                >
                  更换作品
                </Button>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <Switch
                    checked={enableGridDetection}
                    onChange={setEnableGridDetection}
                    checkedChildren="启用米字格检测"
                    unCheckedChildren="关闭米字格检测"
                  />
                  {enableGridDetection && (
                    <Button
                      icon={<ScanOutlined />}
                      onClick={() => detectGrid(`/images/${encodeURIComponent(selectedWork.filename)}`)}
                    >
                      重新检测米字格
                    </Button>
                  )}
                </Space>
              </div>

              <div>
                <CanvasAnnotator
                  imageUrl={`/images/${encodeURIComponent(selectedWork.filename)}`}
                  initialAnnotations={convertAnnotationsForComponent()}
                  onAnnotationAdd={handleAnnotationAdd}
                  onAnnotationSelect={handleAnnotationSelect}
                  imageWidth={800}
                  theme={theme} // 传递主题
                />
              </div>

              {/* 标注表单 */}
              <Card>
                <Title level={4}>{isEditMode ? '修改标注' : '添加标注'}</Title>
                <Space direction="vertical" style={{ width: '100%' }} className="annotation-form">
                  <div>
                    <Text strong>字符名称:</Text>
                    <Input
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="输入字符"
                    />
                    <Button
                      type="primary"
                      onClick={handleAnnotation}
                      disabled={!selectedAnnotation}
                      icon={isEditMode ? <EditOutlined /> : <PlusOutlined />}
                    >
                      {isEditMode ? '更新标注' : '保存标注'}
                    </Button>

                    {isEditMode && (
                      <Button
                        onClick={handleCancelEdit}
                        icon={<RollbackOutlined />}
                      >
                        取消
                      </Button>
                    )}
                  </div>
                  {annotationStatus && (
                    <Alert
                      message={annotationStatus}
                      type={annotationStatus.includes('成功') ? 'success' : 'error'}
                      showIcon
                    />
                  )}
                </Space>
              </Card>

              {/* 已有标注列表 */}
              {annotations.length > 0 && (
                <Card title={`已有标注 (${annotations.length})`}>
                  <div className="annotation-list">
                    {annotations.map(annotation => {
                      // 创建标注详情内容
                      const detailContent = (
                        <div className="annotation-detail-content">
                          <p><i className="detail-icon" style={{ marginRight: '8px' }}>⏰</i> 标注时间: {formatDate(annotation.annotation_time)}</p>
                          <p><UserOutlined style={{ marginRight: '8px' }} /> 标注作者: {getAnnotationUser(annotation.user_id)}</p>
                          <p><EnvironmentOutlined style={{ marginRight: '8px' }} /> 位置: ({annotation.position_x}, {annotation.position_y})</p>
                          <p><ColumnWidthOutlined style={{ marginRight: '8px' }} /> 尺寸: {annotation.width}×{annotation.height}</p>
                        </div>
                      );

                      return (
                        <div
                          key={annotation.id}
                          className="annotation-card"
                        >
                          <div className="annotation-character">{annotation.character_name}</div>
                          <div className="annotation-image-container">
                            <Image
                              src={getCroppedImageUrl(annotation)}
                              alt={annotation.character_name}
                              className="annotation-image"
                              preview={{
                                mask: <ZoomInOutlined />,
                                maskClassName: "custom-preview-mask"
                              }}
                              fallback={`/images/${encodeURIComponent(selectedWork.filename)}`}
                              onError={(e) => {
                                console.error('裁剪图像加载失败');
                                console.error(`裁剪参数: x=${annotation.position_x}, y=${annotation.position_y}, w=${annotation.width}, h=${annotation.height}`);

                                // 回退到原始完整图像，但是添加裁剪样式
                                try {
                                  e.target.src = `/images/${encodeURIComponent(selectedWork.filename)}`;
                                  e.target.style.objectFit = 'none';
                                  e.target.style.objectPosition = `-${annotation.position_x}px -${annotation.position_y}px`;
                                  e.target.style.width = `${annotation.width}px`;
                                  e.target.style.height = `${annotation.height}px`;
                                  e.target.style.maxWidth = 'none';
                                  e.target.style.maxHeight = 'none';
                                } catch (err) {
                                  console.error('回退显示出错:', err);
                                }
                              }}
                              onClick={(e) => {
                                // 阻止事件冒泡，避免触发父容器的点击事件
                                e.stopPropagation();
                              }}
                            />
                          </div>

                          <div className="annotation-tools">
                            <Popover
                              content={detailContent}
                              title="标注详情"
                              trigger="click"
                              placement="right"
                            >
                              <Button
                                type="text"
                                size="small"
                                icon={<InfoCircleOutlined />}
                              />
                            </Popover>

                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => {
                                setSelectedAnnotation({
                                  id: annotation.id.toString(),
                                  x: annotation.position_x,
                                  y: annotation.position_y,
                                  width: annotation.width,
                                  height: annotation.height,
                                  characterName: annotation.character_name,
                                  // 如果有透视校正数据，也包含进来
                                  ...(annotation.perspective_correction && annotation.four_points && {
                                    perspectiveCorrection: true,
                                    fourPoints: annotation.four_points
                                  })
                                });
                                setCharacterName(annotation.character_name);
                                setIsEditMode(true);
                              }}
                            />

                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteAnnotation(annotation.id)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Text type="secondary">请从左侧选择一个作品开始标注</Text>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* 评论区 */}
      {(!commentSettings || commentSettings?.enabled) && (
        <Card title="评论区" style={{ marginTop: '20px' }} id="comments">
          <TwikooComment commentPath={commentSettings?.shared_path || '/annotate'} />
        </Card>
      )}
    </div>
  );
};

export default AnnotationPage;