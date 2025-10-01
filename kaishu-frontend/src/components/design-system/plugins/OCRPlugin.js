/**
 * OCR识别插件
 * 将OCR功能集成到字体标注页面的插件系统中
 */

import React from 'react';
import { Button, Modal, Progress, Alert, Card, Steps, Space, Typography, Tag, Input, Form, message } from 'antd';
import { ScanOutlined, CheckOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

class OCRPlugin {
  constructor() {
    this.id = 'ocr-plugin';
    this.name = 'OCR识别';
    this.version = '1.0.0';
    this.description = '自动识别图片中的文字并生成标注';
    this.dependencies = [];
    
    // 插件状态
    this.api = null;
    this.isActive = false;
    this.toolbarButtonId = null;
    this.sidebarPanelId = null;
    
    // OCR状态
    this.ocrResults = [];
    this.isProcessing = false;
    this.currentStep = 0; // 0: 准备, 1: 识别中, 2: 确认标注, 3: 完成
    this.confirmedAnnotations = [];
    this.currentAnnotationIndex = 0;
    
    // UI状态
    this.showWorkflowModal = false;
    this.showPreviewModal = false;
    this.previewAnnotation = null;
  }
  
  /**
   * 安装插件
   */
  install(api) {
    this.api = api;
    this.setupUI();
    this.bindEvents();
    
    console.log(`OCR插件 ${this.name} 安装成功`);
  }
  
  /**
   * 卸载插件
   */
  uninstall() {
    this.cleanup();
    console.log(`OCR插件 ${this.name} 卸载成功`);
  }
  
  /**
   * 激活插件
   */
  activate() {
    this.isActive = true;
    this.api.events.emit('plugin:ocr:activated');
  }
  
  /**
   * 停用插件
   */
  deactivate() {
    this.isActive = false;
    this.api.events.emit('plugin:ocr:deactivated');
  }
  
  /**
   * 设置UI
   */
  setupUI() {
    // 添加工具栏按钮
    this.toolbarButtonId = this.api.ui.addToolbarButton({
      id: 'ocr-button',
      icon: React.createElement(ScanOutlined),
      tooltip: 'OCR文字识别',
      onClick: () => this.startOCRWorkflow(),
      group: 'analysis'
    });
    
    // 添加侧边栏面板
    this.sidebarPanelId = this.api.ui.addSidebarPanel({
      id: 'ocr-panel',
      title: 'OCR识别',
      icon: React.createElement(ScanOutlined),
      content: this.renderOCRPanel(),
      collapsible: true,
      defaultCollapsed: true
    });
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 监听图像加载事件
    this.api.events.on('image:loaded', this.handleImageLoaded.bind(this));
    
    // 监听图像变化事件
    this.api.events.on('image:changed', this.handleImageChanged.bind(this));
    
    // 监听标注选择事件
    this.api.events.on('annotation:selected', this.handleAnnotationSelected.bind(this));
  }
  
  /**
   * 清理资源
   */
  cleanup() {
    if (this.toolbarButtonId) {
      this.api.ui.removeToolbarButton(this.toolbarButtonId);
    }
    
    if (this.sidebarPanelId) {
      this.api.ui.removeSidebarPanel(this.sidebarPanelId);
    }
    
    // 移除事件监听
    this.api.events.off('image:loaded', this.handleImageLoaded.bind(this));
    this.api.events.off('image:changed', this.handleImageChanged.bind(this));
    this.api.events.off('annotation:selected', this.handleAnnotationSelected.bind(this));
  }
  
  /**
   * 开始OCR工作流程
   */
  async startOCRWorkflow() {
    // 检查是否有图像
    const imageSize = this.api.image.getSize();
    if (!imageSize.width || !imageSize.height) {
      this.api.ui.showNotification('请先加载图像', 'warning');
      return;
    }
    
    // 重置状态
    this.currentStep = 0;
    this.ocrResults = [];
    this.confirmedAnnotations = [];
    this.currentAnnotationIndex = 0;
    
    // 显示工作流程模态框
    this.showWorkflowModal = true;
    this.updateWorkflowModal();
    
    // 开始OCR识别
    await this.performOCR();
  }
  
  /**
   * 执行OCR识别
   */
  async performOCR() {
    try {
      this.currentStep = 1;
      this.isProcessing = true;
      this.updateWorkflowModal();
      
      this.api.ui.showNotification('开始OCR识别...', 'info');
      
      // 获取图像数据
      const canvas = this.api.canvas.getContext().canvas;
      const blob = await this.canvasToBlob(canvas);
      
      // 准备表单数据
      const formData = new FormData();
      formData.append('image', blob, 'annotation_image.png');
      
      // 调用OCR API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/baidu-ocr/recognize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('OCR请求失败');
      }
      
      const data = await response.json();
      this.ocrResults = data.words_result || [];
      
      if (this.ocrResults.length === 0) {
        throw new Error('未识别到任何文字');
      }
      
      // 转换OCR结果为标注
      this.convertOCRResultsToAnnotations();
      
      // 进入确认阶段
      this.currentStep = 2;
      this.api.ui.showNotification(`OCR识别完成，找到${this.ocrResults.length}个字符`, 'success');
      
    } catch (error) {
      console.error('OCR识别失败:', error);
      this.api.ui.showNotification('OCR识别失败: ' + error.message, 'error');
      this.currentStep = 0;
    } finally {
      this.isProcessing = false;
      this.updateWorkflowModal();
    }
  }
  
  /**
   * 将OCR结果转换为标注
   */
  convertOCRResultsToAnnotations() {
    const imageScale = this.api.image.getScale();
    const imagePosition = this.api.image.getPosition();
    
    this.confirmedAnnotations = this.ocrResults.map((result, index) => {
      const location = result.location;
      
      return {
        id: `ocr_${Date.now()}_${index}`,
        type: 'rectangle',
        data: {
          rectangle: {
            x: (location.left * imageScale) + imagePosition.x,
            y: (location.top * imageScale) + imagePosition.y,
            width: location.width * imageScale,
            height: location.height * imageScale
          }
        },
        style: {
          strokeColor: '#ff4d4f',
          fillColor: 'rgba(255, 77, 79, 0.1)',
          strokeWidth: 2,
          opacity: 1
        },
        metadata: {
          text: result.words,
          confidence: result.probability,
          source: 'ocr',
          confirmed: false,
          originalIndex: index
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }
  
  /**
   * 确认当前标注
   */
  confirmCurrentAnnotation() {
    if (this.currentAnnotationIndex < this.confirmedAnnotations.length) {
      const annotation = this.confirmedAnnotations[this.currentAnnotationIndex];
      annotation.metadata.confirmed = true;
      
      // 添加到标注系统
      this.api.annotations.add(annotation);
      
      // 移动到下一个
      this.currentAnnotationIndex++;
      
      if (this.currentAnnotationIndex >= this.confirmedAnnotations.length) {
        // 全部确认完成
        this.currentStep = 3;
        this.api.ui.showNotification('所有标注确认完成！', 'success');
      }
      
      this.updateWorkflowModal();
    }
  }
  
  /**
   * 跳过当前标注
   */
  skipCurrentAnnotation() {
    this.currentAnnotationIndex++;
    
    if (this.currentAnnotationIndex >= this.confirmedAnnotations.length) {
      this.currentStep = 3;
      this.api.ui.showNotification('标注确认完成！', 'success');
    }
    
    this.updateWorkflowModal();
  }
  
  /**
   * 编辑当前标注
   */
  editCurrentAnnotation() {
    if (this.currentAnnotationIndex < this.confirmedAnnotations.length) {
      const annotation = this.confirmedAnnotations[this.currentAnnotationIndex];
      this.previewAnnotation = annotation;
      this.showPreviewModal = true;
      this.updatePreviewModal();
    }
  }
  
  /**
   * 预览标注
   */
  previewAnnotation(annotation) {
    // 临时高亮显示标注
    this.api.annotations.select(annotation.id);
    
    // 显示预览模态框
    this.previewAnnotation = annotation;
    this.showPreviewModal = true;
    this.updatePreviewModal();
  }
  
  /**
   * Canvas转Blob
   */
  async canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
  }
  
  /**
   * 渲染OCR面板
   */
  renderOCRPanel() {
    return React.createElement('div', { style: { padding: '16px' } }, [
      React.createElement(Title, { level: 5, key: 'title' }, 'OCR文字识别'),
      React.createElement('p', { key: 'desc' }, '自动识别图片中的文字并生成标注'),
      React.createElement(Button, {
        key: 'start-btn',
        type: 'primary',
        icon: React.createElement(ScanOutlined),
        onClick: () => this.startOCRWorkflow(),
        block: true,
        disabled: this.isProcessing
      }, this.isProcessing ? '识别中...' : '开始识别'),
      
      this.ocrResults.length > 0 && React.createElement('div', { key: 'results', style: { marginTop: '16px' } }, [
        React.createElement(Title, { level: 5, key: 'results-title' }, '识别结果'),
        React.createElement('div', { key: 'results-list' }, 
          this.ocrResults.map((result, index) => 
            React.createElement(Card, {
              key: index,
              size: 'small',
              style: { marginBottom: '8px' },
              title: `字符 ${index + 1}`,
              extra: React.createElement(Tag, { 
                color: result.probability > 0.8 ? 'green' : 'orange' 
              }, `${Math.round(result.probability * 100)}%`)
            }, [
              React.createElement(Text, { key: 'text', strong: true }, result.words),
              React.createElement('br', { key: 'br' }),
              React.createElement(Text, { key: 'pos', type: 'secondary', style: { fontSize: '12px' } }, 
                `位置: (${result.location.left}, ${result.location.top})`
              )
            ])
          )
        )
      ])
    ]);
  }
  
  /**
   * 更新工作流程模态框
   */
  updateWorkflowModal() {
    if (!this.showWorkflowModal) return;
    
    const steps = [
      { title: '准备识别', description: '准备图像数据' },
      { title: '识别中', description: '正在识别文字...' },
      { title: '确认标注', description: '逐个确认识别结果' },
      { title: '完成', description: '标注添加完成' }
    ];
    
    let content;
    
    if (this.currentStep === 1) {
      // 识别中
      content = React.createElement('div', { style: { textAlign: 'center', padding: '40px 0' } }, [
        React.createElement(Progress, { key: 'progress', type: 'circle', percent: 50 }),
        React.createElement('div', { key: 'text', style: { marginTop: '16px' } }, '正在识别图片中的文字...')
      ]);
    } else if (this.currentStep === 2) {
      // 确认标注
      const currentAnnotation = this.confirmedAnnotations[this.currentAnnotationIndex];
      const progress = Math.round((this.currentAnnotationIndex / this.confirmedAnnotations.length) * 100);
      
      content = React.createElement('div', {}, [
        React.createElement(Progress, { 
          key: 'progress', 
          percent: progress, 
          format: () => `${this.currentAnnotationIndex}/${this.confirmedAnnotations.length}`
        }),
        
        currentAnnotation && React.createElement(Card, {
          key: 'current',
          style: { marginTop: '16px' },
          title: `字符 ${this.currentAnnotationIndex + 1}`,
          extra: React.createElement(Tag, { 
            color: currentAnnotation.metadata.confidence > 0.8 ? 'green' : 'orange' 
          }, `${Math.round(currentAnnotation.metadata.confidence * 100)}%`)
        }, [
          React.createElement('div', { key: 'text', style: { fontSize: '24px', textAlign: 'center', margin: '16px 0' } }, 
            currentAnnotation.metadata.text
          ),
          React.createElement(Space, { key: 'actions', style: { width: '100%', justifyContent: 'center' } }, [
            React.createElement(Button, {
              key: 'confirm',
              type: 'primary',
              icon: React.createElement(CheckOutlined),
              onClick: () => this.confirmCurrentAnnotation()
            }, '确认'),
            React.createElement(Button, {
              key: 'edit',
              icon: React.createElement(EditOutlined),
              onClick: () => this.editCurrentAnnotation()
            }, '编辑'),
            React.createElement(Button, {
              key: 'skip',
              onClick: () => this.skipCurrentAnnotation()
            }, '跳过')
          ])
        ])
      ]);
    } else if (this.currentStep === 3) {
      // 完成
      const confirmedCount = this.confirmedAnnotations.filter(a => a.metadata.confirmed).length;
      
      content = React.createElement('div', { style: { textAlign: 'center', padding: '40px 0' } }, [
        React.createElement(CheckOutlined, { 
          key: 'icon', 
          style: { fontSize: '48px', color: '#52c41a', marginBottom: '16px' } 
        }),
        React.createElement(Title, { key: 'title', level: 3 }, 'OCR识别完成！'),
        React.createElement(Text, { key: 'summary' }, `成功添加 ${confirmedCount} 个标注`),
        React.createElement('div', { key: 'actions', style: { marginTop: '24px' } }, [
          React.createElement(Button, {
            key: 'close',
            type: 'primary',
            onClick: () => { this.showWorkflowModal = false; this.updateWorkflowModal(); }
          }, '完成')
        ])
      ]);
    }
    
    // 显示模态框
    this.api.ui.showModal({
      id: 'ocr-workflow',
      title: 'OCR识别工作流程',
      content: React.createElement('div', {}, [
        React.createElement(Steps, {
          key: 'steps',
          current: this.currentStep,
          size: 'small',
          style: { marginBottom: '24px' }
        }, steps.map((step, index) => 
          React.createElement(Step, {
            key: index,
            title: step.title,
            description: step.description
          })
        )),
        content
      ]),
      width: 600,
      footer: null,
      closable: this.currentStep !== 1,
      maskClosable: false,
      onCancel: () => {
        this.showWorkflowModal = false;
        this.updateWorkflowModal();
      }
    });
  }
  
  /**
   * 更新预览模态框
   */
  updatePreviewModal() {
    if (!this.showPreviewModal || !this.previewAnnotation) return;
    
    const annotation = this.previewAnnotation;
    
    this.api.ui.showModal({
      id: 'ocr-preview',
      title: '编辑标注',
      content: React.createElement('div', {}, [
        React.createElement(Form, { key: 'form', layout: 'vertical' }, [
          React.createElement(Form.Item, { key: 'text', label: '识别文字' }, [
            React.createElement(Input, {
              value: annotation.metadata.text,
              onChange: (e) => {
                annotation.metadata.text = e.target.value;
                this.updatePreviewModal();
              }
            })
          ]),
          React.createElement(Form.Item, { key: 'confidence', label: '置信度' }, [
            React.createElement(Text, {}, `${Math.round(annotation.metadata.confidence * 100)}%`)
          ]),
          React.createElement(Form.Item, { key: 'position', label: '位置信息' }, [
            React.createElement(Text, { type: 'secondary' }, 
              `X: ${Math.round(annotation.data.rectangle.x)}, ` +
              `Y: ${Math.round(annotation.data.rectangle.y)}, ` +
              `W: ${Math.round(annotation.data.rectangle.width)}, ` +
              `H: ${Math.round(annotation.data.rectangle.height)}`
            )
          ])
        ])
      ]),
      onOk: () => {
        this.showPreviewModal = false;
        this.updatePreviewModal();
      },
      onCancel: () => {
        this.showPreviewModal = false;
        this.updatePreviewModal();
      }
    });
  }
  
  // ==================== 事件处理 ====================
  
  handleImageLoaded() {
    this.api.ui.showNotification('图像加载完成，可以开始OCR识别', 'info');
  }
  
  handleImageChanged() {
    // 图像变化时清除OCR结果
    this.ocrResults = [];
    this.confirmedAnnotations = [];
    this.currentStep = 0;
  }
  
  handleAnnotationSelected(annotation) {
    // 如果选中的是OCR生成的标注，显示相关信息
    if (annotation.metadata.source === 'ocr') {
      this.api.ui.showNotification(
        `OCR标注: ${annotation.metadata.text} (置信度: ${Math.round(annotation.metadata.confidence * 100)}%)`,
        'info'
      );
    }
  }
  
  /**
   * 获取插件配置
   */
  getConfig() {
    return {
      autoStart: false,
      confidenceThreshold: 0.5,
      language: 'zh-CN',
      enablePreview: true
    };
  }
  
  /**
   * 设置插件配置
   */
  setConfig(config) {
    // 更新插件配置
    this.config = { ...this.getConfig(), ...config };
  }
}

export default OCRPlugin;