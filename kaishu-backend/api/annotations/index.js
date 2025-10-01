/**
 * Vercel Serverless API: 标注管理
 * 处理所有标注相关的请求
 */

const { databaseService } = require('../../services/databaseService');

// 设置 CORS 头部
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async (req, res) => {
  // 设置 CORS 头
  setCorsHeaders(res);

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetAnnotations(req, res);
      case 'POST':
        return await handleCreateAnnotation(req, res);
      case 'PUT':
        return await handleUpdateAnnotation(req, res);
      case 'DELETE':
        return await handleDeleteAnnotation(req, res);
      default:
        return res.status(405).json({ error: '方法不允许' });
    }
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};

/**
 * 获取标注列表
 */
async function handleGetAnnotations(req, res) {
  const { 
    work_id, 
    character, 
    user_id, 
    page = 1, 
    limit = 50 
  } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  // 隐私过滤 - 暂时只显示公开内容
  whereClause += ` AND w.privacy = 'public'`;
  
  if (work_id) {
    whereClause += ` AND a.work_id = $${paramIndex}`;
    params.push(work_id);
    paramIndex++;
  }
  
  if (character) {
    whereClause += ` AND a.character_name = $${paramIndex}`;
    params.push(character);
    paramIndex++;
  }
  
  if (user_id) {
    whereClause += ` AND a.user_id = $${paramIndex}`;
    params.push(user_id);
    paramIndex++;
  }
  
  // 添加分页参数
  params.push(parseInt(limit));
  const limitParam = paramIndex++;
  params.push(offset);
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
      w.image_url as work_image_url
    FROM annotations a
    JOIN works w ON a.work_id = w.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;
  
  const result = await databaseService.query(query, params);
  
  // 获取总数
  const countQuery = `
    SELECT COUNT(a.id) as total
    FROM annotations a
    JOIN works w ON a.work_id = w.id
    ${whereClause}
  `;
  
  const countResult = await databaseService.query(countQuery, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].total) || 0;
  
  res.status(200).json({
    annotations: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}

/**
 * 创建新标注
 */
async function handleCreateAnnotation(req, res) {
  const { work_id, character_name, x_position, y_position, notes } = req.body;
  
  if (!work_id || !character_name || x_position === undefined || y_position === undefined) {
    return res.status(400).json({ error: '缺少必需的字段' });
  }
  
  const query = `
    INSERT INTO annotations (work_id, character_name, x_position, y_position, notes, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
  `;
  
  const result = await databaseService.query(query, [
    work_id, character_name, x_position, y_position, notes || ''
  ]);
  
  res.status(201).json(result.rows[0]);
}

/**
 * 更新标注
 */
async function handleUpdateAnnotation(req, res) {
  const { id } = req.query;
  const { character_name, x_position, y_position, notes } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: '缺少标注ID' });
  }
  
  const query = `
    UPDATE annotations 
    SET character_name = $1, x_position = $2, y_position = $3, notes = $4, updated_at = NOW()
    WHERE id = $5
    RETURNING *
  `;
  
  const result = await databaseService.query(query, [
    character_name, x_position, y_position, notes || '', id
  ]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '标注不存在' });
  }
  
  res.status(200).json(result.rows[0]);
}

/**
 * 删除标注
 */
async function handleDeleteAnnotation(req, res) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: '缺少标注ID' });
  }
  
  const query = 'DELETE FROM annotations WHERE id = $1 RETURNING *';
  const result = await databaseService.query(query, [id]);
  
  if (result.rows.length === 0) {
    return res.status(404).json({ error: '标注不存在' });
  }
  
  res.status(200).json({ message: '标注已删除', annotation: result.rows[0] });
}