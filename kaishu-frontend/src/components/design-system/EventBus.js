/**
 * 事件总线系统
 * 提供发布-订阅模式的事件通信机制
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.maxListeners = 100; // 防止内存泄漏
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
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} context - 上下文对象
   */
  on(event, handler, context = null) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    const listeners = this.events.get(event);
    
    // 检查监听器数量限制
    if (listeners.length >= this.maxListeners) {
      console.warn(`Event '${event}' has reached maximum listeners (${this.maxListeners})`);
    }
    
    // 检查是否已经存在相同的监听器
    const exists = listeners.some(listener => 
      listener.handler === handler && listener.context === context
    );
    
    if (!exists) {
      listeners.push({ handler, context });
      
      if (this.debug) {
        console.log(`[EventBus] Subscribed to '${event}', total listeners: ${listeners.length}`);
      }
    }
    
    return this;
  }
  
  /**
   * 订阅事件（只触发一次）
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} context - 上下文对象
   */
  once(event, handler, context = null) {
    if (typeof handler !== 'function') {
      throw new Error('Event handler must be a function');
    }
    
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    
    const listeners = this.onceEvents.get(event);
    listeners.push({ handler, context });
    
    if (this.debug) {
      console.log(`[EventBus] Subscribed once to '${event}'`);
    }
    
    return this;
  }
  
  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} handler - 事件处理函数
   * @param {Object} context - 上下文对象
   */
  off(event, handler = null, context = null) {
    // 如果没有指定handler，移除所有监听器
    if (!handler) {
      this.events.delete(event);
      this.onceEvents.delete(event);
      
      if (this.debug) {
        console.log(`[EventBus] Removed all listeners for '${event}'`);
      }
      
      return this;
    }
    
    // 移除普通监听器
    if (this.events.has(event)) {
      const listeners = this.events.get(event);
      const filteredListeners = listeners.filter(listener => 
        listener.handler !== handler || listener.context !== context
      );
      
      if (filteredListeners.length === 0) {
        this.events.delete(event);
      } else {
        this.events.set(event, filteredListeners);
      }
      
      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from '${event}', remaining listeners: ${filteredListeners.length}`);
      }
    }
    
    // 移除一次性监听器
    if (this.onceEvents.has(event)) {
      const listeners = this.onceEvents.get(event);
      const filteredListeners = listeners.filter(listener => 
        listener.handler !== handler || listener.context !== context
      );
      
      if (filteredListeners.length === 0) {
        this.onceEvents.delete(event);
      } else {
        this.onceEvents.set(event, filteredListeners);
      }
    }
    
    return this;
  }
  
  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data = null) {
    if (this.debug) {
      console.log(`[EventBus] Emitting '${event}'`, data);
    }
    
    let listenerCount = 0;
    
    // 触发普通监听器
    if (this.events.has(event)) {
      const listeners = this.events.get(event).slice(); // 复制数组，防止在执行过程中被修改
      
      for (const listener of listeners) {
        try {
          if (listener.context) {
            listener.handler.call(listener.context, data, event);
          } else {
            listener.handler(data, event);
          }
          listenerCount++;
        } catch (error) {
          console.error(`[EventBus] Error in event handler for '${event}':`, error);
          // 继续执行其他监听器
        }
      }
    }
    
    // 触发一次性监听器
    if (this.onceEvents.has(event)) {
      const listeners = this.onceEvents.get(event).slice();
      this.onceEvents.delete(event); // 清除一次性监听器
      
      for (const listener of listeners) {
        try {
          if (listener.context) {
            listener.handler.call(listener.context, data, event);
          } else {
            listener.handler(data, event);
          }
          listenerCount++;
        } catch (error) {
          console.error(`[EventBus] Error in once event handler for '${event}':`, error);
        }
      }
    }
    
    if (this.debug) {
      console.log(`[EventBus] Event '${event}' triggered ${listenerCount} listeners`);
    }
    
    return this;
  }
  
  /**
   * 异步发布事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  async emitAsync(event, data = null) {
    if (this.debug) {
      console.log(`[EventBus] Emitting async '${event}'`, data);
    }
    
    const promises = [];
    
    // 收集普通监听器的Promise
    if (this.events.has(event)) {
      const listeners = this.events.get(event).slice();
      
      for (const listener of listeners) {
        try {
          const result = listener.context 
            ? listener.handler.call(listener.context, data, event)
            : listener.handler(data, event);
          
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`[EventBus] Error in async event handler for '${event}':`, error);
        }
      }
    }
    
    // 收集一次性监听器的Promise
    if (this.onceEvents.has(event)) {
      const listeners = this.onceEvents.get(event).slice();
      this.onceEvents.delete(event);
      
      for (const listener of listeners) {
        try {
          const result = listener.context 
            ? listener.handler.call(listener.context, data, event)
            : listener.handler(data, event);
          
          if (result instanceof Promise) {
            promises.push(result);
          }
        } catch (error) {
          console.error(`[EventBus] Error in async once event handler for '${event}':`, error);
        }
      }
    }
    
    // 等待所有Promise完成
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
    
    if (this.debug) {
      console.log(`[EventBus] Async event '${event}' completed with ${promises.length} async handlers`);
    }
    
    return this;
  }
  
  /**
   * 检查是否有监听器
   * @param {string} event - 事件名称
   */
  hasListeners(event) {
    const hasNormal = this.events.has(event) && this.events.get(event).length > 0;
    const hasOnce = this.onceEvents.has(event) && this.onceEvents.get(event).length > 0;
    return hasNormal || hasOnce;
  }
  
  /**
   * 获取监听器数量
   * @param {string} event - 事件名称
   */
  getListenerCount(event) {
    const normalCount = this.events.has(event) ? this.events.get(event).length : 0;
    const onceCount = this.onceEvents.has(event) ? this.onceEvents.get(event).length : 0;
    return normalCount + onceCount;
  }
  
  /**
   * 获取所有事件名称
   */
  getEventNames() {
    const normalEvents = Array.from(this.events.keys());
    const onceEvents = Array.from(this.onceEvents.keys());
    return [...new Set([...normalEvents, ...onceEvents])];
  }
  
  /**
   * 移除所有监听器
   */
  removeAllListeners() {
    const eventCount = this.getEventNames().length;
    this.events.clear();
    this.onceEvents.clear();
    
    if (this.debug) {
      console.log(`[EventBus] Removed all listeners for ${eventCount} events`);
    }
    
    return this;
  }
  
  /**
   * 设置最大监听器数量
   * @param {number} max - 最大数量
   */
  setMaxListeners(max) {
    if (typeof max !== 'number' || max < 0) {
      throw new Error('Max listeners must be a non-negative number');
    }
    this.maxListeners = max;
    return this;
  }
  
  /**
   * 获取最大监听器数量
   */
  getMaxListeners() {
    return this.maxListeners;
  }
  
  /**
   * 创建命名空间事件总线
   * @param {string} namespace - 命名空间
   */
  namespace(namespace) {
    return new NamespacedEventBus(this, namespace);
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo() {
    const info = {
      totalEvents: this.getEventNames().length,
      events: {},
      totalListeners: 0
    };
    
    for (const event of this.getEventNames()) {
      const count = this.getListenerCount(event);
      info.events[event] = count;
      info.totalListeners += count;
    }
    
    return info;
  }
  
  /**
   * 打印调试信息
   */
  printDebugInfo() {
    const info = this.getDebugInfo();
    console.table(info.events);
    console.log(`Total events: ${info.totalEvents}, Total listeners: ${info.totalListeners}`);
  }
}

/**
 * 命名空间事件总线
 * 为特定命名空间提供隔离的事件通信
 */
class NamespacedEventBus {
  constructor(parentBus, namespace) {
    this.parentBus = parentBus;
    this.namespace = namespace;
  }
  
  /**
   * 添加命名空间前缀
   */
  _addNamespace(event) {
    return `${this.namespace}:${event}`;
  }
  
  /**
   * 移除命名空间前缀
   */
  _removeNamespace(event) {
    const prefix = `${this.namespace}:`;
    return event.startsWith(prefix) ? event.slice(prefix.length) : event;
  }
  
  on(event, handler, context = null) {
    return this.parentBus.on(this._addNamespace(event), handler, context);
  }
  
  once(event, handler, context = null) {
    return this.parentBus.once(this._addNamespace(event), handler, context);
  }
  
  off(event, handler = null, context = null) {
    return this.parentBus.off(this._addNamespace(event), handler, context);
  }
  
  emit(event, data = null) {
    return this.parentBus.emit(this._addNamespace(event), data);
  }
  
  emitAsync(event, data = null) {
    return this.parentBus.emitAsync(this._addNamespace(event), data);
  }
  
  hasListeners(event) {
    return this.parentBus.hasListeners(this._addNamespace(event));
  }
  
  getListenerCount(event) {
    return this.parentBus.getListenerCount(this._addNamespace(event));
  }
  
  removeAllListeners() {
    const allEvents = this.parentBus.getEventNames();
    const namespaceEvents = allEvents.filter(event => event.startsWith(`${this.namespace}:`));
    
    for (const event of namespaceEvents) {
      this.parentBus.off(event);
    }
    
    return this;
  }
}

export default EventBus;
export { NamespacedEventBus };