/**
 * UI管理器
 * 负责管理插件的UI组件，包括工具栏、侧边栏、模态框等
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Modal, notification, Tooltip } from 'antd';

class UIManager {
  constructor(container, eventBus, options = {}) {
    this.container = container;
    this.eventBus = eventBus;
    this.options = options;
    
    // UI组件容器
    this.toolbarButtons = new Map();
    this.sidebarPanels = new Map();
    this.modals = new Map();
    this.contextMenus = new Map();
    
    // DOM元素
    this.toolbarElement = null;
    this.sidebarElement = null;
    this.modalContainer = null;
    
    this.debug = false;
  }
  
  /**
   * 初始化UI管理器
   */
  init() {
    this.createUIStructure();
    this.setupEventListeners();
    
    if (this.debug) {
      console.log('[UIManager] UI manager initialized');
    }
  }
  
  /**
   * 创建UI结构
   */
  createUIStructure() {
    // 创建工具栏容器
    this.toolbarElement = document.createElement('div');
    this.toolbarElement.className = 'annotation-toolbar';
    this.toolbarElement.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 8px;
      background: rgba(255, 255, 255, 0.9);
      padding: 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    `;
    
    // 创建侧边栏容器
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.className = 'annotation-sidebar';
    this.sidebarElement.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 280px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      max-height: calc(100% - 20px);
      overflow-y: auto;
    `;
    
    // 创建模态框容器
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'annotation-modals';
    this.modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2000;
    `;
    
    // 添加到容器
    this.container.style.position = 'relative';
    this.container.appendChild(this.toolbarElement);
    this.container.appendChild(this.sidebarElement);
    document.body.appendChild(this.modalContainer);
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  /**
   * 添加工具栏按钮
   * @param {Object} config - 按钮配置
   */
  addToolbarButton(config) {
    const {
      id,
      icon,
      tooltip,
      onClick,
      group = 'default',
      disabled = false,
      type = 'default'
    } = config;
    
    if (this.toolbarButtons.has(id)) {
      console.warn(`[UIManager] Toolbar button ${id} already exists`);
      return null;
    }
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = `toolbar-button-${id}`;
    
    // 渲染React按钮
    const buttonElement = React.createElement(Tooltip, {
      title: tooltip,
      key: id
    }, React.createElement(Button, {
      type,
      icon,
      disabled,
      onClick: () => {
        if (onClick) {
          onClick();
        }
        this.eventBus.emit('ui:toolbarButtonClick', { id, config });
      },
      style: { minWidth: '32px', height: '32px' }
    }));
    
    const root = createRoot(buttonContainer);
    root.render(buttonElement);
    
    // 添加到工具栏
    this.toolbarElement.appendChild(buttonContainer);
    
    // 保存按钮信息
    this.toolbarButtons.set(id, {
      config,
      element: buttonContainer,
      root,
      group
    });
    
    if (this.debug) {
      console.log(`[UIManager] Toolbar button added: ${id}`);
    }
    
    return id;
  }
  
  /**
   * 移除工具栏按钮
   * @param {string} id - 按钮ID
   */
  removeToolbarButton(id) {
    const button = this.toolbarButtons.get(id);
    if (!button) {
      console.warn(`[UIManager] Toolbar button ${id} not found`);
      return false;
    }
    
    // 异步卸载React组件
    if (button.root) {
      setTimeout(() => {
        try {
          button.root.unmount();
        } catch (error) {
          console.warn(`[UIManager] 卸载按钮组件失败: ${id}`, error);
        }
      }, 0);
    }
    
    // 移除DOM元素
    if (button.element && button.element.parentNode) {
      try {
        button.element.parentNode.removeChild(button.element);
      } catch (error) {
        console.warn(`[UIManager] 移除按钮DOM失败: ${id}`, error);
      }
    }
    
    // 从映射中移除
    this.toolbarButtons.delete(id);
    
    if (this.debug) {
      console.log(`[UIManager] Toolbar button removed: ${id}`);
    }
    
    return true;
  }
  
  /**
   * 更新工具栏按钮状态
   * @param {string} id - 按钮ID
   * @param {boolean} active - 是否激活
   */
  updateToolbarState(id, active) {
    const button = this.toolbarButtons.get(id);
    if (!button) return;
    
    // 更新按钮样式
    const buttonElement = button.element.querySelector('.ant-btn');
    if (buttonElement) {
      if (active) {
        buttonElement.classList.add('ant-btn-primary');
        buttonElement.classList.remove('ant-btn-default');
      } else {
        buttonElement.classList.add('ant-btn-default');
        buttonElement.classList.remove('ant-btn-primary');
      }
    }
  }
  
  /**
   * 添加侧边栏面板
   * @param {Object} config - 面板配置
   */
  addSidebarPanel(config) {
    const {
      id,
      title,
      content,
      icon,
      collapsible = true,
      defaultCollapsed = false
    } = config;
    
    if (this.sidebarPanels.has(id)) {
      console.warn(`[UIManager] Sidebar panel ${id} already exists`);
      return null;
    }
    
    // 创建面板容器
    const panelContainer = document.createElement('div');
    panelContainer.className = `sidebar-panel-${id}`;
    panelContainer.style.cssText = `
      border-bottom: 1px solid #f0f0f0;
      background: white;
    `;
    
    // 创建面板头部
    const headerElement = document.createElement('div');
    headerElement.style.cssText = `
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: ${collapsible ? 'pointer' : 'default'};
      background: #fafafa;
    `;
    
    const titleElement = document.createElement('div');
    titleElement.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 14px;
    `;
    titleElement.textContent = title;
    
    if (icon) {
      const iconContainer = document.createElement('div');
      const iconRoot = createRoot(iconContainer);
      iconRoot.render(icon);
      titleElement.insertBefore(iconContainer, titleElement.firstChild);
    }
    
    headerElement.appendChild(titleElement);
    
    // 创建内容容器
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      padding: 16px;
      display: ${defaultCollapsed ? 'none' : 'block'};
    `;
    
    // 渲染内容
    let contentRoot = null;
    if (React.isValidElement(content)) {
      contentRoot = createRoot(contentContainer);
      contentRoot.render(content);
    } else if (typeof content === 'string') {
      contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      contentContainer.appendChild(content);
    }
    
    // 折叠功能
    if (collapsible) {
      let collapsed = defaultCollapsed;
      
      const toggleButton = document.createElement('div');
      toggleButton.textContent = collapsed ? '▶' : '▼';
      toggleButton.style.cssText = `
        font-size: 12px;
        transition: transform 0.2s;
      `;
      
      headerElement.appendChild(toggleButton);
      
      headerElement.addEventListener('click', () => {
        collapsed = !collapsed;
        contentContainer.style.display = collapsed ? 'none' : 'block';
        toggleButton.textContent = collapsed ? '▶' : '▼';
      });
    }
    
    // 组装面板
    panelContainer.appendChild(headerElement);
    panelContainer.appendChild(contentContainer);
    
    // 添加到侧边栏
    this.sidebarElement.appendChild(panelContainer);
    
    // 保存面板信息
    this.sidebarPanels.set(id, {
      config,
      element: panelContainer,
      contentContainer,
      contentRoot
    });
    
    if (this.debug) {
      console.log(`[UIManager] Sidebar panel added: ${id}`);
    }
    
    return id;
  }
  
  /**
   * 移除侧边栏面板
   * @param {string} id - 面板ID
   */
  removeSidebarPanel(id) {
    const panel = this.sidebarPanels.get(id);
    if (!panel) {
      console.warn(`[UIManager] Sidebar panel ${id} not found`);
      return false;
    }
    
    // 异步卸载React组件
    if (panel.contentRoot) {
      setTimeout(() => {
        try {
          panel.contentRoot.unmount();
        } catch (error) {
          console.warn(`[UIManager] 卸载面板组件失败: ${id}`, error);
        }
      }, 0);
    }
    
    // 移除DOM元素
    if (panel.element && panel.element.parentNode) {
      try {
        panel.element.parentNode.removeChild(panel.element);
      } catch (error) {
        console.warn(`[UIManager] 移除面板DOM失败: ${id}`, error);
      }
    }
    
    // 从映射中移除
    this.sidebarPanels.delete(id);
    
    if (this.debug) {
      console.log(`[UIManager] Sidebar panel removed: ${id}`);
    }
    
    return true;
  }
  
  /**
   * 显示模态框
   * @param {Object} config - 模态框配置
   */
  showModal(config) {
    const {
      id,
      title,
      content,
      width = 520,
      height,
      closable = true,
      maskClosable = true,
      footer,
      onOk,
      onCancel
    } = config;
    
    // 如果模态框已存在，先关闭
    if (this.modals.has(id)) {
      this.hideModal(id);
    }
    
    // 创建模态框容器
    const modalContainer = document.createElement('div');
    modalContainer.className = `modal-${id}`;
    modalContainer.style.pointerEvents = 'auto';
    
    // 创建模态框
    const modalElement = React.createElement(Modal, {
      title,
      open: true,
      width,
      height,
      closable,
      maskClosable,
      footer,
      onOk: () => {
        if (onOk) onOk();
        this.hideModal(id);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        this.hideModal(id);
      },
      getContainer: () => modalContainer
    }, content);
    
    // 渲染模态框
    const modalRoot = createRoot(modalContainer);
    modalRoot.render(modalElement);
    
    // 添加到容器
    this.modalContainer.appendChild(modalContainer);
    
    // 保存模态框信息
    this.modals.set(id, {
      config,
      element: modalContainer,
      root: modalRoot
    });
    
    if (this.debug) {
      console.log(`[UIManager] Modal shown: ${id}`);
    }
  }
  
  /**
   * 隐藏模态框
   * @param {string} id - 模态框ID
   */
  hideModal(id) {
    const modal = this.modals.get(id);
    if (!modal) {
      console.warn(`[UIManager] Modal ${id} not found`);
      return false;
    }
    
    // 异步卸载React组件
    if (modal.root) {
      setTimeout(() => {
        try {
          modal.root.unmount();
        } catch (error) {
          console.warn(`[UIManager] 卸载模态框组件失败: ${id}`, error);
        }
      }, 0);
    }
    
    // 移除DOM元素
    if (modal.element && modal.element.parentNode) {
      try {
        modal.element.parentNode.removeChild(modal.element);
      } catch (error) {
        console.warn(`[UIManager] 移除模态框DOM失败: ${id}`, error);
      }
    }
    
    // 从映射中移除
    this.modals.delete(id);
    
    if (this.debug) {
      console.log(`[UIManager] Modal hidden: ${id}`);
    }
    
    return true;
  }
  
  /**
   * 显示通知
   * @param {string} message - 消息内容
   * @param {string} type - 通知类型
   */
  showNotification(message, type = 'info') {
    const notificationConfig = {
      message,
      duration: 3,
      placement: 'topRight'
    };
    
    switch (type) {
      case 'success':
        notification.success(notificationConfig);
        break;
      case 'error':
        notification.error(notificationConfig);
        break;
      case 'warning':
        notification.warning(notificationConfig);
        break;
      default:
        notification.info(notificationConfig);
    }
    
    if (this.debug) {
      console.log(`[UIManager] Notification shown: ${type} - ${message}`);
    }
  }
  
  /**
   * 处理窗口大小变化
   */
  handleResize() {
    // 调整侧边栏高度
    if (this.sidebarElement) {
      const containerHeight = this.container.clientHeight;
      this.sidebarElement.style.maxHeight = `${containerHeight - 20}px`;
    }
    
    this.eventBus.emit('ui:resize');
  }
  
  /**
   * 设置工具栏可见性
   * @param {boolean} visible - 是否可见
   */
  setToolbarVisible(visible) {
    if (this.toolbarElement) {
      this.toolbarElement.style.display = visible ? 'flex' : 'none';
    }
  }
  
  /**
   * 设置侧边栏可见性
   * @param {boolean} visible - 是否可见
   */
  setSidebarVisible(visible) {
    if (this.sidebarElement) {
      this.sidebarElement.style.display = visible ? 'block' : 'none';
    }
  }
  
  /**
   * 获取UI状态
   */
  getUIState() {
    return {
      toolbarButtons: Array.from(this.toolbarButtons.keys()),
      sidebarPanels: Array.from(this.sidebarPanels.keys()),
      modals: Array.from(this.modals.keys())
    };
  }
  
  /**
   * 清除所有UI组件
   */
  clearAll() {
    // 异步清除所有组件，避免竞态条件
    setTimeout(() => {
      // 清除工具栏按钮
      const buttonIds = Array.from(this.toolbarButtons.keys());
      for (const id of buttonIds) {
        this.removeToolbarButton(id);
      }
      
      // 清除侧边栏面板
      const panelIds = Array.from(this.sidebarPanels.keys());
      for (const id of panelIds) {
        this.removeSidebarPanel(id);
      }
      
      // 清除模态框
      const modalIds = Array.from(this.modals.keys());
      for (const id of modalIds) {
        this.hideModal(id);
      }
    }, 0);
  }
  
  /**
   * 销毁UI管理器
   */
  destroy() {
    // 清除所有UI组件
    this.clearAll();
    
    // 移除事件监听器
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // 移除DOM元素
    if (this.toolbarElement && this.toolbarElement.parentNode) {
      this.toolbarElement.parentNode.removeChild(this.toolbarElement);
    }
    
    if (this.sidebarElement && this.sidebarElement.parentNode) {
      this.sidebarElement.parentNode.removeChild(this.sidebarElement);
    }
    
    if (this.modalContainer && this.modalContainer.parentNode) {
      this.modalContainer.parentNode.removeChild(this.modalContainer);
    }
    
    // 清理状态
    this.toolbarButtons.clear();
    this.sidebarPanels.clear();
    this.modals.clear();
    
    if (this.debug) {
      console.log('[UIManager] UI manager destroyed');
    }
  }
}

export default UIManager;