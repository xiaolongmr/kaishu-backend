# 字体标注页面插件化架构设计

## 概述

将字体标注页面重构为类似 Figma、Canva、Photoshop 的插件化架构，提供统一的开发API，让开发者可以像开发插件一样添加新功能。

## 核心架构

### 1. 核心系统 (AnnotationCore)

```
AnnotationCore/
├── CanvasManager          # Canvas管理器
├── PluginManager          # 插件管理器
├── EventBus              # 事件总线
├── StateManager          # 状态管理
├── APIProvider           # API提供者
└── UIManager             # UI管理器
```

### 2. 插件系统 (Plugins)

```
Plugins/
├── OCRPlugin/            # OCR识别插件
├── AnnotationPlugin/     # 基础标注插件
├── GridPlugin/           # 米字格检测插件
├── ZoomPlugin/           # 缩放工具插件
├── LayerPlugin/          # 图层管理插件
├── ExportPlugin/         # 导出功能插件
└── HistoryPlugin/        # 历史记录插件
```

### 3. UI框架 (UIFramework)

```
UIFramework/
├── Toolbar/              # 工具栏
├── Sidebar/              # 侧边栏
├── PropertyPanel/        # 属性面板
├── StatusBar/            # 状态栏
└── ContextMenu/          # 右键菜单
```

## API设计

### 1. 核心API接口

```typescript
interface AnnotationAPI {
  // Canvas操作
  canvas: {
    getContext(): CanvasRenderingContext2D;
    getSize(): { width: number; height: number };
    setSize(width: number, height: number): void;
    clear(): void;
    redraw(): void;
    addEventListener(event: string, handler: Function): void;
    removeEventListener(event: string, handler: Function): void;
  };
  
  // 图像操作
  image: {
    load(url: string): Promise<HTMLImageElement>;
    getSize(): { width: number; height: number };
    getScale(): number;
    setScale(scale: number): void;
    getPosition(): { x: number; y: number };
    setPosition(x: number, y: number): void;
  };
  
  // 标注操作
  annotations: {
    add(annotation: Annotation): string;
    remove(id: string): boolean;
    update(id: string, data: Partial<Annotation>): boolean;
    get(id: string): Annotation | null;
    getAll(): Annotation[];
    select(id: string): void;
    deselect(): void;
    getSelected(): Annotation | null;
  };
  
  // 状态管理
  state: {
    get(key: string): any;
    set(key: string, value: any): void;
    subscribe(key: string, callback: Function): void;
    unsubscribe(key: string, callback: Function): void;
  };
  
  // 事件系统
  events: {
    emit(event: string, data?: any): void;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
    once(event: string, handler: Function): void;
  };
  
  // UI操作
  ui: {
    addToolbarButton(config: ToolbarButtonConfig): string;
    removeToolbarButton(id: string): void;
    addSidebarPanel(config: SidebarPanelConfig): string;
    removeSidebarPanel(id: string): void;
    showModal(config: ModalConfig): void;
    hideModal(id: string): void;
    showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
  };
  
  // 历史记录
  history: {
    push(action: HistoryAction): void;
    undo(): boolean;
    redo(): boolean;
    canUndo(): boolean;
    canRedo(): boolean;
  };
}
```

### 2. 插件接口

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  
  // 生命周期
  install(api: AnnotationAPI): void;
  uninstall(): void;
  activate(): void;
  deactivate(): void;
  
  // 配置
  getConfig?(): PluginConfig;
  setConfig?(config: PluginConfig): void;
}
```

### 3. 数据类型定义

```typescript
interface Annotation {
  id: string;
  type: 'rectangle' | 'fourPoint' | 'circle' | 'polygon';
  data: AnnotationData;
  style: AnnotationStyle;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface AnnotationData {
  // 矩形标注
  rectangle?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // 四点标注
  fourPoint?: {
    points: [Point, Point, Point, Point];
  };
  
  // 圆形标注
  circle?: {
    center: Point;
    radius: number;
  };
  
  // 多边形标注
  polygon?: {
    points: Point[];
  };
}

interface Point {
  x: number;
  y: number;
}

interface AnnotationStyle {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  dashArray?: number[];
}
```

## 插件开发指南

### 1. 基础插件模板

```typescript
class BasePlugin implements Plugin {
  id: string;
  name: string;
  version: string;
  api: AnnotationAPI;
  
  constructor(config: PluginConfig) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
  }
  
  install(api: AnnotationAPI): void {
    this.api = api;
    this.setupUI();
    this.bindEvents();
  }
  
  uninstall(): void {
    this.cleanup();
  }
  
  activate(): void {
    // 激活插件
  }
  
  deactivate(): void {
    // 停用插件
  }
  
  protected setupUI(): void {
    // 设置UI
  }
  
  protected bindEvents(): void {
    // 绑定事件
  }
  
  protected cleanup(): void {
    // 清理资源
  }
}
```

### 2. OCR插件示例

```typescript
class OCRPlugin extends BasePlugin {
  constructor() {
    super({
      id: 'ocr-plugin',
      name: 'OCR识别',
      version: '1.0.0'
    });
  }
  
  protected setupUI(): void {
    // 添加工具栏按钮
    this.api.ui.addToolbarButton({
      id: 'ocr-button',
      icon: 'ScanOutlined',
      tooltip: 'OCR识别',
      onClick: () => this.startOCR()
    });
    
    // 添加侧边栏面板
    this.api.ui.addSidebarPanel({
      id: 'ocr-panel',
      title: 'OCR设置',
      content: this.renderOCRPanel()
    });
  }
  
  protected bindEvents(): void {
    this.api.events.on('image:loaded', () => {
      this.api.ui.showNotification('图片加载完成，可以开始OCR识别', 'info');
    });
  }
  
  private async startOCR(): Promise<void> {
    try {
      const imageData = this.api.canvas.getImageData();
      const results = await this.performOCR(imageData);
      
      // 将OCR结果转换为标注
      results.forEach(result => {
        const annotation: Annotation = {
          id: this.generateId(),
          type: 'rectangle',
          data: {
            rectangle: {
              x: result.location.left,
              y: result.location.top,
              width: result.location.width,
              height: result.location.height
            }
          },
          style: {
            strokeColor: '#ff0000',
            fillColor: 'transparent',
            strokeWidth: 2,
            opacity: 1
          },
          metadata: {
            text: result.words,
            confidence: result.probability,
            source: 'ocr'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        this.api.annotations.add(annotation);
      });
      
      this.api.ui.showNotification(`OCR识别完成，找到${results.length}个字符`, 'success');
      
    } catch (error) {
      this.api.ui.showNotification('OCR识别失败: ' + error.message, 'error');
    }
  }
  
  private async performOCR(imageData: ImageData): Promise<OCRResult[]> {
    // 调用OCR API
    const formData = new FormData();
    const blob = this.imageDataToBlob(imageData);
    formData.append('image', blob);
    
    const response = await fetch('/api/baidu-ocr/recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('OCR请求失败');
    }
    
    const data = await response.json();
    return data.words_result || [];
  }
  
  private renderOCRPanel(): React.ReactElement {
    return (
      <div>
        <h4>OCR设置</h4>
        <p>配置OCR识别参数</p>
        {/* OCR设置界面 */}
      </div>
    );
  }
}
```

## 事件系统

### 1. 核心事件

```typescript
// 图像事件
'image:loading'     // 图像开始加载
'image:loaded'      // 图像加载完成
'image:error'       // 图像加载失败
'image:changed'     // 图像发生变化

// 标注事件
'annotation:added'     // 标注添加
'annotation:removed'   // 标注删除
'annotation:updated'   // 标注更新
'annotation:selected'  // 标注选中
'annotation:deselected' // 标注取消选中

// Canvas事件
'canvas:mousedown'   // 鼠标按下
'canvas:mousemove'   // 鼠标移动
'canvas:mouseup'     // 鼠标抬起
'canvas:click'       // 鼠标点击
'canvas:resize'      // Canvas尺寸变化

// 工具事件
'tool:activated'     // 工具激活
'tool:deactivated'   // 工具停用
'tool:changed'       // 工具切换

// 状态事件
'state:changed'      // 状态变化
'history:changed'    // 历史记录变化
```

### 2. 事件使用示例

```typescript
// 监听标注添加事件
api.events.on('annotation:added', (annotation) => {
  console.log('新增标注:', annotation);
  // 更新UI
  updateAnnotationList();
});

// 监听工具切换事件
api.events.on('tool:changed', (toolId) => {
  console.log('切换到工具:', toolId);
  // 更新工具栏状态
  updateToolbarState(toolId);
});
```

## 插件管理

### 1. 插件注册

```typescript
class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private api: AnnotationAPI;
  
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`插件 ${plugin.id} 已存在`);
    }
    
    // 检查依赖
    this.checkDependencies(plugin);
    
    // 安装插件
    plugin.install(this.api);
    this.plugins.set(plugin.id, plugin);
    
    console.log(`插件 ${plugin.name} 安装成功`);
  }
  
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.uninstall();
      this.plugins.delete(pluginId);
      console.log(`插件 ${plugin.name} 卸载成功`);
    }
  }
  
  activate(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.activate();
    }
  }
  
  deactivate(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.deactivate();
    }
  }
  
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  private checkDependencies(plugin: Plugin): void {
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(`插件 ${plugin.id} 依赖的插件 ${dep} 未安装`);
        }
      }
    }
  }
}
```

### 2. 插件配置

```typescript
interface PluginConfig {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  settings: Record<string, any>;
}

// 插件配置管理
class PluginConfigManager {
  private configs: Map<string, PluginConfig> = new Map();
  
  load(): void {
    const saved = localStorage.getItem('plugin-configs');
    if (saved) {
      const configs = JSON.parse(saved);
      configs.forEach((config: PluginConfig) => {
        this.configs.set(config.id, config);
      });
    }
  }
  
  save(): void {
    const configs = Array.from(this.configs.values());
    localStorage.setItem('plugin-configs', JSON.stringify(configs));
  }
  
  get(pluginId: string): PluginConfig | undefined {
    return this.configs.get(pluginId);
  }
  
  set(pluginId: string, config: PluginConfig): void {
    this.configs.set(pluginId, config);
    this.save();
  }
}
```

## 实施计划

### 阶段1：核心架构
1. 创建 AnnotationCore 核心系统
2. 实现 EventBus 事件总线
3. 实现 StateManager 状态管理
4. 实现 PluginManager 插件管理器

### 阶段2：基础插件
1. 重构现有功能为插件
2. 实现 AnnotationPlugin 基础标注插件
3. 实现 ZoomPlugin 缩放插件
4. 实现 HistoryPlugin 历史记录插件

### 阶段3：高级插件
1. 实现 OCRPlugin OCR识别插件
2. 实现 GridPlugin 米字格检测插件
3. 实现 LayerPlugin 图层管理插件
4. 实现 ExportPlugin 导出功能插件

### 阶段4：UI框架
1. 重构UI为模块化组件
2. 实现动态工具栏
3. 实现可配置侧边栏
4. 实现插件设置面板

### 阶段5：优化完善
1. 性能优化
2. 插件开发文档
3. 示例插件
4. 测试覆盖

## 优势

1. **模块化**：功能独立，易于维护和扩展
2. **可扩展**：开发者可以轻松添加新功能
3. **可配置**：用户可以根据需要启用/禁用功能
4. **标准化**：统一的API接口，降低学习成本
5. **性能**：按需加载，减少资源消耗
6. **维护性**：插件独立更新，不影响核心系统

这个架构设计将使字体标注页面具备类似专业设计软件的扩展能力，为未来的功能扩展奠定坚实基础。