import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TwikooComment = ({ commentPath }) => {
  const location = useLocation();
  const commentContainerRef = useRef(null);
  const initializationAttemptedRef = useRef(false);
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
    console.log('TwikooComment组件挂载，commentPath:', commentPath);
    
    // 清除之前的评论组件，防止重复加载
    const container = document.getElementById('tcomment');
    if (container) {
      container.innerHTML = '';
    }

    // 确保twikoo已加载
    const loadTwikoo = () => {
      if (window.twikoo) {
        // 使用传入的commentPath或当前路径
        const path = commentPath || location.pathname;
        console.log('初始化Twikoo评论区，路径:', path);
        
        if (initializationAttemptedRef.current) {
          console.log('已尝试初始化过Twikoo，本次跳过以防止重复初始化');
          return;
        }
        
        initializationAttemptedRef.current = true;
        
        try {
          window.twikoo.init({
            envId: 'https://twikookaishu.z-l.top', 
            el: '#tcomment',
            path: path // 使用指定路径或当前路径
          });
          console.log('Twikoo评论初始化成功');
        } catch (error) {
          console.error('Twikoo评论初始化失败:', error);
          // 重置标志，允许下次重试
          initializationAttemptedRef.current = false;
        }
      } else {
        setTimeout(loadTwikoo, 100);
      }
    };

    // 加载twikoo脚本
    if (!document.getElementById('twikoo-script')) {
      console.log('加载Twikoo脚本');
      const script = document.createElement('script');
      script.id = 'twikoo-script';
      script.src = 'https://cdn.jsdelivr.net/npm/twikoo@1.6.44/dist/twikoo.min.js';
      script.onload = () => {
        console.log('Twikoo脚本加载完成');
        loadTwikoo();
      };
      document.body.appendChild(script);
    } else {
      console.log('Twikoo脚本已存在，直接初始化');
      loadTwikoo();
    }

    return () => {
      // 清理可能的副作用
      console.log('TwikooComment组件卸载');
      initializationAttemptedRef.current = false;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [commentPath, location.pathname]);

  return (
    <div 
      id="tcomment" 
      ref={commentContainerRef} 
      style={{ 
        background: 'transparent', 
        padding: isMobile ? '8px 0' : '10px 0', 
        borderRadius: '4px' 
      }}
    ></div>
  );
};

export default TwikooComment;