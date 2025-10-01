/**
 * Vercel Serverless API: 获取标注数量
 * 处理标注数量查询请求
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
      work_id, 
      character, 
      user_id 
    } = req.query;

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

    const query = `
      SELECT COUNT(a.id) as count
      FROM annotations a
      JOIN works w ON a.work_id = w.id
      ${whereClause}
    `;

    const result = await databaseService.query(query, params);
    
    res.status(200).json({
      count: parseInt(result.rows[0].count) || 0
    });

  } catch (error) {
    console.error('获取标注数量失败:', error);
    res.status(500).json({ error: '获取标注数量失败' });
  }
};