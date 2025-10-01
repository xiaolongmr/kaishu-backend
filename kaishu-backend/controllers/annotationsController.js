/**
 * 标注管理控制器
 * 处理字符标注相关的业务逻辑
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { databaseService } = require('../services/databaseService');
const { validateInput, commonRules } = require('../utils/validators');
const logger = require('../utils/logger');
const { pinyin } = require('pinyin');

class AnnotationsController {
  /**
   * 创建标注
   */
  async createAnnotation(req, res) {
    try {
      const {
        work_id,
        character_name,
        position_x,
        position_y,
        width,
        height,
        four_points,
        perspective_correction = false
      } = req.body;
      
      const userId = req.user.userId;
      
      // 输入验证
      const validation = validateInput({
        work_id,
        character_name,
        position_x,
        position_y,
        width,
        height
      }, {
        work_id: { required: true, type: 'number', integer: true, min: 1 },
        character_name: { required: true, type: 'string', minLength: 1, maxLength: 10 },
        position_x: { required: true, type: 'number', min: 0 },
        position_y: { required: true, type: 'number', min: 0 },
        width: { required: true, type: 'number', min: 1 },
        height: { required: true, type: 'number', min: 1 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      // 检查作品是否存在
      const workResult = await databaseService.query(
        'SELECT id, filename, user_id, privacy FROM works WHERE id = $1',
        [work_id]
      );
      
      if (workResult.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = workResult.rows[0];
      
      // 检查权限（私有作品只有作者可以标注）
      if (work.privacy === 'private' && work.user_id !== userId) {
        return res.status(403).json({ error: '无权限标注此作品' });
      }
      
      // 检查是否已存在相同位置的标注
      const existingResult = await databaseService.query(
        `SELECT id FROM annotations 
         WHERE work_id = $1 AND character_name = $2 
         AND ABS(position_x - $3) < 10 AND ABS(position_y - $4) < 10`,
        [work_id, character_name, position_x, position_y]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(409).json({ error: '该位置已存在相同字符的标注' });
      }
      
      // 处理四点坐标
      let fourPointsData = null;
      if (four_points && Array.isArray(four_points) && four_points.length === 4) {
        fourPointsData = JSON.stringify(four_points);
      }
      
      // 创建标注
      const result = await databaseService.query(
        `INSERT INTO annotations (
           work_id, character_name, position_x, position_y, width, height, 
           four_points, perspective_correction, annotation_time, user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
         RETURNING *`,
        [
          work_id, character_name, position_x, position_y, width, height,
          fourPointsData, perspective_correction, userId
        ]
      );
      
      const annotation = result.rows[0];
      
      // 尝试裁剪字符图片
      try {
        await this.cropCharacterImage(work.filename, annotation);
      } catch (cropError) {
        logger.warn('字符图片裁剪失败:', cropError);
        // 不影响标注创建，继续执行
      }
      
      logger.info(`标注创建成功 - 作品ID: ${work_id}, 字符: ${character_name} by ${req.user.username}`);
      
      res.status(201).json({
        message: '标注创建成功',
        annotation: {
          ...annotation,
          four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null
        }
      });
    } catch (error) {
      logger.error('创建标注失败:', error);
      res.status(500).json({ error: '创建标注失败' });
    }
  }
  
  /**
   * 批量创建标注
   */
  async batchCreateAnnotations(req, res) {
    try {
      const { annotations } = req.body;
      const userId = req.user.userId;
      
      if (!Array.isArray(annotations) || annotations.length === 0) {
        return res.status(400).json({ error: '请提供标注数组' });
      }
      
      if (annotations.length > 50) {
        return res.status(400).json({ error: '批量标注数量不能超过50个' });
      }
      
      const results = [];
      const errors = [];
      
      // 使用事务处理批量创建
      await databaseService.transaction(async (client) => {
        for (let i = 0; i < annotations.length; i++) {
          const annotation = annotations[i];
          try {
            // 验证单个标注
            const validation = validateInput(annotation, {
              work_id: { required: true, type: 'number', integer: true, min: 1 },
              character_name: { required: true, type: 'string', minLength: 1, maxLength: 10 },
              position_x: { required: true, type: 'number', min: 0 },
              position_y: { required: true, type: 'number', min: 0 },
              width: { required: true, type: 'number', min: 1 },
              height: { required: true, type: 'number', min: 1 }
            });
            
            if (!validation.isValid) {
              errors.push({ index: i, error: '输入验证失败', details: validation.errors });
              continue;
            }
            
            const {
              work_id,
              character_name,
              position_x,
              position_y,
              width,
              height,
              four_points,
              perspective_correction = false
            } = annotation;
            
            // 处理四点坐标
            let fourPointsData = null;
            if (four_points && Array.isArray(four_points) && four_points.length === 4) {
              fourPointsData = JSON.stringify(four_points);
            }
            
            // 创建标注
            const result = await client.query(
              `INSERT INTO annotations (
                 work_id, character_name, position_x, position_y, width, height, 
                 four_points, perspective_correction, annotation_time, user_id
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
               RETURNING *`,
              [
                work_id, character_name, position_x, position_y, width, height,
                fourPointsData, perspective_correction, userId
              ]
            );
            
            results.push({
              index: i,
              success: true,
              annotation: result.rows[0]
            });
          } catch (error) {
            logger.error(`批量创建标注失败 - 索引 ${i}:`, error);
            errors.push({ index: i, error: error.message });
          }
        }
      });
      
      logger.info(`批量标注创建完成 - 成功: ${results.length}, 失败: ${errors.length} by ${req.user.username}`);
      
      res.json({
        message: `批量标注创建完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
        results,
        errors
      });
    } catch (error) {
      logger.error('批量创建标注失败:', error);
      res.status(500).json({ error: '批量创建标注失败' });
    }
  }
  
  /**
   * 获取标注列表
   */
  async getAnnotations(req, res) {
    try {
      const { page = 1, limit = 20, work_id, character, user_id, verified } = req.query;
      const currentUserId = req.user?.userId;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 隐私过滤
      if (!currentUserId) {
        whereClause += ` AND w.privacy = 'public'`;
      } else {
        whereClause += ` AND (w.privacy = 'public' OR w.user_id = $${paramIndex})`;
        params.push(currentUserId);
        paramIndex++;
      }
      
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
      
      if (verified !== undefined) {
        whereClause += ` AND a.verified = $${paramIndex}`;
        params.push(verified === 'true');
        paramIndex++;
      }
      
      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);
      
      const query = `
        SELECT a.*, w.filename as work_filename, w.original_filename, 
               u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.annotation_time DESC
        ${limitClause}
      `;
      
      const result = await databaseService.query(query, params);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) 
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        ${whereClause}
      `;
      const countResult = await databaseService.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
        imageUrl: `/images/${annotation.work_filename}`,
        croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
      }));
      
      res.json({
        annotations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取标注列表失败:', error);
      res.status(500).json({ error: '获取标注列表失败' });
    }
  }
  
  /**
   * 获取标注统计
   */
  async getAnnotationStats(req, res) {
    try {
      const userId = req.user?.userId;
      
      // 构建隐私过滤
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [];
      
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $1)";
        params.push(userId);
      }
      
      const statsQuery = `
        SELECT 
          COUNT(a.id) as total_annotations,
          COUNT(DISTINCT a.character_name) as unique_characters,
          COUNT(DISTINCT a.work_id) as annotated_works,
          COUNT(DISTINCT a.user_id) as annotators_count,
          AVG(a.width * a.height) as avg_annotation_size
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE 1=1 ${privacyFilter}
      `;
      
      const result = await databaseService.query(statsQuery, params);
      const stats = result.rows[0];
      
      // 获取最活跃的标注者
      const topAnnotatorsQuery = `
        SELECT u.username, COUNT(a.id) as annotation_count
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE 1=1 ${privacyFilter}
        GROUP BY u.id, u.username
        ORDER BY annotation_count DESC
        LIMIT 5
      `;
      
      const topAnnotatorsResult = await databaseService.query(topAnnotatorsQuery, params);
      
      // 获取最常标注的字符
      const topCharactersQuery = `
        SELECT a.character_name, COUNT(a.id) as count
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE 1=1 ${privacyFilter}
        GROUP BY a.character_name
        ORDER BY count DESC
        LIMIT 10
      `;
      
      const topCharactersResult = await databaseService.query(topCharactersQuery, params);
      
      // 获取每日标注统计（最近30天）
      const dailyStatsQuery = `
        SELECT 
          DATE(a.annotation_time) as date,
          COUNT(a.id) as count
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.annotation_time > NOW() - INTERVAL '30 days' ${privacyFilter}
        GROUP BY DATE(a.annotation_time)
        ORDER BY date DESC
      `;
      
      const dailyStatsResult = await databaseService.query(dailyStatsQuery, params);
      
      res.json({
        overview: {
          totalAnnotations: parseInt(stats.total_annotations),
          uniqueCharacters: parseInt(stats.unique_characters),
          annotatedWorks: parseInt(stats.annotated_works),
          annotatorsCount: parseInt(stats.annotators_count),
          avgAnnotationSize: parseFloat(stats.avg_annotation_size) || 0
        },
        topAnnotators: topAnnotatorsResult.rows.map(row => ({
          username: row.username,
          count: parseInt(row.annotation_count)
        })),
        topCharacters: topCharactersResult.rows.map(row => ({
          character: row.character_name,
          count: parseInt(row.count)
        })),
        dailyStats: dailyStatsResult.rows.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        }))
      });
    } catch (error) {
      logger.error('获取标注统计失败:', error);
      res.status(500).json({ error: '获取标注统计失败' });
    }
  }
  
  /**
   * 获取标注数量
   */
  async getAnnotationCount(req, res) {
    try {
      const { work_id, character, user_id } = req.query;
      const currentUserId = req.user?.userId;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 隐私过滤
      if (!currentUserId) {
        whereClause += ` AND w.privacy = 'public'`;
      } else {
        whereClause += ` AND (w.privacy = 'public' OR w.user_id = $${paramIndex})`;
        params.push(currentUserId);
        paramIndex++;
      }
      
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
      
      res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
      logger.error('获取标注数量失败:', error);
      res.status(500).json({ error: '获取标注数量失败' });
    }
  }
  
  /**
   * 按字符名搜索标注
   */
  async searchAnnotationsByCharacter(req, res) {
    try {
      const { characterName } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user?.userId;
      
      if (!characterName) {
        return res.status(400).json({ error: '请提供字符名称' });
      }
      
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [characterName, limit, (page - 1) * limit];
      
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $4)";
        params.push(userId);
      }
      
      const query = `
        SELECT a.*, w.filename as work_filename, w.original_filename,
               u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.character_name = $1 ${privacyFilter}
        ORDER BY a.annotation_time DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await databaseService.query(query, params.slice(0, userId ? 4 : 3));
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) 
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.character_name = $1 ${privacyFilter}
      `;
      const countParams = userId ? [characterName, userId] : [characterName];
      const countResult = await databaseService.query(countQuery, countParams);
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
        imageUrl: `/images/${annotation.work_filename}`,
        croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
      }));
      
      res.json({
        character: characterName,
        annotations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      logger.error('按字符搜索标注失败:', error);
      res.status(500).json({ error: '搜索失败' });
    }
  }
  
  /**
   * 高级搜索标注
   */
  async advancedSearchAnnotations(req, res) {
    try {
      const {
        q,
        work_id,
        user_id,
        min_width,
        max_width,
        min_height,
        max_height,
        verified,
        perspective_correction,
        date_from,
        date_to,
        page = 1,
        limit = 20,
        sort = 'newest'
      } = req.query;
      
      const currentUserId = req.user?.userId;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 隐私过滤
      if (!currentUserId) {
        whereClause += ` AND w.privacy = 'public'`;
      } else {
        whereClause += ` AND (w.privacy = 'public' OR w.user_id = $${paramIndex})`;
        params.push(currentUserId);
        paramIndex++;
      }
      
      // 文本搜索
      if (q) {
        whereClause += ` AND a.character_name ILIKE $${paramIndex}`;
        params.push(`%${q}%`);
        paramIndex++;
      }
      
      // 作品ID过滤
      if (work_id) {
        whereClause += ` AND a.work_id = $${paramIndex}`;
        params.push(work_id);
        paramIndex++;
      }
      
      // 用户ID过滤
      if (user_id) {
        whereClause += ` AND a.user_id = $${paramIndex}`;
        params.push(user_id);
        paramIndex++;
      }
      
      // 尺寸过滤
      if (min_width) {
        whereClause += ` AND a.width >= $${paramIndex}`;
        params.push(parseInt(min_width));
        paramIndex++;
      }
      
      if (max_width) {
        whereClause += ` AND a.width <= $${paramIndex}`;
        params.push(parseInt(max_width));
        paramIndex++;
      }
      
      if (min_height) {
        whereClause += ` AND a.height >= $${paramIndex}`;
        params.push(parseInt(min_height));
        paramIndex++;
      }
      
      if (max_height) {
        whereClause += ` AND a.height <= $${paramIndex}`;
        params.push(parseInt(max_height));
        paramIndex++;
      }
      
      // 验证状态过滤
      if (verified !== undefined) {
        whereClause += ` AND a.verified = $${paramIndex}`;
        params.push(verified === 'true');
        paramIndex++;
      }
      
      // 透视校正过滤
      if (perspective_correction !== undefined) {
        whereClause += ` AND a.perspective_correction = $${paramIndex}`;
        params.push(perspective_correction === 'true');
        paramIndex++;
      }
      
      // 日期范围过滤
      if (date_from) {
        whereClause += ` AND a.annotation_time >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
      }
      
      if (date_to) {
        whereClause += ` AND a.annotation_time <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
      }
      
      // 排序
      let orderClause = 'ORDER BY a.annotation_time DESC';
      if (sort === 'oldest') {
        orderClause = 'ORDER BY a.annotation_time ASC';
      } else if (sort === 'character') {
        orderClause = 'ORDER BY a.character_name ASC, a.annotation_time DESC';
      } else if (sort === 'size') {
        orderClause = 'ORDER BY (a.width * a.height) DESC, a.annotation_time DESC';
      }
      
      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);
      
      const query = `
        SELECT a.*, w.filename as work_filename, w.original_filename,
               u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;
      
      const result = await databaseService.query(query, params);
      
      // 获取总数
      const countQuery = `
        SELECT COUNT(*) 
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        ${whereClause}
      `;
      const countResult = await databaseService.query(countQuery, params.slice(0, -2));
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
        imageUrl: `/images/${annotation.work_filename}`,
        croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
      }));
      
      res.json({
        annotations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        },
        searchParams: {
          q, work_id, user_id, min_width, max_width, min_height, max_height,
          verified, perspective_correction, date_from, date_to, sort
        }
      });
    } catch (error) {
      logger.error('高级搜索标注失败:', error);
      res.status(500).json({ error: '搜索失败' });
    }
  }
  
  /**
   * 获取用户的标注
   */
  async getUserAnnotations(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user?.userId;
      
      // 隐私过滤
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [userId, limit, (page - 1) * limit];
      
      if (currentUserId && parseInt(currentUserId) === parseInt(userId)) {
        // 用户查看自己的标注，可以看到所有隐私级别
        privacyFilter = '';
      } else if (currentUserId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $4)";
        params.push(currentUserId);
      }
      
      const query = `
        SELECT a.*, w.filename as work_filename, w.original_filename,
               u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.user_id = $1 ${privacyFilter}
        ORDER BY a.annotation_time DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await databaseService.query(query, params.slice(0, currentUserId && parseInt(currentUserId) !== parseInt(userId) ? 4 : 3));
      
      const countQuery = `
        SELECT COUNT(*) 
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.user_id = $1 ${privacyFilter}
      `;
      const countParams = currentUserId && parseInt(currentUserId) !== parseInt(userId) ? [userId, currentUserId] : [userId];
      const countResult = await databaseService.query(countQuery, countParams);
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
        imageUrl: `/images/${annotation.work_filename}`,
        croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
      }));
      
      res.json({
        annotations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      logger.error('获取用户标注失败:', error);
      res.status(500).json({ error: '获取用户标注失败' });
    }
  }
  
  /**
   * 获取我的标注
   */
  async getMyAnnotations(req, res) {
    req.params.userId = req.user.userId;
    return this.getUserAnnotations(req, res);
  }
  
  /**
   * 获取单个标注详情
   */
  async getAnnotationById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      const result = await databaseService.query(
        `SELECT a.*, w.filename as work_filename, w.original_filename, w.privacy, w.user_id as work_user_id,
                u.username as annotator_name
         FROM annotations a
         JOIN works w ON a.work_id = w.id
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '标注不存在' });
      }
      
      const annotation = result.rows[0];
      
      // 检查隐私权限
      if (annotation.privacy === 'private' && (!userId || annotation.work_user_id !== userId)) {
        return res.status(403).json({ error: '无权访问此标注' });
      }
      
      res.json({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
        imageUrl: `/images/${annotation.work_filename}`,
        croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
      });
    } catch (error) {
      logger.error('获取标注详情失败:', error);
      res.status(500).json({ error: '获取标注详情失败' });
    }
  }
  
  /**
   * 更新标注
   */
  async updateAnnotation(req, res) {
    try {
      const { id } = req.params;
      const {
        character_name,
        position_x,
        position_y,
        width,
        height,
        four_points,
        perspective_correction
      } = req.body;
      
      // 输入验证
      const validation = validateInput({
        character_name,
        position_x,
        position_y,
        width,
        height
      }, {
        character_name: { type: 'string', minLength: 1, maxLength: 10 },
        position_x: { type: 'number', min: 0 },
        position_y: { type: 'number', min: 0 },
        width: { type: 'number', min: 1 },
        height: { type: 'number', min: 1 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      // 处理四点坐标
      let fourPointsData = null;
      if (four_points && Array.isArray(four_points) && four_points.length === 4) {
        fourPointsData = JSON.stringify(four_points);
      }
      
      const result = await databaseService.query(
        `UPDATE annotations 
         SET character_name = COALESCE($1, character_name),
             position_x = COALESCE($2, position_x),
             position_y = COALESCE($3, position_y),
             width = COALESCE($4, width),
             height = COALESCE($5, height),
             four_points = COALESCE($6, four_points),
             perspective_correction = COALESCE($7, perspective_correction),
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [character_name, position_x, position_y, width, height, fourPointsData, perspective_correction, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '标注不存在' });
      }
      
      const annotation = result.rows[0];
      
      logger.info(`标注更新成功 - ID: ${id} by ${req.user.username}`);
      
      res.json({
        message: '标注更新成功',
        annotation: {
          ...annotation,
          four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null
        }
      });
    } catch (error) {
      logger.error('更新标注失败:', error);
      res.status(500).json({ error: '更新标注失败' });
    }
  }
  
  /**
   * 删除标注
   */
  async deleteAnnotation(req, res) {
    try {
      const { id } = req.params;
      
      // 获取标注信息
      const annotationResult = await databaseService.query(
        'SELECT * FROM annotations WHERE id = $1',
        [id]
      );
      
      if (annotationResult.rows.length === 0) {
        return res.status(404).json({ error: '标注不存在' });
      }
      
      const annotation = annotationResult.rows[0];
      
      // 删除标注
      await databaseService.query('DELETE FROM annotations WHERE id = $1', [id]);
      
      // 删除裁剪的字符图片
      const croppedImagePath = path.join(__dirname, '../../楷书库/cropped', `${annotation.character_name}_${annotation.id}.jpg`);
      if (fs.existsSync(croppedImagePath)) {
        try {
          fs.unlinkSync(croppedImagePath);
          logger.info(`裁剪图片删除成功: ${annotation.character_name}_${annotation.id}.jpg`);
        } catch (error) {
          logger.error('删除裁剪图片失败:', error);
        }
      }
      
      logger.info(`标注删除成功 - ID: ${id}, 字符: ${annotation.character_name} by ${req.user.username}`);
      
      res.json({ message: '标注删除成功' });
    } catch (error) {
      logger.error('删除标注失败:', error);
      res.status(500).json({ error: '删除标注失败' });
    }
  }
  
  /**
   * 批量删除标注
   */
  async batchDeleteAnnotations(req, res) {
    try {
      const { ids } = req.body;
      const userId = req.user.userId;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: '请提供要删除的标注ID数组' });
      }
      
      if (ids.length > 100) {
        return res.status(400).json({ error: '批量删除数量不能超过100个' });
      }
      
      // 检查权限
      const checkQuery = `
        SELECT a.id, a.character_name, a.user_id, w.user_id as work_user_id
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.id = ANY($1)
      `;
      
      const checkResult = await databaseService.query(checkQuery, [ids]);
      
      // 过滤出用户有权限删除的标注
      const allowedIds = checkResult.rows
        .filter(row => row.user_id === userId || row.work_user_id === userId || req.user.isAdmin)
        .map(row => row.id);
      
      if (allowedIds.length === 0) {
        return res.status(403).json({ error: '没有权限删除任何标注' });
      }
      
      // 批量删除
      const deleteResult = await databaseService.query(
        'DELETE FROM annotations WHERE id = ANY($1) RETURNING *',
        [allowedIds]
      );
      
      // 删除对应的裁剪图片
      deleteResult.rows.forEach(annotation => {
        const croppedImagePath = path.join(__dirname, '../../楷书库/cropped', `${annotation.character_name}_${annotation.id}.jpg`);
        if (fs.existsSync(croppedImagePath)) {
          try {
            fs.unlinkSync(croppedImagePath);
          } catch (error) {
            logger.error('删除裁剪图片失败:', error);
          }
        }
      });
      
      logger.info(`批量删除标注成功 - 删除数量: ${deleteResult.rowCount} by ${req.user.username}`);
      
      res.json({
        message: `批量删除成功，共删除 ${deleteResult.rowCount} 个标注`,
        deletedCount: deleteResult.rowCount,
        requestedCount: ids.length,
        allowedCount: allowedIds.length
      });
    } catch (error) {
      logger.error('批量删除标注失败:', error);
      res.status(500).json({ error: '批量删除失败' });
    }
  }
  
  /**
   * 验证标注（管理员功能）
   */
  async verifyAnnotation(req, res) {
    try {
      const { id } = req.params;
      const { verified, verification_note } = req.body;
      
      if (typeof verified !== 'boolean') {
        return res.status(400).json({ error: '验证状态必须是布尔值' });
      }
      
      await databaseService.query(
        `UPDATE annotations 
         SET verified = $1, verification_note = $2, verified_by = $3, verified_at = NOW()
         WHERE id = $4`,
        [verified, verification_note || null, req.user.userId, id]
      );
      
      logger.info(`标注验证 - ID: ${id}, 状态: ${verified} by ${req.user.username}`);
      
      res.json({ message: '标注验证状态更新成功' });
    } catch (error) {
      logger.error('验证标注失败:', error);
      res.status(500).json({ error: '验证标注失败' });
    }
  }
  
  /**
   * 标注质量评分
   */
  async rateAnnotation(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.userId;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: '评分必须在1-5之间' });
      }
      
      // 检查是否已经评分过
      const existingResult = await databaseService.query(
        'SELECT id FROM annotation_ratings WHERE annotation_id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (existingResult.rows.length > 0) {
        // 更新评分
        await databaseService.query(
          'UPDATE annotation_ratings SET rating = $1, comment = $2, updated_at = NOW() WHERE annotation_id = $3 AND user_id = $4',
          [rating, comment || null, id, userId]
        );
      } else {
        // 创建新评分
        await databaseService.query(
          'INSERT INTO annotation_ratings (annotation_id, user_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [id, userId, rating, comment || null]
        );
      }
      
      logger.info(`标注评分 - ID: ${id}, 评分: ${rating} by ${req.user.username}`);
      
      res.json({ message: '评分提交成功' });
    } catch (error) {
      logger.error('标注评分失败:', error);
      res.status(500).json({ error: '评分失败' });
    }
  }
  
  /**
   * 获取标注的评分
   */
  async getAnnotationRatings(req, res) {
    try {
      const { id } = req.params;
      
      const result = await databaseService.query(
        `SELECT ar.*, u.username
         FROM annotation_ratings ar
         LEFT JOIN users u ON ar.user_id = u.id
         WHERE ar.annotation_id = $1
         ORDER BY ar.created_at DESC`,
        [id]
      );
      
      // 计算平均评分
      const avgResult = await databaseService.query(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as rating_count FROM annotation_ratings WHERE annotation_id = $1',
        [id]
      );
      
      const avgRating = parseFloat(avgResult.rows[0].avg_rating) || 0;
      const ratingCount = parseInt(avgResult.rows[0].rating_count);
      
      res.json({
        ratings: result.rows,
        summary: {
          averageRating: Math.round(avgRating * 10) / 10,
          totalRatings: ratingCount
        }
      });
    } catch (error) {
      logger.error('获取标注评分失败:', error);
      res.status(500).json({ error: '获取评分失败' });
    }
  }
  
  /**
   * 导出标注数据
   */
  async exportAnnotations(req, res) {
    try {
      const { format = 'json', work_id, character, user_id } = req.query;
      const currentUserId = req.user.userId;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 只导出用户有权限查看的标注
      if (!req.user.isAdmin) {
        whereClause += ` AND (w.privacy = 'public' OR w.user_id = $${paramIndex} OR a.user_id = $${paramIndex})`;
        params.push(currentUserId);
        paramIndex++;
      }
      
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
        SELECT a.*, w.filename as work_filename, w.original_filename,
               u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.annotation_time DESC
      `;
      
      const result = await databaseService.query(query, params);
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null
      }));
      
      if (format === 'csv') {
        // 生成CSV格式
        const csvHeader = 'id,work_id,character_name,position_x,position_y,width,height,perspective_correction,annotation_time,annotator_name,work_filename\n';
        const csvRows = annotations.map(a => 
          `${a.id},${a.work_id},"${a.character_name}",${a.position_x},${a.position_y},${a.width},${a.height},${a.perspective_correction},"${a.annotation_time}","${a.annotator_name || ''}","${a.work_filename}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="annotations.csv"');
        res.send(csvHeader + csvRows);
      } else {
        // 默认JSON格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="annotations.json"');
        res.json({
          exportTime: new Date().toISOString(),
          totalCount: annotations.length,
          annotations
        });
      }
      
      logger.info(`标注数据导出 - 格式: ${format}, 数量: ${annotations.length} by ${req.user.username}`);
    } catch (error) {
      logger.error('导出标注数据失败:', error);
      res.status(500).json({ error: '导出失败' });
    }
  }
  
  /**
   * 获取字符统计
   */
  async getCharacterStats(req, res) {
    try {
      const { limit = 50 } = req.query;
      const userId = req.user?.userId;
      
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [limit];
      
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $2)";
        params.push(userId);
      }
      
      const query = `
        SELECT 
          a.character_name,
          COUNT(a.id) as annotation_count,
          COUNT(DISTINCT a.work_id) as work_count,
          COUNT(DISTINCT a.user_id) as annotator_count,
          AVG(a.width * a.height) as avg_size,
          MIN(a.annotation_time) as first_annotation,
          MAX(a.annotation_time) as last_annotation
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE 1=1 ${privacyFilter}
        GROUP BY a.character_name
        ORDER BY annotation_count DESC
        LIMIT $1
      `;
      
      const result = await databaseService.query(query, params);
      
      const characters = result.rows.map(row => ({
        character: row.character_name,
        annotationCount: parseInt(row.annotation_count),
        workCount: parseInt(row.work_count),
        annotatorCount: parseInt(row.annotator_count),
        averageSize: parseFloat(row.avg_size) || 0,
        firstAnnotation: row.first_annotation,
        lastAnnotation: row.last_annotation,
        // 添加拼音信息
        pinyin: pinyin(row.character_name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      }));
      
      res.json({ characters });
    } catch (error) {
      logger.error('获取字符统计失败:', error);
      res.status(500).json({ error: '获取字符统计失败' });
    }
  }
  
  /**
   * 获取热门字符
   */
  async getTrendingCharacters(req, res) {
    try {
      const { limit = 20, days = 30 } = req.query;
      const userId = req.user?.userId;
      
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [days, limit];
      
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $3)";
        params.push(userId);
      }
      
      const query = `
        SELECT 
          a.character_name,
          COUNT(a.id) as recent_count,
          COUNT(DISTINCT a.user_id) as recent_annotators
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.annotation_time > NOW() - INTERVAL '$1 days' ${privacyFilter}
        GROUP BY a.character_name
        HAVING COUNT(a.id) > 1
        ORDER BY recent_count DESC, recent_annotators DESC
        LIMIT $2
      `;
      
      const result = await databaseService.query(query, params);
      
      const trendingCharacters = result.rows.map(row => ({
        character: row.character_name,
        recentCount: parseInt(row.recent_count),
        recentAnnotators: parseInt(row.recent_annotators),
        pinyin: pinyin(row.character_name, { style: pinyin.STYLE_NORMAL }).flat().join('')
      }));
      
      res.json({ 
        trendingCharacters,
        period: `${days} days`
      });
    } catch (error) {
      logger.error('获取热门字符失败:', error);
      res.status(500).json({ error: '获取热门字符失败' });
    }
  }
  
  /**
   * 获取字符详情
   */
  async getCharacterDetails(req, res) {
    try {
      const { character } = req.params;
      const userId = req.user?.userId;
      
      if (!character) {
        return res.status(400).json({ error: '请提供字符' });
      }
      
      let privacyFilter = "AND w.privacy = 'public'";
      const params = [character];
      
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $2)";
        params.push(userId);
      }
      
      // 获取字符基本统计
      const statsQuery = `
        SELECT 
          COUNT(a.id) as total_annotations,
          COUNT(DISTINCT a.work_id) as work_count,
          COUNT(DISTINCT a.user_id) as annotator_count,
          AVG(a.width) as avg_width,
          AVG(a.height) as avg_height,
          MIN(a.annotation_time) as first_annotation,
          MAX(a.annotation_time) as last_annotation
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.character_name = $1 ${privacyFilter}
      `;
      
      const statsResult = await databaseService.query(statsQuery, params);
      const stats = statsResult.rows[0];
      
      // 获取最近的标注
      const recentQuery = `
        SELECT a.*, w.filename as work_filename, u.username as annotator_name
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.character_name = $1 ${privacyFilter}
        ORDER BY a.annotation_time DESC
        LIMIT 10
      `;
      
      const recentResult = await databaseService.query(recentQuery, params);
      
      // 获取标注者排行
      const annotatorsQuery = `
        SELECT u.username, COUNT(a.id) as count
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.character_name = $1 ${privacyFilter}
        GROUP BY u.id, u.username
        ORDER BY count DESC
        LIMIT 5
      `;
      
      const annotatorsResult = await databaseService.query(annotatorsQuery, params);
      
      res.json({
        character,
        pinyin: pinyin(character, { style: pinyin.STYLE_NORMAL }).flat().join(''),
        stats: {
          totalAnnotations: parseInt(stats.total_annotations),
          workCount: parseInt(stats.work_count),
          annotatorCount: parseInt(stats.annotator_count),
          averageWidth: parseFloat(stats.avg_width) || 0,
          averageHeight: parseFloat(stats.avg_height) || 0,
          firstAnnotation: stats.first_annotation,
          lastAnnotation: stats.last_annotation
        },
        recentAnnotations: recentResult.rows.map(annotation => ({
          ...annotation,
          four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null,
          imageUrl: `/images/${annotation.work_filename}`,
          croppedImageUrl: `/images/cropped/${annotation.character_name}_${annotation.id}.jpg`
        })),
        topAnnotators: annotatorsResult.rows.map(row => ({
          username: row.username,
          count: parseInt(row.count)
        }))
      });
    } catch (error) {
      logger.error('获取字符详情失败:', error);
      res.status(500).json({ error: '获取字符详情失败' });
    }
  }
  
  /**
   * 获取相似字符
   */
  async getSimilarCharacters(req, res) {
    try {
      const { character } = req.params;
      const { limit = 10 } = req.query;
      
      if (!character) {
        return res.status(400).json({ error: '请提供字符' });
      }
      
      // 这里可以实现更复杂的相似字符算法
      // 目前简单基于拼音相似性
      const targetPinyin = pinyin(character, { style: pinyin.STYLE_NORMAL }).flat();
      
      const query = `
        SELECT 
          a.character_name,
          COUNT(a.id) as annotation_count
        FROM annotations a
        JOIN works w ON a.work_id = w.id
        WHERE a.character_name != $1 AND w.privacy = 'public'
        GROUP BY a.character_name
        ORDER BY annotation_count DESC
        LIMIT $2
      `;
      
      const result = await databaseService.query(query, [character, limit]);
      
      const similarCharacters = result.rows
        .map(row => {
          const charPinyin = pinyin(row.character_name, { style: pinyin.STYLE_NORMAL }).flat();
          const similarity = this.calculatePinyinSimilarity(targetPinyin, charPinyin);
          
          return {
            character: row.character_name,
            annotationCount: parseInt(row.annotation_count),
            pinyin: charPinyin.join(''),
            similarity
          };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
      
      res.json({
        character,
        similarCharacters
      });
    } catch (error) {
      logger.error('获取相似字符失败:', error);
      res.status(500).json({ error: '获取相似字符失败' });
    }
  }
  
  /**
   * 获取标注历史记录
   */
  async getAnnotationHistory(req, res) {
    try {
      const { id } = req.params;
      
      // 获取标注的修改历史（如果有历史表的话）
      // 目前返回基本信息
      const result = await databaseService.query(
        'SELECT * FROM annotations WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '标注不存在' });
      }
      
      res.json({
        message: '历史记录功能待实现',
        annotation: result.rows[0]
      });
    } catch (error) {
      logger.error('获取标注历史失败:', error);
      res.status(500).json({ error: '获取历史记录失败' });
    }
  }
  
  /**
   * 恢复已删除的标注
   */
  async restoreAnnotation(req, res) {
    try {
      const { id } = req.params;
      
      // 恢复功能需要软删除机制支持
      res.status(501).json({ error: '恢复功能待实现' });
    } catch (error) {
      logger.error('恢复标注失败:', error);
      res.status(500).json({ error: '恢复标注失败' });
    }
  }
  
  /**
   * 裁剪字符图片
   */
  async cropCharacterImage(filename, annotation) {
    try {
      const imagePath = path.join(__dirname, '../../楷书库', filename);
      const croppedDir = path.join(__dirname, '../../楷书库/cropped');
      
      // 确保裁剪目录存在
      if (!fs.existsSync(croppedDir)) {
        fs.mkdirSync(croppedDir, { recursive: true });
      }
      
      const outputPath = path.join(croppedDir, `${annotation.character_name}_${annotation.id}.jpg`);
      
      if (annotation.four_points && annotation.perspective_correction) {
        // 透视校正裁剪
        await this.perspectiveCrop(imagePath, outputPath, JSON.parse(annotation.four_points));
      } else {
        // 普通矩形裁剪
        await sharp(imagePath)
          .extract({
            left: Math.round(annotation.position_x),
            top: Math.round(annotation.position_y),
            width: Math.round(annotation.width),
            height: Math.round(annotation.height)
          })
          .jpeg({ quality: 90 })
          .toFile(outputPath);
      }
      
      logger.info(`字符图片裁剪成功: ${annotation.character_name}_${annotation.id}.jpg`);
    } catch (error) {
      logger.error('裁剪字符图片失败:', error);
      throw error;
    }
  }
  
  /**
   * 透视校正裁剪
   */
  async perspectiveCrop(inputPath, outputPath, fourPoints) {
    // 简化的透视校正实现
    // 实际项目中可能需要更复杂的图像处理库
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // 计算边界框
      const minX = Math.min(...fourPoints.map(p => p.x));
      const maxX = Math.max(...fourPoints.map(p => p.x));
      const minY = Math.min(...fourPoints.map(p => p.y));
      const maxY = Math.max(...fourPoints.map(p => p.y));
      
      // 使用边界框进行裁剪（简化版本）
      await image
        .extract({
          left: Math.max(0, Math.round(minX)),
          top: Math.max(0, Math.round(minY)),
          width: Math.min(metadata.width - Math.round(minX), Math.round(maxX - minX)),
          height: Math.min(metadata.height - Math.round(minY), Math.round(maxY - minY))
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);
    } catch (error) {
      logger.error('透视校正裁剪失败:', error);
      throw error;
    }
  }
  
  /**
   * 计算拼音相似度
   */
  calculatePinyinSimilarity(pinyin1, pinyin2) {
    if (!pinyin1.length || !pinyin2.length) return 0;
    
    let matches = 0;
    const maxLength = Math.max(pinyin1.length, pinyin2.length);
    
    for (let i = 0; i < Math.min(pinyin1.length, pinyin2.length); i++) {
      if (pinyin1[i] === pinyin2[i]) {
        matches++;
      }
    }
    
    return matches / maxLength;
  }
}

module.exports = new AnnotationsController();