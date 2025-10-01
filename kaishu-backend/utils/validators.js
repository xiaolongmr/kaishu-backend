/**
 * 数据验证工具函数
 * 提供统一的输入验证和数据清理功能
 */

const validator = require('validator');

/**
 * 验证规则定义
 */
const validationRules = {
  // 字符串验证
  string: (value, rule) => {
    if (typeof value !== 'string') {
      return '必须是字符串类型';
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      return `长度不能少于${rule.minLength}个字符`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return `长度不能超过${rule.maxLength}个字符`;
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.patternMessage || '格式不正确';
    }
    
    return null;
  },
  
  // 数字验证
  number: (value, rule) => {
    const num = Number(value);
    if (isNaN(num)) {
      return '必须是有效的数字';
    }
    
    if (rule.min !== undefined && num < rule.min) {
      return `不能小于${rule.min}`;
    }
    
    if (rule.max !== undefined && num > rule.max) {
      return `不能大于${rule.max}`;
    }
    
    if (rule.integer && !Number.isInteger(num)) {
      return '必须是整数';
    }
    
    return null;
  },
  
  // 邮箱验证
  email: (value, rule) => {
    if (typeof value !== 'string') {
      return '邮箱必须是字符串类型';
    }
    
    if (!validator.isEmail(value)) {
      return '邮箱格式不正确';
    }
    
    return null;
  },
  
  // URL验证
  url: (value, rule) => {
    if (typeof value !== 'string') {
      return 'URL必须是字符串类型';
    }
    
    if (!validator.isURL(value, rule.options || {})) {
      return 'URL格式不正确';
    }
    
    return null;
  },
  
  // 布尔值验证
  boolean: (value, rule) => {
    if (typeof value !== 'boolean') {
      return '必须是布尔值类型';
    }
    
    return null;
  },
  
  // 数组验证
  array: (value, rule) => {
    if (!Array.isArray(value)) {
      return '必须是数组类型';
    }
    
    if (rule.minLength && value.length < rule.minLength) {
      return `数组长度不能少于${rule.minLength}`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      return `数组长度不能超过${rule.maxLength}`;
    }
    
    if (rule.itemType) {
      for (let i = 0; i < value.length; i++) {
        const itemError = validateValue(value[i], { type: rule.itemType, ...rule.itemRule });
        if (itemError) {
          return `数组第${i + 1}项: ${itemError}`;
        }
      }
    }
    
    return null;
  },
  
  // 对象验证
  object: (value, rule) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return '必须是对象类型';
    }
    
    if (rule.properties) {
      for (const [key, propRule] of Object.entries(rule.properties)) {
        const propError = validateValue(value[key], propRule);
        if (propError) {
          return `属性${key}: ${propError}`;
        }
      }
    }
    
    return null;
  },
  
  // 日期验证
  date: (value, rule) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return '必须是有效的日期';
    }
    
    if (rule.min && date < new Date(rule.min)) {
      return `日期不能早于${rule.min}`;
    }
    
    if (rule.max && date > new Date(rule.max)) {
      return `日期不能晚于${rule.max}`;
    }
    
    return null;
  },
  
  // 文件验证
  file: (value, rule) => {
    if (!value || typeof value !== 'object') {
      return '必须是有效的文件对象';
    }
    
    if (rule.maxSize && value.size > rule.maxSize) {
      return `文件大小不能超过${formatFileSize(rule.maxSize)}`;
    }
    
    if (rule.allowedTypes && !rule.allowedTypes.includes(value.mimetype)) {
      return `文件类型不支持，支持的类型: ${rule.allowedTypes.join(', ')}`;
    }
    
    return null;
  }
};

/**
 * 验证单个值
 * @param {any} value - 要验证的值
 * @param {Object} rule - 验证规则
 * @returns {string|null} 错误信息或null
 */
const validateValue = (value, rule) => {
  // 检查必填项
  if (rule.required && (value === undefined || value === null || value === '')) {
    return '此字段为必填项';
  }
  
  // 如果值为空且非必填，跳过验证
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null;
  }
  
  // 根据类型进行验证
  if (rule.type && validationRules[rule.type]) {
    return validationRules[rule.type](value, rule);
  }
  
  // 自定义验证函数
  if (rule.validator && typeof rule.validator === 'function') {
    try {
      const result = rule.validator(value, rule);
      return result === true ? null : (result || '验证失败');
    } catch (error) {
      return `验证过程中发生错误: ${error.message}`;
    }
  }
  
  return null;
};

/**
 * 验证输入数据
 * @param {Object} data - 要验证的数据
 * @param {Object} rules - 验证规则
 * @returns {Object} 验证结果
 */
const validateInput = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  for (const [field, rule] of Object.entries(rules)) {
    const error = validateValue(data[field], rule);
    if (error) {
      errors[field] = error;
      isValid = false;
    }
  }
  
  return {
    isValid,
    errors,
    data: isValid ? sanitizeData(data, rules) : data
  };
};

/**
 * 数据清理和转换
 * @param {Object} data - 原始数据
 * @param {Object} rules - 验证规则
 * @returns {Object} 清理后的数据
 */
const sanitizeData = (data, rules) => {
  const sanitized = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    let value = data[field];
    
    if (value !== undefined && value !== null) {
      // 字符串清理
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.trim !== false) {
          value = value.trim();
        }
        if (rule.escape) {
          value = validator.escape(value);
        }
        if (rule.toLowerCase) {
          value = value.toLowerCase();
        }
        if (rule.toUpperCase) {
          value = value.toUpperCase();
        }
      }
      
      // 数字转换
      if (rule.type === 'number') {
        value = Number(value);
      }
      
      // 布尔值转换
      if (rule.type === 'boolean' && typeof value !== 'boolean') {
        value = Boolean(value);
      }
      
      // 日期转换
      if (rule.type === 'date') {
        value = new Date(value);
      }
    }
    
    sanitized[field] = value;
  }
  
  return sanitized;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 常用验证规则预设
 */
const commonRules = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    patternMessage: '用户名只能包含字母、数字、下划线和连字符'
  },
  
  password: {
    required: true,
    type: 'string',
    minLength: 6,
    maxLength: 100
  },
  
  email: {
    required: true,
    type: 'email'
  },
  
  id: {
    required: true,
    type: 'number',
    integer: true,
    min: 1
  },
  
  pagination: {
    page: {
      type: 'number',
      integer: true,
      min: 1,
      default: 1
    },
    limit: {
      type: 'number',
      integer: true,
      min: 1,
      max: 100,
      default: 20
    }
  },
  
  imageFile: {
    required: true,
    type: 'file',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  }
};

/**
 * SQL注入防护
 * @param {string} input - 输入字符串
 * @returns {boolean} 是否包含可疑内容
 */
const containsSqlInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|drop|create|alter|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror|onclick)/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * XSS防护
 * @param {string} input - 输入字符串
 * @returns {string} 清理后的字符串
 */
const sanitizeXSS = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  validateInput,
  validateValue,
  sanitizeData,
  formatFileSize,
  commonRules,
  containsSqlInjection,
  sanitizeXSS,
  validationRules
};