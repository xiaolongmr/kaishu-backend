import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Timeline, 
  Tag, 
  Divider, 
  Row, 
  Col, 
  Statistic, 
  Badge, 
  Space, 
  Collapse, 
  List,
  Descriptions,
  Avatar,
  Tooltip,
  Button
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  BugOutlined, 
  RocketOutlined,
  InfoCircleOutlined,
  LikeOutlined,
  DislikeOutlined,
  CalendarOutlined,
  UserOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  EyeOutlined,
  DatabaseOutlined,
  SettingOutlined,
  CommentOutlined,
  BarChartOutlined,
  FileDoneOutlined,
  SyncOutlined,
  ApiOutlined,
  MobileOutlined,
  DesktopOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SecurityScanOutlined,
  HighlightOutlined,
  FormatPainterOutlined,
  PictureOutlined,
  FontSizeOutlined,
  ScissorOutlined,
  EditOutlined,
  MenuOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const ChangelogHistoryPage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 项目统计数据
  const projectStats = [
    { title: '总版本数', value: '10', suffix: '个', icon: <FileDoneOutlined /> },
    { title: '功能更新', value: '45', suffix: '项', icon: <CheckCircleOutlined /> },
    { title: '问题修复', value: '28', suffix: '个', icon: <BugOutlined /> },
    { title: '性能优化', value: '15', suffix: '项', icon: <SyncOutlined /> }
  ];

  // 版本分类统计
  const versionStats = [
    { type: '重大更新', count: 1, color: 'magenta' },
    { type: '功能更新', count: 6, color: 'blue' },
    { type: '功能改进', count: 2, color: 'green' },
    { type: '问题修复', count: 3, color: 'orange' },
    { type: '初始版本', count: 1, color: 'purple' }
  ];

  // 详细的更新历程数据
  const changelogData = [
    {
      version: 'v2.0.0',
      date: '2025-09-01',
      type: 'major',
      author: '开发团队',
      description: '重大更新：重构代码结构，优化性能，添加更多实用功能',
      releaseNotes: '本次更新是项目的一次重大升级，对前后端架构进行了全面重构，提升了系统性能和用户体验，同时新增了多项实用功能。',
      features: [
        { 
          title: '前端架构重构', 
          description: '采用现代化的React Hooks和Context API重构前端架构，提升代码可维护性和性能',
          icon: <ApiOutlined />,
          tags: ['React', 'Hooks', 'Context API']
        },
        { 
          title: '后端API优化', 
          description: '优化后端API性能，提升响应速度，支持更高的并发访问',
          icon: <ApiOutlined />,
          tags: ['Node.js', 'Express', '性能优化']
        },
        { 
          title: '作品分组和标签功能', 
          description: '添加作品分组和标签功能，方便用户对作品进行分类管理',
          icon: <Tag />,
          tags: ['分组', '标签', '分类']
        },
        { 
          title: '用户权限管理系统', 
          description: '实现完整的用户权限管理系统，支持多用户和权限控制',
          icon: <SecurityScanOutlined />,
          tags: ['用户管理', '权限控制', '安全']
        },
        { 
          title: '数据导出和导入功能', 
          description: '添加数据导出和导入功能，支持数据备份和迁移',
          icon: <DatabaseOutlined />,
          tags: ['数据导出', '数据导入', '备份']
        }
      ],
      improvements: [
        { 
          title: 'UI界面优化', 
          description: '优化UI界面和用户体验，采用更现代化的设计语言',
          icon: <FormatPainterOutlined />,
          tags: ['UI优化', '用户体验']
        },
        { 
          title: '图像处理性能提升', 
          description: '优化图像处理流程，提升处理速度和质量',
          icon: <PictureOutlined />,
          tags: ['图像处理', '性能优化']
        },
        { 
          title: '搜索功能改进', 
          description: '改进搜索功能，支持更精确的搜索结果',
          icon: <SearchOutlined />,
          tags: ['搜索优化', '精准匹配']
        }
      ],
      fixes: [
        { 
          title: '标注透视校正问题', 
          description: '修复标注功能的透视校正问题，提升标注准确性',
          icon: <FontSizeOutlined />,
          tags: ['标注', '透视校正', 'bug修复']
        },
        { 
          title: '移动端适配问题', 
          description: '解决移动端适配问题，提升在移动设备上的显示效果',
          icon: <MobileOutlined />,
          tags: ['移动端', '响应式', '适配']
        }
      ],
      stats: {
        features: 5,
        improvements: 3,
        fixes: 2,
        performance: '提升40%'
      }
    },
    {
      version: 'v1.9.0',
      date: '2025-08-15',
      type: 'feature',
      author: '数据分析团队',
      description: '添加数据统计和分析功能',
      releaseNotes: '本次更新重点增强了项目的统计分析能力，帮助用户更好地了解和管理自己的字库数据。',
      features: [
        { 
          title: '字体统计页面', 
          description: '添加专门的字体统计页面，展示详细的字库数据',
          icon: <BarChartOutlined />,
          tags: ['统计', '数据分析', '可视化']
        },
        { 
          title: 'Unicode覆盖率统计', 
          description: '实现Unicode覆盖率统计，帮助用户了解字库完整度',
          icon: <DatabaseOutlined />,
          tags: ['Unicode', '覆盖率', '统计']
        },
        { 
          title: '字符使用频率分析', 
          description: '添加字符使用频率分析功能，展示常用字符排行',
          icon: <BarChartOutlined />,
          tags: ['频率分析', '排行榜', '数据分析']
        },
        { 
          title: '统计数据导出', 
          description: '支持统计数据导出，方便用户进行离线分析',
          icon: <CloudDownloadOutlined />,
          tags: ['数据导出', 'CSV', '分析']
        }
      ],
      improvements: [
        { 
          title: '数据库查询优化', 
          description: '优化数据库查询性能，提升统计页面加载速度',
          icon: <DatabaseOutlined />,
          tags: ['数据库', '性能优化', '查询']
        },
        { 
          title: '首页加载优化', 
          description: '改进首页加载逻辑，提升页面响应速度',
          icon: <SyncOutlined />,
          tags: ['首页优化', '加载速度']
        }
      ],
      stats: {
        features: 4,
        improvements: 2,
        fixes: 0,
        performance: '提升25%'
      }
    },
    {
      version: 'v1.8.0',
      date: '2025-08-01',
      type: 'feature',
      author: '社交功能团队',
      description: '添加评论功能和社交分享',
      releaseNotes: '本次更新增强了项目的社交属性，让用户能够更好地分享和交流作品。',
      features: [
        { 
          title: 'Twikoo评论系统', 
          description: '集成Twikoo评论系统，提供强大的评论功能',
          icon: <CommentOutlined />,
          tags: ['评论', 'Twikoo', '社交']
        },
        { 
          title: '评论设置页面', 
          description: '添加评论设置页面，支持灵活配置评论功能',
          icon: <SettingOutlined />,
          tags: ['评论设置', '配置', '管理']
        },
        { 
          title: '作品社交分享', 
          description: '实现作品社交分享功能，支持分享到主流社交平台',
          icon: <LikeOutlined />,
          tags: ['社交分享', '传播', '推广']
        }
      ],
      improvements: [
        { 
          title: '移动端界面优化', 
          description: '优化移动端界面，提升在手机上的使用体验',
          icon: <MobileOutlined />,
          tags: ['移动端', '界面优化', '用户体验']
        },
        { 
          title: '作品展示页面改进', 
          description: '改进作品展示页面，提供更好的浏览体验',
          icon: <EyeOutlined />,
          tags: ['作品展示', '浏览体验', '优化']
        }
      ],
      stats: {
        features: 3,
        improvements: 2,
        fixes: 0,
        performance: '提升15%'
      }
    },
    {
      version: 'v1.7.0',
      date: '2025-07-15',
      type: 'improvement',
      author: 'UI/UX团队',
      description: '优化UI界面和用户体验',
      releaseNotes: '本次更新专注于UI界面和用户体验的优化，带来更现代化的视觉效果和更流畅的操作体验。',
      features: [
        { 
          title: '现代化首页设计', 
          description: '重新设计现代化首页，采用更简洁美观的布局',
          icon: <DesktopOutlined />,
          tags: ['首页设计', '现代化', '美观']
        },
        { 
          title: '暗黑模式支持', 
          description: '添加暗黑模式支持，保护用户夜间使用眼睛',
          icon: <HighlightOutlined />,
          tags: ['暗黑模式', '夜间模式', '护眼']
        },
        { 
          title: '响应式布局', 
          description: '实现响应式布局，适配不同尺寸的设备',
          icon: <MobileOutlined />,
          tags: ['响应式', '适配', '多设备']
        }
      ],
      improvements: [
        { 
          title: '搜索功能优化', 
          description: '优化搜索功能，提升搜索准确性和响应速度',
          icon: <SearchOutlined />,
          tags: ['搜索优化', '准确性', '速度']
        },
        { 
          title: '标注界面交互改进', 
          description: '改进标注界面交互，提供更直观的操作体验',
          icon: <FontSizeOutlined />,
          tags: ['标注界面', '交互', '用户体验']
        },
        { 
          title: '页面加载速度提升', 
          description: '提升页面加载速度，优化用户等待体验',
          icon: <SyncOutlined />,
          tags: ['加载速度', '性能', '优化']
        }
      ],
      fixes: [
        { 
          title: '图像裁剪功能bug', 
          description: '修复图像裁剪功能的bug，提升裁剪准确性',
          icon: <ScissorOutlined />,
          tags: ['图像裁剪', 'bug修复', '准确性']
        },
        { 
          title: '文件上传中文名问题', 
          description: '解决文件上传中文名问题，支持完整的中文文件名',
          icon: <UploadOutlined />,
          tags: ['文件上传', '中文支持', 'bug修复']
        }
      ],
      stats: {
        features: 3,
        improvements: 3,
        fixes: 2,
        performance: '提升30%'
      }
    },
    {
      version: 'v1.6.0',
      date: '2025-07-01',
      type: 'feature',
      author: '内容管理团队',
      description: '添加作品作者信息管理',
      releaseNotes: '本次更新增强了作品信息管理功能，让用户能够更好地记录和管理作品的作者信息。',
      features: [
        { 
          title: '作品作者字段', 
          description: '添加作品作者字段，记录作品创作者信息',
          icon: <UserOutlined />,
          tags: ['作者信息', '创作者', '字段']
        },
        { 
          title: '作者信息管理', 
          description: '支持作者信息管理，方便维护作者资料',
          icon: <UserOutlined />,
          tags: ['作者管理', '资料维护', '信息']
        },
        { 
          title: '作者筛选功能', 
          description: '实现作者筛选功能，快速查找特定作者的作品',
          icon: <SearchOutlined />,
          tags: ['作者筛选', '查找', '搜索']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.5.0',
      date: '2025-06-15',
      type: 'feature',
      author: '分类管理团队',
      description: '添加作品分组和标签功能',
      releaseNotes: '本次更新引入了作品分组和标签功能，让用户能够更好地组织和管理大量作品。',
      features: [
        { 
          title: '作品分组管理', 
          description: '实现作品分组管理，支持创建和管理作品分组',
          icon: <FileDoneOutlined />,
          tags: ['作品分组', '管理', '组织']
        },
        { 
          title: '标签系统', 
          description: '添加标签系统，为作品添加多个标签便于分类',
          icon: <Tag />,
          tags: ['标签', '分类', '组织']
        },
        { 
          title: '分组和标签筛选', 
          description: '支持分组和标签筛选，快速定位相关作品',
          icon: <SearchOutlined />,
          tags: ['筛选', '分组', '标签']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.4.0',
      date: '2025-06-01',
      type: 'feature',
      author: '数据管理团队',
      description: '添加数据导出和导入功能',
      releaseNotes: '本次更新增强了数据管理能力，支持作品数据的导出和导入，方便用户进行数据备份和迁移。',
      features: [
        { 
          title: '作品数据导出', 
          description: '支持作品数据导出，生成可备份的数据文件',
          icon: <CloudDownloadOutlined />,
          tags: ['数据导出', '备份', '数据安全']
        },
        { 
          title: '数据导入功能', 
          description: '实现数据导入功能，支持从备份文件恢复数据',
          icon: <CloudUploadOutlined />,
          tags: ['数据导入', '恢复', '数据安全']
        },
        { 
          title: '数据库备份机制', 
          description: '添加数据库备份机制，定期自动备份重要数据',
          icon: <DatabaseOutlined />,
          tags: ['数据库备份', '自动备份', '数据安全']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.3.0',
      date: '2025-05-15',
      type: 'feature',
      author: '安全管理团队',
      description: '添加用户权限管理系统',
      releaseNotes: '本次更新引入了完整的用户权限管理系统，增强了项目的安全性和管理能力。',
      features: [
        { 
          title: '用户登录功能', 
          description: '实现用户登录功能，保护系统资源安全',
          icon: <UserOutlined />,
          tags: ['用户登录', '身份验证', '安全']
        },
        { 
          title: '管理员权限控制', 
          description: '添加管理员权限控制，实现分级管理',
          icon: <SecurityScanOutlined />,
          tags: ['管理员', '权限控制', '分级管理']
        },
        { 
          title: '多用户管理', 
          description: '支持多用户管理，可添加和管理多个用户账号',
          icon: <UserOutlined />,
          tags: ['多用户', '账号管理', '用户系统']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.2.0',
      date: '2025-05-01',
      type: 'feature',
      author: '图像处理团队',
      description: '添加透视校正功能',
      releaseNotes: '本次更新增强了图像处理能力，新增透视校正功能，能够处理复杂角度拍摄的作品。',
      features: [
        { 
          title: '四点定位标注模式', 
          description: '实现四点定位标注模式，适用于透视变形的作品',
          icon: <FontSizeOutlined />,
          tags: ['四点定位', '标注模式', '透视处理']
        },
        { 
          title: '透视校正预览', 
          description: '添加透视校正预览功能，实时查看校正效果',
          icon: <EyeOutlined />,
          tags: ['透视校正', '预览', '实时']
        },
        { 
          title: '复杂布局作品处理', 
          description: '支持复杂布局作品处理，提升处理能力',
          icon: <PictureOutlined />,
          tags: ['复杂布局', '处理能力', '图像处理']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.1.0',
      date: '2025-04-15',
      type: 'feature',
      author: 'OCR团队',
      description: '添加OCR自动识别功能',
      releaseNotes: '本次更新引入了OCR自动识别功能，大大提升了字符标注的效率和准确性。',
      features: [
        { 
          title: '百度OCR引擎', 
          description: '集成百度OCR引擎，实现高质量字符识别',
          icon: <ApiOutlined />,
          tags: ['OCR', '百度OCR', '字符识别']
        },
        { 
          title: '自动字符识别', 
          description: '实现自动字符识别，减少手动标注工作量',
          icon: <CheckCircleOutlined />,
          tags: ['自动识别', '效率', '标注']
        },
        { 
          title: 'OCR结果编辑功能', 
          description: '添加OCR结果编辑功能，支持手动修正识别结果',
          icon: <EditOutlined />,
          tags: ['OCR编辑', '修正', '准确性']
        }
      ],
      stats: {
        features: 3,
        improvements: 0,
        fixes: 0,
        performance: '新增功能'
      }
    },
    {
      version: 'v1.0.0',
      date: '2025-04-01',
      type: 'initial',
      author: '核心开发团队',
      description: '初始版本发布',
      releaseNotes: '项目正式发布初始版本，包含核心功能模块，为后续功能扩展奠定基础。',
      features: [
        { 
          title: '作品上传功能', 
          description: '支持上传书法作品到"楷书库"目录',
          icon: <UploadOutlined />,
          tags: ['作品上传', '文件管理', '存储']
        },
        { 
          title: '字体标注功能', 
          description: '对上传的作品进行字符标注',
          icon: <FontSizeOutlined />,
          tags: ['字体标注', '字符识别', '标注']
        },
        { 
          title: '字符裁剪功能', 
          description: '裁剪单字并标注字名',
          icon: <ScissorOutlined />,
          tags: ['字符裁剪', '图像处理', '裁剪']
        },
        { 
          title: '搜索功能', 
          description: '根据字名搜索单字图片',
          icon: <SearchOutlined />,
          tags: ['搜索', '查找', '检索']
        },
        { 
          title: '作品展示功能', 
          description: '浏览所有上传的书法作品',
          icon: <PictureOutlined />,
          tags: ['作品展示', '浏览', '查看']
        },
        { 
          title: '后台管理功能', 
          description: '管理系统中的作品和标注',
          icon: <SettingOutlined />,
          tags: ['后台管理', '系统管理', '维护']
        }
      ],
      stats: {
        features: 6,
        improvements: 0,
        fixes: 0,
        performance: '初始版本'
      }
    }
  ];

  const getVersionTag = (type, version) => {
    switch (type) {
      case 'major':
        return <Tag icon={<RocketOutlined />} color="magenta">重大更新 {version}</Tag>;
      case 'feature':
        return <Tag icon={<CheckCircleOutlined />} color="blue">功能更新 {version}</Tag>;
      case 'improvement':
        return <Tag icon={<CheckCircleOutlined />} color="green">功能改进 {version}</Tag>;
      case 'fix':
        return <Tag icon={<BugOutlined />} color="orange">问题修复 {version}</Tag>;
      case 'initial':
        return <Tag icon={<ClockCircleOutlined />} color="purple">初始版本 {version}</Tag>;
      default:
        return <Tag color="blue">{version}</Tag>;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'major': return 'magenta';
      case 'feature': return 'blue';
      case 'improvement': return 'green';
      case 'fix': return 'orange';
      case 'initial': return 'purple';
      default: return 'blue';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'major': return <RocketOutlined />;
      case 'feature': return <CheckCircleOutlined />;
      case 'improvement': return <CheckCircleOutlined />;
      case 'fix': return <BugOutlined />;
      case 'initial': return <ClockCircleOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };

  const renderFeatureList = (items, title, icon, color) => (
    <div style={{ marginBottom: '20px' }}>
      <Title level={5} style={{ color: color, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        {title}
      </Title>
      <List
        dataSource={items}
        renderItem={(item, idx) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar icon={item.icon} style={{ backgroundColor: 'transparent', color: color }} />}
              title={
                <Space wrap>
                  <Text strong>{item.title}</Text>
                  {item.tags && item.tags.map((tag, tagIdx) => (
                    <Tag key={tagIdx} color={color === '#1890ff' ? 'blue' : color === '#52c41a' ? 'green' : color === '#fa8c16' ? 'orange' : color}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Title level={isMobile ? 3 : 2} style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '16px' : '24px',
        fontSize: isMobile ? '24px' : '30px'
      }}>
        项目更新历程
      </Title>
      
      {/* 项目统计数据 */}
      <Card 
        title="项目统计" 
        style={{ 
          marginBottom: isMobile ? '16px' : '24px',
          borderRadius: '8px'
        }}
      >
        <Row gutter={[16, 16]} justify="center">
          {projectStats.map((stat, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Card 
                size="small" 
                style={{ 
                  textAlign: 'center',
                  borderRadius: '6px'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', color: '#888' }}>
                  {stat.suffix}
                </div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', marginTop: '4px' }}>
                  {stat.title}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
      
      {/* 版本分类统计 */}
      <Card 
        title="版本分类统计" 
        style={{ 
          marginBottom: isMobile ? '16px' : '24px',
          borderRadius: '8px'
        }}
      >
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: isMobile ? '8px' : '12px',
          justifyContent: 'center'
        }}>
          {versionStats.map((stat, index) => (
            <Tag 
              key={index} 
              color={stat.color}
              style={{ 
                padding: isMobile ? '4px 8px' : '6px 12px',
                fontSize: isMobile ? '12px' : '14px'
              }}
            >
              {stat.type}: {stat.count}
            </Tag>
          ))}
        </div>
      </Card>
      
      {/* 详细更新历程 */}
      <Card 
        title="详细更新历程" 
        style={{ 
          borderRadius: '8px'
        }}
      >
        <Timeline mode="alternate">
          {changelogData.map((version, index) => (
            <Timeline.Item 
              key={index} 
              color={version.type === 'major' ? 'red' : version.type === 'feature' ? 'blue' : version.type === 'improvement' ? 'green' : 'orange'}
            >
              <Card 
                size="small" 
                style={{ 
                  maxWidth: isMobile ? '100%' : '600px',
                  margin: isMobile ? '8px 0' : '12px 0',
                  borderRadius: '6px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <Text strong style={{ fontSize: isMobile ? '16px' : '18px' }}>
                    {version.version}
                  </Text>
                  <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                    <CalendarOutlined /> {version.date}
                  </Text>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginTop: '8px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Text style={{ fontSize: isMobile ? '12px' : '14px' }}>
                    {version.author}
                  </Text>
                </div>
                
                <Paragraph 
                  style={{ 
                    marginTop: '12px',
                    fontSize: isMobile ? '14px' : '16px'
                  }}
                >
                  {version.description}
                </Paragraph>
                
                <Paragraph 
                  type="secondary" 
                  style={{ 
                    fontSize: isMobile ? '12px' : '14px',
                    fontStyle: 'italic'
                  }}
                >
                  {version.releaseNotes}
                </Paragraph>
                
                {/* 新增功能 */}
                {version.features && version.features.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      新增功能
                    </Text>
                    <List
                      size="small"
                      dataSource={version.features}
                      renderItem={(feature, idx) => (
                        <List.Item style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ 
                              fontSize: isMobile ? '16px' : '18px',
                              marginRight: '8px',
                              marginTop: '2px'
                            }}>
                              {feature.icon}
                            </div>
                            <div>
                              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                                {feature.title}
                              </Text>
                              <Paragraph style={{ 
                                fontSize: isMobile ? '12px' : '13px',
                                margin: '4px 0 0 0'
                              }}>
                                {feature.description}
                              </Paragraph>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '4px',
                                marginTop: '4px'
                              }}>
                                {feature.tags.map((tag, tagIdx) => (
                                  <Tag 
                                    key={tagIdx} 
                                    style={{ 
                                      fontSize: isMobile ? '10px' : '12px',
                                      padding: isMobile ? '0 4px' : '0 7px'
                                    }}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
                
                {/* 功能改进 */}
                {version.improvements && version.improvements.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      <SyncOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                      功能改进
                    </Text>
                    <List
                      size="small"
                      dataSource={version.improvements}
                      renderItem={(improvement, idx) => (
                        <List.Item style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ 
                              fontSize: isMobile ? '16px' : '18px',
                              marginRight: '8px',
                              marginTop: '2px'
                            }}>
                              {improvement.icon}
                            </div>
                            <div>
                              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                                {improvement.title}
                              </Text>
                              <Paragraph style={{ 
                                fontSize: isMobile ? '12px' : '13px',
                                margin: '4px 0 0 0'
                              }}>
                                {improvement.description}
                              </Paragraph>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '4px',
                                marginTop: '4px'
                              }}>
                                {improvement.tags.map((tag, tagIdx) => (
                                  <Tag 
                                    key={tagIdx} 
                                    color="blue"
                                    style={{ 
                                      fontSize: isMobile ? '10px' : '12px',
                                      padding: isMobile ? '0 4px' : '0 7px'
                                    }}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
                
                {/* 问题修复 */}
                {version.fixes && version.fixes.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      <BugOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />
                      问题修复
                    </Text>
                    <List
                      size="small"
                      dataSource={version.fixes}
                      renderItem={(fix, idx) => (
                        <List.Item style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <div style={{ 
                              fontSize: isMobile ? '16px' : '18px',
                              marginRight: '8px',
                              marginTop: '2px'
                            }}>
                              {fix.icon}
                            </div>
                            <div>
                              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                                {fix.title}
                              </Text>
                              <Paragraph style={{ 
                                fontSize: isMobile ? '12px' : '13px',
                                margin: '4px 0 0 0'
                              }}>
                                {fix.description}
                              </Paragraph>
                              <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '4px',
                                marginTop: '4px'
                              }}>
                                {fix.tags.map((tag, tagIdx) => (
                                  <Tag 
                                    key={tagIdx} 
                                    color="orange"
                                    style={{ 
                                      fontSize: isMobile ? '10px' : '12px',
                                      padding: isMobile ? '0 4px' : '0 7px'
                                    }}
                                  >
                                    {tag}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}
                
                {/* 统计信息 */}
                {version.stats && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px'
                  }}>
                    <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      <BarChartOutlined style={{ marginRight: '8px' }} />
                      本次更新统计
                    </Text>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                      gap: '12px',
                      marginTop: '12px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>
                          {version.stats.features}
                        </Text>
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>新增功能</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>
                          {version.stats.improvements}
                        </Text>
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>功能改进</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>
                          {version.stats.fixes}
                        </Text>
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>问题修复</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 'bold' }}>
                          {version.stats.performance}
                        </Text>
                        <div style={{ fontSize: isMobile ? '12px' : '14px' }}>性能提升</div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

export default ChangelogHistoryPage;