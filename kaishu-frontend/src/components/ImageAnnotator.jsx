import React, { useState, useRef, useEffect } from 'react';
import { Button, Radio, Tooltip } from 'antd';
import { BorderOutlined, DragOutlined } from '@ant-design/icons';
import './ImageAnnotator.css';

const ImageAnnotator = ({ 
  imageUrl, 
  initialAnnotations = [], 
  onAnnotationAdd, 
  onAnnotationSelect,
  imageWidth = 800
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
  // 添加移动端检测状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  // 添加响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
    if (imageRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const imgNaturalWidth = imageRef.current.naturalWidth;
      const imgNaturalHeight = imageRef.current.naturalHeight;
      
      // 保存原始尺寸信息
      setNaturalSize({
        width: imgNaturalWidth,
        height: imgNaturalHeight
      });
      
      // 如果图片太宽，需要缩放
      if (imgNaturalWidth > imageWidth) {
        const newScale = imageWidth / imgNaturalWidth;
        setScale(newScale);
        setImageDimensions({
          width: imgNaturalWidth * newScale,
          height: imgNaturalHeight * newScale
        });
      } else {
        setScale(1);
        setImageDimensions({
          width: imgNaturalWidth,
          height: imgNaturalHeight
        });
      }
    }
  };

  // 图片加载处理
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    updateScale();
  };

  // 图片加载错误处理
  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
    console.error('图片加载失败:', imageUrl);
  };

  // 获取鼠标相对于图片的坐标
  const getMousePosition = (e) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    
    // 计算鼠标相对于图片的坐标
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height))
    };
  };
  
  // 从显示坐标转换为原始图片坐标
  const displayToOriginalCoords = (displayX, displayY) => {
    if (!naturalSize.width || !naturalSize.height) return { x: displayX, y: displayY };
    
    return {
      x: Math.round(displayX * (naturalSize.width / imageDimensions.width)),
      y: Math.round(displayY * (naturalSize.height / imageDimensions.height))
    };
  };
  
  // 从原始图片坐标转换为显示坐标
  const originalToDisplayCoords = (originalX, originalY, originalWidth, originalHeight) => {
    if (!naturalSize.width || !naturalSize.height) {
      return { x: originalX, y: originalY, width: originalWidth, height: originalHeight };
    }
    
    return {
      x: Math.round(originalX * (imageDimensions.width / naturalSize.width)),
      y: Math.round(originalY * (imageDimensions.height / naturalSize.height)),
      width: originalWidth ? Math.round(originalWidth * (imageDimensions.width / naturalSize.width)) : undefined,
      height: originalHeight ? Math.round(originalHeight * (imageDimensions.height / naturalSize.height)) : undefined
    };
  };

  // 鼠标按下事件 - 开始绘制或添加四点坐标
  const handleMouseDown = (e) => {
    if (annotationMode === 'rectangle') {
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

  // 鼠标移动事件 - 更新绘制中的标注
  const handleMouseMove = (e) => {
    if (annotationMode === 'rectangle' && drawing && currentAnnotation) {
      const { x, y } = getMousePosition(e);
      
      // 计算显示尺寸
      const displayWidth = Math.max(0, x - currentAnnotation.displayX);
      const displayHeight = Math.max(0, y - currentAnnotation.displayY);
      
      // 转换为原始图片尺寸
      const originalCoords = displayToOriginalCoords(
        currentAnnotation.displayX + displayWidth,
        currentAnnotation.displayY + displayHeight
      );
      
      const originalWidth = Math.max(0, originalCoords.x - currentAnnotation.x);
      const originalHeight = Math.max(0, originalCoords.y - currentAnnotation.y);
      
      setCurrentAnnotation({
        ...currentAnnotation,
        width: originalWidth,
        height: originalHeight,
        displayWidth,
        displayHeight
      });
    }
  };

  // 鼠标抬起事件 - 完成绘制
  const handleMouseUp = () => {
    if (annotationMode === 'rectangle' && drawing && currentAnnotation) {
      // 只有当宽高都大于10像素时才视为有效标注
      if (currentAnnotation.displayWidth > 10 && currentAnnotation.displayHeight > 10) {
        const newAnnotation = {
          id: currentAnnotation.id,
          x: currentAnnotation.x,
          y: currentAnnotation.y,
          width: currentAnnotation.width,
          height: currentAnnotation.height
        };
        
        // 确保标注不超出图片范围
        if (newAnnotation.x + newAnnotation.width > naturalSize.width) {
          newAnnotation.width = naturalSize.width - newAnnotation.x;
        }
        
        if (newAnnotation.y + newAnnotation.height > naturalSize.height) {
          newAnnotation.height = naturalSize.height - newAnnotation.y;
        }
        
        // 确保宽度和高度不为负数
        newAnnotation.width = Math.max(0, newAnnotation.width);
        newAnnotation.height = Math.max(0, newAnnotation.height);
        
        const updatedAnnotations = [...annotations, newAnnotation];
        setAnnotations(updatedAnnotations);
        
        // 调用回调函数
        if (onAnnotationAdd) {
          onAnnotationAdd(newAnnotation);
        }
        
        // 选中新创建的标注
        setSelectedAnnotation(newAnnotation);
        if (onAnnotationSelect) {
          onAnnotationSelect(newAnnotation);
        }
      }
    }
    
    setDrawing(false);
    setCurrentAnnotation(null);
  };
  
  // 创建四点标注
  const createFourPointAnnotation = () => {
    if (fourPointsCoords.length !== 4) {
      return;
    }
    
    // 找出四个点构成的边界框
    let minX = Math.min(...fourPointsCoords.map(p => p.x));
    let minY = Math.min(...fourPointsCoords.map(p => p.y));
    let maxX = Math.max(...fourPointsCoords.map(p => p.x));
    let maxY = Math.max(...fourPointsCoords.map(p => p.y));
    
    // 创建新的标注
    const newAnnotation = {
      id: Date.now().toString(),
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      // 保存原始的四点坐标，用于精确裁剪
      fourPoints: fourPointsCoords.map(p => ({ x: p.x, y: p.y }))
    };
    
    // 确保标注不超出图片范围
    if (newAnnotation.x + newAnnotation.width > naturalSize.width) {
      newAnnotation.width = naturalSize.width - newAnnotation.x;
    }
    
    if (newAnnotation.y + newAnnotation.height > naturalSize.height) {
      newAnnotation.height = naturalSize.height - newAnnotation.y;
    }
    
    // 确保宽度和高度不为负数
    newAnnotation.width = Math.max(0, newAnnotation.width);
    newAnnotation.height = Math.max(0, newAnnotation.height);
    
    // 更新标注列表
    const updatedAnnotations = [...annotations, newAnnotation];
    setAnnotations(updatedAnnotations);
    
    // 调用回调函数
    if (onAnnotationAdd) {
      onAnnotationAdd(newAnnotation);
    }
    
    // 选中新创建的标注
    setSelectedAnnotation(newAnnotation);
    if (onAnnotationSelect) {
      onAnnotationSelect(newAnnotation);
    }
    
    // 清空四点坐标
    setFourPointsCoords([]);
  };
  
  // 取消四点标注
  const cancelFourPointAnnotation = () => {
    setFourPointsCoords([]);
  };
  
  // 在当前位置查找标注
  const findAnnotationAtPosition = (e) => {
    const { x, y } = getMousePosition(e);
    
    // 从后往前检查，这样可以优先选择最上层的标注
    for (let i = annotations.length - 1; i >= 0; i--) {
      const annotation = annotations[i];
      
      // 计算标注在显示尺寸中的位置
      const scaled = originalToDisplayCoords(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );
      
      if (
        x >= scaled.x && 
        x <= scaled.x + scaled.width && 
        y >= scaled.y && 
        y <= scaled.y + scaled.height
      ) {
        return annotation;
      }
    }
    
    return null;
  };
  
  // 将原始尺寸转换为显示尺寸
  const scaleAnnotation = (annotation) => {
    return originalToDisplayCoords(annotation.x, annotation.y, annotation.width, annotation.height);
  };

  return (
    <div className="image-annotator" style={{ position: 'relative', width: '100%', maxWidth: `${imageWidth}px` }}>
      <div style={{ marginBottom: isMobile ? '8px' : '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Radio.Group 
          value={annotationMode} 
          onChange={(e) => {
            setAnnotationMode(e.target.value);
            setFourPointsCoords([]);
          }}
          size={isMobile ? "small" : "default"}
        >
          <Tooltip title="矩形框选">
            <Radio.Button value="rectangle">
              <BorderOutlined /> {isMobile ? '' : '矩形框选'}
            </Radio.Button>
          </Tooltip>
          <Tooltip title="四点定位">
            <Radio.Button value="fourPoint">
              <DragOutlined /> {isMobile ? '' : '四点定位'}
            </Radio.Button>
          </Tooltip>
        </Radio.Group>
        
        {annotationMode === 'fourPoint' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}>
            <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
              已选择 {fourPointsCoords.length}/4 个点
            </span>
            <Button 
              type="primary" 
              disabled={fourPointsCoords.length !== 4}
              onClick={createFourPointAnnotation}
              size={isMobile ? "small" : "default"}
              style={{ 
                padding: isMobile ? '0 12px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {isMobile ? '创建' : '创建四点标注'}
            </Button>
            <Button 
              style={{ 
                marginLeft: isMobile ? '4px' : '8px',
                padding: isMobile ? '0 12px' : '0 15px',
                fontSize: isMobile ? '12px' : '14px'
              }}
              onClick={cancelFourPointAnnotation}
              disabled={fourPointsCoords.length === 0}
              size={isMobile ? "small" : "default"}
            >
              {isMobile ? '清空' : '清除点'}
            </Button>
          </div>
        )}
      </div>
      
      <div 
        ref={containerRef} 
        className="image-annotator-container"
        style={{ 
          position: 'relative', 
          overflow: 'hidden', 
          maxWidth: '100%',
          borderRadius: isMobile ? '4px' : '8px'
        }}
        onMouseDown={imageLoaded ? handleMouseDown : undefined}
        onMouseMove={imageLoaded ? handleMouseMove : undefined}
        onMouseUp={imageLoaded ? handleMouseUp : undefined}
        onMouseLeave={imageLoaded ? handleMouseUp : undefined}
      >
        {/* 图片 */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="需要标注的图片"
          style={{ 
            display: 'block',
            maxWidth: '100%',
            height: 'auto'
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
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
            padding: isMobile ? '12px' : '20px',
            textAlign: 'center',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            图片加载失败
          </div>
        )}
        
        {/* 四点定位模式下的点 */}
        {imageLoaded && annotationMode === 'fourPoint' && fourPointsCoords.map((point, index) => (
          <div
            key={`point-${index}`}
            className="annotation-point"
            style={{
              position: 'absolute',
              top: `${point.displayY - (isMobile ? 4 : 5)}px`,
              left: `${point.displayX - (isMobile ? 4 : 5)}px`,
              width: isMobile ? '8px' : '10px',
              height: isMobile ? '8px' : '10px',
              borderRadius: '50%',
              backgroundColor: '#ff3d00',
              cursor: 'pointer',
              zIndex: 30,
            }}
          />
        ))}
        
        {/* 四点定位模式下的连线 */}
        {imageLoaded && annotationMode === 'fourPoint' && fourPointsCoords.length >= 2 && 
          fourPointsCoords.map((point, index) => {
            // 如果是最后一个点并且不足4个点，不画最后一条连线
            if (index === fourPointsCoords.length - 1 && fourPointsCoords.length < 4) {
              return null;
            }
            
            const nextPoint = index === fourPointsCoords.length - 1 ? 
              fourPointsCoords[0] : // 闭合连线
              fourPointsCoords[index + 1];
            
            // 计算线的长度和角度
            const dx = nextPoint.displayX - point.displayX;
            const dy = nextPoint.displayY - point.displayY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            return (
              <div
                key={`line-${index}`}
                style={{
                  position: 'absolute',
                  top: `${point.displayY}px`,
                  left: `${point.displayX}px`,
                  width: `${length}px`,
                  height: isMobile ? '1px' : '2px',
                  backgroundColor: '#ff3d00',
                  transformOrigin: '0 0',
                  transform: `rotate(${angle}deg)`,
                  zIndex: 25,
                }}
              />
            );
          })
        }
        
        {/* 已有标注 */}
        {imageLoaded && annotations.map(annotation => {
          const scaled = scaleAnnotation(annotation);
          const isSelected = selectedAnnotation && selectedAnnotation.id === annotation.id;
          
          return (
            <div
              key={annotation.id}
              className={`annotation-box ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                top: `${scaled.y}px`,
                left: `${scaled.x}px`,
                width: `${scaled.width}px`,
                height: `${scaled.height}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnotation(annotation);
                if (onAnnotationSelect) {
                  onAnnotationSelect(annotation);
                }
              }}
            />
          );
        })}
        
        {/* 当前正在绘制的标注 */}
        {drawing && currentAnnotation && (
          <div
            className="annotation-drawing"
            style={{
              position: 'absolute',
              top: `${currentAnnotation.displayY}px`,
              left: `${currentAnnotation.displayX}px`,
              width: `${currentAnnotation.displayWidth}px`,
              height: `${currentAnnotation.displayHeight}px`,
            }}
          />
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
            <p style={{ margin: isMobile ? '4px 0' : '6px 0' }}>
              操作说明: {
                annotationMode === 'rectangle' 
                  ? '点击并拖动鼠标在图片上框选要标注的字体' 
                  : '点击图片添加4个点来标记要标注的区域，然后点击"创建四点标注"'
              }
            </p>
            <p style={{ margin: isMobile ? '4px 0' : '6px 0' }}>
              原始图片尺寸: {imageRef.current?.naturalWidth} × {imageRef.current?.naturalHeight}，
              显示比例: {Math.round(scale * 100)}%
            </p>
            {selectedAnnotation && (
              <p style={{ margin: isMobile ? '4px 0' : '6px 0' }}>
                已选择标注: ID {selectedAnnotation.id.slice(-4)}，
                位置 ({selectedAnnotation.x}, {selectedAnnotation.y})，
                尺寸 {selectedAnnotation.width} × {selectedAnnotation.height}
              </p>
            )}
          </>
        ) : imageError ? (
          <p style={{ fontSize: isMobile ? '14px' : '16px' }}>图片加载失败，请检查图片路径或刷新页面重试</p>
        ) : (
          <p style={{ fontSize: isMobile ? '14px' : '16px' }}>图片加载中...</p>
        )}
      </div>
    </div>
  );
};

export default ImageAnnotator;