import React, { useState, useEffect } from 'react';
import TwikooComment from './TwikooComment'; // 导入评论组件
import useCommentSettings from './useCommentSettings'; // 导入评论设置hook
import { annotationsAPI } from '../utils/api';

// 常用字数据 (3500字)
// 这里只列出了一部分常用字示例，实际项目中可以导入完整的常用字列表
const COMMON_CHARACTERS = "的一是不了在人有我他这个们中来上大为和国地到以说时要就出会可也你对生能而子那得于着下自之年过发后作里用道行所然家种事成方多经么去法学如都同现当没动面起看定天分还进好小部其些主样理心她本前开但因只从想实日军者意无力它与长把机十民第公此已工使情明性知全三又关点正业外将两好间由问很最重并物手应战向头文体政美相见被利什二等产或新己制身果加西斯月话合回特代内信表化老给世位次度门任常先海通教儿原东";

// CJK基本区汉字范围定义
const CJK_RANGES = [
  // CJK统一汉字基本区 (4E00-9FFF): 常用汉字
  { start: 0x4E00, end: 0x9FFF, name: "CJK统一汉字基本区" },
  // CJK统一汉字扩展A区 (3400-4DBF): 不常用汉字
  { start: 0x3400, end: 0x4DBF, name: "CJK统一汉字扩展A区" },
  // CJK统一汉字扩展B区 (20000-2A6DF): 罕用汉字
  { start: 0x20000, end: 0x2A6DF, name: "CJK统一汉字扩展B区" },
  // CJK统一汉字扩展C区 (2A700-2B73F): 更罕用的汉字
  { start: 0x2A700, end: 0x2B73F, name: "CJK统一汉字扩展C区" },
  // CJK统一汉字扩展D区 (2B740-2B81F): 更罕用的汉字
  { start: 0x2B740, end: 0x2B81F, name: "CJK统一汉字扩展D区" },
  // CJK统一汉字扩展E区 (2B820-2CEAF): 更罕用的汉字
  { start: 0x2B820, end: 0x2CEAF, name: "CJK统一汉字扩展E区" },
  // CJK统一汉字扩展F区 (2CEB0-2EBEF): 更罕用的汉字
  { start: 0x2CEB0, end: 0x2EBEF, name: "CJK统一汉字扩展F区" },
  // CJK兼容汉字 (F900-FAFF): 兼容汉字
  { start: 0xF900, end: 0xFAFF, name: "CJK兼容汉字" }
];

// 首先创建米字格样式的CSS
const gridStyle = {
  position: 'relative',
  backgroundImage: `
    linear-gradient(to right, #ddd 1px, transparent 1px),
    linear-gradient(to bottom, #ddd 1px, transparent 1px)
  `,
  backgroundSize: '100% 100%',
};

const CharacterStatistics = () => {
  const [loading, setLoading] = useState(true);
  const [annotations, setAnnotations] = useState([]);
  const [statistics, setStatistics] = useState({});
  const { commentSettings } = useCommentSettings('statistics'); // 获取字体统计页面评论设置
  const [selectedRange, setSelectedRange] = useState("all");
  const [sortOption, setSortOption] = useState("unicode"); // "unicode", "common", "frequency"
  const [showUnannotated, setShowUnannotated] = useState(false);
  const [unannotatedChars, setUnannotatedChars] = useState([]);
  const [page, setPage] = useState(1);
  const charsPerPage = 200; // 每页显示的字符数量
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
    fetchAnnotations();
  }, []);

  useEffect(() => {
    if (annotations.length > 0) {
      calculateStatistics();
    }
  }, [annotations, selectedRange, sortOption]);

  useEffect(() => {
    if (showUnannotated && selectedRange !== "all") {
      generateUnannotatedChars();
    }
  }, [showUnannotated, selectedRange, statistics]);

  // 获取所有标注
  const fetchAnnotations = async () => {
    try {
      setLoading(true);
      
      const data = await annotationsAPI.searchAnnotations();
      
      setAnnotations(data);
      setLoading(false);

      // 触发标注变化事件
      const annotationChangedEvent = new CustomEvent('annotationChanged');
      window.dispatchEvent(annotationChangedEvent);
    } catch (error) {
      console.error('获取标注数据失败:', error);
      setLoading(false);
    }
  };

  // 生成未标注的字符
  const generateUnannotatedChars = () => {
    if (selectedRange === "all" || !statistics.byRange) return;
    
    const range = CJK_RANGES.find(r => r.name === selectedRange);
    if (!range) return;
    
    const annotatedChars = new Set(statistics.byRange[selectedRange]?.characters || []);
    const missing = [];
    
    // 只生成当前页需要的字符，避免生成过多导致性能问题
    const start = (page - 1) * charsPerPage;
    const end = Math.min(start + charsPerPage, range.end - range.start + 1);
    
    for (let i = start; i < end; i++) {
      const codePoint = range.start + i;
      try {
        const char = String.fromCodePoint(codePoint);
        if (!annotatedChars.has(char)) {
          missing.push(char);
        }
      } catch (e) {
        console.error(`无法创建代码点为 ${codePoint} 的字符`);
      }
    }
    
    setUnannotatedChars(missing);
  };

  // 计算统计信息
  const calculateStatistics = () => {
    // 创建统计对象
    const stats = {
      total: 0,
      byRange: {},
      characters: {},
      characterList: [],
      frequencyMap: {}
    };

    // 初始化每个Unicode区间的统计数据
    CJK_RANGES.forEach(range => {
      stats.byRange[range.name] = {
        total: range.end - range.start + 1,
        annotated: 0,
        percentage: 0,
        characters: []
      };
    });

    // 统计每个标注的字符
    annotations.forEach(annotation => {
      const char = annotation.character_name;
      
      // 只统计长度为1的字符（单个汉字）
      if (char && char.length === 1) {
        const codePoint = char.codePointAt(0);
        
        // 记录字符出现频率
        if (!stats.frequencyMap[char]) {
          stats.frequencyMap[char] = 0;
        }
        stats.frequencyMap[char]++;
        
        // 增加总数
        if (!stats.characters[char]) {
          stats.characters[char] = 1;
          stats.total++;
          stats.characterList.push(char);
          
          // 统计Unicode区间
          let foundRange = false;
          for (const range of CJK_RANGES) {
            if (codePoint >= range.start && codePoint <= range.end) {
              stats.byRange[range.name].annotated++;
              stats.byRange[range.name].characters.push(char);
              stats.byRange[range.name].percentage = 
                (stats.byRange[range.name].annotated / stats.byRange[range.name].total * 100).toFixed(2);
              foundRange = true;
              break;
            }
          }
          
          // 如果没有找到对应的Unicode区间，归为"其他"
          if (!foundRange) {
            if (!stats.byRange["其他"]) {
              stats.byRange["其他"] = { total: 0, annotated: 0, percentage: 0, characters: [] };
            }
            stats.byRange["其他"].annotated++;
            stats.byRange["其他"].characters.push(char);
          }
        } else {
          stats.characters[char]++;
        }
      }
    });

    // 根据selectedRange过滤结果
    let filteredChars = [];
    if (selectedRange !== "all") {
      filteredChars = stats.byRange[selectedRange]?.characters || [];
    } else {
      filteredChars = stats.characterList;
    }

    // 根据排序选项对字符进行排序
    if (sortOption === "common") {
      // 按常用字排序
      filteredChars.sort((a, b) => {
        const aIndex = COMMON_CHARACTERS.indexOf(a);
        const bIndex = COMMON_CHARACTERS.indexOf(b);
        
        // 如果都不是常用字，则按 Unicode 排序
        if (aIndex === -1 && bIndex === -1) {
          return a.codePointAt(0) - b.codePointAt(0);
        }
        
        // 如果只有一个是常用字，常用字排在前面
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        // 如果都是常用字，按照常用字中的顺序排序
        return aIndex - bIndex;
      });
    } else if (sortOption === "frequency") {
      // 按出现频率排序
      filteredChars.sort((a, b) => (stats.frequencyMap[b] || 0) - (stats.frequencyMap[a] || 0));
    } else {
      // 默认按 Unicode 编码排序
      filteredChars.sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
    }
    
    stats.filteredCharacters = filteredChars;
    setStatistics(stats);
  };

  // 生成米字格样式
  const getMiziGeStyle = (size = 36) => {
    return {
      width: `${size}px`,
      height: `${size}px`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      backgroundImage: `
        linear-gradient(to right, #ddd 1px, transparent 1px),
        linear-gradient(to bottom, #ddd 1px, transparent 1px),
        linear-gradient(45deg, transparent calc(50% - 0.5px), #ddd calc(50% - 0.5px), #ddd calc(50% + 0.5px), transparent calc(50% + 0.5px)),
        linear-gradient(-45deg, transparent calc(50% - 0.5px), #ddd calc(50% - 0.5px), #ddd calc(50% + 0.5px), transparent calc(50% + 0.5px))
      `,
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
      backgroundPosition: 'center',
    };
  };

  // 为未标注字符使用默认楷体显示
  const getDefaultKaiTiStyle = (size = 36) => {
    return {
      width: `${size}px`,
      height: `${size}px`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ddd',
      borderRadius: '4px',
      background: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      fontFamily: "'KaiTi', '楷体', serif",
      backgroundImage: `
        linear-gradient(to right, #ddd 1px, transparent 1px),
        linear-gradient(to bottom, #ddd 1px, transparent 1px),
        linear-gradient(45deg, transparent calc(50% - 0.5px), #ddd calc(50% - 0.5px), #ddd calc(50% + 0.5px), transparent calc(50% + 0.5px)),
        linear-gradient(-45deg, transparent calc(50% - 0.5px), #ddd calc(50% - 0.5px), #ddd calc(50% + 0.5px), transparent calc(50% + 0.5px))
      `,
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 100% 100%',
      backgroundPosition: 'center',
    };
  };

  const renderCharacterGrid = () => {
    // 决定显示哪些字符
    let chars = [];
    if (showUnannotated && selectedRange !== "all") {
      chars = unannotatedChars;
    } else {
      chars = statistics.filteredCharacters || [];
    }
    
    // 如果显示未标注的字符，且字符过多，则分页显示
    if (showUnannotated && selectedRange !== "all") {
      const range = CJK_RANGES.find(r => r.name === selectedRange);
      if (range) {
        const totalChars = range.end - range.start + 1;
        const totalPages = Math.ceil(totalChars / charsPerPage);
        
        const pagination = (
          <div style={{ marginTop: '10px', marginBottom: '10px', textAlign: 'center' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ 
                padding: '5px 10px', 
                marginRight: '10px', 
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              上一页
            </button>
            <span>
              第 {page} / {totalPages} 页 
              (字符 {(page-1) * charsPerPage + 1} - {Math.min(page * charsPerPage, totalChars)})
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ 
                padding: '5px 10px', 
                marginLeft: '10px', 
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              下一页
            </button>
          </div>
        );
        
        return (
          <>
            {pagination}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', 
              gap: '8px',
              marginTop: '20px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '10px',
              background: '#f9f9f9',
              borderRadius: '4px'
            }}>
              {chars.map((char, index) => (
                <div 
                  key={index} 
                  style={getDefaultKaiTiStyle(36)} 
                  title={`Unicode: U+${char.codePointAt(0).toString(16).toUpperCase()} (未标注)`}
                >
                  {char}
                </div>
              ))}
            </div>
            {pagination}
          </>
        );
      }
    }
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', 
        gap: '8px',
        marginTop: '20px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '10px',
        background: '#f9f9f9',
        borderRadius: '4px'
      }}>
        {chars.map((char, index) => (
          <div 
            key={index} 
            style={getMiziGeStyle(36)} 
            title={`Unicode: U+${char.codePointAt(0).toString(16).toUpperCase()}`}
          >
            {char}
          </div>
        ))}
      </div>
    );
  };

  const renderStatisticsTable = () => {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Unicode区间</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>区间总字数</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>已标注字数</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>覆盖率</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(statistics.byRange || {}).map(([name, data], index) => (
            <tr key={index} 
                style={{ 
                  cursor: 'pointer', 
                  backgroundColor: selectedRange === name ? '#e6f7ff' : 'transparent'
                }}
                onClick={() => setSelectedRange(name)}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{name}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{data.total || 'N/A'}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{data.annotated}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
                {data.percentage ? `${data.percentage}%` : '0%'}
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#eee', 
                  borderRadius: '4px',
                  marginTop: '4px',
                  height: '8px'
                }}>
                  <div style={{
                    width: `${data.percentage || 0}%`,
                    backgroundColor: '#4CAF50',
                    height: '8px',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 'bold' }}>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>总计</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
              {Object.values(statistics.byRange || {}).reduce((sum, data) => sum + (data.total || 0), 0)}
            </td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>{statistics.total || 0}</td>
            <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
              {statistics.total && 
                ((statistics.total / Object.values(statistics.byRange || {}).reduce((sum, data) => sum + (data.total || 0), 0)) * 100).toFixed(4) + '%'
              }
            </td>
          </tr>
        </tfoot>
      </table>
    );
  };

  return (
    <div>
      <h3>汉字标注统计</h3>
      
      {loading ? (
        <p>加载中...</p>
      ) : (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <p>总共已标注 <strong>{statistics.total || 0}</strong> 个唯一汉字</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
              <div>
                <label style={{ marginRight: '10px' }}>选择Unicode区间：</label>
                <select 
                  value={selectedRange} 
                  onChange={(e) => {
                    setSelectedRange(e.target.value);
                    setPage(1); // 切换区间时重置页码
                  }}
                  style={{ padding: '6px', borderRadius: '4px', minWidth: '200px' }}
                >
                  <option value="all">所有区间</option>
                  {CJK_RANGES.map((range, index) => (
                    <option key={index} value={range.name}>
                      {range.name} ({(statistics.byRange && statistics.byRange[range.name]?.annotated) || 0} 字)
                    </option>
                  ))}
                  {statistics.byRange && statistics.byRange["其他"] && 
                    <option value="其他">其他 ({statistics.byRange["其他"].annotated} 字)</option>
                  }
                </select>
              </div>
              
              <div>
                <label style={{ marginRight: '10px' }}>排序方式：</label>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{ padding: '6px', borderRadius: '4px', width: '150px' }}
                >
                  <option value="unicode">Unicode编码</option>
                  <option value="common">按常用字排序</option>
                  <option value="frequency">按出现频率</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label>
                  <input 
                    type="checkbox" 
                    checked={showUnannotated}
                    onChange={(e) => {
                      setShowUnannotated(e.target.checked);
                      setPage(1); // 切换显示模式时重置页码
                    }}
                    style={{ marginRight: '8px' }}
                  />
                  显示未标注字符
                </label>
                <span style={{ fontSize: '12px', color: '#888', marginLeft: '8px' }}>
                  (仅限单个区间)
                </span>
              </div>
            </div>
          </div>
          
          {renderStatisticsTable()}
          {renderCharacterGrid()}
        </div>
      )}
      
      {/* 评论区 */}
      {(!commentSettings || commentSettings?.enabled) && (
        <div style={{ marginTop: '20px' }} id="comments">
          <TwikooComment commentPath={commentSettings?.shared_path || '/statistics'} />
        </div>
      )}
    </div>
  );
};

export default CharacterStatistics;