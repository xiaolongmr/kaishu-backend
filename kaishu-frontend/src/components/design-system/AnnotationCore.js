/**
 * 字体标注页面核心系统
 * 提供插件化架构的基础框架
 */

import EventBus from './EventBus';
import StateManager from './StateManager';
import PluginManager from './PluginManager';
import CanvasManager from './CanvasManager';
import UIManager from './UIManager';
import HistoryManager from './HistoryManager';

class AnnotationCore {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      width: 800,
      height: 600,
      theme: 'light',
      ...options
    };
    
    // 初始化子系统
    this.eventBus = new EventBus();
    this.stateManager = new StateManager(this.eventBus);
    this.canvasManager = new CanvasManager(this.container, this.eventBus, this.options);
    this.uiManager = new UIManager(this.container, this.eventBus, this.options);
    this.historyManager = new HistoryManager(this.eventBus);
    this.pluginManager = new PluginManager(this.getAPI());
    
    // 初始化状态
    this.annotations = new Map();
    this.selectedAnnotation = null;
    this.currentTool = null;
    this.isInitialized = false;
    
    this.init();
  }
  
  /**
   * 初始化核心系统
   */
  init() {
    if (this.isInitialized) return;
    
    // 初始化UI
    this.uiManager.init();
    
    // 初始化Canvas
    this.canvasManager.init();
    
    // 绑定核心事件
    this.bindCoreEvents();
    
    // 设置初始状态
    this.stateManager.set('core.initialized', true);
    this.stateManager.set('annotations.list', []);
    this.stateManager.set('annotations.selected', null);
    this.stateManager.set('tools.current', null);
    
    this.isInitialized = true;
    this.eventBus.emit('core:initialized');
    
    console.log('AnnotationCore initialized');
  }
  
  /**
   * 绑定核心事件
   */
  bindCoreEvents() {
    // 标注相关事件
    this.eventBus.on('annotation:add', this.handleAnnotationAdd.bind(this));
    this.eventBus.on('annotation:remove', this.handleAnnotationRemove.bind(this));
    this.eventBus.on('annotation:update', this.handleAnnotationUpdate.bind(this));
    this.eventBus.on('annotation:select', this.handleAnnotationSelect.bind(this));
    this.eventBus.on('annotation:deselect', this.handleAnnotationDeselect.bind(this));
    
    // 工具相关事件
    this.eventBus.on('tool:activate', this.handleToolActivate.bind(this));
    this.eventBus.on('tool:deactivate', this.handleToolDeactivate.bind(this));
    
    // Canvas事件
    this.eventBus.on('canvas:click', this.handleCanvasClick.bind(this));
    this.eventBus.on('canvas:mousedown', this.handleCanvasMouseDown.bind(this));
    this.eventBus.on('canvas:mousemove', this.handleCanvasMouseMove.bind(this));
    this.eventBus.on('canvas:mouseup', this.handleCanvasMouseUp.bind(this));
    
    // 历史记录事件
    this.eventBus.on('history:undo', this.handleUndo.bind(this));
    this.eventBus.on('history:redo', this.handleRedo.bind(this));
  }
  
  /**
   * 获取API接口
   */
  getAPI() {
    return {
      // Canvas操作
      canvas: {
        getContext: () => this.canvasManager.getContext(),
        getSize: () => this.canvasManager.getSize(),
        setSize: (width, height) => this.canvasManager.setSize(width, height),
        clear: () => this.canvasManager.clear(),
        redraw: () => this.canvasManager.redraw(),
        addEventListener: (event, handler) => this.canvasManager.addEventListener(event, handler),
        removeEventListener: (event, handler) => this.canvasManager.removeEventListener(event, handler),
        getImageData: () => this.canvasManager.getImageData(),
        putImageData: (imageData) => this.canvasManager.putImageData(imageData)
      },
      
      // 图像操作
      image: {
        load: (url) => this.canvasManager.loadImage(url),
        getSize: () => this.canvasManager.getImageSize(),
        getScale: () => this.canvasManager.getScale(),
        setScale: (scale) => this.canvasManager.setScale(scale),
        getPosition: () => this.canvasManager.getImagePosition(),
        setPosition: (x, y) => this.canvasManager.setImagePosition(x, y)
      },
      
      // 标注操作
      annotations: {
        add: (annotation) => this.addAnnotation(annotation),
        remove: (id) => this.removeAnnotation(id),
        update: (id, data) => this.updateAnnotation(id, data),
        get: (id) => this.getAnnotation(id),
        getAll: () => this.getAllAnnotations(),
        select: (id) => this.selectAnnotation(id),
        deselect: () => this.deselectAnnotation(),
        getSelected: () => this.getSelectedAnnotation()
      },
      
      // 状态管理
      state: {
        get: (key) => this.stateManager.get(key),
        set: (key, value) => this.stateManager.set(key, value),
        subscribe: (key, callback) => this.stateManager.subscribe(key, callback),
        unsubscribe: (key, callback) => this.stateManager.unsubscribe(key, callback)
      },
      
      // 事件系统
      events: {
        emit: (event, data) => this.eventBus.emit(event, data),
        on: (event, handler) => this.eventBus.on(event, handler),
        off: (event, handler) => this.eventBus.off(event, handler),
        once: (event, handler) => this.eventBus.once(event, handler)
      },
      
      // UI操作
      ui: {
        addToolbarButton: (config) => this.uiManager.addToolbarButton(config),
        removeToolbarButton: (id) => this.uiManager.removeToolbarButton(id),
        addSidebarPanel: (config) => this.uiManager.addSidebarPanel(config),
        removeSidebarPanel: (id) => this.uiManager.removeSidebarPanel(id),
        showModal: (config) => this.uiManager.showModal(config),
        hideModal: (id) => this.uiManager.hideModal(id),
        showNotification: (message, type) => this.uiManager.showNotification(message, type),
        updateToolbarState: (toolId, active) => this.uiManager.updateToolbarState(toolId, active)
      },
      
      // 历史记录
      history: {
        push: (action) => this.historyManager.push(action),
        undo: () => this.historyManager.undo(),
        redo: () => this.historyManager.redo(),
        canUndo: () => this.historyManager.canUndo(),
        canRedo: () => this.historyManager.canRedo(),
        clear: () => this.historyManager.clear()
      },
      
      // 工具管理
      tools: {
        register: (tool) => this.registerTool(tool),
        unregister: (toolId) => this.unregisterTool(toolId),
        activate: (toolId) => this.activateTool(toolId),
        deactivate: () => this.deactivateTool(),
        getCurrent: () => this.getCurrentTool()
      }
    };
  }
  
  // ==================== 标注管理 ====================
  
  /**
   * 添加标注
   */
  addAnnotation(annotation) {
    const id = annotation.id || this.generateId();
    const fullAnnotation = {
      id,
      type: 'rectangle',
      data: {},
      style: {
        strokeColor: '#ff0000',
        fillColor: 'transparent',
        strokeWidth: 2,
        opacity: 1
      },
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...annotation
    };
    
    this.annotations.set(id, fullAnnotation);
    this.updateAnnotationsList();
    
    // 记录历史
    this.historyManager.push({
      type: 'add_annotation',
      data: { annotation: fullAnnotation },
      undo: () => this.removeAnnotation(id),
      redo: () => this.addAnnotation(fullAnnotation)
    });
    
    this.eventBus.emit('annotation:added', fullAnnotation);
    this.canvasManager.redraw();
    
    return id;
  }
  
  /**
   * 删除标注
   */
  removeAnnotation(id) {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;
    
    this.annotations.delete(id);
    
    if (this.selectedAnnotation?.id === id) {
      this.selectedAnnotation = null;
      this.stateManager.set('annotations.selected', null);
    }
    
    this.updateAnnotationsList();
    
    // 记录历史
    this.historyManager.push({
      type: 'remove_annotation',
      data: { annotation },
      undo: () => this.addAnnotation(annotation),
      redo: () => this.removeAnnotation(id)
    });
    
    this.eventBus.emit('annotation:removed', annotation);
    this.canvasManager.redraw();
    
    return true;
  }
  
  /**
   * 更新标注
   */
  updateAnnotation(id, data) {
    const annotation = this.annotations.get(id);
    if (!annotation) return false;
    
    const oldData = { ...annotation };
    const updatedAnnotation = {
      ...annotation,
      ...data,
      updatedAt: new Date()
    };
    
    this.annotations.set(id, updatedAnnotation);
    this.updateAnnotationsList();
    
    // 记录历史
    this.historyManager.push({
      type: 'update_annotation',
      data: { id, oldData, newData: data },
      undo: () => this.updateAnnotation(id, oldData),
      redo: () => this.updateAnnotation(id, data)
    });
    
    this.eventBus.emit('annotation:updated', updatedAnnotation);
    this.canvasManager.redraw();
    
    return true;
  }
  
  /**
   * 获取标注
   */
  getAnnotation(id) {
    return this.annotations.get(id) || null;
  }
  
  /**
   * 获取所有标注
   */
  getAllAnnotations() {
    return Array.from(this.annotations.values());
  }
  
  /**
   * 选择标注
   */
  selectAnnotation(id) {
    const annotation = this.annotations.get(id);
    if (!annotation) return;
    
    this.selectedAnnotation = annotation;
    this.stateManager.set('annotations.selected', annotation);
    this.eventBus.emit('annotation:selected', annotation);
    this.canvasManager.redraw();
  }
  
  /**
   * 取消选择标注
   */
  deselectAnnotation() {
    if (this.selectedAnnotation) {
      const annotation = this.selectedAnnotation;
      this.selectedAnnotation = null;
      this.stateManager.set('annotations.selected', null);
      this.eventBus.emit('annotation:deselected', annotation);
      this.canvasManager.redraw();
    }
  }
  
  /**
   * 获取选中的标注
   */
  getSelectedAnnotation() {
    return this.selectedAnnotation;
  }
  
  /**
   * 更新标注列表状态
   */
  updateAnnotationsList() {
    const list = this.getAllAnnotations();
    this.stateManager.set('annotations.list', list);
    this.eventBus.emit('annotations:changed', list);
  }
  
  // ==================== 工具管理 ====================
  
  /**
   * 注册工具
   */
  registerTool(tool) {
    // 工具注册逻辑
    this.eventBus.emit('tool:registered', tool);
  }
  
  /**
   * 注销工具
   */
  unregisterTool(toolId) {
    // 工具注销逻辑
    this.eventBus.emit('tool:unregistered', toolId);
  }
  
  /**
   * 激活工具
   */
  activateTool(toolId) {
    if (this.currentTool) {
      this.deactivateTool();
    }
    
    this.currentTool = toolId;
    this.stateManager.set('tools.current', toolId);
    this.eventBus.emit('tool:activated', toolId);
  }
  
  /**
   * 停用工具
   */
  deactivateTool() {
    if (this.currentTool) {
      const toolId = this.currentTool;
      this.currentTool = null;
      this.stateManager.set('tools.current', null);
      this.eventBus.emit('tool:deactivated', toolId);
    }
  }
  
  /**
   * 获取当前工具
   */
  getCurrentTool() {
    return this.currentTool;
  }
  
  // ==================== 事件处理 ====================
  
  handleAnnotationAdd(annotation) {
    // 处理标注添加事件
  }
  
  handleAnnotationRemove(annotation) {
    // 处理标注删除事件
  }
  
  handleAnnotationUpdate(annotation) {
    // 处理标注更新事件
  }
  
  handleAnnotationSelect(annotation) {
    // 处理标注选择事件
  }
  
  handleAnnotationDeselect(annotation) {
    // 处理标注取消选择事件
  }
  
  handleToolActivate(toolId) {
    // 处理工具激活事件
    this.uiManager.updateToolbarState(toolId, true);
  }
  
  handleToolDeactivate(toolId) {
    // 处理工具停用事件
    this.uiManager.updateToolbarState(toolId, false);
  }
  
  handleCanvasClick(event) {
    // 处理Canvas点击事件
    if (this.currentTool) {
      this.eventBus.emit(`tool:${this.currentTool}:click`, event);
    }
  }
  
  handleCanvasMouseDown(event) {
    // 处理Canvas鼠标按下事件
    if (this.currentTool) {
      this.eventBus.emit(`tool:${this.currentTool}:mousedown`, event);
    }
  }
  
  handleCanvasMouseMove(event) {
    // 处理Canvas鼠标移动事件
    if (this.currentTool) {
      this.eventBus.emit(`tool:${this.currentTool}:mousemove`, event);
    }
  }
  
  handleCanvasMouseUp(event) {
    // 处理Canvas鼠标抬起事件
    if (this.currentTool) {
      this.eventBus.emit(`tool:${this.currentTool}:mouseup`, event);
    }
  }
  
  handleUndo() {
    this.historyManager.undo();
  }
  
  handleRedo() {
    this.historyManager.redo();
  }
  
  // ==================== 插件管理 ====================
  
  /**
   * 注册插件
   */
  registerPlugin(plugin) {
    return this.pluginManager.register(plugin);
  }
  
  /**
   * 注销插件
   */
  unregisterPlugin(pluginId) {
    return this.pluginManager.unregister(pluginId);
  }
  
  /**
   * 激活插件
   */
  activatePlugin(pluginId) {
    return this.pluginManager.activate(pluginId);
  }
  
  /**
   * 停用插件
   */
  deactivatePlugin(pluginId) {
    return this.pluginManager.deactivate(pluginId);
  }
  
  /**
   * 获取插件
   */
  getPlugin(pluginId) {
    return this.pluginManager.getPlugin(pluginId);
  }
  
  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return this.pluginManager.getAllPlugins();
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 生成唯一ID
   */
  generateId() {
    return 'annotation_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * 销毁核心系统
   */
  destroy() {
    // 停用所有插件
    this.pluginManager.destroy();
    
    // 清理事件监听
    this.eventBus.removeAllListeners();
    
    // 清理Canvas
    this.canvasManager.destroy();
    
    // 清理UI
    this.uiManager.destroy();
    
    // 清理状态
    this.stateManager.clear();
    
    // 清理历史记录
    this.historyManager.clear();
    
    this.isInitialized = false;
    
    console.log('AnnotationCore destroyed');
  }
}

export default AnnotationCore;