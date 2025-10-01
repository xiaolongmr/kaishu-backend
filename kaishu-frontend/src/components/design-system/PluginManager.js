/**
 * 插件管理器
 * 负责插件的注册、激活、停用和生命周期管理
 */

class PluginManager {
  constructor(api) {
    this.api = api;
    this.plugins = new Map();
    this.activePlugins = new Set();
    this.pluginConfigs = new Map();
    this.dependencies = new Map();
    this.loadOrder = [];
    this.debug = false;
  }
  
  /**
   * 启用调试模式
   */
  enableDebug() {
    this.debug = true;
  }
  
  /**
   * 禁用调试模式
   */
  disableDebug() {
    this.debug = false;
  }
  
  /**
   * 注册插件
   * @param {Object} plugin - 插件实例
   */
  register(plugin) {
    if (!plugin || !plugin.id) {
      throw new Error('Plugin must have an id');
    }
    
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }
    
    // 验证插件接口
    this.validatePlugin(plugin);
    
    // 检查依赖
    if (plugin.dependencies) {
      this.checkDependencies(plugin);
    }
    
    try {
      // 安装插件
      plugin.install(this.api);
      
      // 注册插件
      this.plugins.set(plugin.id, plugin);
      this.dependencies.set(plugin.id, plugin.dependencies || []);
      
      // 加载配置
      this.loadPluginConfig(plugin.id);
      
      if (this.debug) {
        console.log(`[PluginManager] Plugin registered: ${plugin.name} (${plugin.id})`);
      }
      
      // 发送注册事件
      this.api.events.emit('plugin:registered', plugin);
      
      return true;
      
    } catch (error) {
      console.error(`[PluginManager] Failed to register plugin ${plugin.id}:`, error);
      throw error;
    }
  }
  
  /**
   * 注销插件
   * @param {string} pluginId - 插件ID
   */
  unregister(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`[PluginManager] Plugin ${pluginId} not found`);
      return false;
    }
    
    try {
      // 检查是否有其他插件依赖此插件
      const dependents = this.getDependents(pluginId);
      if (dependents.length > 0) {
        throw new Error(`Cannot unregister plugin ${pluginId}. It is required by: ${dependents.join(', ')}`);
      }
      
      // 停用插件
      if (this.activePlugins.has(pluginId)) {
        this.deactivate(pluginId);
      }
      
      // 卸载插件
      plugin.uninstall();
      
      // 移除插件
      this.plugins.delete(pluginId);
      this.dependencies.delete(pluginId);
      this.pluginConfigs.delete(pluginId);
      
      // 从加载顺序中移除
      const index = this.loadOrder.indexOf(pluginId);
      if (index !== -1) {
        this.loadOrder.splice(index, 1);
      }
      
      if (this.debug) {
        console.log(`[PluginManager] Plugin unregistered: ${plugin.name} (${pluginId})`);
      }
      
      // 发送注销事件
      this.api.events.emit('plugin:unregistered', plugin);
      
      return true;
      
    } catch (error) {
      console.error(`[PluginManager] Failed to unregister plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * 激活插件
   * @param {string} pluginId - 插件ID
   */
  activate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (this.activePlugins.has(pluginId)) {
      console.warn(`[PluginManager] Plugin ${pluginId} is already active`);
      return false;
    }
    
    try {
      // 检查并激活依赖
      if (plugin.dependencies) {
        for (const depId of plugin.dependencies) {
          if (!this.activePlugins.has(depId)) {
            this.activate(depId);
          }
        }
      }
      
      // 激活插件
      plugin.activate();
      this.activePlugins.add(pluginId);
      
      // 更新加载顺序
      if (!this.loadOrder.includes(pluginId)) {
        this.loadOrder.push(pluginId);
      }
      
      if (this.debug) {
        console.log(`[PluginManager] Plugin activated: ${plugin.name} (${pluginId})`);
      }
      
      // 发送激活事件
      this.api.events.emit('plugin:activated', plugin);
      
      return true;
      
    } catch (error) {
      console.error(`[PluginManager] Failed to activate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * 停用插件
   * @param {string} pluginId - 插件ID
   */
  deactivate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    if (!this.activePlugins.has(pluginId)) {
      console.warn(`[PluginManager] Plugin ${pluginId} is not active`);
      return false;
    }
    
    try {
      // 检查是否有活跃的依赖插件
      const dependents = this.getActiveDependents(pluginId);
      if (dependents.length > 0) {
        // 先停用依赖插件
        for (const depId of dependents) {
          this.deactivate(depId);
        }
      }
      
      // 停用插件
      plugin.deactivate();
      this.activePlugins.delete(pluginId);
      
      // 从加载顺序中移除
      const index = this.loadOrder.indexOf(pluginId);
      if (index !== -1) {
        this.loadOrder.splice(index, 1);
      }
      
      if (this.debug) {
        console.log(`[PluginManager] Plugin deactivated: ${plugin.name} (${pluginId})`);
      }
      
      // 发送停用事件
      this.api.events.emit('plugin:deactivated', plugin);
      
      return true;
      
    } catch (error) {
      console.error(`[PluginManager] Failed to deactivate plugin ${pluginId}:`, error);
      throw error;
    }
  }
  
  /**
   * 获取插件
   * @param {string} pluginId - 插件ID
   */
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }
  
  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
  
  /**
   * 获取活跃插件
   */
  getActivePlugins() {
    return Array.from(this.activePlugins).map(id => this.plugins.get(id));
  }
  
  /**
   * 检查插件是否活跃
   * @param {string} pluginId - 插件ID
   */
  isActive(pluginId) {
    return this.activePlugins.has(pluginId);
  }
  
  /**
   * 检查插件是否已注册
   * @param {string} pluginId - 插件ID
   */
  isRegistered(pluginId) {
    return this.plugins.has(pluginId);
  }
  
  /**
   * 验证插件接口
   * @param {Object} plugin - 插件实例
   */
  validatePlugin(plugin) {
    const requiredMethods = ['install', 'uninstall', 'activate', 'deactivate'];
    const requiredProperties = ['id', 'name', 'version'];
    
    // 检查必需属性
    for (const prop of requiredProperties) {
      if (!plugin[prop]) {
        throw new Error(`Plugin missing required property: ${prop}`);
      }
    }
    
    // 检查必需方法
    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`Plugin missing required method: ${method}`);
      }
    }
    
    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
      throw new Error(`Invalid plugin version format: ${plugin.version}`);
    }
  }
  
  /**
   * 检查插件依赖
   * @param {Object} plugin - 插件实例
   */
  checkDependencies(plugin) {
    if (!plugin.dependencies || !Array.isArray(plugin.dependencies)) {
      return;
    }
    
    for (const depId of plugin.dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Plugin ${plugin.id} depends on ${depId}, but it is not registered`);
      }
    }
  }
  
  /**
   * 获取插件的依赖者
   * @param {string} pluginId - 插件ID
   */
  getDependents(pluginId) {
    const dependents = [];
    
    for (const [id, deps] of this.dependencies) {
      if (deps.includes(pluginId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }
  
  /**
   * 获取活跃的依赖者
   * @param {string} pluginId - 插件ID
   */
  getActiveDependents(pluginId) {
    return this.getDependents(pluginId).filter(id => this.activePlugins.has(id));
  }
  
  /**
   * 加载插件配置
   * @param {string} pluginId - 插件ID
   */
  loadPluginConfig(pluginId) {
    try {
      const saved = localStorage.getItem(`plugin-config-${pluginId}`);
      if (saved) {
        const config = JSON.parse(saved);
        this.pluginConfigs.set(pluginId, config);
        
        // 应用配置到插件
        const plugin = this.plugins.get(pluginId);
        if (plugin && typeof plugin.setConfig === 'function') {
          plugin.setConfig(config);
        }
      }
    } catch (error) {
      console.error(`[PluginManager] Failed to load config for plugin ${pluginId}:`, error);
    }
  }
  
  /**
   * 保存插件配置
   * @param {string} pluginId - 插件ID
   * @param {Object} config - 配置对象
   */
  savePluginConfig(pluginId, config) {
    try {
      this.pluginConfigs.set(pluginId, config);
      localStorage.setItem(`plugin-config-${pluginId}`, JSON.stringify(config));
      
      // 应用配置到插件
      const plugin = this.plugins.get(pluginId);
      if (plugin && typeof plugin.setConfig === 'function') {
        plugin.setConfig(config);
      }
      
      if (this.debug) {
        console.log(`[PluginManager] Config saved for plugin ${pluginId}`);
      }
      
    } catch (error) {
      console.error(`[PluginManager] Failed to save config for plugin ${pluginId}:`, error);
    }
  }
  
  /**
   * 获取插件配置
   * @param {string} pluginId - 插件ID
   */
  getPluginConfig(pluginId) {
    return this.pluginConfigs.get(pluginId) || {};
  }
  
  /**
   * 批量激活插件
   * @param {Array<string>} pluginIds - 插件ID数组
   */
  activateBatch(pluginIds) {
    const results = [];
    
    for (const pluginId of pluginIds) {
      try {
        this.activate(pluginId);
        results.push({ pluginId, success: true });
      } catch (error) {
        results.push({ pluginId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * 批量停用插件
   * @param {Array<string>} pluginIds - 插件ID数组
   */
  deactivateBatch(pluginIds) {
    const results = [];
    
    for (const pluginId of pluginIds) {
      try {
        this.deactivate(pluginId);
        results.push({ pluginId, success: true });
      } catch (error) {
        results.push({ pluginId, success: false, error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * 获取插件信息
   */
  getPluginInfo() {
    const info = {
      total: this.plugins.size,
      active: this.activePlugins.size,
      plugins: []
    };
    
    for (const plugin of this.plugins.values()) {
      info.plugins.push({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description || '',
        active: this.activePlugins.has(plugin.id),
        dependencies: plugin.dependencies || [],
        dependents: this.getDependents(plugin.id)
      });
    }
    
    return info;
  }
  
  /**
   * 销毁插件管理器
   */
  destroy() {
    // 停用所有插件
    const activePluginIds = Array.from(this.activePlugins);
    for (const pluginId of activePluginIds) {
      try {
        this.deactivate(pluginId);
      } catch (error) {
        console.error(`[PluginManager] Error deactivating plugin ${pluginId}:`, error);
      }
    }
    
    // 注销所有插件
    const pluginIds = Array.from(this.plugins.keys());
    for (const pluginId of pluginIds) {
      try {
        this.unregister(pluginId);
      } catch (error) {
        console.error(`[PluginManager] Error unregistering plugin ${pluginId}:`, error);
      }
    }
    
    // 清理状态
    this.plugins.clear();
    this.activePlugins.clear();
    this.pluginConfigs.clear();
    this.dependencies.clear();
    this.loadOrder = [];
    
    if (this.debug) {
      console.log('[PluginManager] Plugin manager destroyed');
    }
  }
}

export default PluginManager;