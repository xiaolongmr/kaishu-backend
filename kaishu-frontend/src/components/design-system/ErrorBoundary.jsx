/**
 * 错误边界组件
 * 捕获和处理React组件中的错误
 */

import React from 'react';
import { Alert, Button, Card, Typography } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }
  
  static getDerivedStateFromError(error) {
    // 更新state以显示错误UI
    return {
      hasError: true,
      errorId: Date.now().toString(36)
    };
  }
  
  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    this.setState({
      error,
      errorInfo
    });
    
    // 记录错误到控制台
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 可以在这里发送错误报告到服务器
    this.logErrorToService(error, errorInfo);
  }
  
  logErrorToService = (error, errorInfo) => {
    try {
      // 这里可以集成错误监控服务
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // 发送到错误监控服务
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
      
      console.log('Error report:', errorReport);
    } catch (reportError) {
      console.error('Failed to log error:', reportError);
    }
  };
  
  handleReload = () => {
    // 重新加载页面
    window.location.reload();
  };
  
  handleRetry = () => {
    // 重置错误状态
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };
  
  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallback, showDetails = false } = this.props;
      
      // 如果提供了自定义fallback，使用它
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(error, errorInfo, this.handleRetry)
          : fallback;
      }
      
      // 默认错误UI
      return (
        <div style={{ 
          padding: '24px', 
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card 
            style={{ maxWidth: '600px', width: '100%' }}
            actions={[
              <Button 
                key="retry"
                type="primary" 
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
              >
                重试
              </Button>,
              <Button 
                key="reload"
                icon={<ReloadOutlined />}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>
            ]}
          >
            <div style={{ textAlign: 'center' }}>
              <BugOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
              <Title level={3}>出现了一个错误</Title>
              <Paragraph type="secondary">
                抱歉，应用程序遇到了意外错误。您可以尝试重新加载页面或联系技术支持。
              </Paragraph>
              
              {showDetails && error && (
                <Alert
                  message="错误详情"
                  description={
                    <div style={{ textAlign: 'left' }}>
                      <Text strong>错误信息：</Text>
                      <pre style={{ 
                        fontSize: '12px', 
                        background: '#f5f5f5', 
                        padding: '8px', 
                        borderRadius: '4px',
                        marginTop: '8px',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}>
                        {error.message}
                      </pre>
                      {errorInfo && (
                        <>
                          <Text strong style={{ marginTop: '16px', display: 'block' }}>组件堆栈：</Text>
                          <pre style={{ 
                            fontSize: '12px', 
                            background: '#f5f5f5', 
                            padding: '8px', 
                            borderRadius: '4px',
                            marginTop: '8px',
                            overflow: 'auto',
                            maxHeight: '200px'
                          }}>
                            {errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  }
                  type="error"
                  style={{ marginTop: '16px' }}
                  showIcon
                />
              )}
            </div>
          </Card>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// 高阶组件：为组件添加错误边界
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook：在函数组件中使用错误边界
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);
  
  const resetError = React.useCallback(() => {
    setError(null);
  }, []);
  
  const captureError = React.useCallback((error) => {
    setError(error);
    console.error('Captured error:', error);
  }, []);
  
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);
  
  return { captureError, resetError };
};

export default ErrorBoundary;