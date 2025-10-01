import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Image, Typography, message, Spin, Empty, Tag } from 'antd';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useTheme } from './ThemeContext'; // 导入主题上下文
import { useNavigate } from 'react-router-dom'; // 添加路由导航
import './SearchStyles.css'; // 导入搜索相关样式
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook

const { Title, Text } = Typography;

const SearchPage = ({ initialSearchTerm = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]); // 添加搜索历史
  const [popularSearches, setPopularSearches] = useState([]); // 添加热门搜索
  const { isDarkMode } = useTheme(); // 使用主题上下文
  const navigate = useNavigate(); // 使用路由导航
  const { commentSettings } = useCommentSettings('search'); // 获取搜索页面评论设置
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

  // 从localStorage获取上次的搜索词
  useEffect(() => {
    const lastSearchTerm = localStorage.getItem('lastSearchTerm');
    if (lastSearchTerm) {
      setSearchTerm(lastSearchTerm);
      handleSearch(lastSearchTerm);
      // 使用后清除，避免影响后续使用
      localStorage.removeItem('lastSearchTerm');
    } else if (initialSearchTerm) {
      setSearchTerm(initialSearchTerm);
      handleSearch(initialSearchTerm);
    }
    
    // 加载搜索历史
    const history = localStorage.getItem('searchHistory');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('解析搜索历史失败:', e);
      }
    }
  }, [initialSearchTerm]);

  // 从服务器获取热门搜索数据
  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        const response = await fetch('/api/search/popular');
        
        if (!response.ok) {
          throw new Error(`获取热门搜索失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 假设API返回的是一个包含搜索词的数组
        if (Array.isArray(data) && data.length > 0) {
          setPopularSearches(data);
        } else {
          console.error('获取热门搜索失败，数据格式不正确');
        }
      } catch (error) {
        console.error('获取热门搜索出错:', error);
        // 如果获取失败，可以设置一些默认的热门搜索作为后备
        setPopularSearches(['书法', '楷书', '字体', '汉字', '笔画', '结构', '临摹', '创作', '欣赏', '教程']);
      }
    };

    fetchPopularSearches();
  }, []);

  // 监听全局搜索事件
  useEffect(() => {
    const handleSearchEvent = (event) => {
      const { searchTerm } = event.detail;
      if (searchTerm) {
        setSearchTerm(searchTerm);
        handleSearch(searchTerm);
      }
    };

    window.addEventListener('searchTermChanged', handleSearchEvent);
    
    return () => {
      window.removeEventListener('searchTermChanged', handleSearchEvent);
    };
  }, []);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) {
      message.warning('请输入要搜索的字符名称');
      return;
    }

    try {
      setLoading(true);
      console.log(`发起搜索请求: ${term}`);
      
      const response = await fetch(`/api/search/${encodeURIComponent(term)}`);
      
      if (!response.ok) {
        throw new Error(`服务器响应异常: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`搜索结果数量: ${data.length}`);
      
      setSearchResults(data);
      
      // 保存搜索历史
      saveSearchHistory(term);
      
      if (data.length > 0) {
        message.success(`找到 ${data.length} 个结果`);
      } else {
        message.info('未找到匹配的字符');
      }
    } catch (error) {
      console.error('搜索出错:', error);
      message.error(`搜索出错: ${error.message}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 保存搜索历史
  const saveSearchHistory = (term) => {
    if (!term.trim()) return;
    
    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 清空搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // 创建裁剪图像的URL
  const getCroppedImageUrl = (result) => {
    // 添加时间戳参数避免缓存引起的问题
    const timestamp = new Date().getTime();
    // 使用filename字段，它是文件系统中的文件名（英文）
    return `/api/crop-image?filename=${encodeURIComponent(result.filename)}&x=${result.position_x}&y=${result.position_y}&width=${result.width}&height=${result.height}&t=${timestamp}`;
  };

  return (
    <div className="search-page-container" style={{ padding: isMobile ? '0px' : '24px' }}>
      <Title level={isMobile ? 3 : 2} className="search-page-header" style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '16px' : '24px',
        fontSize: isMobile ? '24px' : '30px'
      }}>
        搜索单字
      </Title>
      
      {/* 搜索框 */}
      <Card style={{ 
        padding: isMobile ? '12px' : '16px',
        marginBottom: isMobile ? '12px' : '16px'
      }}>
        <div style={{ display: 'flex', marginBottom: isMobile ? '12px' : '16px', flexDirection: isMobile ? 'column' : 'row' }}>
          <Input 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="输入字符名称进行搜索"
            size={isMobile ? "middle" : "large"}
            onPressEnter={() => handleSearch()}
            style={{ 
              flex: 1, 
              marginRight: isMobile ? 0 : 8,
              marginBottom: isMobile ? '8px' : 0
            }}
            suffix={searchTerm && (
              <CloseOutlined 
                onClick={() => {
                  setSearchTerm('');
                  setSearchResults([]);
                }} 
                style={{ 
                  cursor: 'pointer', 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              />
            )}
          />
          <Button 
            type="primary" 
            size={isMobile ? "middle" : "large"}
            onClick={() => handleSearch()}
            loading={loading}
            icon={<SearchOutlined />}
            style={{ 
              padding: isMobile ? '0 20px' : '0 40px',
              fontSize: isMobile ? '14px' : '16px',
              height: isMobile ? '36px' : '40px'
            }}
          >
            {isMobile ? '搜索' : '搜索'}
          </Button>
        </div>
        <p style={{ 
          color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)', 
          margin: 0,
          fontSize: isMobile ? '12px' : '14px'
        }}>
          支持按汉字、拼音首字母或全拼搜索
        </p>
      </Card>
      
      {/* 热门搜索 */}
      {popularSearches.length > 0 && (
        <Card 
          title="热门搜索" 
          style={{ 
            marginTop: isMobile ? '12px' : '16px',
            padding: isMobile ? '12px' : '16px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8 }}>
            {popularSearches.map((tag, index) => (
              <Tag
                key={index}
                onClick={() => {
                  setSearchTerm(tag);
                  handleSearch(tag);
                }}
                style={{ 
                  cursor: 'pointer', 
                  marginBottom: isMobile ? '6px' : '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '2px 8px' : '4px 10px'
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </Card>
      )}
      
      {/* 搜索历史 */}
      {searchHistory.length > 0 && (
        <Card 
          title="搜索历史" 
          style={{ 
            marginTop: isMobile ? '12px' : '16px',
            padding: isMobile ? '12px' : '16px'
          }}
          extra={
            <Button 
              type="link" 
              size="small" 
              onClick={clearSearchHistory}
              style={{ 
                padding: 0,
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              清空历史
            </Button>
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 6 : 8 }}>
            {searchHistory.map((tag, index) => (
              <Tag
                key={index}
                onClick={() => {
                  setSearchTerm(tag);
                  handleSearch(tag);
                }}
                style={{ 
                  cursor: 'pointer', 
                  marginBottom: isMobile ? '6px' : '8px',
                  fontSize: isMobile ? '12px' : '14px',
                  padding: isMobile ? '2px 8px' : '4px 10px'
                }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </Card>
      )}
      
      <Card 
        title={`搜索结果 ${searchResults.length > 0 ? `(${searchResults.length})` : ''}`} 
        style={{ 
          marginTop: isMobile ? '12px' : '16px',
          padding: isMobile ? '12px' : '16px'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  搜索中...
                </div>
              </Spin>
          </div>
        ) : searchResults.length > 0 ? (
          <List
            grid={{
              gutter: isMobile ? 8 : 16,
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
              xl: 5,
              xxl: 6
            }}
            dataSource={searchResults}
            renderItem={result => (
              <List.Item>
                <Card 
                  hoverable
                  style={{
                    transition: 'all 0.3s ease',
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'white',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#f0f0f0'}`,
                    height: isMobile ? '180px' : '220px'
                  }}
                  cover={
                    <div style={{ 
                      padding: isMobile ? '8px 8px 0' : '12px 12px 0', 
                      textAlign: 'center' 
                    }}>
                      <Image
                        src={getCroppedImageUrl(result)}
                        alt={result.character_name}
                        width={isMobile ? 80 : 120}
                        height={isMobile ? 80 : 120}
                        style={{
                          objectFit: 'contain',
                          backgroundColor: isDarkMode ? '#141414' : '#f5f5f5',
                          borderRadius: '4px',
                          padding: '4px'
                        }}
                        fallback={`/images/${encodeURIComponent(result.filename)}`}
                        onError={(e) => {
                          console.error('裁剪图像加载失败');
                          console.error(`裁剪参数: x=${result.position_x}, y=${result.position_y}, w=${result.width}, h=${result.height}`);
                          
                          // 回退到原始完整图像，但是添加裁剪样式
                          try {
                            e.target.src = `/images/${encodeURIComponent(result.filename)}`;
                            e.target.style.objectFit = 'none';
                            e.target.style.objectPosition = `-${result.position_x}px -${result.position_y}px`;
                            e.target.style.width = `${result.width}px`;
                            e.target.style.height = `${result.height}px`;
                            e.target.style.maxWidth = 'none';
                            e.target.style.maxHeight = 'none';
                            e.target.parentElement.style.overflow = 'hidden';
                          } catch(err) {
                            console.error('回退显示出错:', err);
                          }
                        }}
                      />
                    </div>
                  }
                >
                  <Card.Meta
                    title={<Text strong style={{ 
                      fontSize: isMobile ? '14px' : '16px', 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' 
                    }}>
                      {result.character_name}
                    </Text>}
                    description={
                      <div>
                        <Text 
                          type="secondary" 
                          style={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
                            cursor: 'pointer',
                            fontSize: isMobile ? '10px' : '12px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 导航到作品展示页面，并传递作品ID
                            navigate(`/gallery?workId=${result.work_id}`);
                          }}
                        >
                          来自作品: {result.original_filename ? (result.original_filename?.length > (isMobile ? 10 : 15) ? decodeURIComponent(result.original_filename).substring(0, isMobile ? 10 : 15) + '...' : decodeURIComponent(result.original_filename)) : (result.filename ? (result.filename?.length > (isMobile ? 10 : 15) ? decodeURIComponent(result.filename).substring(0, isMobile ? 10 : 15) + '...' : decodeURIComponent(result.filename)) : '未知文件名')}
                        </Text>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : searchTerm && !loading ? (
          <Empty 
            description={
              <span style={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                未找到匹配的字符
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
        ) : (
          <Empty 
            description={
              <span style={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)',
                fontSize: isMobile ? '14px' : '16px'
              }}>
                请输入搜索关键词
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
        )}
      </Card>
      
      {/* 评论区 */}
      {(!commentSettings || commentSettings?.enabled) && (
        <Card 
          title="评论区" 
          style={{ 
            marginTop: isMobile ? '16px' : '20px',
            padding: isMobile ? '12px' : '16px'
          }} 
          id="comments"
        >
          <TwikooComment commentPath={commentSettings?.shared_path || '/search'} />
        </Card>
      )}
    </div>
  );
};

export default SearchPage;