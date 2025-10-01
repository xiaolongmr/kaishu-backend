/**
 * 历史记录管理器
 * 提供撤销/重做功能和操作历史管理
 */

class HistoryManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.history = [];
    this.currentIndex = -1;
    this.maxHistorySize = 50;
    this.groupTimeout = 1000; // 1秒内的操作可以合并
    this.lastActionTime = 0;
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
   * 推入新的历史记录
   * @param {Object} action - 操作对象
   */
  push(action) {
    if (!this.validateAction(action)) {
      throw new Error('Invalid action object');
    }
    
    const now = Date.now();
    
    // 检查是否可以与上一个操作合并
    if (this.canMergeWithPrevious(action, now)) {
      this.mergeWithPrevious(action);
      return;
    }
    
    // 如果当前不在历史记录的末尾，删除后面的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1);
    }
    
    // 添加时间戳
    const timestampedAction = {
      ...action,
      timestamp: now,
      id: this.generateActionId()
    };
    
    // 添加新记录
    this.history.push(timestampedAction);
    this.currentIndex++;
    
    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
    
    this.lastActionTime = now;
    
    if (this.debug) {
      console.log(`[HistoryManager] Action pushed: ${action.type}`, {
        currentIndex: this.currentIndex,
        historySize: this.history.length
      });
    }
    
    // 发送历史变化事件
    this.eventBus.emit('history:changed', {
      action: 'push',
      currentIndex: this.currentIndex,
      historySize: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }
  
  /**
   * 撤销操作
   */
  undo() {
    if (!this.canUndo()) {
      if (this.debug) {
        console.warn('[HistoryManager] Cannot undo: no actions to undo');
      }
      return false;
    }
    
    const action = this.history[this.currentIndex];
    
    try {
      // 执行撤销操作
      if (typeof action.undo === 'function') {
        action.undo();
      }
      
      this.currentIndex--;
      
      if (this.debug) {
        console.log(`[HistoryManager] Action undone: ${action.type}`, {
          currentIndex: this.currentIndex
        });
      }
      
      // 发送撤销事件
      this.eventBus.emit('history:undo', {
        action,
        currentIndex: this.currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      // 发送历史变化事件
      this.eventBus.emit('history:changed', {
        action: 'undo',
        currentIndex: this.currentIndex,
        historySize: this.history.length,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      return true;
      
    } catch (error) {
      console.error(`[HistoryManager] Error during undo of ${action.type}:`, error);
      return false;
    }
  }
  
  /**
   * 重做操作
   */
  redo() {
    if (!this.canRedo()) {
      if (this.debug) {
        console.warn('[HistoryManager] Cannot redo: no actions to redo');
      }
      return false;
    }
    
    this.currentIndex++;
    const action = this.history[this.currentIndex];
    
    try {
      // 执行重做操作
      if (typeof action.redo === 'function') {
        action.redo();
      } else if (typeof action.execute === 'function') {
        action.execute();
      }
      
      if (this.debug) {
        console.log(`[HistoryManager] Action redone: ${action.type}`, {
          currentIndex: this.currentIndex
        });
      }
      
      // 发送重做事件
      this.eventBus.emit('history:redo', {
        action,
        currentIndex: this.currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      // 发送历史变化事件
      this.eventBus.emit('history:changed', {
        action: 'redo',
        currentIndex: this.currentIndex,
        historySize: this.history.length,
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
      
      return true;
      
    } catch (error) {
      console.error(`[HistoryManager] Error during redo of ${action.type}:`, error);
      this.currentIndex--; // 回滚索引
      return false;
    }
  }
  
  /**
   * 检查是否可以撤销
   */
  canUndo() {
    return this.currentIndex >= 0;
  }
  
  /**
   * 检查是否可以重做
   */
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }
  
  /**
   * 获取当前操作
   */
  getCurrentAction() {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }
  
  /**
   * 获取历史记录
   */
  getHistory() {
    return this.history.map((action, index) => ({
      ...action,
      isCurrent: index === this.currentIndex,
      canUndo: index <= this.currentIndex,
      canRedo: index > this.currentIndex
    }));
  }
  
  /**
   * 清除历史记录
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.lastActionTime = 0;
    
    if (this.debug) {
      console.log('[HistoryManager] History cleared');
    }
    
    // 发送清除事件
    this.eventBus.emit('history:cleared');
    
    // 发送历史变化事件
    this.eventBus.emit('history:changed', {
      action: 'clear',
      currentIndex: this.currentIndex,
      historySize: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }
  
  /**
   * 设置最大历史记录大小
   * @param {number} size - 最大大小
   */
  setMaxHistorySize(size) {
    if (typeof size !== 'number' || size < 1) {
      throw new Error('Max history size must be a positive number');
    }
    
    this.maxHistorySize = size;
    
    // 如果当前历史记录超过新的限制，删除旧记录
    if (this.history.length > size) {
      const removeCount = this.history.length - size;
      this.history.splice(0, removeCount);
      this.currentIndex = Math.max(-1, this.currentIndex - removeCount);
    }
  }
  
  /**
   * 获取最大历史记录大小
   */
  getMaxHistorySize() {
    return this.maxHistorySize;
  }
  
  /**
   * 跳转到指定的历史记录
   * @param {number} index - 目标索引
   */
  jumpTo(index) {
    if (index < -1 || index >= this.history.length) {
      throw new Error('Invalid history index');
    }
    
    const direction = index > this.currentIndex ? 'forward' : 'backward';
    
    try {
      if (direction === 'forward') {
        // 向前跳转：执行重做操作
        while (this.currentIndex < index) {
          if (!this.redo()) {
            throw new Error(`Failed to redo action at index ${this.currentIndex + 1}`);
          }
        }
      } else {
        // 向后跳转：执行撤销操作
        while (this.currentIndex > index) {
          if (!this.undo()) {
            throw new Error(`Failed to undo action at index ${this.currentIndex}`);
          }
        }
      }
      
      if (this.debug) {
        console.log(`[HistoryManager] Jumped to index ${index}`);
      }
      
      return true;
      
    } catch (error) {
      console.error('[HistoryManager] Error during jump:', error);
      return false;
    }
  }
  
  /**
   * 创建检查点
   * @param {string} name - 检查点名称
   */
  createCheckpoint(name) {
    const checkpoint = {
      type: 'checkpoint',
      name,
      timestamp: Date.now(),
      index: this.currentIndex,
      undo: () => {}, // 检查点不需要撤销操作
      redo: () => {}
    };
    
    this.push(checkpoint);
    
    if (this.debug) {
      console.log(`[HistoryManager] Checkpoint created: ${name}`);
    }
  }
  
  /**
   * 获取检查点列表
   */
  getCheckpoints() {
    return this.history
      .map((action, index) => ({ ...action, index }))
      .filter(action => action.type === 'checkpoint');
  }
  
  /**
   * 跳转到检查点
   * @param {string} name - 检查点名称
   */
  jumpToCheckpoint(name) {
    const checkpoint = this.history.find(action => 
      action.type === 'checkpoint' && action.name === name
    );
    
    if (!checkpoint) {
      throw new Error(`Checkpoint '${name}' not found`);
    }
    
    const index = this.history.indexOf(checkpoint);
    return this.jumpTo(index);
  }
  
  /**
   * 验证操作对象
   * @param {Object} action - 操作对象
   */
  validateAction(action) {
    if (!action || typeof action !== 'object') {
      return false;
    }
    
    // 必须有类型
    if (!action.type || typeof action.type !== 'string') {
      return false;
    }
    
    // 必须有撤销函数
    if (typeof action.undo !== 'function') {
      return false;
    }
    
    return true;
  }
  
  /**
   * 检查是否可以与前一个操作合并
   * @param {Object} action - 当前操作
   * @param {number} timestamp - 时间戳
   */
  canMergeWithPrevious(action, timestamp) {
    if (this.currentIndex < 0) {
      return false;
    }
    
    const previousAction = this.history[this.currentIndex];
    
    // 检查时间间隔
    if (timestamp - this.lastActionTime > this.groupTimeout) {
      return false;
    }
    
    // 检查操作类型是否相同
    if (action.type !== previousAction.type) {
      return false;
    }
    
    // 检查是否支持合并
    if (!action.mergeable || !previousAction.mergeable) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 与前一个操作合并
   * @param {Object} action - 当前操作
   */
  mergeWithPrevious(action) {
    const previousAction = this.history[this.currentIndex];
    
    if (typeof action.merge === 'function') {
      // 使用自定义合并函数
      const mergedAction = action.merge(previousAction);
      this.history[this.currentIndex] = {
        ...mergedAction,
        timestamp: Date.now(),
        id: previousAction.id
      };
    } else {
      // 默认合并：更新数据和重做函数
      this.history[this.currentIndex] = {
        ...previousAction,
        data: { ...previousAction.data, ...action.data },
        redo: action.redo || previousAction.redo,
        timestamp: Date.now()
      };
    }
    
    if (this.debug) {
      console.log(`[HistoryManager] Action merged with previous: ${action.type}`);
    }
  }
  
  /**
   * 生成操作ID
   */
  generateActionId() {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 获取历史统计信息
   */
  getStatistics() {
    const typeCount = {};
    let totalSize = 0;
    
    for (const action of this.history) {
      typeCount[action.type] = (typeCount[action.type] || 0) + 1;
      totalSize += JSON.stringify(action).length;
    }
    
    return {
      totalActions: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      typeCount,
      totalSize,
      averageSize: this.history.length > 0 ? totalSize / this.history.length : 0,
      maxHistorySize: this.maxHistorySize
    };
  }
  
  /**
   * 导出历史记录
   */
  export() {
    return {
      history: this.history,
      currentIndex: this.currentIndex,
      maxHistorySize: this.maxHistorySize,
      exportTime: Date.now()
    };
  }
  
  /**
   * 导入历史记录
   * @param {Object} data - 导入的数据
   */
  import(data) {
    if (!data || !Array.isArray(data.history)) {
      throw new Error('Invalid import data');
    }
    
    // 验证所有操作
    for (const action of data.history) {
      if (!this.validateAction(action)) {
        throw new Error(`Invalid action in import data: ${action.type}`);
      }
    }
    
    // 清除当前历史
    this.clear();
    
    // 导入新历史
    this.history = [...data.history];
    this.currentIndex = Math.min(data.currentIndex, this.history.length - 1);
    
    if (data.maxHistorySize) {
      this.maxHistorySize = data.maxHistorySize;
    }
    
    if (this.debug) {
      console.log(`[HistoryManager] Imported ${this.history.length} actions`);
    }
    
    // 发送导入事件
    this.eventBus.emit('history:imported', {
      actionCount: this.history.length,
      currentIndex: this.currentIndex
    });
  }
}

export default HistoryManager;