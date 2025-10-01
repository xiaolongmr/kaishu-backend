import React, { useState, useRef, useEffect } from 'react';
import { Button, Radio, Tooltip, Spin, Modal, Slider, Switch, InputNumber, message } from 'antd';
import { BorderOutlined, DragOutlined, EyeOutlined, ZoomInOutlined, ZoomOutOutlined, EditOutlined } from '@ant-design/icons';

const CanvasAnnotator = ({ 
  imageUrl, 
  initialAnnotations = [], 
  onAnnotationAdd, 
  onAnnotationSelect,
  imageWidth = 800,
  theme = 'light'
}) => {
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [drawing, setDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  
  // 新增状态
  const [annotationMode, setAnnotationMode] = useState('rectangle'); // 'rectangle' 或 'fourPoint'
  const [fourPointsCoords, setFourPointsCoords] = useState([]);
  
  // 透视变换预览相关状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [transformQuality, setTransformQuality] = useState(85); // JPEG质量
  
  // 放大功能相关状态
  const [zoomLevel, setZoomLevel] = useState(1); // 缩放级别
  const [showMagnifier, setShowMagnifier] = useState(false); // 是否显示放大镜
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 }); // 放大镜位置
  const [magnifierScale, setMagnifierScale] = useState(2); // 放大倍数
  const [enableMagnifierTest, setEnableMagnifierTest] = useState(false); // 启用放大镜测试功能
  
  // OCR功能相关状态
  const [enableOcrTest, setEnableOcrTest] = useState(false); // 启用OCR测试功能
  
  // 四点编辑状态
  const [editingFourPoint, setEditingFourPoint] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  
  // 动态Canvas尺寸
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const previewCanvasRef = useRef(null);
  
  // 响应式处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // 重新计算Canvas尺寸
      if (imageRef.current && imageLoaded) {
        updateCanvasSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded]); // 用于生成预览图像的canvas
  const resizeObserverRef = useRef(null); // 用于监听容器尺寸变化


  
  // 处理图片加载
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setSelectedAnnotation(null);
    // 重置四点坐标
    setFourPointsCoords([]);
  }, [imageUrl]);
  
  // 更新外部传入的标注
  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  // 计算图片和容器的比例
  const updateScale = () => {
    if (imageRef.current && canvasRef.current) {
      const imgNaturalWidth = imageRef.current.naturalWidth;
      const imgNaturalHeight = imageRef.current.naturalHeight;
      
      // 保存原始尺寸信息
      setNaturalSize({
        width: imgNaturalWidth,
        height: imgNaturalHeight
      });
      
      // 计算缩放比例以适应固定Canvas尺寸
      const scaleX = canvasSize.width / imgNaturalWidth;
      const scaleY = canvasSize.height / imgNaturalHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // 不放大图片
      
      setScale(newScale);
      setImageDimensions({
        width: imgNaturalWidth * newScale,
        height: imgNaturalHeight * newScale
      });
    }
  };

  // 更新Canvas尺寸以适应图片比例
  const updateCanvasSize = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // 计算最大显示尺寸
    const maxWidth = isMobile ? window.innerWidth - 40 : 800;
    const maxHeight = isMobile ? 400 : 600;
    
    // 计算缩放比例，保持图片宽高比
    const scaleX = maxWidth / naturalWidth;
    const scaleY = maxHeight / naturalHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 不放大图片
    
    const displayWidth = Math.round(naturalWidth * scale);
    const displayHeight = Math.round(naturalHeight * scale);
    
    setCanvasSize({ width: displayWidth, height: displayHeight });
    setScale(scale);
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImageDimensions({ width: displayWidth, height: displayHeight });
  };
  
  // 图片加载完成处理
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    
    if (imageRef.current) {
      updateCanvasSize();
    }
  };

  // 图片加载错误处理
  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
    console.error('图片加载失败:', imageUrl);
  };

  // 获取鼠标相对于canvas的坐标
  const getMousePosition = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于canvas的坐标
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    };
  };
  
  // 从显示坐标转换为原始图片坐标
  const displayToOriginalCoords = (displayX, displayY) => {
    if (!naturalSize.width || !naturalSize.height || !imageDimensions.width || !imageDimensions.height) {
      return { x: displayX, y: displayY };
    }
    
    const scaleRatio = imageDimensions.width / naturalSize.width;
    return {
      x: Math.round(displayX / scaleRatio),
      y: Math.round(displayY / scaleRatio)
    };
  };
  
  // 从原始图片坐标转换为显示坐标
  const originalToDisplayCoords = (originalX, originalY, originalWidth, originalHeight) => {
    if (!naturalSize.width || !naturalSize.height || !imageDimensions.width || !imageDimensions.height) {
      return { x: originalX, y: originalY, width: originalWidth, height: originalHeight };
    }
    
    const scaleRatio = imageDimensions.width / naturalSize.width;
    return {
      x: Math.round(originalX * scaleRatio),
      y: Math.round(originalY * scaleRatio),
      width: originalWidth ? Math.round(originalWidth * scaleRatio) : undefined,
      height: originalHeight ? Math.round(originalHeight * scaleRatio) : undefined
    };
  };

  // 鼠标按下事件 - 开始绘制或添加四点坐标
  const handleMouseDown = (e) => {
    if (editingFourPoint && editingAnnotation) {
      // 编辑四点模式
      handleEditFourPointMouseDown(e);
    } else if (annotationMode === 'rectangle') {
      // 矩形框选模式
      handleRectangleMouseDown(e);
    } else {
      // 四点定位模式
      handleFourPointMouseDown(e);
    }
  };

  // 矩形框选模式的鼠标按下处理
  const handleRectangleMouseDown = (e) => {
    // 检查是否点击在已有标注上
    const clickedAnnotation = findAnnotationAtPosition(e);
    
    if (clickedAnnotation) {
      // 如果点击在标注上，选择该标注
      setSelectedAnnotation(clickedAnnotation);
      if (onAnnotationSelect) {
        onAnnotationSelect(clickedAnnotation);
      }
    } else {
      // 开始新的标注
      const { x, y } = getMousePosition(e);
      
      // 转换为原始图片坐标
      const original = displayToOriginalCoords(x, y);
      
      setCurrentAnnotation({
        id: Date.now().toString(),
        x: original.x,
        y: original.y,
        width: 0,
        height: 0,
        displayX: x,
        displayY: y,
        displayWidth: 0,
        displayHeight: 0
      });
      
      setDrawing(true);
      setSelectedAnnotation(null);
    }
  };

  // 四点定位模式的鼠标按下处理
  const handleFourPointMouseDown = (e) => {
    if (fourPointsCoords.length < 4) {
      // 添加新的点
      const { x, y } = getMousePosition(e);
      const original = displayToOriginalCoords(x, y);
      
      const newPoint = { displayX: x, displayY: y, x: original.x, y: original.y };
      setFourPointsCoords([...fourPointsCoords, newPoint]);
    }
  };

  // 编辑四点模式的鼠标按下处理
  const handleEditFourPointMouseDown = (e) => {
    const { x, y } = getMousePosition(e);
    
    // 检查是否点击在某个控制点上
    const controlPointRadius = 10;
    for (let i = 0; i < editingAnnotation.fourPoints.length; i++) {
      const point = editingAnnotation.fourPoints[i];
      const displayPoint = originalToDisplayCoords(point.x, point.y);
      
      const distance = Math.sqrt(
        Math.pow(x - displayPoint.x, 2) + 
        Math.pow(y - displayPoint.y, 2)
      );
      
      if (distance <= controlPointRadius) {
        // 开始拖拽这个点
        setEditingFourPoint(i);
        return;
      }
    }
  };

  // 绘制标注
  const drawAnnotations = () => {
    if (!canvasRef.current || !imageLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制图片，确保按正确比例显示
    if (imageRef.current && imageLoaded) {
      // 绘制图片，保持原始宽高比
      ctx.drawImage(
        imageRef.current, 
        0, 0, 
        imageRef.current.naturalWidth, 
        imageRef.current.naturalHeight,
        0, 0, 
        canvas.width, 
        canvas.height
      );
    }
    
    // 绘制已有标注
    annotations.forEach(annotation => {
      const displayCoords = originalToDisplayCoords(annotation.x, annotation.y, annotation.width, annotation.height);
      
      // 绘制矩形框
      ctx.strokeStyle = selectedAnnotation?.id === annotation.id ? '#1890ff' : '#ff4d4f';
      ctx.lineWidth = selectedAnnotation?.id === annotation.id ? 2 : 1;
      ctx.strokeRect(displayCoords.x, displayCoords.y, displayCoords.width, displayCoords.height);
      
      // 绘制字符名称而不是ID
      ctx.fillStyle = selectedAnnotation?.id === annotation.id ? '#1890ff' : '#ff4d4f';
      ctx.font = '14px Arial';
      ctx.fillText(annotation.characterName || '未命名', displayCoords.x + 5, displayCoords.y + 15);
    });
    
    // 绘制当前正在绘制的标注
    if (currentAnnotation && drawing) {
      ctx.strokeStyle = '#52c41a';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentAnnotation.displayX, 
        currentAnnotation.displayY, 
        currentAnnotation.displayWidth, 
        currentAnnotation.displayHeight
      );
    }
    
    // 绘制四点坐标
    if (annotationMode === 'fourPoint' && fourPointsCoords.length > 0) {
      // 绘制点
      fourPointsCoords.forEach((point, index) => {
        ctx.fillStyle = '#1890ff';
        ctx.beginPath();
        ctx.arc(point.displayX, point.displayY, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制点的序号
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), point.displayX, point.displayY);
      });
      
      // 绘制连线
      if (fourPointsCoords.length > 1) {
        ctx.strokeStyle = '#1890ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fourPointsCoords[0].displayX, fourPointsCoords[0].displayY);
        for (let i = 1; i < fourPointsCoords.length; i++) {
          ctx.lineTo(fourPointsCoords[i].displayX, fourPointsCoords[i].displayY);
        }
        if (fourPointsCoords.length === 4) {
          ctx.closePath(); // 闭合四边形
        }
        ctx.stroke();
      }
    }
    
    // 绘制编辑中的四点标注
    if (editingAnnotation && editingAnnotation.fourPoints) {
      const points = editingAnnotation.fourPoints.map(point => 
        originalToDisplayCoords(point.x, point.y)
      );
      
      // 绘制连线
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // 绘制控制点
      points.forEach((point, index) => {
        ctx.fillStyle = editingFourPoint === index ? '#ff4d4f' : '#1890ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // 绘制点的序号
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((index + 1).toString(), point.x, point.y);
      });
    }
    
    // 绘制放大镜
    if (showMagnifier && magnifierPosition.x > 0 && magnifierPosition.y > 0) {
      const magnifierSize = 100; // 放大镜直径
      const magnifiedSize = magnifierSize * magnifierScale; // 放大后的尺寸
      
      // 创建放大区域
      ctx.save();
      ctx.beginPath();
      ctx.arc(magnifierPosition.x, magnifierPosition.y, magnifierSize / 2, 0, 2 * Math.PI);
      ctx.clip();
      
      // 绘制放大后的图像
      ctx.drawImage(
        imageRef.current,
        (magnifierPosition.x - magnifierSize / 2) * (naturalSize.width / imageDimensions.width),
        (magnifierPosition.y - magnifierSize / 2) * (naturalSize.height / imageDimensions.height),
        magnifierSize * (naturalSize.width / imageDimensions.width),
        magnifierSize * (naturalSize.height / imageDimensions.height),
        magnifierPosition.x - magnifiedSize / 2,
        magnifierPosition.y - magnifiedSize / 2,
        magnifiedSize,
        magnifiedSize
      );
      
      ctx.restore();
      
      // 绘制放大镜边框
      ctx.strokeStyle = '#1890ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(magnifierPosition.x, magnifierPosition.y, magnifierSize / 2, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // 查找点击位置的标注
  const findAnnotationAtPosition = (e) => {
    const { x, y } = getMousePosition(e);
    
    // 反向遍历，优先选择最后绘制的标注
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      const displayCoords = originalToDisplayCoords(annotation.x, annotation.y, annotation.width, annotation.height);
      
      if (
        x >= displayCoords.x &&
        x <= displayCoords.x + displayCoords.width &&
        y >= displayCoords.y &&
        y <= displayCoords.y + displayCoords.height
      ) {
        return annotation;
      }
    }
    
    return null;
  };

  // 鼠标移动事件
  const handleMouseMove = (e) => {
    if (drawing && currentAnnotation) {
      const { x, y } = getMousePosition(e);
      
      // 更新当前标注的尺寸
      const width = x - currentAnnotation.displayX;
      const height = y - currentAnnotation.displayY;
      
      setCurrentAnnotation({
        ...currentAnnotation,
        displayWidth: width,
        displayHeight: height,
        width: Math.round(width * (naturalSize.width / imageDimensions.width)),
        height: Math.round(height * (naturalSize.height / imageDimensions.height))
      });
    } else if (editingFourPoint !== false && editingAnnotation) {
      // 更新正在编辑的四点坐标
      const { x, y } = getMousePosition(e);
      const original = displayToOriginalCoords(x, y);
      
      const updatedPoints = [...editingAnnotation.fourPoints];
      updatedPoints[editingFourPoint] = { x: original.x, y: original.y };
      
      setEditingAnnotation({
        ...editingAnnotation,
        fourPoints: updatedPoints
      });
    }
    
    // 更新放大镜位置
    if (enableMagnifierTest) {
      const { x, y } = getMousePosition(e);
      setMagnifierPosition({ x, y });
    }
  };

  // 鼠标抬起事件
  const handleMouseUp = () => {
    if (drawing && currentAnnotation) {
      // 完成标注绘制
      if (Math.abs(currentAnnotation.displayWidth) > 5 && Math.abs(currentAnnotation.displayHeight) > 5) {
        // 调整坐标，确保宽度和高度为正值
        const finalAnnotation = {
          ...currentAnnotation,
          x: currentAnnotation.displayWidth < 0 ? 
            currentAnnotation.x + currentAnnotation.width : 
            currentAnnotation.x,
          y: currentAnnotation.displayHeight < 0 ? 
            currentAnnotation.y + currentAnnotation.height : 
            currentAnnotation.y,
          width: Math.abs(currentAnnotation.width),
          height: Math.abs(currentAnnotation.height),
          displayX: currentAnnotation.displayWidth < 0 ? 
            currentAnnotation.displayX + currentAnnotation.displayWidth : 
            currentAnnotation.displayX,
          displayY: currentAnnotation.displayHeight < 0 ? 
            currentAnnotation.displayY + currentAnnotation.displayHeight : 
            currentAnnotation.displayY,
          displayWidth: Math.abs(currentAnnotation.displayWidth),
          displayHeight: Math.abs(currentAnnotation.displayHeight)
        };
        
        setAnnotations([...annotations, finalAnnotation]);
        
        // 通知父组件
        if (onAnnotationAdd) {
          onAnnotationAdd(finalAnnotation);
        }
      }
      
      setDrawing(false);
      setCurrentAnnotation(null);
    } else if (editingFourPoint !== false) {
      // 完成四点编辑
      setEditingFourPoint(false);
    }
  };

  // 触摸事件处理
  const handleTouchStart = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      // 创建模拟的鼠标事件
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      
      handleMouseDown(mouseEvent);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      handleMouseMove(mouseEvent);
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    handleMouseUp();
  };

  // 生成透视变换预览
  const generatePerspectivePreview = async () => {
    if (fourPointsCoords.length !== 4) return;
    
    setPreviewLoading(true);
    
    try {
      // 构造请求数据
      const requestData = {
        imageUrl: imageUrl,
        points: fourPointsCoords.map(point => ({
          x: point.x,
          y: point.y
        })),
        quality: transformQuality
      };
      
      // 调用后端API生成透视变换图像
      const response = await fetch('/api/transform-perspective', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreviewImageUrl(data.transformedImageUrl);
      } else {
        throw new Error('生成透视变换图像失败');
      }
    } catch (error) {
      console.error('生成透视变换预览失败:', error);
      setPreviewImageUrl('');
    } finally {
      setPreviewLoading(false);
    }
  };

  // 创建四点标注
  const createFourPointAnnotation = () => {
    if (!previewImageUrl) return;
    
    // 创建一个新的标注
    const newAnnotation = {
      id: Date.now().toString(),
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      displayX: 0,
      displayY: 0,
      displayWidth: 0,
      displayHeight: 0,
      isFourPoint: true,
      fourPoints: fourPointsCoords.map(point => ({ x: point.x, y: point.y })),
      previewImageUrl: previewImageUrl
    };
    
    setAnnotations([...annotations, newAnnotation]);
    
    // 通知父组件
    if (onAnnotationAdd) {
      onAnnotationAdd(newAnnotation);
    }
    
    // 关闭预览窗口
    setPreviewVisible(false);
    // 清空四点坐标
    setFourPointsCoords([]);
  };

  // 清空四点坐标
  const clearFourPoints = () => {
    setFourPointsCoords([]);
  };

  // 重置标注
  const resetAnnotations = () => {
    setAnnotations([]);
    setSelectedAnnotation(null);
    setCurrentAnnotation(null);
    setDrawing(false);
    setFourPointsCoords([]);
  };

  // 编辑四点标注
  const editFourPointAnnotation = (annotation) => {
    if (annotation.fourPoints) {
      setEditingAnnotation(annotation);
      setAnnotationMode('fourPoint');
      setSelectedAnnotation(annotation);
    }
  };

  // 保存四点编辑
  const saveFourPointEdit = () => {
    if (editingAnnotation) {
      // 更新标注
      const updatedAnnotations = annotations.map(ann => 
        ann.id === editingAnnotation.id ? editingAnnotation : ann
      );
      
      setAnnotations(updatedAnnotations);
      
      // 通知父组件
      if (onAnnotationAdd) {
        onAnnotationAdd(editingAnnotation);
      }
      
      // 重置编辑状态
      setEditingAnnotation(null);
      setEditingFourPoint(false);
    }
  };



  // 组件挂载和更新时的副作用
  useEffect(() => {
    updateCanvasSize();
    drawAnnotations();
  }, [imageLoaded, annotations, currentAnnotation, drawing, selectedAnnotation, fourPointsCoords, showMagnifier, magnifierPosition, editingAnnotation, editingFourPoint]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      updateScale();
      updateCanvasSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageWidth]);

  // 监听主题变化
  useEffect(() => {
    drawAnnotations();
  }, [theme]);

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <div>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '12px' : '16px',
          fontSize: isMobile ? '18px' : '20px'
        }}>
          图像标注工具
        </h3>
        
        {/* 控制面板 */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: isMobile ? '8px' : '12px', 
          marginBottom: isMobile ? '12px' : '16px',
          padding: isMobile ? '8px' : '12px',
          backgroundColor: '#f5f5f5',
          borderRadius: '6px'
        }}>
          <Radio.Group 
            value={annotationMode} 
            onChange={(e) => {
              setAnnotationMode(e.target.value);
              if (e.target.value !== 'fourPoint') {
                setEditingAnnotation(null);
                setEditingFourPoint(false);
              }
            }}
            size={isMobile ? "small" : "default"}
          >
            <Radio.Button value="rectangle">
              <Tooltip title="矩形框选模式">
                <BorderOutlined /> {isMobile ? '' : '矩形框选'}
              </Tooltip>
            </Radio.Button>
            <Radio.Button value="fourPoint">
              <Tooltip title="四点定位模式">
                <DragOutlined /> {isMobile ? '' : '四点定位'}
              </Tooltip>
            </Radio.Button>
          </Radio.Group>
          
          <Button 
            onClick={resetAnnotations}
            size={isMobile ? "small" : "default"}
            style={{ 
              padding: isMobile ? '0 12px' : '0 15px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            {isMobile ? '重置' : '重置标注'}
          </Button>
          
          {annotationMode === 'fourPoint' && (
            <>
              <Button 
                onClick={clearFourPoints}
                disabled={fourPointsCoords.length === 0}
                size={isMobile ? "small" : "default"}
                style={{ 
                  padding: isMobile ? '0 12px' : '0 15px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {isMobile ? '清空' : '清空点'}
              </Button>
              <Button 
                onClick={() => {
                  if (fourPointsCoords.length === 4) {
                    generatePerspectivePreview();
                    setPreviewVisible(true);
                  }
                }}
                disabled={fourPointsCoords.length !== 4}
                type="primary"
                size={isMobile ? "small" : "default"}
                style={{ 
                  padding: isMobile ? '0 12px' : '0 15px',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                {isMobile ? '预览' : '预览效果'}
              </Button>
            </>
          )}
          
          {editingAnnotation && (
            <Button 
              onClick={saveFourPointEdit}
              type="primary"
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 12px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              保存编辑
            </Button>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>缩放:</span>
            <Button 
              icon={<ZoomOutOutlined />} 
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 8px' : '0 12px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            />
            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button 
              icon={<ZoomInOutlined />} 
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 8px' : '0 12px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>放大镜:</span>
            <Switch 
              checked={enableMagnifierTest} 
              onChange={setEnableMagnifierTest}
              size={isMobile ? "small" : "default"}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>OCR测试:</span>
            <Switch 
              checked={enableOcrTest} 
              onChange={setEnableOcrTest}
              size={isMobile ? "small" : "default"}
            />
          </div>
        </div>
        
        {/* 画布容器 */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: isMobile ? '100%' : `${canvasSize.width}px`,
          margin: '0 auto',
          overflow: 'hidden',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          {/* 隐藏的图片用于获取原始尺寸 */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="需要标注的图片"
            style={{ display: 'none' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* 隐藏的canvas用于生成预览图片 */}
          <canvas
            ref={previewCanvasRef}
            style={{ display: 'none' }}
          />
          
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ 
              display: 'block',
              width: '100%',
              height: 'auto',
              maxWidth: `${canvasSize.width}px`,
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: annotationMode === 'rectangle' ? 'crosshair' : 'pointer',
              imageRendering: 'auto',
              touchAction: 'none'
            }}
            onMouseDown={imageLoaded ? handleMouseDown : undefined}
            onMouseMove={imageLoaded ? handleMouseMove : undefined}
            onMouseUp={imageLoaded ? handleMouseUp : undefined}
            onMouseEnter={() => enableMagnifierTest && setShowMagnifier(true)}
            onMouseLeave={(e) => {
              if (imageLoaded) handleMouseUp(e);
              if (enableMagnifierTest) setShowMagnifier(false);
            }}
            onTouchStart={imageLoaded ? handleTouchStart : undefined}
            onTouchMove={imageLoaded ? handleTouchMove : undefined}
            onTouchEnd={imageLoaded ? handleTouchEnd : undefined}
            onTouchCancel={imageLoaded ? handleTouchEnd : undefined}
          />
          
          {/* 错误提示 */}
          {imageError && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '20px',
              textAlign: 'center',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              图片加载失败
            </div>
          )}
        </div>
        
        {/* 标注信息 */}
        <div style={{ 
          marginTop: isMobile ? '8px' : '10px', 
          fontSize: isMobile ? '12px' : '14px', 
          color: '#666' 
        }}>
          {imageLoaded ? (
            <>
              <p>
                操作说明: {
                  annotationMode === 'rectangle' 
                    ? '点击并拖动鼠标在图片上框选要标注的字体' 
                    : editingAnnotation 
                      ? '拖拽控制点来调整四点位置，完成后点击"保存编辑"' 
                      : '点击图片添加4个点来标记透视校正区域，然后点击"预览效果"查看校正结果，满意后点击"创建透视标注"'
                }
              </p>
              <p>原始图片尺寸: {imageRef.current?.naturalWidth} × {imageRef.current?.naturalHeight}，显示比例: {Math.round(scale * 100)}%</p>
              {selectedAnnotation && (
                <p>
                  已选择标注: {selectedAnnotation.characterName || '未命名'}，
                  位置 ({selectedAnnotation.x}, {selectedAnnotation.y})，
                  尺寸 {selectedAnnotation.width} × {selectedAnnotation.height}
                </p>
              )}
            </>
          ) : imageError ? (
            <p>图片加载失败，请检查图片路径或刷新页面重试</p>
          ) : (
            <p>图片加载中...</p>
          )}
        </div>
        
        {/* 透视变换预览模态窗口 */}
        <Modal
          title="透视变换预览"
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={[
            <Button 
              key="back" 
              onClick={() => setPreviewVisible(false)}
              size={isMobile ? "small" : "default"}
            >
              取消
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={createFourPointAnnotation}
              size={isMobile ? "small" : "default"}
            >
              确认创建标注
            </Button>
          ]}
          width={isMobile ? '90%' : 800}
        >
          <Spin spinning={previewLoading}>
            <div style={{ textAlign: 'center' }}>
              {previewImageUrl && (
                <>
                  <img 
                    src={previewImageUrl} 
                    alt="透视校正预览" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: isMobile ? '300px' : '500px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px'
                    }} 
                  />
                  <div style={{ marginTop: isMobile ? '16px' : '20px' }}>
                    <p style={{ 
                      marginBottom: isMobile ? '6px' : '8px',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      预览图像质量 ({transformQuality}%)
                    </p>
                    <Slider 
                      min={10} 
                      max={100} 
                      defaultValue={transformQuality} 
                      onChange={(value) => setTransformQuality(value)} 
                      onAfterChange={() => generatePerspectivePreview()}
                      marks={{ 10: '低', 50: '中', 100: '高' }}
                    />
                  </div>
                </>
              )}
            </div>
          </Spin>
        </Modal>
      </div>
    </div>
  );
};

export default CanvasAnnotator;