# Fetch工具函数使用指南

## 为什么需要统一的fetch工具函数？

在跨域请求中，尤其是当请求需要携带凭证（credentials）时，必须在每个fetch调用中显式设置`credentials: 'include'`选项。为了避免手动修改所有组件文件，我们创建了统一的fetch工具函数，确保所有请求都正确配置。

## 如何使用

### 1. 导入工具函数

```javascript
import fetchUtils from './src/utils/fetchUtils';
// 或者
import { fetchWithCredentials } from './src/utils/fetchUtils';
```

### 2. 使用便捷方法（推荐）

```javascript
// GET请求
const data = await fetchUtils.get('/api/works');

// POST请求
const response = await fetchUtils.post('/api/auth/login', { username, password });

// PUT请求
const result = await fetchUtils.put('/api/comment-settings/page', { enabled: true });

// DELETE请求
await fetchUtils.delete('/api/annotations/123');

// PATCH请求
const updated = await fetchUtils.patch('/api/users/profile', { name: '新名称' });
```

### 3. 使用基础函数（适合复杂请求）

```javascript
const response = await fetchWithCredentials('/api/custom-endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ custom: 'data' })
});
```

## 迁移指南

将现有的fetch调用迁移到新的工具函数：

### 原代码
```javascript
const response = await fetch('/api/works');
const data = await response.json();
```

### 新代码
```javascript
const data = await fetchUtils.get('/api/works');
```

### 原代码（带选项）
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ username, password })
});
const data = await response.json();
```

### 新代码
```javascript
const data = await fetchUtils.post('/api/auth/login', { username, password });
```

## 错误处理

工具函数会自动处理响应状态和JSON解析，您可以使用try/catch进行错误处理：

```javascript
try {
  const data = await fetchUtils.get('/api/works');
  // 处理成功响应
} catch (error) {
  console.error('请求失败:', error.message);
  // 错误对象包含status和data属性
}
```

## 注意事项

1. 工具函数默认设置`Content-Type: 'application/json'`，如果需要其他类型，请在headers中覆盖
2. 对于非JSON响应，请使用fetchWithCredentials并手动处理响应
3. 所有请求都会自动携带凭证，解决跨域CORS问题

## 示例：完整迁移案例

### 组件中的迁移示例

```javascript
// 原代码
const fetchWorks = async () => {
  try {
    const response = await fetch('/api/works');
    if (!response.ok) throw new Error('获取失败');
    const data = await response.json();
    setWorks(data);
  } catch (error) {
    console.error('错误:', error);
  }
};

// 新代码
const fetchWorks = async () => {
  try {
    const data = await fetchUtils.get('/api/works');
    setWorks(data);
  } catch (error) {
    console.error('错误:', error);
  }
};
```