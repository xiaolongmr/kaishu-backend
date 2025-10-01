import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const LoginPage = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleLogin = async (values) => {
    const { username, password } = values;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }
      
      // 将令牌保存在localStorage中
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        username: data.username,
        isAdmin: data.isAdmin
      }));
      
      // 调用回调通知父组件登录成功
      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      setError(err.message || '登录过程中出现错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh', 
      padding: isMobile ? '16px' : '32px 0' 
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: isMobile ? '100%' : '400px', 
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          margin: isMobile ? '0 16px' : '0'
        }}
        variant="filled"
      >
        <div style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '16px' : '24px' 
        }}>
          <Title level={isMobile ? 3 : 2} style={{ 
            marginBottom: '0',
            fontSize: isMobile ? '20px' : '24px'
          }}>
            管理员登录
          </Title>
          <Space style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: isMobile ? '4px' : '8px' 
          }}>
            <LoginOutlined style={{ 
              color: '#1890ff', 
              fontSize: isMobile ? '16px' : '20px' 
            }} />
          </Space>
        </div>
        
        {error && (
          <Alert
            message="登录错误"
            description={error}
            type="error"
            showIcon
            closable
            style={{ 
              marginBottom: isMobile ? '12px' : '16px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
        )}
        
        <Form
          form={form}
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          size={isMobile ? "middle" : "large"}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名!' },
              { min: 3, message: '用户名至少三个字符!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#999' }} />} 
              placeholder="用户名"
              style={{ 
                borderRadius: '4px',
                fontSize: isMobile ? '14px' : '16px'
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#999' }} />}
              placeholder="密码"
              style={{ 
                borderRadius: '4px',
                fontSize: isMobile ? '14px' : '16px'
              }}
            />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              style={{ 
                height: isMobile ? '40px' : '48px', 
                borderRadius: '4px',
                fontSize: isMobile ? '14px' : '16px'
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ 
          textAlign: 'center', 
          marginTop: isMobile ? '12px' : '16px' 
        }}>
          <Text type="secondary" style={{ 
            fontSize: isMobile ? '12px' : '14px' 
          }}>
            提示：默认管理员账号为 admin / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;