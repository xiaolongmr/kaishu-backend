// useCommentSettings.js - 自定义hook用于获取评论设置（带缓存）

import { useState, useEffect } from 'react';
import { commentAPI } from '../utils/api'; // 导入评论API

// 缓存对象
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存时间

// 为首页提供默认设置
const DEFAULT_HOME_SETTINGS = {
  page_path: '',
  enabled: true, // 首页默认启用评论功能
  shared_path: null,
  updated_at: new Date().toISOString()
};

/**
 * 获取评论设置的自定义hook（带缓存）
 * @param {string} pagePath - 页面路径
 * @returns {object} 包含评论设置和加载状态的对象
 */
const useCommentSettings = (pagePath) => {
  const [commentSettings, setCommentSettings] = useState(
    // 为首页提供立即可用的默认设置，避免闪烁
    pagePath === '' ? DEFAULT_HOME_SETTINGS : null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // 用于处理组件卸载情况
    
    const fetchCommentSettings = async () => {
      try {
        if (!isMounted) return;
        
        setLoading(true);
        
        // 对首页路径特殊处理，优先使用默认设置
        if (pagePath === '') {
          console.log('首页评论设置：使用预设默认值');
        }
        
        // 检查是否有缓存且未过期
        const cacheKey = `comment_settings_${pagePath}`;
        const cachedItem = cache.get(cacheKey);
        const now = new Date().getTime();
        
        if (cachedItem && now - cachedItem.timestamp < CACHE_DURATION) {
          // 使用缓存数据
          console.log(`使用缓存的评论设置，页面：${pagePath}`);
          if (isMounted) setCommentSettings(cachedItem.data);
        } else {
          // 从网络获取数据，增加超时控制和重试机制
          let lastError;
          let data;
          
          // 最多重试3次
          for (let i = 0; i < 3; i++) {
            if (!isMounted) return;
            
            try {
              console.log(`获取评论设置，页面：${pagePath}，尝试：${i + 1}/3`);
              
              const response = await commentAPI.getCommentSettings(pagePath);
              data = response.data;
              console.log(`成功获取评论设置，页面：${pagePath}`, data);
              break; // 成功获取数据，跳出循环
            } catch (fetchError) {
              lastError = fetchError;
              
              if (fetchError.name === 'AbortError') {
                console.warn(`获取评论设置超时 (尝试 ${i + 1}/3)`);
              } else {
                console.error(`获取评论设置失败 (尝试 ${i + 1}/3):`, fetchError);
              }
              
              // 如果不是最后一次尝试，等待后重试
              if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
              }
            }
          }
          
          // 如果所有重试都失败了，使用默认值
          if (!data) {
            console.error('获取评论设置最终失败，使用默认值:', lastError);
            // 首页使用固定的默认启用设置
            if (pagePath === '') {
              data = DEFAULT_HOME_SETTINGS;
            } else {
              data = {
                page_path: pagePath,
                enabled: true, // 所有页面默认启用评论功能
                shared_path: null,
                updated_at: new Date().toISOString()
              };
            }
          }
          
          // 保存到缓存
          cache.set(cacheKey, {
            data,
            timestamp: now
          });
          
          if (isMounted) setCommentSettings(data);
        }
      } catch (error) {
        console.error('获取评论设置失败:', error);
        
        // 设置默认值
        const defaultSettings = pagePath === '' 
          ? DEFAULT_HOME_SETTINGS 
          : {
              page_path: pagePath,
              enabled: true, // 所有页面默认启用评论功能
              shared_path: null,
              updated_at: new Date().toISOString()
            };
        
        if (isMounted) setCommentSettings(defaultSettings);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCommentSettings();
    
    // 监听评论设置更新事件
    const handleSettingsUpdate = (event) => {
      // 修复：确保所有页面都能正确响应更新
      if (event.detail.pagePath === pagePath || event.detail.pagePath === 'all') {
        console.log(`收到评论设置更新事件，页面：${pagePath}`);
        // 清除当前页面的缓存
        const cacheKey = `comment_settings_${pagePath}`;
        cache.delete(cacheKey);
        // 重新获取数据
        fetchCommentSettings();
      }
    };
    
    window.addEventListener('commentSettingsUpdated', handleSettingsUpdate);
    
    // 清理事件监听器
    return () => {
      isMounted = false;
      window.removeEventListener('commentSettingsUpdated', handleSettingsUpdate);
    };
  }, [pagePath]);

  return { commentSettings, loading };
};

export default useCommentSettings;