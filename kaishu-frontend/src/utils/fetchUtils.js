/**
 * 统一的fetch工具函数，自动设置credentials选项
 * 确保所有跨域请求都正确携带凭证
 */

export const fetchWithCredentials = async (url, options = {}) => {
  // 合并默认选项和用户选项，确保credentials始终为'include'
  const fetchOptions = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  try {
    // 发送请求
    const response = await fetch(url, fetchOptions);
    
    // 检查响应状态
    if (!response.ok) {
      // 尝试解析错误响应
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = { error: `请求失败: ${response.status} ${response.statusText}` };
      }
      
      // 创建错误对象
      const error = new Error(errorData.error || '请求失败');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    
    // 对于204 No Content响应，直接返回空对象
    if (response.status === 204) {
      return {};
    }
    
    // 尝试解析JSON响应
    try {
      return await response.json();
    } catch (jsonError) {
      // 如果响应不是有效的JSON，返回原始响应文本
      return await response.text();
    }
  } catch (error) {
    console.error('Fetch请求错误:', error);
    throw error;
  }
};

// 导出便捷方法
export const fetchUtils = {
  // GET请求
  get: (url) => fetchWithCredentials(url, { method: 'GET' }),
  
  // POST请求
  post: (url, data) => fetchWithCredentials(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  // PUT请求
  put: (url, data) => fetchWithCredentials(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  // DELETE请求
  delete: (url) => fetchWithCredentials(url, { method: 'DELETE' }),
  
  // PATCH请求
  patch: (url, data) => fetchWithCredentials(url, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
};

export default fetchUtils;