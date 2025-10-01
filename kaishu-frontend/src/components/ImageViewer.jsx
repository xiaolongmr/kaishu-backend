import React, { useState, useEffect } from 'react';

const ImageViewer = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageStats, setImageStats] = useState(null);
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
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 获取楷书库中的所有图片
      const response = await fetch('/api/list-images');
      const data = await response.json();
      
      if (response.ok) {
        setImages(data.files || []);
      } else {
        setError(data.error || '获取图片列表失败');
      }
    } catch (err) {
      setError('获取图片列表时出错: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkImageUrl = async (filename) => {
    try {
      const img = new Image();
      img.src = `http://localhost:3000/images/${filename}`;
      
      return new Promise((resolve) => {
        img.onload = () => {
          resolve({
            status: 'success',
            width: img.width,
            height: img.height,
            aspect: (img.width / img.height).toFixed(2)
          });
        };
        
        img.onerror = () => {
          resolve({
            status: 'error',
            message: '图片加载失败'
          });
        };
      });
    } catch (err) {
      return {
        status: 'error',
        message: '检查图片时出错: ' + err.message
      };
    }
  };

  const handleImageSelect = async (filename) => {
    setSelectedImage(filename);
    
    const stats = await checkImageUrl(filename);
    setImageStats(stats);
  };
  
  const handleRefreshList = () => {
    fetchImages();
    setSelectedImage(null);
    setImageStats(null);
  };

  return (
    <div style={{ padding: isMobile ? '16px' : '20px' }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '16px' : '20px',
        fontSize: isMobile ? '20px' : '24px'
      }}>
        楷书库图片查看器
      </h2>
      
      <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
        <button 
          onClick={handleRefreshList}
          style={{
            padding: isMobile ? '6px 12px' : '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px'
          }}
        >
          刷新图片列表
        </button>
      </div>
      
      {loading ? (
        <p style={{ fontSize: isMobile ? '14px' : '16px' }}>加载中...</p>
      ) : error ? (
        <div style={{ 
          padding: isMobile ? '12px' : '15px', 
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: isMobile ? '16px' : '20px'
        }}>
          <strong>错误:</strong> {error}
        </div>
      ) : (
        <div style={{ 
          display: isMobile ? 'block' : 'flex', 
          gap: isMobile ? '16px' : '20px' 
        }}>
          <div style={{ 
            flex: isMobile ? 'none' : '0 0 300px', 
            maxHeight: isMobile ? 'auto' : '600px', 
            overflowY: 'auto',
            padding: isMobile ? '12px' : '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: isMobile ? '16px' : '0'
          }}>
            <h3 style={{ 
              fontSize: isMobile ? '16px' : '18px',
              marginBottom: isMobile ? '12px' : '16px'
            }}>
              楷书库图片列表 ({images.length})
            </h3>
            
            {images.length === 0 ? (
              <p style={{ fontSize: isMobile ? '14px' : '16px' }}>未找到图片</p>
            ) : (
              <ul style={{ 
                listStyleType: 'none', 
                padding: 0, 
                margin: 0
              }}>
                {images.map((image, index) => (
                  <li 
                    key={index}
                    style={{ 
                      padding: isMobile ? '8px' : '10px', 
                      marginBottom: isMobile ? '6px' : '8px',
                      backgroundColor: selectedImage === image ? '#e0e0e0' : 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onClick={() => handleImageSelect(image)}
                  >
                    <div style={{
                      width: isMobile ? '32px' : '40px',
                      height: isMobile ? '32px' : '40px',
                      marginRight: isMobile ? '8px' : '10px',
                      border: '1px solid #ddd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <img 
                        src={`http://localhost:3000/images/${image}`}
                        alt={image}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%' 
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UsIHNhbnMtc2VyaWYiIGZpbGw9IiM5OTk5OTkiPj88L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </div>
                    <div style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: isMobile ? '12px' : '14px'
                    }}>
                      {image}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={{ flex: isMobile ? 'none' : 1 }}>
            {selectedImage ? (
              <div>
                <h3 style={{ 
                  fontSize: isMobile ? '16px' : '18px',
                  marginBottom: isMobile ? '12px' : '16px'
                }}>
                  预览: {selectedImage}
                </h3>
                
                {imageStats && (
                  <div style={{
                    padding: isMobile ? '8px' : '10px',
                    backgroundColor: imageStats.status === 'success' ? '#d4edda' : '#f8d7da',
                    color: imageStats.status === 'success' ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    marginBottom: isMobile ? '12px' : '15px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    {imageStats.status === 'success' ? (
                      <>
                        <div>状态: <strong>加载成功</strong></div>
                        <div>尺寸: {imageStats.width} × {imageStats.height} 像素</div>
                        <div>宽高比: {imageStats.aspect}</div>
                      </>
                    ) : (
                      <>
                        <div>状态: <strong>加载失败</strong></div>
                        <div>{imageStats.message}</div>
                      </>
                    )}
                  </div>
                )}
                
                <div style={{ 
                  border: '1px solid #ddd',
                  padding: isMobile ? '8px' : '10px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  position: 'relative'
                }}>
                  <img 
                    src={`http://localhost:3000/images/${selectedImage}`}
                    alt={selectedImage}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: isMobile ? '300px' : '500px',
                      display: 'block',
                      margin: '0 auto',
                      backgroundColor: '#fff'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const errorElement = document.createElement('div');
                      errorElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #721c24;">图片加载失败</div>`;
                      e.target.parentNode.appendChild(errorElement);
                    }}
                  />
                </div>
                
                <div style={{ marginTop: isMobile ? '16px' : '20px' }}>
                  <h4 style={{ 
                    fontSize: isMobile ? '14px' : '16px',
                    marginBottom: isMobile ? '8px' : '10px'
                  }}>
                    图片URL
                  </h4>
                  <div style={{
                    padding: isMobile ? '8px' : '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    fontSize: isMobile ? '10px' : '12px'
                  }}>
                    http://localhost:3000/images/{selectedImage}
                  </div>
                  
                  <button 
                    onClick={() => window.open(`http://localhost:3000/images/${selectedImage}`, '_blank')}
                    style={{
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: isMobile ? '8px' : '10px',
                      fontSize: isMobile ? '14px' : '16px'
                    }}
                  >
                    在新标签页打开
                  </button>
                </div>
                
                <div style={{ marginTop: isMobile ? '16px' : '20px' }}>
                  <h4 style={{ 
                    fontSize: isMobile ? '14px' : '16px',
                    marginBottom: isMobile ? '8px' : '10px'
                  }}>
                    常见问题
                  </h4>
                  <ul style={{ 
                    paddingLeft: isMobile ? '16px' : '20px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}>
                    <li>如果图片无法加载，请检查文件名是否包含特殊字符</li>
                    <li>确认图片格式是浏览器支持的格式（JPG, PNG, GIF等）</li>
                    <li>中文文件名可能需要URL编码，服务器已自动处理</li>
                    <li>检查文件权限，确保服务器有读取权限</li>
                    <li>如果文件存在但无法显示，可能是文件格式损坏</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: isMobile ? '20px' : '30px', 
                textAlign: 'center', 
                backgroundColor: '#f9f9f9',
                borderRadius: '8px'
              }}>
                <h3 style={{ 
                  fontSize: isMobile ? '16px' : '18px',
                  marginBottom: isMobile ? '12px' : '16px'
                }}>
                  请从左侧列表选择一张图片进行查看
                </h3>
                <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
                  选择图片后，可以在这里查看预览并诊断问题
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;