import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook

const ImageDebugTool = () => {
  const { isAuthenticated } = useAuth();
  const [imageCheckResult, setImageCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const { commentSettings } = useCommentSettings('debug'); // 获取图像调试页面评论设置
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
    checkImages();
  }, []);

  const checkImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/check-images');
      const data = await response.json();
      setImageCheckResult(data);
    } catch (error) {
      console.error('检查图片出错:', error);
      setImageCheckResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testImageLoading = () => {
    if (!testImageUrl) return;
    
    setTestResult({
      status: 'loading',
      message: '正在加载图片...'
    });
    
    const img = new Image();
    img.onload = () => {
      setTestResult({
        status: 'success',
        message: '图片加载成功！',
        dimensions: `${img.width}x${img.height}`
      });
    };
    img.onerror = () => {
      setTestResult({
        status: 'error',
        message: '图片加载失败！'
      });
    };
    img.src = testImageUrl;
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: isMobile ? '16px' : '20px' }}>
        <h2 style={{ 
          fontSize: isMobile ? '20px' : '24px',
          textAlign: 'center',
          marginBottom: isMobile ? '16px' : '20px'
        }}>
          图片加载诊断工具
        </h2>
        <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
          您需要登录才能使用诊断工具。
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: isMobile ? '16px' : '20px', 
      maxWidth: isMobile ? '100%' : '800px', 
      margin: '0 auto' 
    }}>
      <h2 style={{ 
        fontSize: isMobile ? '24px' : '30px',
        textAlign: 'center',
        marginBottom: isMobile ? '16px' : '20px'
      }}>
        图片加载诊断工具
      </h2>
      
      <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
        <button 
          onClick={checkImages} 
          disabled={loading}
          style={{ 
            padding: isMobile ? '6px 12px' : '8px 16px', 
            marginRight: isMobile ? '6px' : '10px',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          {loading ? '检查中...' : '检查楷书库图片'}
        </button>
        
        {loading && <span style={{ fontSize: isMobile ? '14px' : '16px' }}>加载中...</span>}
      </div>
      
      {imageCheckResult && (
        <div style={{ 
          border: '1px solid #ccc', 
          padding: isMobile ? '12px' : '15px', 
          borderRadius: '4px',
          backgroundColor: imageCheckResult.success ? '#f0fff0' : '#fff0f0',
          marginBottom: isMobile ? '16px' : '20px'
        }}>
          <h3 style={{ fontSize: isMobile ? '18px' : '20px' }}>检查结果</h3>
          <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>状态:</strong> {imageCheckResult.success ? '成功' : '失败'}</p>
          <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>信息:</strong> {imageCheckResult.message}</p>
          <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>路径:</strong> {imageCheckResult.path}</p>
          
          {imageCheckResult.success ? (
            <>
              <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>文件数量:</strong> {imageCheckResult.count}</p>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto', 
                border: '1px solid #eee', 
                padding: isMobile ? '8px' : '10px'
              }}>
                <h4 style={{ fontSize: isMobile ? '16px' : '18px' }}>文件列表:</h4>
                <ul style={{ 
                  paddingLeft: isMobile ? '16px' : '20px',
                  fontSize: isMobile ? '12px' : '14px'
                }}>
                  {imageCheckResult.files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>错误:</strong> {imageCheckResult.error}</p>
          )}
        </div>
      )}
      
      <div style={{ marginTop: isMobile ? '20px' : '30px' }}>
        <h3 style={{ fontSize: isMobile ? '18px' : '20px' }}>测试单个图片加载</h3>
        <div style={{ 
          display: 'flex', 
          marginBottom: isMobile ? '8px' : '10px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <input 
            type="text" 
            value={testImageUrl} 
            onChange={(e) => setTestImageUrl(e.target.value)}
            placeholder="输入图片URL，例如: http://localhost:3000/images/文件名.jpg"
            style={{ 
              flex: 1, 
              padding: isMobile ? '6px' : '8px', 
              marginRight: isMobile ? 0 : '10px',
              marginBottom: isMobile ? '8px' : 0,
              fontSize: isMobile ? '14px' : '16px'
            }}
          />
          <button 
            onClick={testImageLoading}
            style={{ 
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '14px' : '16px'
            }}
          >
            测试加载
          </button>
        </div>
        
        {testResult && (
          <div style={{ 
            border: '1px solid #ccc', 
            padding: isMobile ? '12px' : '15px', 
            borderRadius: '4px',
            backgroundColor: testResult.status === 'success' ? '#f0fff0' : 
                              testResult.status === 'error' ? '#fff0f0' : '#f0f0ff'
          }}>
            <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>状态:</strong> {testResult.message}</p>
            {testResult.dimensions && <p style={{ fontSize: isMobile ? '14px' : '16px' }}><strong>尺寸:</strong> {testResult.dimensions}</p>}
            {testImageUrl && (
              <div style={{ 
                marginTop: isMobile ? '8px' : '10px', 
                textAlign: 'center' 
              }}>
                <img 
                  src={testImageUrl} 
                  alt="测试图片" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: isMobile ? '150px' : '200px',
                    border: '1px solid #ddd'
                  }}
                  onError={(e) => {
                    console.error('测试图片加载失败:', e);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: isMobile ? '20px' : '30px', 
        padding: isMobile ? '12px' : '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px'
      }}>
        <h3 style={{ fontSize: isMobile ? '18px' : '20px' }}>图片加载故障排除提示</h3>
        <ol style={{ 
          paddingLeft: isMobile ? '16px' : '20px',
          fontSize: isMobile ? '12px' : '14px'
        }}>
          <li>确认后端服务正在运行并监听端口3000</li>
          <li>确认楷书库目录存在并包含图片文件</li>
          <li>图片URL应为 <code style={{ fontSize: isMobile ? '12px' : '14px' }}>http://localhost:3000/images/文件名.jpg</code></li>
          <li>检查浏览器控制台是否有跨域错误</li>
          <li>确认前端代理配置正确</li>
        </ol>
      </div>
      
      {/* 评论区 */}
      {(!commentSettings || commentSettings?.enabled) && (
        <div style={{ 
          marginTop: isMobile ? '16px' : '20px' 
        }} id="comments">
          <TwikooComment commentPath={commentSettings?.shared_path || '/debug'} />
        </div>
      )}
    </div>
  );
};

export default ImageDebugTool;