/**
 * 分组管理路由模块
 * 处理作品分组的增删改查功能
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { databaseService } = require('../services/databaseService');
const logger = require('../utils/logger');

// 获取所有分组
router.get('/', async (req, res) => {
  try {
    const result = await databaseService.query(`
      WITH RECURSIVE group_tree AS (
        SELECT id, name, parent_id, description, created_at, 0 as level
        FROM work_groups 
        WHERE parent_id IS NULL
        UNION ALL
        SELECT g.id, g.name, g.parent_id, g.description, g.created_at, gt.level + 1
        FROM work_groups g
        INNER JOIN group_tree gt ON g.parent_id = gt.id
      )
      SELECT * FROM group_tree ORDER BY level, name
    `);
    
    // 获取每个分组的作品数量
    const groupCounts = await databaseService.query(`
      SELECT group_name, COUNT(*) as work_count
      FROM works 
      WHERE group_name IS NOT NULL
      GROUP BY group_name
    `);
    
    const countMap = {};
    groupCounts.rows.forEach(row => {
      countMap[row.group_name] = parseInt(row.work_count);
    });
    
    const groups = result.rows.map(group => ({
      ...group,
      work_count: countMap[group.name] || 0
    }));
    
    res.json({ groups });
  } catch (error) {
    logger.error('获取分组列表失败:', error);
    res.status(500).json({ error: '获取分组列表失败' });
  }
});

// 创建新分组
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, parent_id, description } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }
    
    // 检查分组名是否已存在（在同一父分组下）
    const existingGroup = await databaseService.query(
      'SELECT id FROM work_groups WHERE name = $1 AND parent_id = $2',
      [name, parent_id || null]
    );
    
    if (existingGroup.rows.length > 0) {
      return res.status(400).json({ error: '该分组名称已存在' });
    }
    
    const result = await databaseService.query(
      'INSERT INTO work_groups (name, parent_id, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, parent_id || null, description, userId]
    );
    
    res.json({ group: result.rows[0] });
  } catch (error) {
    logger.error('创建分组失败:', error);
    res.status(500).json({ error: '创建分组失败' });
  }
});

// 更新分组
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: '分组名称不能为空' });
    }
    
    const result = await databaseService.query(
      'UPDATE work_groups SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    res.json({ group: result.rows[0] });
  } catch (error) {
    logger.error('更新分组失败:', error);
    res.status(500).json({ error: '更新分组失败' });
  }
});

// 删除分组
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查分组是否有子分组
    const childGroups = await databaseService.query(
      'SELECT id FROM work_groups WHERE parent_id = $1',
      [id]
    );
    
    if (childGroups.rows.length > 0) {
      return res.status(400).json({ error: '请先删除子分组' });
    }
    
    // 检查分组是否有作品
    const groupInfo = await databaseService.query(
      'SELECT name FROM work_groups WHERE id = $1',
      [id]
    );
    
    if (groupInfo.rows.length === 0) {
      return res.status(404).json({ error: '分组不存在' });
    }
    
    const groupName = groupInfo.rows[0].name;
    const worksInGroup = await databaseService.query(
      'SELECT id FROM works WHERE group_name = $1',
      [groupName]
    );
    
    if (worksInGroup.rows.length > 0) {
      return res.status(400).json({ error: '分组中还有作品，请先移动或删除作品' });
    }
    
    // 删除分组
    await databaseService.query('DELETE FROM work_groups WHERE id = $1', [id]);
    
    res.json({ success: true });
  } catch (error) {
    logger.error('删除分组失败:', error);
    res.status(500).json({ error: '删除分组失败' });
  }
});

// 获取分组下的作品
router.get('/:name/works', async (req, res) => {
  try {
    const { name } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await databaseService.query(
      'SELECT * FROM works WHERE group_name = $1 ORDER BY upload_time DESC LIMIT $2 OFFSET $3',
      [name, limit, offset]
    );
    
    const countResult = await databaseService.query(
      'SELECT COUNT(*) FROM works WHERE group_name = $1',
      [name]
    );
    
    res.json({
      works: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    logger.error('获取分组作品失败:', error);
    res.status(500).json({ error: '获取分组作品失败' });
  }
});

// 移动作品到分组
router.put('/move-work/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { group_name } = req.body;
    
    const result = await databaseService.query(
      'UPDATE works SET group_name = $1 WHERE id = $2 RETURNING *',
      [group_name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '作品不存在' });
    }
    
    res.json({ work: result.rows[0] });
  } catch (error) {
    logger.error('移动作品到分组失败:', error);
    res.status(500).json({ error: '移动作品到分组失败' });
  }
});

module.exports = router;