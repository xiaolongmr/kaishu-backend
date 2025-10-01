import React, { useRef, useEffect, useState } from 'react';
import { Button, Card, List, Typography, Space, Checkbox, Tag } from 'antd';
import { CheckCircleOutlined, CloseOutlined, FilterOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const OcrCanvasViewer = ({ imageUrl, ocrResults, onConfirm }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null); // 用于存储图片元素
  const [selectedResults, setSelectedResults] = useState([]);
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [scale, setScale] = useState(1); // 存储缩放比例

  // 初始化选中所有高置信度结果
  useEffect(() => {
    const highConfidenceResults = ocrResults.filter(item => item.confidence >= 80);
    setSelectedResults(highConfidenceResults.map(item => item.id));
  }, [ocrResults]);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      imageRef.current = img; // 保存图片引用
      
      // 设置canvas尺寸为固定大小或根据容器调整
      const maxWidth = 800; // 最大宽度
      const scale = Math.min(1, maxWidth / img.width); // 计算缩放比例
      setScale(scale); // 保存缩放比例用于坐标转换
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 绘制OCR结果框（需要根据缩放比例调整坐标）
      ocrResults.forEach((result) => {
        // 只显示选中的结果
        if (selectedResults.includes(result.id)) {
          // 根据缩放比例调整坐标和尺寸
          const scaledX = result.x * scale;
          const scaledY = result.y * scale;
          const scaledWidth = result.width * scale;
          const scaledHeight = result.height * scale;
          
          ctx.strokeStyle = '#1890ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

          // 绘制文字
          ctx.fillStyle = '#1890ff';
          ctx.font = '14px Arial';
          ctx.fillText(result.text, scaledX, scaledY - 5);
        }
      });
    };

    img.src = imageUrl;
  }, [imageUrl, ocrResults, selectedResults]);

  const handleResultToggle = (id) => {
    if (selectedResults.includes(id)) {
      setSelectedResults(selectedResults.filter(item => item !== id));
    } else {
      setSelectedResults([...selectedResults, id]);
    }
  };

  const handleConfirm = () => {
    // 过滤出选中的结果
    const confirmedResults = ocrResults.filter(item => selectedResults.includes(item.id));
    onConfirm(confirmedResults);
  };

  const filteredResults = showLowConfidence 
    ? ocrResults 
    : ocrResults.filter(item => item.confidence >= 80);

  return (
    <Card 
      title="OCR识别结果预览" 
      extra={
        <Space>
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={handleConfirm}
          >
            确认并上传
          </Button>
        </Space>
      }
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <canvas 
          ref={canvasRef} 
          style={{ maxWidth: '100%', border: '1px solid #ddd' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <Space>
          <Checkbox 
            checked={showLowConfidence}
            onChange={(e) => setShowLowConfidence(e.target.checked)}
          >
            显示低置信度结果
          </Checkbox>
          <Text type="secondary">
            已选中 {selectedResults.length} 个字符
          </Text>
        </Space>
      </div>
      
      <Title level={5}>识别到的字符:</Title>
      <List
        dataSource={filteredResults}
        renderItem={(item) => (
          <List.Item 
            actions={[
              <Checkbox 
                checked={selectedResults.includes(item.id)}
                onChange={() => handleResultToggle(item.id)}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{item.text}</Text>
                  {item.originalText && item.originalText !== item.text && (
                    <Text type="secondary" delete>
                      {item.originalText}
                    </Text>
                  )}
                  <Tag color={item.confidence >= 90 ? 'green' : item.confidence >= 80 ? 'orange' : 'red'}>
                    置信度: {item.confidence}%
                  </Tag>
                  {item.originalText && item.originalText !== item.text && (
                    <Tag color="blue">已纠正</Tag>
                  )}
                </Space>
              }
              description={`位置: (${item.x}, ${item.y}) 尺寸: ${item.width}x${item.height}`}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default OcrCanvasViewer;