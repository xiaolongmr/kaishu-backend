---
trigger: manual
alwaysApply: false
---
# 字体标注Canvas规范

## 1. Canvas基础规范

### 1.1 Canvas元素创建
- 必须使用React的useRef钩子创建Canvas引用
- Canvas元素需要设置明确的width和height属性
- 使用useEffect钩子在组件挂载后获取Canvas上下文
- canvas尺寸固定大小,支持鼠标滚轮放大内容,像ps一样, 空格拖拽画布,支持反复修改
- 四点定位模式像ps的透视一样，透视矫正完成后的字是一个正方形的
- 支持显示在线编辑人
- 支持作品的调整，像ps一样可以调整以为拍摄角度变形的作品

```javascript
const canvasRef = useRef(null);
const ctxRef = useRef(null);

useEffect(() => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  ctxRef.current = ctx;
}, []);
```

### 1.2 Canvas尺寸管理
- Canvas尺寸应根据图像实际尺寸和显示区域进行适配
- 需要处理设备像素比(DPR)以确保高分辨率屏幕下的清晰度
- 实现响应式Canvas尺寸调整

```javascript
const setupCanvas = (canvas, imageWidth, imageHeight) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = imageWidth * dpr;
  canvas.height = imageHeight * dpr;
  canvas.style.width = imageWidth + 'px';
  canvas.style.height = imageHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
};
```

## 2. Canvas绘图API规范

### 2.1 坐标系统
- 使用Canvas默认坐标系统(左上角为原点)
- 实现坐标转换函数处理图像坐标与Canvas坐标的映射
- 支持缩放和偏移后的坐标计算

### 2.2 标注绘制
- 矩形标注使用strokeRect方法绘制边框
- 四点标注使用beginPath/moveTo/lineTo/closePath/stroke方法绘制路径
- 标注高亮使用不同的颜色和线宽区分

```javascript
// 绘制矩形标注
ctx.strokeStyle = '#1890ff';
ctx.lineWidth = 2;
ctx.strokeRect(x, y, width, height);

// 绘制四点标注
ctx.beginPath();
ctx.moveTo(points[0].x, points[0].y);
for (let i = 1; i < points.length; i++) {
  ctx.lineTo(points[i].x, points[i].y);
}
ctx.closePath();
ctx.stroke();
```

### 2.3 交互处理
- 实现mousedown、mousemove、mouseup事件处理标注绘制
- 添加鼠标悬停效果提升用户体验
- 实现标注选择和编辑功能

## 3. Canvas性能优化

### 3.1 重绘优化
- 只在必要时进行Canvas重绘
- 使用requestAnimationFrame优化动画性能
- 实现脏矩形渲染减少绘制区域

### 3.2 内存管理
- 及时清理不需要的图像对象
- 避免频繁创建Canvas上下文
- 合理使用Canvas离屏缓冲

## 4. Canvas标注功能规范

### 4.1 标注模式
- 支持矩形框选模式和四点定位模式
- 实现模式切换功能
- 保存标注数据时区分不同模式

### 4.2 标注数据结构
```javascript
// 矩形标注数据
const rectangleAnnotation = {
  id: 'unique_id',
  type: 'rectangle',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  character: '字'
};

// 四点标注数据
const fourPointAnnotation = {
  id: 'unique_id',
  type: 'fourPoint',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
  ],
  character: '字'
};
```

### 4.3 标注操作
- 支持标注的添加、编辑、删除操作
- 实现标注的选中和取消选中
- 提供标注数据的导入和导出功能

## 5. Canvas错误处理

### 5.1 兼容性处理
- 检查浏览器是否支持Canvas
- 提供降级方案处理不支持Canvas的环境
- 处理不同浏览器Canvas实现差异

### 5.2 异常处理
- 捕获Canvas操作异常
- 提供友好的错误提示
- 记录错误日志便于调试

## 6. Canvas测试规范

### 6.1 单元测试
- 测试Canvas上下文创建
- 验证坐标转换函数正确性
- 测试标注绘制功能

### 6.2 集成测试
- 测试完整的标注流程
- 验证标注数据的正确性
- 测试Canvas与其他组件的交互

---
trigger: manual