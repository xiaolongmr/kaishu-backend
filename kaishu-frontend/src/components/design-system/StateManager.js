/**
 * 状态管理器
 * 提供全局状态管理和订阅机制
 */

class StateManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.state = new Map();
    this.subscribers = new Map();
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
   * 设置状态值
   * @param {string} key - 状态键
   * @param {*} value - 状态值
   */
  set(key, value) {
    const oldValue = this.state.get(key);
    
    // 检查值是否真的发生了变化
    if (this.isEqual(oldValue, value)) {
      return;
    }
    
    this.state.set(key, value);
    
    if (this.debug) {
      console.log(`[StateManager] State changed: ${key}`, { oldValue, newValue: value });
    }
    
    // 通知订阅者
    this.notifySubscribers(key, value, oldValue);
    
    // 发送全局事件
    this.eventBus.emit('state:changed', { key, value, oldValue });
  }
  
  /**
   * 获取状态值
   * @param {string} key - 状态键
   * @param {*} defaultValue - 默认值
   */
  get(key, defaultValue = undefined) {
    return this.state.has(key) ? this.state.get(key) : defaultValue;
  }
  
  /**
   * 检查状态是否存在
   * @param {string} key - 状态键
   */
  has(key) {
    return this.state.has(key);
  }
  
  /**
   * 删除状态
   * @param {string} key - 状态键
   */
  delete(key) {
    if (this.state.has(key)) {
      const oldValue = this.state.get(key);
      this.state.delete(key);
      
      if (this.debug) {
        console.log(`[StateManager] State deleted: ${key}`, oldValue);
      }
      
      // 通知订阅者
      this.notifySubscribers(key, undefined, oldValue);
      
      // 发送全局事件
      this.eventBus.emit('state:deleted', { key, oldValue });
      
      return true;
    }
    return false;
  }
  
  /**
   * 订阅状态变化
   * @param {string} key - 状态键
   * @param {Function} callback - 回调函数
   */
  subscribe(key, callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key).add(callback);
    
    if (this.debug) {
      console.log(`[StateManager] Subscribed to state: ${key}`);
    }
    
    // 返回取消订阅函数
    return () => this.unsubscribe(key, callback);
  }
  
  /**
   * 取消订阅状态变化
   * @param {string} key - 状态键
   * @param {Function} callback - 回调函数
   */
  unsubscribe(key, callback) {
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key);
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        this.subscribers.delete(key);
      }
      
      if (this.debug) {
        console.log(`[StateManager] Unsubscribed from state: ${key}`);
      }
    }
  }
  
  /**
   * 通知订阅者
   * @param {string} key - 状态键
   * @param {*} newValue - 新值
   * @param {*} oldValue - 旧值
   */
  notifySubscribers(key, newValue, oldValue) {
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key);
      
      for (const callback of callbacks) {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error(`[StateManager] Error in subscriber callback for ${key}:`, error);
        }
      }
    }
  }
  
  /**
   * 批量设置状态
   * @param {Object} states - 状态对象
   */
  setBatch(states) {
    const changes = [];
    
    for (const [key, value] of Object.entries(states)) {
      const oldValue = this.state.get(key);
      
      if (!this.isEqual(oldValue, value)) {
        this.state.set(key, value);
        changes.push({ key, value, oldValue });
      }
    }
    
    if (changes.length > 0) {
      if (this.debug) {
        console.log(`[StateManager] Batch state changes:`, changes);
      }
      
      // 通知所有变化的订阅者
      for (const change of changes) {
        this.notifySubscribers(change.key, change.value, change.oldValue);
      }
      
      // 发送批量变化事件
      this.eventBus.emit('state:batchChanged', changes);
    }
  }
  
  /**
   * 获取所有状态
   */
  getAll() {
    return Object.fromEntries(this.state);
  }
  
  /**
   * 清除所有状态
   */
  clear() {
    const oldStates = this.getAll();
    this.state.clear();
    this.subscribers.clear();
    
    if (this.debug) {
      console.log(`[StateManager] All states cleared`);
    }
    
    this.eventBus.emit('state:cleared', oldStates);
  }
  
  /**
   * 获取状态键列表
   */
  getKeys() {
    return Array.from(this.state.keys());
  }
  
  /**
   * 获取订阅者数量
   * @param {string} key - 状态键
   */
  getSubscriberCount(key) {
    return this.subscribers.has(key) ? this.subscribers.get(key).size : 0;
  }
  
  /**
   * 获取所有订阅信息
   */
  getSubscriptionInfo() {
    const info = {};
    
    for (const [key, callbacks] of this.subscribers) {
      info[key] = callbacks.size;
    }
    
    return info;
  }
  
  /**
   * 深度比较两个值是否相等
   * @param {*} a - 值A
   * @param {*} b - 值B
   */
  isEqual(a, b) {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
          if (!this.isEqual(a[i], b[i])) return false;
        }
        return true;
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.isEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * 创建计算状态
   * @param {string} key - 状态键
   * @param {Array<string>} dependencies - 依赖的状态键
   * @param {Function} computeFn - 计算函数
   */
  createComputed(key, dependencies, computeFn) {
    const compute = () => {
      const depValues = dependencies.map(dep => this.get(dep));
      const result = computeFn(...depValues);
      this.set(key, result);
    };
    
    // 初始计算
    compute();
    
    // 订阅依赖变化
    const unsubscribers = dependencies.map(dep => 
      this.subscribe(dep, compute)
    );
    
    // 返回清理函数
    return () => {
      unsubscribers.forEach(unsub => unsub());
      this.delete(key);
    };
  }
  
  /**
   * 创建状态快照
   */
  createSnapshot() {
    return {
      timestamp: Date.now(),
      states: this.getAll()
    };
  }
  
  /**
   * 恢复状态快照
   * @param {Object} snapshot - 状态快照
   */
  restoreSnapshot(snapshot) {
    if (!snapshot || !snapshot.states) {
      throw new Error('Invalid snapshot');
    }
    
    this.clear();
    this.setBatch(snapshot.states);
    
    if (this.debug) {
      console.log(`[StateManager] Restored snapshot from ${new Date(snapshot.timestamp)}`);
    }
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    return {
      stateCount: this.state.size,
      subscriberInfo: this.getSubscriptionInfo(),
      totalSubscribers: Array.from(this.subscribers.values())
        .reduce((total, callbacks) => total + callbacks.size, 0)
    };
  }
}

export default StateManager;