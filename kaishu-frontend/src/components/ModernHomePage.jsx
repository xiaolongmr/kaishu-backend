import React, { useState, useEffect } from 'react';
import { Typography, Button, Row, Col, Card, Image, Spin, message } from 'antd';
import {
  UploadOutlined,
  FontSizeOutlined,
  ScissorOutlined,
  SearchOutlined,
  PictureOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './ModernHomePage.css';
import { useAuth } from './AuthContext'; // 导入认证上下文
import { useTheme } from './ThemeContext'; // 导入主题上下文
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook
import { homepageAPI } from '../utils/api'; // 导入首页API

const { Title, Paragraph, Text } = Typography;

const ModernHomePage = ({ onNavigate }) => { // 接收导航函数
  const { isAuthenticated, currentUser, login } = useAuth(); // 使用认证上下文
  // 使用主题上下文
  const { isDarkMode, toggleTheme } = useTheme();
  const [contents, setContents] = useState({}); // 内容状态
  const [loading, setLoading] = useState(true);
  const { commentSettings } = useCommentSettings(''); // 获取首页评论设置
  const navigate = useNavigate();
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

  // 获取首页内容
  useEffect(() => {
    fetchHomepageContents();
  }, []);

  // 获取首页内容的方法
  const fetchHomepageContents = async () => {
    try {
      setLoading(true);
      const response = await homepageAPI.getHomepageData();
      const data = response.data;

      // 处理API响应格式
      let contentsMap = {};
      
      if (data.success && data.data && data.data.content) {
        // 新的API格式：{success: true, data: {content: {...}}}
        contentsMap = data.data.content;
      } else if (Array.isArray(data)) {
        // 旧的数组格式：[{content_key, content_value}, ...]
        data.forEach(item => {
          contentsMap[item.content_key] = item.content_value;
        });
      } else {
        // 直接对象格式
        contentsMap = data;
      }

      setContents(contentsMap);
    } catch (error) {
      console.error('获取首页内容失败:', error);
      message.error('获取首页内容失败，显示默认内容');
    } finally {
      setLoading(false);
    }
  };

  // 处理开始使用按钮点击
  const handleGetStarted = () => {
    navigate('/upload');
  };

  // 根据内容键获取值，如果不存在则使用默认值
  const getContent = (key, defaultValue) => {
    return contents[key] || defaultValue;
  };

  // 图标映射
  const iconMap = {
    UploadOutlined: <UploadOutlined style={{ fontSize: '24px' }} />,
    FontSizeOutlined: <FontSizeOutlined style={{ fontSize: '24px' }} />,
    ScissorOutlined: <ScissorOutlined style={{ fontSize: '24px' }} />,
    SearchOutlined: <SearchOutlined style={{ fontSize: '24px' }} />,
    PictureOutlined: <PictureOutlined style={{ fontSize: '24px' }} />,
    FileImageOutlined: <FileImageOutlined style={{ fontSize: '24px' }} />
  };

  // 处理导航功能
  const handleNavigate = (path) => {
    navigate(`/${path}`);
  };

  // 特性数据
  const features = [
    {
      icon: getContent('feature_1_icon', 'UploadOutlined'),
      color: getContent('feature_1_color', '#1890ff'),
      title: getContent('feature_1_title', '上传书法作品'),
      description: getContent('feature_1_description', '支持上传各种格式的书法作品图片，自动保存到作品库中，支持批量上传和拖拽上传')
    },
    {
      icon: getContent('feature_2_icon', 'FontSizeOutlined'),
      color: getContent('feature_2_color', '#52c41a'),
      title: getContent('feature_2_title', '字体标注'),
      description: getContent('feature_2_description', '通过直观的鼠标框选方式对上传的作品进行字体标注，轻松命名和管理每个字符')
    },
    {
      icon: getContent('feature_3_icon', 'ScissorOutlined'),
      color: getContent('feature_3_color', '#722ed1'),
      title: getContent('feature_3_title', '字符裁剪'),
      description: getContent('feature_3_description', '自动裁剪标注的单字，生成独立的字符图片，支持高精度裁剪和边缘优化')
    },
    {
      icon: getContent('feature_4_icon', 'SearchOutlined'),
      color: getContent('feature_4_color', '#fa8c16'),
      title: getContent('feature_4_title', '字符搜索'),
      description: getContent('feature_4_description', '根据字符名称快速搜索和查看已标注的单字，支持模糊搜索和拼音搜索')
    },
    {
      icon: getContent('feature_5_icon', 'PictureOutlined'),
      color: getContent('feature_5_color', '#f5222d'),
      title: getContent('feature_5_title', '作品展示'),
      description: getContent('feature_5_description', '精美展示所有上传的书法作品和标注的字符，支持多种排序和筛选方式')
    },
    {
      icon: getContent('feature_6_icon', 'FileImageOutlined'),
      color: getContent('feature_6_color', '#13c2c2'),
      title: getContent('feature_6_title', '字库管理'),
      description: getContent('feature_6_description', '强大的楷书字库管理功能，支持导出和统计，助您构建完整的楷书字体库')
    }
  ];

  if (loading) {
    return (
      <div className={`modern-${isDarkMode ? 'dark' : 'light'}-theme`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                加载内容中...
              </div>
            </Spin>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'modern-dark-theme' : 'modern-light-theme'}>
      {/* 英雄区块 - 简化版 */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-title-container">
              <h1 className="hero-title-gradient" style={{ position: 'relative' }}>
                {getContent('site_name', '绍楷字库')}
                <span style={{
                  position: 'absolute',
                  top: isMobile ? '-5px' : '0px',
                  right: isMobile ? '-35px' : '-45px',
                  fontSize: isMobile ? '12px' : '16px',
                  fontWeight: '600',
                  color: 'white',
                  padding: isMobile ? '0px 4px' : '0px 6px',
                  borderRadius: '4px',
                  lineHeight: '1.5',
                  WebkitTextFillColor: '#1890ff',
                  backgroundImage: 'none'
                }}>
                  Beta
                </span>
              </h1>
            </div>
            <Paragraph className="hero-subtitle" style={{ fontSize: isMobile ? '14px' : '16px' }}>
              {getContent('site_description', '楷书字库是一个专业的楷书字体管理工具，帮助您轻松管理、标注和搜索楷书字体作品，构建完整的楷书字库。')}
            </Paragraph>

            <div className="hero-buttons">
              <Button
                type="primary"
                size={isMobile ? "middle" : "large"}
                onClick={handleGetStarted}
                style={{
                  padding: isMobile ? '0 20px' : '0 40px',
                  fontSize: isMobile ? '14px' : '16px',
                  height: isMobile ? '36px' : '40px',
                  marginRight: isMobile ? '8px' : '16px'
                }}
              >
                {getContent('start_button_text', '开始使用')}
              </Button>
              <Button
                size={isMobile ? "middle" : "large"}
                onClick={() => handleNavigate('about')}
                style={{
                  padding: isMobile ? '0 20px' : '0 40px',
                  fontSize: isMobile ? '14px' : '16px',
                  height: isMobile ? '36px' : '40px'
                }}
              >
                {getContent('about_button_text', '了解更多')}
              </Button>
            </div>
          </div>

          <div className="hero-image">
            <div className="simple-image-container">
              <Image
                preview={false}
                src="https://cdn.h5ds.com/space/files/600972551685382144/20250913/891200516408332288.svg"
                alt="绍楷字库图标"
                className="hero-simple-image"
                fallback="data:image/svg+xml;base64,PHN2ZyBpZD0iX18yIiBkYXRhLW5hbWU9Il8yIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDEuNjEgNDQxLjYxIj48ZGVmcz48c3R5bGU+LmNscy0xe3N0cm9rZS1kYXNoYXJyYXk6MTJ9LmNscy0xLC5jbHMtMywuY2xzLTQsLmNscy01LC5jbHMtNntmaWxsOm5vbmU7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOjNweH0uY2xzLTEsLmNscy0zLC5jbHMtNntzdHJva2U6I2I1YjViNn0uY2xzLTd7ZmlsbDojZTYwMDEyfS5jbHMtM3tzdHJva2UtZGFzaGFycmF5OjEyLjE5IDEyLjE5fS5jbHMtNHtzdHJva2UtZGFzaGFycmF5OjEyLjQyIDEyLjQyfS5jbHMtNCwuY2xzLTV7c3Ryb2tlOiM4OTg5ODl9PC9zdHlsZT48L2RlZnM+PGcgaWQ9Il9fMS0yIiBkYXRhLW5hbWU9Il8xIj48cGF0aCBjbGFzcz0iY2xzLTUiIGQ9Ik0zMDcuNTYgMzAxLjU2djZoLTYiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0yODkuMTMgMzA3LjU2SDE0Ni4yNiIvPjxwYXRoIGNsYXNzPSJjbHMtNSIgZD0iTTE0MC4wNSAzMDcuNTZoLTZ2LTYiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0xMzQuMDUgMjg5LjEzVjE0Ni4yNiIvPjxwYXRoIGNsYXNzPSJjbHMtNSIgZD0iTTEzNC4wNSAxNDAuMDV2LTZoNiIvPjxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTE1Mi40NyAxMzQuMDVoMTQyLjg3Ii8+PHBhdGggY2xhc3M9ImNscy01IiBkPSJNMzAxLjU2IDEzNC4wNWg2djYiLz48cGF0aCBjbGFzcz0iY2xzLTQiIGQ9Ik0zMDcuNTYgMTUyLjQ3djE0Mi44NyIvPjxyZWN0IHg9IjM5LjgxIiB5PSIzOS44MSIgd2lkdGg9IjM2MS45OCIgaGVpZ2h0PSIzNjEuOTgiIHJ4PSIxODAuOTkiIHJ5PSIxODAuOTkiIHN0cm9rZT0iIzcyNzE3MSIgc3Ryb2tlLWRhc2hhcnJheT0iMTIuMSAxMi4xIiBmaWxsPSJub25lIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMyIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEuNSAxLjVsNDM4LjYxIDQzOC42MU00NDAuMTEgMS41TDEuNSA0NDAuMTFNMS41IDIyMC44aDQzOC42MU0yMjAuOCAxLjV2NDM4LjYxIi8+PGc+PHBhdGggY2xhc3M9ImNscy02IiBkPSJNNDQwLjExIDQzNC4xMXY2aC02Ii8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDIxLjkyIDQ0MC4xMUgxMy41OSIvPjxwYXRoIGNsYXNzPSJjbHMtNiIgZD0iTTcuNSA0NDAuMTFoLTZ2LTYiLz48cGF0aCBjbGFzcz0iY2xzLTMiIGQ9Ik0xLjUgNDIxLjkyVjEzLjU5Ii8+PHBhdGggY2xhc3M9ImNscy02IiBkPSJNMS41IDcuNXYtNmg2Ii8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTkuNjkgMS41aDQwOC4zMiIvPjxwYXRoIGNsYXNzPSJjbHMtNiIgZD0iTTQzNC4xMSAxLjVoNnY2Ii8+PHBhdGggY2xhc3M9ImNscy0zIiBkPSJNNDQwLjExIDE5LjY5djQwOC4zMiIvPjwvZz48L2c+PGcgaWQ9Il9fMi0yIiBkYXRhLW5hbWU9Il8yIj48cGF0aCBjbGFzcz0iY2xzLTciIGQ9Ik0zMDEuMjMgMjk0LjI0bC0uODQtLjQyYy0xNC4yNC03LjEyLTI2LjYtMTcuMzEtMzguMDktMjguMjItNS4zOC01LjEtMTAuNTctMTAuMzktMTUuODEtMTUuNjMtMi42OC0yLjY4LTUuMzctNS4zNi04LjExLTcuOTktMi40Ni0yLjM2LTQuOTEtNS4xOC03LjgtNy4wMi0uMzQtLjIyLS43NS0uNDMtMS4xNC0uMzItLjYyLjE3LS43NS45Ny0uNzggMS42MS0uNjQgMTguMjctLjY2IDM2LjU1LS41NCA1NC44Mi4wNiA4LjY0LjEgMTcuMjcuMSAyNS45MSAwIDEuNDMgMCAyLjg1LjAxIDQuMjggMCAxLjQ5IDAgMi45OC0uMDIgNC40Ny0uMjYgMTMuNzMtMi42NiAyOS4yNS0xMC44MyA0MC42LTEuOTEgMi42NS00LjIyIDYuMDEtNy42NyA2LjcxLTMuMjIuNjYtNy44Ni0uMy0xMC4xMS0yLjc5LTEuMzktMS41NC0xLjk5LTMuNjItMi43MS01LjU3LTIuMzgtNi40LTYuNjctMTAuNy0xMC45Ny0xNS43Ny0zLjc2LTQuNDQtNi05LjkyLTcuMjMtMTUuNTgtLjU0LTIuNDgtLjU3LTQuOTIgMS4xNi02LjkyczQuNTYtMy4zNiA2LjgzLTEuNTRjMi41IDIgMy44MiA1LjAxIDYuMTIgNy4xNCAzLjk1IDMuNjcgMTEuNzIgMi41NiAxNC41NC0yIDEuNTItMi40NSAxLjY1LTUuNDkgMS43NC04LjM3IDAtOC44LjYzLTE3LjYxLjktMjYuNDJzLjQ2LTE4LjI1LjYtMjcuMzdjLjEyLTguNTguMi0xNy4xNi4yOC0yNS43NC4wNC00Ljc1LjA5LTkuNTEuMDEtMTQuMjYtLjA1LTMuMjMuNDItOC42My0zLjMzLTEwLjItMS41MS0uNjMtMi44MS0xLjU3LTMuMzUtMy4xOS4wNS4yNi0xLjE3IDEuMjgtMS4zNyAxLjUzLTEuNDMgMS44Ny0xLjI2IDQuNTItMi4yNCA2LjYyLTEuMDQgMi4yNS0yLjY4IDQuMTUtNCA2LjIzLTMuNjggNS44Mi02LjgyIDExLjk1LTEwLjE5IDE3Ljk0LTUuNTMgOS44Mi0xMS4wNiAxOS42Ny0xNy40OSAyOC45NC01LjQ0IDcuODQtMTEuNTQgMTUuMjYtMTguNjMgMjEuNjYtOS44MiA4Ljg2LTIxLjMzIDE1LjYtMzIuODIgMjIuMTUtLjYyLjM1LTEuMzkuNy0xLjk5LjM0LS45NS0uNTctLjM5LTIuMDMuMjctMi45MiA0Ljc5LTYuMzkgMTAuMzQtMTIuMTYgMTUuNTUtMTguMjEgMTcuNjMtMjAuNDggMzEuMy00NC4zNiA0MC4wNS02OS45Mi45OS0yLjg4IDEuNjEtNi43NC0uOTUtOC40LTIuMTgtMS40Mi01LjA1LS4wOC03LjI4IDEuMjYtMTIuMTEgNy4yNy0yNC4xMiAxNC42OC0zNi4wNSAyMi4yNS0zLjEzIDEuOTktNi40MSA0LjA0LTEwLjEgNC40Mi0zLjA5LjMyLTYuMTgtLjU3LTkuMDktMS42OGE1OS4zMiA1OS4zMiAwIDAgMS0xMy41Ny03LjMzYy0xLjU4LTEuMTQtMy4yOS0zLjA3LTIuMzgtNC43OS44OC0xLjY3IDMuMjgtMS40NSA1LjE3LTEuMjYgNC44My40NyA5LjYyLS45OCAxNC4yLTIuNTUgNi4xNi0yLjEyIDEyLjI3LTQuNDEgMTguMy02Ljg5czEyLjEtNS4yOSAxOC4wOC04LjFjMy43My0xLjc2IDcuNDMtMy42MSAxMC45OC01LjcyIDUuNi0zLjMyIDExLjItNy40IDE3LjcxLTcuNzQgNC40Ni0uMjMgOC43OCAxLjM0IDEzLjEzIDIuMzYgMi44Mi42NiA1LjcyIDEuMSA4LjMyIDIuMzdzNC44OSAzLjYxIDUuMTggNi40OWMxLjA1LTEuNC0uNTMtMy4zOC0uMTctNS4wOC40Mi0yLjAyIDMuMDUtMi40NyA0LjcyLTMuNjkgMS41My0xLjExIDIuMzEtMy4wMyAyLjUtNC45MXMtLjE0LTMuNzctLjQyLTUuNjRjLTEuMjEtOC4xLTEuNTUtMTYuMzMtMS4wMS0yNC41MS4xMy0yLjAyLjMxLTQuMTMtLjQ0LTYuMDEtLjQ2LTEuMTQtMS4zNi0yLjE2LTIuNDktMi42OC0xLjMtLjYtMi41NS0uMjItMy44NC4yMS0xLjAyLjM0LTEuOTguODYtMi45MiAxLjM5LTIuNjkgMS41Mi01LjU0IDIuNzItOC40MiAzLjgzLTMuNyAxLjQyLTcuNDUgMi43MS0xMS4wNSA0LjM4LTQuNTIgMi4wOS04Ljc5IDQuNzktMTMuNTUgNi4yNy0xLjYuNS0zLjQ1LjgyLTQuODgtLjA3LS42Mi0uMzktMS4wOS0uOTYtMS42Ni0xLjQxLS42MS0uNDgtMS4zNC0uODEtMi4wNS0xLjEzYTk3LjU0IDk3LjU0IDAgMCAwLTYuNTctMi42MWMtMS43Ny0uNjMtMy44My0uOTItNS4wMy0yLjUyLS43LS44Ny0xLjUyLTEuNTEtMi4zOC0yLjE5LS44Ni0uNjktMS40Mi0xLjgxLTEuOTMtMi44NC0uMzItLjY2LS4yLTEuNDYuNzMtMS45MS0yLjA4LTEuNTkgMS45NS0zLjI5IDMuMjktMy4yOSAxLjU0IDAgMy4wMi41NiA0LjUyLjk2IDMuNjIuOTggOC4xNCAxLjI1IDExLjczLjAyIDQuMTYtMS40MiA4LjIyLTMuODYgMTIuMTctNS43OCA4LjA4LTMuOTIgMTYuMS03Ljk3IDI0LjA0LTEyLjE1IDMuMjMtMS43IDcuMDctMy43OCAxMC44Mi0zLjc4IDQuMzgtLjE4IDguNTggMS44MyAxMi44NyAyLjQ0IDMuOS41NiA4LjI0IDEuMjYgMTEuMjMgNC4wNSAxLjcxIDEuNTkgMi43OSAzLjcyIDMuODUgNS44LjMxLjYxLjYyIDEuMjMuNyAxLjkuMTUgMS4zMS0uNTkgMi41NS0xLjMxIDMuNjYtMS41MSAyLjM1LTMuMDEgNC43NC0zLjkyIDcuMzgtMS4zOSA0LjA1LTEuMyA4LjQ0LTEuMzcgMTIuNzItLjE0IDcuNjItLjg5IDE1LjIzLTIuMjMgMjIuNzMtLjE0Ljc5LS4yOSAxLjYyLS4xIDIuNHMuODIgMS41MyAxLjYyIDEuNTdjLjc5LjA1IDEuNDUtLjU1IDIuMDEtMS4xIDEyLjAyLTExLjkgMjMuODItMjQuNjEgMzMuNjQtMzguMzkgMi44OS00LjA2IDUuNDItOC4zMiA4LjE4LTEyLjQ2IDEuMi0yLjA0IDIuMzUtNC42OSAxLTYuNjQtLjYyLS44OS0xLjYzLTEuNC0yLjUzLTItMy4wOS0yLjA2LTUuMTktNS44LTQuNjUtOS40N3M0LjE0LTYuODMgNy44MS02LjI4YzEuMzIuMiAyLjUzLjgxIDMuNzIgMS40MSAzLjk1IDIuMDEgNy45MiA0LjAyIDExLjUzIDYuNmE0My45NiA0My45NiAwIDAgMSAxMC4xNSAxMC4xM2MuNzUgMS4wNSAxLjQ4IDIuMTggMS42MSAzLjQ3LjE2IDEuNTQtLjU2IDMuMDItMS4zIDQuMzktNy41NSAxMy45NS0xOC44NCAyNS40NC0yOS45OCAzNi43My03LjUgNy42LTE1LjAzIDE1LjIzLTIzLjQ4IDIxLjc4LTEuMTEuODYtOS40OCA3LjAyLTYuNTggOC4yNS4wNi4zMS4wMy44MS4yMS45MSAxLjY3LjkzIDIuNzIgMy4xNiA0LjAxIDQuNTQgMS43OSAxLjkyIDMuOCAzLjYyIDUuNzkgNS4zM2w1LjY0IDQuODNjMy45OSAzLjQyIDcuOTkgNi44NSAxMi4wMSAxMC4yMyAyLjk5IDIuNTIgNiA1LjAxIDkuMTEgNy4zOSA5LjQ2IDcuMjMgMTkuOTggMTQuMzUgMzEuMjUgMTguMyAxMS42NSA0LjA4IDIzLjk4IDUuOTkgMzUuODUgOS4zNmEzNDEuNyAzNDEuNyAwIDAgMSAyMC4wOCA2LjM4YzMuMzggMS4xOSA2LjczIDIuNDMgMTAuMDcgMy43MiAyLjA2LjggNy42MyAxLjY5IDUuOCA0Ljk4LS43MiAxLjI5LTQuMDMgMi40Mi01LjM3IDIuOS0yLjQxLjg4LTQuOTkgMS4xMy03LjU1IDEuMzMtOS45NC43OC0xOS45Mi44My0yOS44OC41OC00LjkyLS4xMi05Ljg0LS4zMi0xNC43NS0uNTMtNC41My0uMi04Ljk4LjA0LTEzLjM0LTEuNDQtMS43MS0uNTgtMy4zNC0xLjM1LTQuOTctMi4xMy0xLjMtLjYyLTIuNjEtMS4yNC0zLjktMS44OHpNMjM1LjIyIDkyLjkxYy42Mi45MSAyLjkgNC43NiAzLjQxIDUuNzIuOCAxLjUgMS45NyA0LjI1IDEuODcgNS45NC0uMjcgNC43Ni01LjMgNS41My05LjI1IDUuNzItMy4zMi4xNy04LjIxLS4yOC0xMS40NS0uOTktNC43MS0xLjA0LTcuOTItMi44OC0xMi4zMy00Ljg0LTYuMzktMi44NC0xMC4wNS03LjA0LTE0LjMxLTEyLjMzLTEuMjEtMS41LTIuNDYtMy44LTMuMzktNS41LS42MS0xLjEyLTEuMjktMy40Ni0uNC00LjYzIDEuNjktMi4yMiA4Ljg2LTEuMjQgMTEuMjgtMS4yIDQuNDYuMDggOC43My42NSAxMy4xOCAxLjExIDkuNTguOTkgMTUuNzggMi43NyAyMS4zOSAxMC45OHoiLz48L2c+PC9zdmc+"
                style={{
                  width: isMobile ? '150px' : '200px',
                  height: isMobile ? '150px' : '200px'
                }}
              />
            </div>
          </div>
        </div>
      </section >

      {/* 特性区块 */}
      < section className="features-section" id="features" style={{ padding: isMobile ? '20px 16px' : '40px 24px' }}>
        <Title className="section-title" level={isMobile ? 3 : 2} style={{ fontSize: isMobile ? '24px' : '30px' }}>
          {getContent('feature_section_title', '主要特性')}
        </Title>
        <Paragraph className="section-subtitle" style={{ fontSize: isMobile ? '14px' : '16px' }}>
          {getContent('feature_section_subtitle', '绍楷字库字体管理工具提供全面的功能，帮助您轻松管理楷书字体资源')}
        </Paragraph>

        <Row gutter={[isMobile ? 16 : 24, isMobile ? 16 : 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <div className="feature-card-new">
                <div className="feature-icon-container">
                  <div
                    className="feature-icon-wrapper-new"
                    style={{
                      backgroundColor: `${feature.color}15`,
                      width: isMobile ? '50px' : '60px',
                      height: isMobile ? '50px' : '60px'
                    }}
                  >
                    {iconMap[feature.icon] || <UploadOutlined style={{ fontSize: isMobile ? '20px' : '24px', color: feature.color }} />}
                  </div>
                </div>
                <div className="feature-content">
                  <Title level={isMobile ? 5 : 4} className="feature-title-new" style={{ fontSize: isMobile ? '16px' : '18px' }}>
                    {feature.title}
                  </Title>
                  <Paragraph className="feature-description-new" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                    {feature.description}
                  </Paragraph>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </section >

      {/* 评论区 - 始终显示评论区，不进行条件渲染 */}
      < section className="comments-section" id="comments" style={{ padding: isMobile ? '20px 16px' : '40px 24px' }}>
        <div className="comments-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <TwikooComment commentPath={commentSettings?.shared_path || '/'} />
        </div>
      </section >

      {/* 页脚 */}
      < footer className="footer" >
        <div className="footer-content">
          <Paragraph className="footer-text" style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {getContent('footer_text', "绍楷字库 字体管理工具 © " + new Date().getFullYear() + " | 基于 Apache-2.0 许可证开源")}
          </Paragraph>
        </div>
      </footer >
    </div >
  );
};

export default ModernHomePage;