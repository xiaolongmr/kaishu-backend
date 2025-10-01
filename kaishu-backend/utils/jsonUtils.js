/**
 * JSON工具函数
 * 提供安全的JSON解析功能
 */

const logger = require('./logger');

/**
 * 安全解析tags字段
 * @param {string|null} tagsString - tags字符串
 * @param {number} workId - 作品ID（用于日志）
 * @returns {Array} 解析后的tags数组
 */
function safeParseTags(tagsString, workId = null) {
  if (!tagsString) {
    return [];
  }
  
  try {
    const parsed = JSON.parse(tagsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // 如果JSON解析失败，尝试按逗号分割
    if (typeof tagsString === 'string') {
      const tags = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      if (workId) {
        logger.warn(`作品 ${workId} 的tags字段JSON解析失败，使用逗号分割: ${tagsString}`);
      }
      return tags;
    }
    
    if (workId) {
      logger.warn(`作品 ${workId} 的tags字段解析失败: ${tagsString}`);
    }
    return [];
  }
}

/**
 * 安全解析cloud_urls字段
 * @param {string|null} cloudUrlsString - cloud_urls字符串
 * @param {number} workId - 作品ID（用于日志）
 * @returns {Object|null} 解析后的cloud_urls对象
 */
function safeParseCloudUrls(cloudUrlsString, workId = null) {
  if (!cloudUrlsString) {
    return null;
  }
  
  try {
    return JSON.parse(cloudUrlsString);
  } catch (error) {
    if (workId) {
      logger.warn(`作品 ${workId} 的cloud_urls字段JSON解析失败: ${cloudUrlsString}`);
    }
    return null;
  }
}

/**
 * 安全解析任意JSON字段
 * @param {string|null} jsonString - JSON字符串
 * @param {*} defaultValue - 解析失败时的默认值
 * @param {string} fieldName - 字段名（用于日志）
 * @param {number} workId - 作品ID（用于日志）
 * @returns {*} 解析后的值或默认值
 */
function safeParseJSON(jsonString, defaultValue = null, fieldName = 'unknown', workId = null) {
  if (!jsonString) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    if (workId) {
      logger.warn(`作品 ${workId} 的${fieldName}字段JSON解析失败: ${jsonString}`);
    }
    return defaultValue;
  }
}

/**
 * 处理作品对象，安全解析所有JSON字段
 * @param {Object} work - 作品对象
 * @returns {Object} 处理后的作品对象
 */
function processWorkObject(work) {
  return {
    ...work,
    tags: safeParseTags(work.tags, work.id),
    imageUrl: `/images/${work.filename}`,
    cloudUrls: safeParseCloudUrls(work.cloud_urls, work.id)
  };
}

module.exports = {
  safeParseTags,
  safeParseCloudUrls,
  safeParseJSON,
  processWorkObject
};