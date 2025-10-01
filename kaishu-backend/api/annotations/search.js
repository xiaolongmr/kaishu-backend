/**
 * 标注搜索API端点
 * 处理标注搜索请求
 */

const { databaseService } = require('../../services/databaseService');
const logger = require('../../utils/logger');

/**
 * 搜索标注
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const searchAnnotations = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { 
      page = 1, 
      limit = 10, 
      work_id, 
      character, 
      user_id, 
      search 
    } = req.query;
    
    // 构建WHERE子句
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (work_id) {
      whereClause += ` AND a.work_id = $${paramIndex}`;
      params.push(work_id);
      paramIndex++;
    }
    
    if (character) {
      whereClause += ` AND a.character_name ILIKE $${paramIndex}`;
      params.push(`%${character}%`);
      paramIndex++;
    }
    
    if (user_id) {
      whereClause += ` AND a.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }
    
    if (search) {
      whereClause += ` AND a.character_name ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    // 分页参数
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    params.push(parseInt(limit), offset);
    
    const query = `
      SELECT 
        a.id,
        a.character_name,
        a.position_x,
        a.position_y,
        a.annotation_time,
        a.work_id,
        a.user_id
      FROM annotations a
      ${whereClause}
      ORDER BY a.annotation_time DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    const result = await databaseService.query(query, params);
    
    // 获取总数
    const countQuery = `
      SELECT COUNT(a.id) as total
      FROM annotations a
      ${whereClause}
    `;
    
    const countResult = await databaseService.query(countQuery, params.slice(0, -2)); // 移除 limit 和 offset 参数
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      annotations: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('搜索标注失败:', error);
    res.status(500).json({ error: '搜索标注失败' });
  }
};

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return searchAnnotations(req, res);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: '方法不允许' });
  }
};