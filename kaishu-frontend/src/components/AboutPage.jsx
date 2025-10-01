import React, { useState, useEffect } from 'react';
import { Card, Typography, Divider, List } from 'antd';
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook

const { Title, Paragraph, Text } = Typography;

const AboutPage = () => {
  const { commentSettings } = useCommentSettings('about'); // 获取关于页面评论设置
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

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <Title level={isMobile ? 3 : 2} style={{ 
        textAlign: 'center', 
        marginBottom: isMobile ? '16px' : '24px',
        fontSize: isMobile ? '24px' : '30px'
      }}>
        关于项目
      </Title>
      
      <Card style={{ 
        marginBottom: isMobile ? '16px' : '20px',
        padding: isMobile ? '12px' : '16px'
      }}>
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          项目介绍
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          楷书库字体管理工具是一个专门用于管理楷书书法作品的Web应用，支持上传书法作品、字体标注、字符裁剪和搜索功能。
          该项目旨在帮助书法爱好者和研究者建立、管理和使用完整的楷书字库。
        </Paragraph>
        
        <Divider />
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          功能特性
        </Title>
        <List
          bordered
          size={isMobile ? "small" : "default"}
          dataSource={[
            '作品上传：上传书法作品到"楷书库"目录',
            '字体标注：对上传的作品进行字符标注',
            '字符裁剪：裁剪单字并标注字名',
            '搜索功能：根据字名搜索单字图片',
            '作品展示：浏览所有上传的书法作品',
            '后台管理：管理系统中的作品和标注',
            'OCR自动识别：自动识别并标注字符',
            '透视校正：对有透视变形的作品进行校正',
            '用户管理：支持多用户和权限管理',
            '数据导出：支持数据备份和恢复'
          ]}
          renderItem={item => <List.Item style={{ fontSize: isMobile ? '12px' : '14px' }}>{item}</List.Item>}
        />
        
        <Divider />
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          技术架构
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          本项目采用现代化的前后端分离架构：
        </Paragraph>
        <List
          size={isMobile ? "small" : "default"}
          dataSource={[
            '前端：React + Vite + Ant Design 5.x',
            '后端：Node.js + Express',
            '数据库：Neon PostgreSQL',
            '文件存储：本地文件系统（楷书库目录）',
            '图像处理：Sharp库',
            'OCR识别：百度OCR',
            '路由管理：React Router'
          ]}
          renderItem={item => <List.Item style={{ fontSize: isMobile ? '12px' : '14px' }}>{item}</List.Item>}
        />
        
        <Divider />
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          更新日志
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          查看完整的 <a href="/changelog" style={{ fontSize: isMobile ? '14px' : '16px' }}>更新历程</a>
        </Paragraph>
        <List
          size={isMobile ? "small" : "default"}
          dataSource={[
            'v1.0.0 - 初始版本发布',
            'v1.1.0 - 添加OCR自动识别功能',
            'v1.2.0 - 添加透视校正功能',
            'v1.3.0 - 添加用户权限管理系统',
            'v1.4.0 - 添加数据导出和导入功能',
            'v1.5.0 - 添加作品分组和标签功能',
            'v1.6.0 - 添加作品作者信息管理',
            'v1.7.0 - 优化UI界面和用户体验',
            'v1.8.0 - 添加评论功能和社交分享',
            'v1.9.0 - 添加数据统计和分析功能',
            'v2.0.0 - 重大更新：重构代码结构，优化性能，添加更多实用功能'
          ]}
          renderItem={item => <List.Item style={{ fontSize: isMobile ? '12px' : '14px' }}>{item}</List.Item>}
        />
        
        <Divider />
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          开发计划
        </Title>
        <List
          size={isMobile ? "small" : "default"}
          dataSource={[
            '添加更多字体样式支持（行书、草书等）',
            '优化百度OCR识别参数',
            '添加字体比较功能',
            '实现移动端适配',
            '添加字体生成和导出功能',
            '实现云同步功能',
            '添加AI辅助标注功能',
            '实现更丰富的数据统计和可视化'
          ]}
          renderItem={item => <List.Item style={{ fontSize: isMobile ? '12px' : '14px' }}>{item}</List.Item>}
        />
        
        <Divider />
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          贡献
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          欢迎提交 Issue 和 Pull Request 来改进这个项目。
        </Paragraph>
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          许可证
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          本项目采用 MIT 许可证。
        </Paragraph>
        
        <Title level={isMobile ? 4 : 3} style={{ fontSize: isMobile ? '18px' : '20px' }}>
          联系方式
        </Title>
        <Paragraph style={{ fontSize: isMobile ? '14px' : '16px' }}>
          如有任何问题或建议，请通过以下方式联系我们：
        </Paragraph>
        <List
          size={isMobile ? "small" : "default"}
          dataSource={[
            '邮箱：kaishu@example.com',
            'GitHub：https://github.com/kaishu-project',
            '项目地址：https://kaishu.example.com'
          ]}
          renderItem={item => <List.Item style={{ fontSize: isMobile ? '12px' : '14px' }}>{item}</List.Item>}
        />
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
          <TwikooComment commentPath={commentSettings?.shared_path || '/about'} />
        </Card>
      )}
    </div>
  );
};

export default AboutPage;