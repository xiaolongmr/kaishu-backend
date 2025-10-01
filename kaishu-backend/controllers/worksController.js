/**
 * 作品管理控制器
 * 处理作品相关的业务逻辑
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { databaseService } = require('../services/databaseService');
const storageManager = require('../services/storageManager');
const { validateInput, commonRules } = require('../utils/validators');
const { processWorkObject } = require('../utils/jsonUtils');
const logger = require('../utils/logger');

class WorksController {
  /**
   * 上传作品
   */
  async uploadWork(req, res) {
    try {
      const { description, work_author, tags, group_name, privacy = 'public' } = req.body;
      const userId = req.user.userId;
      
      if (!req.file) {
        return res.status(400).json({ error: '请选择要上传的文件' });
      }

      // 输入验证
      const validation = validateInput({ description, work_author, group_name, privacy }, {
        description: { type: 'string', maxLength: 500 },
        work_author: { type: 'string', maxLength: 100 },
        group_name: { type: 'string', maxLength: 50 },
        privacy: { type: 'string', pattern: /^(public|private|unlisted)$/, patternMessage: '隐私设置必须是 public、private 或 unlisted' }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }

      const filename = req.file.filename;
      // 使用路由中预处理的原始文件名，确保中文字符正确显示
      const originalFilename = req.originalFilenames?.[req.file.fieldname] || 
                              Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const filePath = req.file.path;
      
      // 处理标签
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
          if (!Array.isArray(parsedTags)) {
            parsedTags = [];
          }
        } catch (error) {
          logger.warn('标签解析失败:', error);
        }
      }

      // 图片处理和优化
      let processedImageInfo = null;
      try {
        processedImageInfo = await this.processImage(filePath);
      } catch (error) {
        logger.error('图片处理失败:', error);
        // 继续使用原图
      }

      // 云存储上传
      let cloudUrls = {};
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const uploadResult = await storageManager.uploadFile(fileBuffer, filename, filePath);
        cloudUrls = uploadResult;
        logger.info(`文件上传成功: ${filename}`, uploadResult);
      } catch (error) {
        logger.error('云存储上传失败:', error);
        // 继续使用本地存储
      }

      // 保存到数据库
      const result = await databaseService.query(
        `INSERT INTO works (filename, original_filename, description, work_author, tags, group_name, privacy, cloud_urls, image_info, upload_time, user_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10) 
         RETURNING id, filename, original_filename, description, work_author, tags, group_name, privacy, upload_time`,
        [filename, originalFilename, description || null, work_author || null, JSON.stringify(parsedTags), group_name || null, privacy, JSON.stringify(cloudUrls), JSON.stringify(processedImageInfo), userId]
      );

      const work = result.rows[0];
      
      logger.info(`作品上传成功 - ${originalFilename} by ${req.user.username}`);
      
      res.status(201).json({
        message: '作品上传成功',
        work: {
          ...work,
          tags: parsedTags,
          imageUrl: `/images/${filename}`,
          cloudUrls,
          imageInfo: processedImageInfo
        }
      });
    } catch (error) {
      logger.error('上传作品失败:', error);
      
      // 清理上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          logger.error('清理文件失败:', cleanupError);
        }
      }
      
      res.status(500).json({ error: '上传失败，请稍后重试' });
    }
  }

  /**
   * 批量上传作品
   */
  async batchUploadWorks(req, res) {
    try {
      const { description, work_author, tags, group_name, privacy = 'public' } = req.body;
      const userId = req.user.userId;
      
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: '请选择要上传的文件' });
      }

      const results = [];
      const errors = [];

      for (const file of req.files) {
        try {
          // 为每个文件创建单独的上传记录
          const filename = file.filename;
          // 使用路由中预处理的原始文件名，确保中文字符正确显示
          const originalFilename = req.originalFilenames?.[file.fieldname] || 
                                  Buffer.from(file.originalname, 'latin1').toString('utf8');
          
          // 处理标签
          let parsedTags = [];
          if (tags) {
            try {
              parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch (error) {
              logger.warn('标签解析失败:', error);
            }
          }

          // 保存到数据库
          const result = await databaseService.query(
            `INSERT INTO works (filename, original_filename, description, work_author, tags, group_name, privacy, upload_time, user_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8) 
             RETURNING id, filename, original_filename`,
            [filename, originalFilename, description || null, work_author || null, JSON.stringify(parsedTags), group_name || null, privacy, userId]
          );

          results.push({
            success: true,
            work: result.rows[0],
            originalName: originalFilename
          });
        } catch (error) {
          logger.error(`批量上传单个文件失败 - ${file.originalname}:`, error);
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      logger.info(`批量上传完成 - 成功: ${results.length}, 失败: ${errors.length}`);
      
      res.json({
        message: `批量上传完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
        results,
        errors
      });
    } catch (error) {
      logger.error('批量上传失败:', error);
      res.status(500).json({ error: '批量上传失败' });
    }
  }

  /**
   * 获取作品列表
   */
  async getWorks(req, res) {
    try {
      const { page = 1, limit = 20, author, group, privacy, sort = 'newest' } = req.query;
      const userId = req.user?.userId;
      
      // 构建查询条件
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 隐私过滤
      if (!userId) {
        // 未登录用户只能看公开作品
        whereClause += ` AND privacy = 'public'`;
      } else {
        // 登录用户可以看公开作品和自己的私有作品
        whereClause += ` AND (privacy = 'public' OR user_id = $${paramIndex})`;
        params.push(userId);
        paramIndex++;
      }
      
      if (author) {
        whereClause += ` AND work_author ILIKE $${paramIndex}`;
        params.push(`%${author}%`);
        paramIndex++;
      }
      
      if (group) {
        whereClause += ` AND group_name = $${paramIndex}`;
        params.push(group);
        paramIndex++;
      }
      
      if (privacy && userId) {
        whereClause += ` AND privacy = $${paramIndex}`;
        params.push(privacy);
        paramIndex++;
      }
      
      // 排序
      let orderClause = 'ORDER BY upload_time DESC';
      if (sort === 'oldest') {
        orderClause = 'ORDER BY upload_time ASC';
      } else if (sort === 'name') {
        orderClause = 'ORDER BY original_filename ASC';
      } else if (sort === 'author') {
        orderClause = 'ORDER BY work_author ASC, upload_time DESC';
      }
      
      // 分页
      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        ${whereClause}
        ${orderClause}
        ${limitClause}
      `;
      
      const result = await databaseService.query(query, params);
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM works w ${whereClause}`;
      const countResult = await databaseService.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult.rows[0].count);
      
      const works = result.rows.map(work => processWorkObject(work));
      
      res.json({
        works,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取作品列表失败:', error);
      res.status(500).json({ 
        error: '获取作品列表失败',
        details: error.message,
        code: error.code
      });
    }
  }

  /**
   * 获取用户的作品
   */
  async getUserWorks(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user?.userId;
      
      // 构建隐私过滤条件
      let privacyFilter = "AND privacy = 'public'";
      if (currentUserId && parseInt(currentUserId) === parseInt(userId)) {
        // 用户查看自己的作品，可以看到所有隐私级别
        privacyFilter = '';
      }
      
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        WHERE w.user_id = $1 ${privacyFilter}
        ORDER BY w.upload_time DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await databaseService.query(query, [userId, limit, offset]);
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM works WHERE user_id = $1 ${privacyFilter}`;
      const countResult = await databaseService.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].count);
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`
      }));
      
      res.json({
        works,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('获取用户作品失败:', error);
      res.status(500).json({ error: '获取用户作品失败' });
    }
  }

  /**
   * 获取我的作品
   */
  async getMyWorks(req, res) {
    req.params.userId = req.user.userId;
    return this.getUserWorks(req, res);
  }

  /**
   * 获取单个作品详情
   */
  async getWorkById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      const result = await databaseService.query(
        `SELECT w.*, u.username as uploader_name
         FROM works w
         LEFT JOIN users u ON w.user_id = u.id
         WHERE w.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = result.rows[0];
      
      // 检查隐私权限
      if (work.privacy === 'private' && (!userId || work.user_id !== userId)) {
        return res.status(403).json({ error: '无权访问此作品' });
      }
      
      // 获取标注数量
      const annotationResult = await databaseService.query(
        'SELECT COUNT(*) FROM annotations WHERE work_id = $1',
        [id]
      );
      
      res.json({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`,
        cloudUrls: work.cloud_urls ? JSON.parse(work.cloud_urls) : null,
        annotationCount: parseInt(annotationResult.rows[0].count)
      });
    } catch (error) {
      logger.error('获取作品详情失败:', error);
      res.status(500).json({ error: '获取作品详情失败' });
    }
  }

  /**
   * 更新作品信息
   */
  async updateWork(req, res) {
    try {
      const { id } = req.params;
      const { description, work_author, tags, group_name, privacy } = req.body;
      
      // 输入验证
      const validation = validateInput({ description, work_author, group_name, privacy }, {
        description: { type: 'string', maxLength: 500 },
        work_author: { type: 'string', maxLength: 100 },
        group_name: { type: 'string', maxLength: 50 },
        privacy: { type: 'string', pattern: /^(public|private|unlisted)$/, patternMessage: '隐私设置必须是 public、private 或 unlisted' }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      // 处理标签
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
          return res.status(400).json({ error: '标签格式错误' });
        }
      }
      
      const result = await databaseService.query(
        `UPDATE works 
         SET description = $1, work_author = $2, tags = $3, group_name = $4, privacy = $5, updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
        [description, work_author, JSON.stringify(parsedTags), group_name, privacy, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = result.rows[0];
      
      logger.info(`作品更新成功 - ID: ${id} by ${req.user.username}`);
      
      res.json({
        message: '作品更新成功',
        work: {
          ...work,
          tags: parsedTags,
          imageUrl: `/images/${work.filename}`
        }
      });
    } catch (error) {
      logger.error('更新作品失败:', error);
      res.status(500).json({ error: '更新作品失败' });
    }
  }

  /**
   * 删除作品
   */
  async deleteWork(req, res) {
    try {
      const { id } = req.params;
      
      // 获取作品信息
      const workResult = await databaseService.query(
        'SELECT * FROM works WHERE id = $1',
        [id]
      );
      
      if (workResult.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = workResult.rows[0];
      
      // 使用事务删除作品和相关数据
      await databaseService.transaction(async (client) => {
        // 删除相关标注
        await client.query('DELETE FROM annotations WHERE work_id = $1', [id]);
        
        // 删除作品记录
        await client.query('DELETE FROM works WHERE id = $1', [id]);
      });
      
      // 删除本地文件
      const filePath = path.join(__dirname, '../../楷书库', work.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.info(`本地文件删除成功: ${work.filename}`);
        } catch (error) {
          logger.error('删除本地文件失败:', error);
        }
      }
      
      // 删除云存储文件
      if (work.cloud_urls) {
        try {
          const cloudUrls = JSON.parse(work.cloud_urls);
          await storageManager.deleteFile(cloudUrls);
          logger.info(`云存储文件删除成功: ${work.filename}`);
        } catch (error) {
          logger.error('删除云存储文件失败:', error);
        }
      }
      
      logger.info(`作品删除成功 - ID: ${id}, 文件: ${work.filename} by ${req.user.username}`);
      
      res.json({ message: '作品删除成功' });
    } catch (error) {
      logger.error('删除作品失败:', error);
      res.status(500).json({ error: '删除作品失败' });
    }
  }

  /**
   * 获取作品的标注
   */
  async getWorkAnnotations(req, res) {
    try {
      const { id } = req.params;
      
      // 检查作品是否存在和权限
      const workResult = await databaseService.query(
        'SELECT privacy, user_id FROM works WHERE id = $1',
        [id]
      );
      
      if (workResult.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = workResult.rows[0];
      const userId = req.user?.userId;
      
      // 检查隐私权限
      if (work.privacy === 'private' && (!userId || work.user_id !== userId)) {
        return res.status(403).json({ error: '无权访问此作品的标注' });
      }
      
      const result = await databaseService.query(
        `SELECT a.*, u.username as annotator_name
         FROM annotations a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.work_id = $1
         ORDER BY a.annotation_time DESC`,
        [id]
      );
      
      const annotations = result.rows.map(annotation => ({
        ...annotation,
        four_points: annotation.four_points ? JSON.parse(annotation.four_points) : null
      }));
      
      res.json({ annotations });
    } catch (error) {
      logger.error('获取作品标注失败:', error);
      res.status(500).json({ error: '获取作品标注失败' });
    }
  }

  /**
   * 获取作品统计信息
   */
  async getWorkStats(req, res) {
    try {
      const { id } = req.params;
      
      const result = await databaseService.query(
        `SELECT 
           COUNT(a.id) as annotation_count,
           COUNT(DISTINCT a.character_name) as unique_characters,
           COUNT(DISTINCT a.user_id) as annotators_count,
           MIN(a.annotation_time) as first_annotation,
           MAX(a.annotation_time) as last_annotation
         FROM annotations a
         WHERE a.work_id = $1`,
        [id]
      );
      
      const stats = result.rows[0];
      
      res.json({
        annotationCount: parseInt(stats.annotation_count),
        uniqueCharacters: parseInt(stats.unique_characters),
        annotatorsCount: parseInt(stats.annotators_count),
        firstAnnotation: stats.first_annotation,
        lastAnnotation: stats.last_annotation
      });
    } catch (error) {
      logger.error('获取作品统计失败:', error);
      res.status(500).json({ error: '获取作品统计失败' });
    }
  }

  /**
   * 设置作品隐私
   */
  async setWorkPrivacy(req, res) {
    try {
      const { id } = req.params;
      const { privacy } = req.body;
      
      if (!['public', 'private', 'unlisted'].includes(privacy)) {
        return res.status(400).json({ error: '无效的隐私设置' });
      }
      
      await databaseService.query(
        'UPDATE works SET privacy = $1, updated_at = NOW() WHERE id = $2',
        [privacy, id]
      );
      
      logger.info(`作品隐私设置更新 - ID: ${id}, 隐私: ${privacy} by ${req.user.username}`);
      
      res.json({ message: '隐私设置更新成功' });
    } catch (error) {
      logger.error('设置作品隐私失败:', error);
      res.status(500).json({ error: '设置隐私失败' });
    }
  }

  /**
   * 分享作品
   */
  async shareWork(req, res) {
    try {
      const { id } = req.params;
      const { platform, message } = req.body;
      
      // 获取作品信息
      const result = await databaseService.query(
        'SELECT * FROM works WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const work = result.rows[0];
      
      // 生成分享链接
      const shareUrl = `${req.protocol}://${req.get('host')}/works/${id}`;
      
      // 记录分享行为
      await databaseService.query(
        'INSERT INTO work_shares (work_id, user_id, platform, share_url, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [id, req.user.userId, platform, shareUrl]
      );
      
      logger.info(`作品分享 - ID: ${id}, 平台: ${platform} by ${req.user.username}`);
      
      res.json({
        message: '分享链接生成成功',
        shareUrl,
        work: {
          title: work.original_filename,
          description: work.description,
          author: work.work_author
        }
      });
    } catch (error) {
      logger.error('分享作品失败:', error);
      res.status(500).json({ error: '分享失败' });
    }
  }

  /**
   * 收藏作品
   */
  async favoriteWork(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      // 检查是否已收藏
      const existingResult = await databaseService.query(
        'SELECT id FROM work_favorites WHERE work_id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: '已经收藏过此作品' });
      }
      
      await databaseService.query(
        'INSERT INTO work_favorites (work_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [id, userId]
      );
      
      logger.info(`作品收藏 - ID: ${id} by ${req.user.username}`);
      
      res.json({ message: '收藏成功' });
    } catch (error) {
      logger.error('收藏作品失败:', error);
      res.status(500).json({ error: '收藏失败' });
    }
  }

  /**
   * 取消收藏
   */
  async unfavoriteWork(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const result = await databaseService.query(
        'DELETE FROM work_favorites WHERE work_id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rowCount === 0) {
        return res.status(400).json({ error: '未收藏此作品' });
      }
      
      logger.info(`取消收藏 - ID: ${id} by ${req.user.username}`);
      
      res.json({ message: '取消收藏成功' });
    } catch (error) {
      logger.error('取消收藏失败:', error);
      res.status(500).json({ error: '取消收藏失败' });
    }
  }

  /**
   * 获取收藏的作品
   */
  async getFavoriteWorks(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user.userId;
      const offset = (page - 1) * limit;
      
      const result = await databaseService.query(
        `SELECT w.*, u.username as uploader_name, wf.created_at as favorited_at
         FROM work_favorites wf
         JOIN works w ON wf.work_id = w.id
         LEFT JOIN users u ON w.user_id = u.id
         WHERE wf.user_id = $1
         ORDER BY wf.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await databaseService.query(
        'SELECT COUNT(*) FROM work_favorites WHERE user_id = $1',
        [userId]
      );
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`
      }));
      
      res.json({
        works,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      logger.error('获取收藏作品失败:', error);
      res.status(500).json({ error: '获取收藏作品失败' });
    }
  }

  /**
   * 搜索作品
   */
  async searchWorks(req, res) {
    try {
      const { q, author, tags, group, privacy, page = 1, limit = 20 } = req.query;
      const userId = req.user?.userId;
      
      if (!q && !author && !tags && !group) {
        return res.status(400).json({ error: '请提供搜索条件' });
      }
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      // 隐私过滤
      if (!userId) {
        whereClause += ` AND privacy = 'public'`;
      } else {
        whereClause += ` AND (privacy = 'public' OR user_id = $${paramIndex})`;
        params.push(userId);
        paramIndex++;
      }
      
      if (q) {
        whereClause += ` AND (original_filename ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
        params.push(`%${q}%`, `%${q}%`);
        paramIndex += 2;
      }
      
      if (author) {
        whereClause += ` AND work_author ILIKE $${paramIndex}`;
        params.push(`%${author}%`);
        paramIndex++;
      }
      
      if (tags) {
        whereClause += ` AND tags::text ILIKE $${paramIndex}`;
        params.push(`%${tags}%`);
        paramIndex++;
      }
      
      if (group) {
        whereClause += ` AND group_name = $${paramIndex}`;
        params.push(group);
        paramIndex++;
      }
      
      if (privacy && userId) {
        whereClause += ` AND privacy = $${paramIndex}`;
        params.push(privacy);
        paramIndex++;
      }
      
      const offset = (page - 1) * limit;
      const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit), offset);
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        ${whereClause}
        ORDER BY w.upload_time DESC
        ${limitClause}
      `;
      
      const result = await databaseService.query(query, params);
      
      const countQuery = `SELECT COUNT(*) FROM works w LEFT JOIN users u ON w.user_id = u.id ${whereClause}`;
      const countResult = await databaseService.query(countQuery, params.slice(0, -2));
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`
      }));
      
      res.json({
        works,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        },
        searchQuery: { q, author, tags, group, privacy }
      });
    } catch (error) {
      logger.error('搜索作品失败:', error);
      res.status(500).json({ error: '搜索失败' });
    }
  }

  /**
   * 获取热门作品
   */
  async getTrendingWorks(req, res) {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user?.userId;
      
      // 构建隐私过滤
      let privacyFilter = "AND w.privacy = 'public'";
      if (userId) {
        privacyFilter = "AND (w.privacy = 'public' OR w.user_id = $2)";
      }
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               COUNT(a.id) as annotation_count,
               COUNT(DISTINCT a.user_id) as annotators_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        LEFT JOIN annotations a ON w.id = a.work_id
        WHERE w.upload_time > NOW() - INTERVAL '30 days' ${privacyFilter}
        GROUP BY w.id, u.username
        ORDER BY annotation_count DESC, annotators_count DESC, w.upload_time DESC
        LIMIT $1
      `;
      
      const params = userId ? [limit, userId] : [limit];
      const result = await databaseService.query(query, params);
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`,
        annotation_count: parseInt(work.annotation_count),
        annotators_count: parseInt(work.annotators_count)
      }));
      
      res.json({ works });
    } catch (error) {
      logger.error('获取热门作品失败:', error);
      res.status(500).json({ error: '获取热门作品失败' });
    }
  }

  /**
   * 获取最新作品
   */
  async getRecentWorks(req, res) {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user?.userId;
      
      let privacyFilter = "WHERE privacy = 'public'";
      const params = [limit];
      
      if (userId) {
        privacyFilter = "WHERE (privacy = 'public' OR user_id = $2)";
        params.push(userId);
      }
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        ${privacyFilter}
        ORDER BY w.upload_time DESC
        LIMIT $1
      `;
      
      const result = await databaseService.query(query, params);
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`,
        annotation_count: parseInt(work.annotation_count)
      }));
      
      res.json({ works });
    } catch (error) {
      logger.error('获取最新作品失败:', error);
      res.status(500).json({ error: '获取最新作品失败' });
    }
  }

  /**
   * 添加作品标签
   */
  async addWorkTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      
      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: '请提供有效的标签数组' });
      }
      
      // 获取当前标签
      const result = await databaseService.query(
        'SELECT tags FROM works WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const currentTags = result.rows[0].tags ? JSON.parse(result.rows[0].tags) : [];
      const newTags = [...new Set([...currentTags, ...tags])];
      
      await databaseService.query(
        'UPDATE works SET tags = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(newTags), id]
      );
      
      logger.info(`作品标签添加 - ID: ${id}, 标签: ${tags.join(', ')} by ${req.user.username}`);
      
      res.json({
        message: '标签添加成功',
        tags: newTags
      });
    } catch (error) {
      logger.error('添加作品标签失败:', error);
      res.status(500).json({ error: '添加标签失败' });
    }
  }

  /**
   * 移除作品标签
   */
  async removeWorkTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      
      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: '请提供要移除的标签数组' });
      }
      
      // 获取当前标签
      const result = await databaseService.query(
        'SELECT tags FROM works WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '作品不存在' });
      }
      
      const currentTags = result.rows[0].tags ? JSON.parse(result.rows[0].tags) : [];
      const newTags = currentTags.filter(tag => !tags.includes(tag));
      
      await databaseService.query(
        'UPDATE works SET tags = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(newTags), id]
      );
      
      logger.info(`作品标签移除 - ID: ${id}, 标签: ${tags.join(', ')} by ${req.user.username}`);
      
      res.json({
        message: '标签移除成功',
        tags: newTags
      });
    } catch (error) {
      logger.error('移除作品标签失败:', error);
      res.status(500).json({ error: '移除标签失败' });
    }
  }

  /**
   * 获取所有标签
   */
  async getAllTags(req, res) {
    try {
      const result = await databaseService.query(
        `SELECT tags FROM works WHERE tags IS NOT NULL AND tags != '[]'`
      );
      
      const allTags = new Set();
      result.rows.forEach(row => {
        try {
          const tags = JSON.parse(row.tags);
          tags.forEach(tag => allTags.add(tag));
        } catch (error) {
          // 忽略解析错误
        }
      });
      
      const tagCounts = {};
      for (const tag of allTags) {
        const countResult = await databaseService.query(
          `SELECT COUNT(*) FROM works WHERE tags::text LIKE $1`,
          [`%"${tag}"%`]
        );
        tagCounts[tag] = parseInt(countResult.rows[0].count);
      }
      
      const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([tag, count]) => ({ tag, count }));
      
      res.json({ tags: sortedTags });
    } catch (error) {
      logger.error('获取标签列表失败:', error);
      res.status(500).json({ error: '获取标签列表失败' });
    }
  }

  /**
   * 按标签获取作品
   */
  async getWorksByTag(req, res) {
    try {
      const { tag } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user?.userId;
      
      let privacyFilter = "AND privacy = 'public'";
      const params = [tag, limit, (page - 1) * limit];
      
      if (userId) {
        privacyFilter = "AND (privacy = 'public' OR user_id = $4)";
        params.push(userId);
      }
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        WHERE tags::text LIKE $1 ${privacyFilter}
        ORDER BY w.upload_time DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await databaseService.query(query, [`%"${tag}"%`, ...params.slice(1)]);
      
      const countQuery = `SELECT COUNT(*) FROM works WHERE tags::text LIKE $1 ${privacyFilter}`;
      const countParams = userId ? [`%"${tag}"%`, userId] : [`%"${tag}"%`];
      const countResult = await databaseService.query(countQuery, countParams);
      
      const works = result.rows.map(work => ({
        ...work,
        tags: work.tags ? JSON.parse(work.tags) : [],
        imageUrl: `/images/${work.filename}`,
        annotation_count: parseInt(work.annotation_count)
      }));
      
      res.json({
        works,
        tag,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      logger.error('按标签获取作品失败:', error);
      res.status(500).json({ error: '获取作品失败' });
    }
  }

  /**
   * 处理图片（压缩、格式转换等）
   */
  async processImage(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // 如果图片过大，进行压缩
      if (metadata.width > 2048 || metadata.height > 2048) {
        await image
          .resize(2048, 2048, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(filePath + '.processed');
        
        // 替换原文件
        fs.renameSync(filePath + '.processed', filePath);
        
        // 重新获取元数据
        const processedMetadata = await sharp(filePath).metadata();
        return {
          original: metadata,
          processed: processedMetadata,
          compressed: true
        };
      }
      
      return {
        original: metadata,
        compressed: false
      };
    } catch (error) {
      logger.error('图片处理失败:', error);
      throw error;
    }
  }
}

module.exports = new WorksController();