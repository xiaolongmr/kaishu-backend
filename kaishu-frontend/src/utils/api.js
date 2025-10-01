/**
 * API配置和请求工具
 * 统一管理前后端API通信
 */

import axios from 'axios';

// 获取API基础URL
const getApiBaseUrl = () => {
  // 开发环境 - 使用相对路径，让Vite代理处理
  if (import.meta.env.DEV) {
    console.log('开发环境API地址: 使用Vite代理');
    return ''; // 使用相对路径，让Vite代理处理
  }
  
  // 生产环境 - 使用部署的后端服务
  const productionApiUrl = import.meta.env.VITE_PRODUCTION_API_URL || import.meta.env.VITE_API_URL;
  
  // 如果没有配置环境变量，使用默认的自定义域名，并设置备用域名
  if (!productionApiUrl || productionApiUrl === '/api') {
    // 主要使用自定义域名
    const primaryApiUrl = 'https://kaishu-backend.z-l.top';
    console.log('生产环境API地址未配置，使用默认后端地址:', primaryApiUrl);
    return primaryApiUrl;
  }
  
  console.log('生产环境API地址:', productionApiUrl);
  return productionApiUrl;
};

// 备用API基础URL（Vercel默认域名）
const getFallbackApiBaseUrl = () => {
  return 'https://kaishu-backend.vercel.app';
};

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 支持跨域cookie
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 开发环境日志
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        data: config.data,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 开发环境日志
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log('API Response:', {
        status: response.status,
        data: response.data,
        url: response.config.url
      });
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是网络错误或服务器错误，且还没有尝试过备用域名
    if (
      !originalRequest._retry && 
      !import.meta.env.DEV && 
      (error.code === 'NETWORK_ERROR' || 
       error.code === 'ERR_NETWORK' ||
       (error.response && error.response.status >= 500) ||
       !error.response)
    ) {
      const currentBaseUrl = api.defaults.baseURL;
      const fallbackUrl = getFallbackApiBaseUrl();
      
      // 如果当前不是备用域名，尝试切换到备用域名
      if (currentBaseUrl !== fallbackUrl) {
        console.warn('主域名连接失败，尝试切换到备用域名:', fallbackUrl);
        originalRequest._retry = true;
        originalRequest.baseURL = fallbackUrl;
        
        try {
          return await api.request(originalRequest);
        } catch (fallbackError) {
          console.error('备用域名也连接失败:', fallbackError.message);
          // 继续执行原有的错误处理逻辑
        }
      }
    }
    
    // 统一错误处理
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          console.error('权限不足');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error('请求失败:', data?.message || error.message);
      }
    } else if (error.request) {
      // 网络错误
      console.error('网络连接失败，请检查网络设置');
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API方法封装
export const apiMethods = {
  // GET请求
  get: (url, params = {}) => api.get(url, { params }),
  
  // POST请求
  post: (url, data = {}) => api.post(url, data),
  
  // PUT请求
  put: (url, data = {}) => api.put(url, data),
  
  // DELETE请求
  delete: (url) => api.delete(url),
  
  // PATCH请求
  patch: (url, data = {}) => api.patch(url, data)
};

// 具体API接口
export const authAPI = {
  // 用户登录
  login: (credentials) => apiMethods.post('/api/auth/login', credentials),
  
  // 用户注册
  register: (userData) => apiMethods.post('/api/auth/register', userData),
  
  // 获取用户信息
  getProfile: () => apiMethods.get('/api/auth/profile'),
  
  // 更新用户信息
  updateProfile: (userData) => apiMethods.put('/api/auth/profile', userData),
  
  // 用户登出
  logout: () => apiMethods.post('/api/auth/logout')
};

export const worksAPI = {
  // 获取作品列表
  getWorks: (params = {}) => apiMethods.get('/api/works', params),
  
  // 获取单个作品详情
  getWork: (id) => apiMethods.get(`/api/works/${id}`),
  
  // 创建新作品
  createWork: (workData) => apiMethods.post('/api/works', workData),
  
  // 更新作品
  updateWork: (id, workData) => apiMethods.put(`/api/works/${id}`, workData),
  
  // 删除作品
  deleteWork: (id) => apiMethods.delete(`/api/works/${id}`),
  
  // 搜索作品
  searchWorks: (query) => apiMethods.get('/api/works/search', { q: query })
};

export const annotationsAPI = {
  // 获取标注列表
  getAnnotations: (workId) => apiMethods.get(`/api/annotations/${workId}`),
  
  // 获取所有标注
  getAllAnnotations: (params = {}) => apiMethods.get('/api/annotations', params),
  
  // 获取标注数量
  getAnnotationCount: (params = {}) => apiMethods.get('/api/annotations/count', params),
  
  // 搜索标注
  searchAnnotations: (params = {}) => apiMethods.get('/api/annotations/search', params),
  
  // 创建标注
  createAnnotation: (annotationData) => apiMethods.post('/api/annotations', annotationData),
  
  // 更新标注
  updateAnnotation: (id, annotationData) => apiMethods.put(`/api/annotations/${id}`, annotationData),
  
  // 删除标注
  deleteAnnotation: (id) => apiMethods.delete(`/api/annotations/${id}`)
};

export const ocrAPI = {
  // OCR识别
  recognize: (imageData) => apiMethods.post('/api/ocr/recognize', imageData),
  
  // 获取OCR历史
  getHistory: () => apiMethods.get('/api/ocr/history')
};

export const homepageAPI = {
  // 获取首页数据
  getHomepageData: () => apiMethods.get('/api/homepage'),
  
  // 获取统计数据
  getStats: () => apiMethods.get('/api/homepage/stats')
};

export const commentAPI = {
  // 获取评论设置
  getCommentSettings: (pagePath = '') => apiMethods.get(`/api/comment-settings/${pagePath}`),
  
  // 获取所有评论设置
  getAllCommentSettings: () => apiMethods.get('/api/comment-settings'),
  
  // 更新评论设置
  updateCommentSettings: (pagePath, settings) => apiMethods.put(`/api/comment-settings/${pagePath}`, settings)
};

// 健康检查API
export const healthAPI = {
  check: () => apiMethods.get('/api/health')
};

// API域名管理工具
export const apiDomainManager = {
  // 获取当前使用的域名
  getCurrentDomain: () => api.defaults.baseURL,
  
  // 切换到备用域名
  switchToFallback: () => {
    const fallbackUrl = getFallbackApiBaseUrl();
    api.defaults.baseURL = fallbackUrl;
    console.log('已切换到备用API域名:', fallbackUrl);
    return fallbackUrl;
  },
  
  // 切换到主域名
  switchToPrimary: () => {
    const primaryUrl = getApiBaseUrl();
    api.defaults.baseURL = primaryUrl;
    console.log('已切换到主API域名:', primaryUrl);
    return primaryUrl;
  },
  
  // 测试域名连通性
  testConnection: async (url = null) => {
    const testUrl = url || api.defaults.baseURL;
    try {
      // 创建一个独立的axios实例进行测试，避免循环依赖
      const testResponse = await axios.create({ timeout: 5000 }).get(`${testUrl}/api/health`);
      return {
        success: true,
        url: testUrl,
        status: testResponse.status,
        data: testResponse.data
      };
    } catch (error) {
      return {
        success: false,
        url: testUrl,
        error: error.message
      };
    }
  },
  
  // 自动选择最佳域名
  autoSelectBestDomain: async () => {
    const primaryUrl = getApiBaseUrl();
    const fallbackUrl = getFallbackApiBaseUrl();
    
    console.log('正在测试API域名连通性...');
    
    // 先测试主域名
    const primaryTest = await apiDomainManager.testConnection(primaryUrl);
    if (primaryTest.success) {
      api.defaults.baseURL = primaryUrl;
      console.log('主域名连接正常，使用主域名:', primaryUrl);
      return primaryUrl;
    }
    
    // 主域名失败，测试备用域名
    console.warn('主域名连接失败，测试备用域名...');
    const fallbackTest = await apiDomainManager.testConnection(fallbackUrl);
    if (fallbackTest.success) {
      api.defaults.baseURL = fallbackUrl;
      console.log('备用域名连接正常，使用备用域名:', fallbackUrl);
      return fallbackUrl;
    }
    
    // 都失败了
    console.error('所有API域名都无法连接');
    throw new Error('无法连接到任何API服务器');
  }
};

// 默认导出axios实例
export default api;