/**
 * Canvas管理器
 * 负责Canvas的创建、图像加载、绘制和交互处理
 */

class CanvasManager {
  constructor(container, eventBus, options = {}) {
    this.container = container;
    this.eventBus = eventBus;
    this.options = {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      ...options
    };
    
    // Canvas相关
    this.canvas = null;
    this.context = null;
    this.imageElement = null;
    
    // 图像状态
    this.imageLoaded = false;
    this.imageSize = { width: 0, height: 0 };
    this.imagePosition = { x: 0, y: 0 };
    this.imageScale = 1;
    
    // 交互状态
    this.isDragging = false;
    this.lastMousePosition = { x: 0, y: 0 };
    this.eventListeners = new Map();
    
    // 绘制层
    this.layers = new Map();
    this.layerOrder = [];
    
    this.debug = false;
  }
  
  /**
   * 初始化Canvas
   */
  init() {
    this.createCanvas();
    this.setupEventListeners();
    this.setupLayers();
    
    if (this.debug) {
      console.log('[CanvasManager] Canvas initialized');
    }
  }
  
  /**
   * 创建Canvas元素
   */
  createCanvas() {
    // 创建Canvas元素
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.canvas.style.border = '1px solid #ddd';
    this.canvas.style.cursor = 'crosshair';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    
    // 获取2D上下文
    this.context = this.canvas.getContext('2d');
    
    // 添加到容器
    this.container.appendChild(this.canvas);
    
    // 设置高DPI支持
    this.setupHighDPI();
    
    // 初始绘制
    this.clear();
  }
  
  /**
   * 设置高DPI支持
   */
  setupHighDPI() {
    const dpr = window.devicePixelRatio || 1;
    
    // 使用选项中的尺寸
    const displayWidth = this.options.width;
    const displayHeight = this.options.height;
    
    // 设置实际大小
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;
    
    // 设置CSS大小
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
    
    // 缩放上下文
    this.context.scale(dpr, dpr);
    
    // 保存显示尺寸供后续使用
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // 触摸事件（移动端支持）
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 键盘事件
    this.canvas.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.canvas.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // 使Canvas可以接收键盘事件
    this.canvas.tabIndex = 0;
  }
  
  /**
   * 设置绘制层
   */
  setupLayers() {
    // 背景层
    this.addLayer('background', 0, (ctx) => {
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    });
    
    // 图像层
    this.addLayer('image', 1, (ctx) => {
      if (this.imageLoaded && this.imageElement) {
        this.drawImage(ctx);
      }
    });
    
    // 标注层
    this.addLayer('annotations', 2, (ctx) => {
      this.drawAnnotations(ctx);
    });
    
    // 工具层
    this.addLayer('tools', 3, (ctx) => {
      this.drawTools(ctx);
    });
  }
  
  /**
   * 添加绘制层
   * @param {string} name - 层名称
   * @param {number} zIndex - 层级
   * @param {Function} drawFunction - 绘制函数
   */
  addLayer(name, zIndex, drawFunction) {
    this.layers.set(name, {
      zIndex,
      drawFunction,
      visible: true
    });
    
    // 更新层级顺序
    this.updateLayerOrder();
  }
  
  /**
   * 移除绘制层
   * @param {string} name - 层名称
   */
  removeLayer(name) {
    this.layers.delete(name);
    this.updateLayerOrder();
  }
  
  /**
   * 更新层级顺序
   */
  updateLayerOrder() {
    this.layerOrder = Array.from(this.layers.entries())
      .sort(([, a], [, b]) => a.zIndex - b.zIndex)
      .map(([name]) => name);
  }
  
  /**
   * 加载图像
   * @param {string} url - 图像URL
   */
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      this.eventBus.emit('image:loading', { url });
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.imageElement = img;
        this.imageSize = { width: img.naturalWidth, height: img.naturalHeight };
        this.imageLoaded = true;
        
        // 自动调整图像位置和缩放
        this.fitImageToCanvas();
        
        // 重绘Canvas
        this.redraw();
        
        if (this.debug) {
          console.log('[CanvasManager] Image loaded:', {
            url,
            size: this.imageSize,
            scale: this.imageScale
          });
        }
        
        this.eventBus.emit('image:loaded', {
          url,
          size: this.imageSize,
          scale: this.imageScale
        });
        
        resolve(img);
      };
      
      img.onerror = (error) => {
        this.imageLoaded = false;
        console.error('[CanvasManager] Failed to load image:', error);
        this.eventBus.emit('image:error', { url, error });
        reject(error);
      };
      
      img.src = url;
    });
  }
  
  /**
   * 适应图像到Canvas
   */
  fitImageToCanvas() {
    if (!this.imageElement) return;
    
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const imageWidth = this.imageSize.width;
    const imageHeight = this.imageSize.height;
    
    // 计算缩放比例
    const scaleX = canvasWidth / imageWidth;
    const scaleY = canvasHeight / imageHeight;
    this.imageScale = Math.min(scaleX, scaleY, 1); // 不放大图像
    
    // 计算居中位置
    const scaledWidth = imageWidth * this.imageScale;
    const scaledHeight = imageHeight * this.imageScale;
    this.imagePosition = {
      x: (canvasWidth - scaledWidth) / 2,
      y: (canvasHeight - scaledHeight) / 2
    };
  }
  
  /**
   * 绘制图像
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  drawImage(ctx) {
    if (!this.imageElement || !this.imageLoaded) return;
    
    const scaledWidth = this.imageSize.width * this.imageScale;
    const scaledHeight = this.imageSize.height * this.imageScale;
    
    ctx.drawImage(
      this.imageElement,
      this.imagePosition.x,
      this.imagePosition.y,
      scaledWidth,
      scaledHeight
    );
  }
  
  /**
   * 绘制标注
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  drawAnnotations(ctx) {
    // 这里会被插件系统调用来绘制标注
    this.eventBus.emit('canvas:drawAnnotations', { ctx });
  }
  
  /**
   * 绘制工具
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  drawTools(ctx) {
    // 这里会被插件系统调用来绘制工具
    this.eventBus.emit('canvas:drawTools', { ctx });
  }
  
  /**
   * 清除Canvas
   */
  clear() {
    if (!this.context) return;
    
    // 使用显示尺寸而不是实际Canvas尺寸
    const width = this.displayWidth || this.options.width;
    const height = this.displayHeight || this.options.height;
    
    this.context.clearRect(0, 0, width, height);
  }
  
  /**
   * 重绘Canvas
   */
  redraw() {
    if (!this.context) return;
    
    // 保存当前上下文状态
    this.context.save();
    
    this.clear();
    
    // 按层级顺序绘制
    for (const layerName of this.layerOrder) {
      const layer = this.layers.get(layerName);
      if (layer && layer.visible) {
        try {
          layer.drawFunction(this.context);
        } catch (error) {
          console.error(`[CanvasManager] 绘制层 ${layerName} 时出错:`, error);
        }
      }
    }
    
    // 恢复上下文状态
    this.context.restore();
    
    this.eventBus.emit('canvas:redrawn');
  }
  
  /**
   * 获取Canvas上下文
   */
  getContext() {
    return this.context;
  }
  
  /**
   * 获取Canvas尺寸
   */
  getSize() {
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }
  
  /**
   * 设置Canvas尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.options.width = width;
    this.options.height = height;
    
    // 重新适应图像
    if (this.imageLoaded) {
      this.fitImageToCanvas();
    }
    
    this.redraw();
    this.eventBus.emit('canvas:resize', { width, height });
  }
  
  /**
   * 获取图像尺寸
   */
  getImageSize() {
    return this.imageSize;
  }
  
  /**
   * 获取图像缩放比例
   */
  getScale() {
    return this.imageScale;
  }
  
  /**
   * 设置图像缩放比例
   * @param {number} scale - 缩放比例
   */
  setScale(scale) {
    this.imageScale = Math.max(0.1, Math.min(5, scale)); // 限制缩放范围
    this.redraw();
    this.eventBus.emit('image:scaleChanged', { scale: this.imageScale });
  }
  
  /**
   * 获取图像位置
   */
  getImagePosition() {
    return this.imagePosition;
  }
  
  /**
   * 设置图像位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  setImagePosition(x, y) {
    this.imagePosition = { x, y };
    this.redraw();
    this.eventBus.emit('image:positionChanged', { position: this.imagePosition });
  }
  
  /**
   * 获取图像数据
   */
  getImageData() {
    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * 设置图像数据
   * @param {ImageData} imageData - 图像数据
   */
  putImageData(imageData) {
    this.context.putImageData(imageData, 0, 0);
  }
  
  /**
   * 坐标转换：Canvas坐标到图像坐标
   * @param {number} canvasX - Canvas X坐标
   * @param {number} canvasY - Canvas Y坐标
   */
  canvasToImage(canvasX, canvasY) {
    const imageX = (canvasX - this.imagePosition.x) / this.imageScale;
    const imageY = (canvasY - this.imagePosition.y) / this.imageScale;
    return { x: imageX, y: imageY };
  }
  
  /**
   * 坐标转换：图像坐标到Canvas坐标
   * @param {number} imageX - 图像X坐标
   * @param {number} imageY - 图像Y坐标
   */
  imageToCanvas(imageX, imageY) {
    const canvasX = imageX * this.imageScale + this.imagePosition.x;
    const canvasY = imageY * this.imageScale + this.imagePosition.y;
    return { x: canvasX, y: canvasY };
  }
  
  /**
   * 获取鼠标在Canvas中的坐标
   * @param {MouseEvent} event - 鼠标事件
   */
  getMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  
  // ==================== 事件处理 ====================
  
  handleMouseDown(event) {
    const pos = this.getMousePosition(event);
    this.isDragging = true;
    this.lastMousePosition = pos;
    
    this.eventBus.emit('canvas:mousedown', {
      position: pos,
      imagePosition: this.canvasToImage(pos.x, pos.y),
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    });
  }
  
  handleMouseMove(event) {
    const pos = this.getMousePosition(event);
    
    if (this.isDragging) {
      const deltaX = pos.x - this.lastMousePosition.x;
      const deltaY = pos.y - this.lastMousePosition.y;
      
      this.eventBus.emit('canvas:drag', {
        position: pos,
        delta: { x: deltaX, y: deltaY },
        imagePosition: this.canvasToImage(pos.x, pos.y)
      });
    }
    
    this.eventBus.emit('canvas:mousemove', {
      position: pos,
      imagePosition: this.canvasToImage(pos.x, pos.y),
      isDragging: this.isDragging
    });
    
    this.lastMousePosition = pos;
  }
  
  handleMouseUp(event) {
    const pos = this.getMousePosition(event);
    this.isDragging = false;
    
    this.eventBus.emit('canvas:mouseup', {
      position: pos,
      imagePosition: this.canvasToImage(pos.x, pos.y),
      button: event.button
    });
  }
  
  handleClick(event) {
    const pos = this.getMousePosition(event);
    
    this.eventBus.emit('canvas:click', {
      position: pos,
      imagePosition: this.canvasToImage(pos.x, pos.y),
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    });
  }
  
  handleWheel(event) {
    event.preventDefault();
    
    const pos = this.getMousePosition(event);
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = this.imageScale + delta;
    
    this.setScale(newScale);
    
    this.eventBus.emit('canvas:wheel', {
      position: pos,
      delta: event.deltaY,
      scale: this.imageScale
    });
  }
  
  handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseDown(mouseEvent);
    }
  }
  
  handleTouchMove(event) {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseMove(mouseEvent);
    }
  }
  
  handleTouchEnd(event) {
    event.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    this.handleMouseUp(mouseEvent);
  }
  
  handleKeyDown(event) {
    this.eventBus.emit('canvas:keydown', {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    });
  }
  
  handleKeyUp(event) {
    this.eventBus.emit('canvas:keyup', {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    });
  }
  
  /**
   * 添加自定义事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  addEventListener(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(handler);
    this.canvas.addEventListener(event, handler);
  }
  
  /**
   * 移除自定义事件监听器
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   */
  removeEventListener(event, handler) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(handler);
    }
    this.canvas.removeEventListener(event, handler);
  }
  
  /**
   * 销毁Canvas管理器
   */
  destroy() {
    try {
      // 移除所有事件监听器
      if (this.canvas) {
        for (const [event, handlers] of this.eventListeners) {
          for (const handler of handlers) {
            try {
              this.canvas.removeEventListener(event, handler);
            } catch (error) {
              console.warn(`移除事件监听器失败: ${event}`, error);
            }
          }
        }
      }
      
      // 清理Canvas
      if (this.canvas && this.canvas.parentNode) {
        try {
          this.canvas.parentNode.removeChild(this.canvas);
        } catch (error) {
          console.warn('移除Canvas元素失败:', error);
        }
      }
      
      // 清理状态
      this.canvas = null;
      this.context = null;
      this.imageElement = null;
      this.layers.clear();
      this.eventListeners.clear();
      
      if (this.debug) {
        console.log('[CanvasManager] Canvas manager destroyed');
      }
    } catch (error) {
      console.error('[CanvasManager] 销毁Canvas管理器时出错:', error);
    }
  }
}

export default CanvasManager;