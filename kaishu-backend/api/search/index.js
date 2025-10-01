/**
 * Vercel Serverless API: 通用搜索
 * 处理搜索请求
 */

const { databaseService } = require('../../services/databaseService');

// 设置 CORS 头部
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  // 设置 CORS 头
  setCorsHeaders(res);

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    const { 
      q, 
      type = 'annotations', 
      work_id, 
      character, 
      user_id, 
      page = 1, 
      limit = 20 
    } = req.query;

    if (type === 'annotations') {
      return await searchAnnotations(req, res, { 
        searchTerm: q, work_id, character, user_id, page, limit 
      });
    } else if (type === 'works') {
      return await searchWorks(req, res, { 
        searchTerm: q, page, limit 
      });
    } else {
      return res.status(400).json({ error: '不支持的搜索类型' });
    }

  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({ error: '搜索失败' });
  }
};

/**
 * 搜索标注
 */
async function searchAnnotations(req, res, params) {
  const { searchTerm, work_id, character, user_id, page, limit } = params;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let whereClause = 'WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;
  
  // 隐私过滤 - 暂时只显示公开内容
  whereClause += ` AND w.privacy = 'public'`;
  
  if (work_id) {
    whereClause += ` AND a.work_id = $${paramIndex}`;
    queryParams.push(work_id);
    paramIndex++;
  }
  
  if (character) {
    whereClause += ` AND a.character_name = $${paramIndex}`;
    queryParams.push(character);
    paramIndex++;
  }
  
  if (user_id) {
    whereClause += ` AND a.user_id = $${paramIndex}`;
    queryParams.push(user_id);
    paramIndex++;
  }
  
  if (searchTerm) {
    whereClause += ` AND (a.character_name ILIKE $${paramIndex} OR a.notes ILIKE $${paramIndex} OR w.title ILIKE $${paramIndex})`;
    queryParams.push(`%${searchTerm}%`);
    paramIndex++;
  }
  
  // 添加分页参数
  queryParams.push(parseInt(limit));
  const limitParam = paramIndex++;
  queryParams.push(offset);
  const offsetParam = paramIndex++;
  
  const query = `
    SELECT 
      a.id,
      a.character_name,
      a.x_position,
      a.y_position,
      a.notes,
      a.created_at,
      a.updated_at,
      a.work_id,
      w.title as work_title,
      w.image_url as work_image_url,
      w.author as work_author
    FROM annotations a
    JOIN works w ON a.work_id = w.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  
  const result = await databaseService.query(query, queryParams);
  
  // 获取总数
  const countQuery = `
    SELECT COUNT(a.id) as total
    FROM annotations a
    JOIN works w ON a.work_id = w.id
    ${whereClause}
  `;
  
  const countResult = await databaseService.query(countQuery, queryParams.slice(0, -2));
  const total = parseInt(countResult.rows[0].total) || 0;
  
  res.status(200).json({
    type: 'annotations',
    results: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

/**
 * 搜索作品
 */
async function searchWorks(req, res, params) {
  const { searchTerm, page, limit } = params;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let whereClause = 'WHERE 1=1';
  const queryParams = [];
  let paramIndex = 1;
  
  // 隐私过滤 - 暂时只显示公开内容
  whereClause += ` AND privacy = 'public'`;
  
  if (searchTerm) {
    whereClause += ` AND (title ILIKE $${paramIndex} OR author ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    queryParams.push(`%${searchTerm}%`);
    paramIndex++;
  }
  
  // 添加分页参数
  queryParams.push(parseInt(limit));
  const limitParam = paramIndex++;
  queryParams.push(offset);
  const offsetParam = paramIndex++;
  
  const query = `
    SELECT 
      id,
      title,
      author,
      description,
      image_url,
      created_at,
      updated_at
    FROM works
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  
  const result = await databaseService.query(query, queryParams);
  
  // 获取总数
  const countQuery = `
    SELECT COUNT(id) as total
    FROM works
    ${whereClause}
  `;
  
  const countResult = await databaseService.query(countQuery, queryParams.slice(0, -2));
  const total = parseInt(countResult.rows[0].total) || 0;
  
  res.status(200).json({
    type: 'works',
    results: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}