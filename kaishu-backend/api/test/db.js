/**
 * 数据库连接测试端点
 */

const { databaseService } = require('../../services/databaseService');

module.exports = async (req, res) => {
  // 设置CORS头部
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '方法不允许' });
  }
  
  try {
    // 测试简单查询
    const result = await databaseService.query('SELECT 1 as test');
    
    // 测试annotations表是否存在
    const tableCheck = await databaseService.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'annotations'
    `);
    
    // 获取annotations表的列信息
    const columnsCheck = await databaseService.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'annotations'
      ORDER BY ordinal_position
    `);
    
    res.json({
      status: 'success',
      database_connection: result.rows[0],
      annotations_table_exists: tableCheck.rows.length > 0,
      annotations_columns: columnsCheck.rows
    });
  } catch (error) {
    res.status(500).json({ 
      error: '数据库测试失败',
      details: error.message 
    });
  }
};