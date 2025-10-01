import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import HomepageContentEditor from './HomepageContentEditor'; // 导入首页内容编辑器组件
import { Image, Tag, Modal, Input, Form, Button, message } from 'antd'; // 导入Ant Design组件
import { EditOutlined } from '@ant-design/icons'; // 导入编辑图标
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook

const AdminPage = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [works, setWorks] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('works');
  const [newUser, setNewUser] = useState({ username: '', password: '', isAdmin: false });
  const [messageState, setMessage] = useState({ text: '', type: '' });
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordForm] = Form.useForm();
  const { commentSettings } = useCommentSettings('admin'); // 获取后台管理页面评论设置
  // 添加移动端检测状态
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 添加响应式布局处理
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser?.isAdmin) {
      fetchData();
    }
  }, [isAuthenticated, currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取认证令牌
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // 获取所有作品
      const worksResponse = await fetch('/api/works', {
        headers,
        credentials: 'include'
      });
      const worksData = await worksResponse.json();
      setWorks(worksData);

      // 获取所有标注
      const annotationsResponse = await fetch('/api/search/', {
        headers,
        credentials: 'include'
      });
      const annotationsData = await annotationsResponse.json();
      setAnnotations(annotationsData);

      // 获取所有用户（仅管理员可见）
      try {
        const usersResponse = await fetch('/api/admin/users', {
          headers,
          credentials: 'include'
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData);
        }
      } catch (e) {
        console.error('获取用户列表失败:', e);
      }

      setLoading(false);
    } catch (error) {
      console.error('获取数据失败:', error);
      setLoading(false);
      setMessage({ text: '获取数据失败: ' + error.message, type: 'error' });
    }
  };

  const handleDeleteWork = async (workId) => {
    if (window.confirm('确定要删除这个作品吗？这将删除所有相关的标注信息。')) {
      try {
        // 获取认证令牌
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/works/${workId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          setWorks(works.filter(work => work.id !== workId));
          setAnnotations(annotations.filter(anno => anno.work_id !== workId));
          setMessage({ text: '作品删除成功', type: 'success' });
        } else {
          const error = await response.json();
          throw new Error(error.error || '删除失败');
        }
      } catch (error) {
        console.error('删除作品失败:', error);
        setMessage({ text: '删除作品失败: ' + error.message, type: 'error' });
      }
    }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    if (window.confirm('确定要删除这个标注吗？')) {
      try {
        // 获取认证令牌
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/annotations/${annotationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          setAnnotations(annotations.filter(anno => anno.id !== annotationId));
          setMessage({ text: '标注删除成功', type: 'success' });
        } else {
          const error = await response.json();
          throw new Error(error.error || '删除失败');
        }
      } catch (error) {
        console.error('删除标注失败:', error);
        setMessage({ text: '删除标注失败: ' + error.message, type: 'error' });
      }
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.username || !newUser.password) {
        setMessage({ text: '请填写用户名和密码', type: 'error' });
        return;
      }

      // 获取认证令牌
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        const newUserData = await response.json();
        setUsers([...users, newUserData]);
        setNewUser({ username: '', password: '', isAdmin: false });
        setMessage({ text: '用户创建成功', type: 'success' });
      } else {
        const error = await response.json();
        throw new Error(error.error || '创建用户失败');
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      setMessage({ text: '创建用户失败: ' + error.message, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('确定要删除这个用户吗？')) {
      try {
        // 获取认证令牌
        const token = localStorage.getItem('token');

        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
          setMessage({ text: '用户删除成功', type: 'success' });
        } else {
          const error = await response.json();
          throw new Error(error.error || '删除失败');
        }
      } catch (error) {
        console.error('删除用户失败:', error);
        setMessage({ text: '删除用户失败: ' + error.message, type: 'error' });
      }
    }
  };

  // 数据库导出功能
  const handleExportData = async () => {
    try {
      // 获取认证令牌
      const token = localStorage.getItem('token');

      // 创建一个隐藏的a标签用于下载
      const link = document.createElement('a');
      link.href = `/api/admin/export?token=${token}`;
      link.download = `kaishu-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setMessage({ text: '数据库导出成功，下载已开始', type: 'success' });
    } catch (error) {
      console.error('导出数据库失败:', error);
      setMessage({ text: '导出数据库失败: ' + error.message, type: 'error' });
    }
  };

  // 数据库导入功能
  const handleImportData = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('database', file);

      // 获取认证令牌
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessage({ text: '数据库导入成功', type: 'success' });
        // 重新加载数据
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || '导入失败');
      }
    } catch (error) {
      console.error('导入数据库失败:', error);
      setMessage({ text: '导入数据库失败: ' + error.message, type: 'error' });
    }
  };

  // 显示数据功能
  const handleShowData = async () => {
    try {
      // 获取认证令牌
      const token = localStorage.getItem('token');

      const response = await fetch('/api/admin/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // 在新窗口中显示数据
        const newWindow = window.open('', '_blank');
        newWindow.document.write('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
        newWindow.document.close();
      } else {
        const error = await response.json();
        throw new Error(error.error || '获取数据失败');
      }
    } catch (error) {
      console.error('显示数据失败:', error);
      setMessage({ text: '显示数据失败: ' + error.message, type: 'error' });
    }
  };

  // 打开修改密码模态框
  const showPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordModalVisible(true);
  };

  // 处理密码修改
  const handlePasswordChange = async (values) => {
    try {
      // 获取认证令牌
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: values.newPassword })
      });

      if (response.ok) {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        const error = await response.json();
        throw new Error(error.error || '修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      message.error('修改密码失败: ' + error.message);
    }
  };

  if (!isAuthenticated || !currentUser?.isAdmin) {
    return (
      <div>
        <h2>后台管理</h2>
        <p>您没有权限访问此页面，请先登录管理员账号。</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h2>后台管理</h2>

      {messageState.text && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: messageState.type === 'success' ? '#d4edda' : '#f8d7da',
          color: messageState.type === 'success' ? '#155724' : '#721c24',
          borderRadius: '4px'
        }}>
          {messageState.text}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('works')}
          style={{
            padding: '10px 15px',
            backgroundColor: activeTab === 'works' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'works' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          作品管理
        </button>
        <button
          onClick={() => setActiveTab('annotations')}
          style={{
            padding: '10px 15px',
            backgroundColor: activeTab === 'annotations' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'annotations' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          标注管理
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 15px',
            backgroundColor: activeTab === 'users' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'users' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          用户管理
        </button>
        <button
          onClick={() => setActiveTab('homepage')}
          style={{
            padding: '10px 15px',
            backgroundColor: activeTab === 'homepage' ? '#4CAF50' : '#f1f1f1',
            color: activeTab === 'homepage' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            marginRight: '5px'
          }}
        >
          首页内容管理
        </button>
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <button
            onClick={(e) => {
              // 创建一个隐藏的文件输入元素
              const fileInput = document.createElement('input');
              fileInput.type = 'file';
              fileInput.accept = '.json';
              fileInput.onchange = handleImportData;
              fileInput.click();
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              marginRight: '5px'
            }}
          >
            数据管理
          </button>
          {/* 下拉菜单 */}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: activeTab === 'data' ? 'block' : 'none'
          }}>
            <button
              onClick={handleShowData}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                backgroundColor: 'white',
                color: '#333',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              显示数据
            </button>
            <button
              onClick={(e) => {
                // 创建一个隐藏的文件输入元素
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = handleImportData;
                fileInput.click();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                backgroundColor: 'white',
                color: '#333',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              导入数据
            </button>
            <button
              onClick={handleExportData}
              style={{
                display: 'block',
                width: '100%',
                padding: '10px 15px',
                backgroundColor: 'white',
                color: '#333',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              导出数据
            </button>
          </div>
        </div>
      </div>

      {loading && activeTab !== 'homepage' ? (
        <p>加载中...</p>
      ) : (
        <div>
          {activeTab === 'works' && (
            <div>
              <h3>作品管理 ({works.length} 个作品)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>缩略图</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>文件名</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>作品作者</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>分组</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>标签</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>上传时间</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>描述</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>上传者</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {works.map(work => (
                    <tr key={work.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{work.id}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <Image
                          src={`/images/${encodeURIComponent(work.filename)}`}
                          alt={work.original_filename || work.filename}
                          width={60}
                          height={60}
                          style={{ objectFit: 'cover' }}
                          fallback="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ250LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UsIHNhbnMtc2VyaWYiIGZpbGw9IiM5OTk5OTkiPuWbvueJhzwvdGV4dD48L3N2Zz4="
                          preview={{
                            src: `/images/${encodeURIComponent(work.filename)}`
                          }}
                        />
                      </td>
                      {/* 使用original_filename字段显示原始文件名（中文） */}
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{work.original_filename ? decodeURIComponent(work.original_filename) : (work.filename ? decodeURIComponent(work.filename) : '未知文件名')}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{work.work_author || '无'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{work.group_name || '无'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {work.tags && Array.isArray(work.tags) && work.tags.length > 0 ? (
                          work.tags.map((tag, index) => (
                            <Tag key={index} color="blue">{tag}</Tag>
                          ))
                        ) : (
                          '无'
                        )}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(work.upload_time).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{work.description || '无'}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {work.user_id ? (
                          <span>用户ID: {work.user_id}</span>
                        ) : (
                          '未知'
                        )}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <button
                          onClick={() => handleDeleteWork(work.id)}
                          style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'annotations' && (
            <div>
              <h3>标注管理 ({annotations.length} 个标注)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>字符名</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>字体缩略图</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>作品ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>标注时间</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>位置</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>作者</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {annotations.map(annotation => (
                    <tr key={annotation.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{annotation.id}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{annotation.character_name}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <Image
                          src={`/api/crop-image?filename=${encodeURIComponent(annotation.filename)}&x=${annotation.position_x}&y=${annotation.position_y}&width=${annotation.width}&height=${annotation.height}`}
                          alt={annotation.character_name}
                          width={50}
                          height={50}
                          style={{ objectFit: 'cover' }}
                          fallback={`/images/${encodeURIComponent(annotation.filename)}`}
                          preview={{
                            src: `/api/crop-image?filename=${encodeURIComponent(annotation.filename)}&x=${annotation.position_x}&y=${annotation.position_y}&width=${annotation.width}&height=${annotation.height}`
                          }}
                        />
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{annotation.work_id}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(annotation.annotation_time).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        ({annotation.position_x}, {annotation.position_y}, {annotation.width}×{annotation.height})
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {annotation.user_id ? (
                          <span>用户ID: {annotation.user_id}</span>
                        ) : (
                          '未知'
                        )}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <button
                          onClick={() => handleDeleteAnnotation(annotation.id)}
                          style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h3>用户管理</h3>

              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                <h4 style={{ marginTop: 0 }}>创建新用户</h4>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>用户名:</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    style={{ padding: '8px', width: '250px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>密码:</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{ padding: '8px', width: '250px' }}
                  />
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={newUser.isAdmin}
                      onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                      style={{ marginRight: '5px' }}
                    />
                    设为管理员
                  </label>
                </div>
                <button
                  onClick={handleCreateUser}
                  style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer' }}
                >
                  创建用户
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>ID</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>用户名</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>角色</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>创建时间</th>
                    <th style={{ border: '1px solid #ccc', padding: '8px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.id}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{user.username}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        {user.is_admin ?
                          <span style={{ color: '#E91E63', fontWeight: 'bold' }}>管理员</span> :
                          <span>普通用户</span>
                        }
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>{new Date(user.created_at).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                        <button
                          onClick={() => showPasswordModal(user)}
                          style={{
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            cursor: 'pointer',
                            marginRight: '5px'
                          }}
                        >
                          <EditOutlined /> 修改密码
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '5px 10px',
                            cursor: user.username === currentUser.username ? 'not-allowed' : 'pointer',
                            opacity: user.username === currentUser.username ? 0.5 : 1
                          }}
                          disabled={user.username === currentUser.username}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'homepage' && (
            <HomepageContentEditor />
          )}

          {/* 修改密码模态框 */}
          <Modal
            title={`修改用户 ${selectedUser?.username} 的密码`}
            open={passwordModalVisible}
            onCancel={() => setPasswordModalVisible(false)}
            footer={null}
          >
            <Form
              form={passwordForm}
              onFinish={handlePasswordChange}
              layout="vertical"
            >
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[{ required: true, message: '请输入新密码' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* 已移除字体统计区域 */}
        </div>
      )}

      {/* 评论区 */}
      {(!commentSettings || commentSettings?.enabled) && (
        <div style={{ marginTop: '20px' }} id="comments">
          <TwikooComment commentPath={commentSettings?.shared_path || '/admin'} />
        </div>
      )}
    </div>
  );
};

export default AdminPage;