/**
 * 首页内容控制器
 * 处理首页内容管理的业务逻辑
 */

const { databaseService } = require('../services/databaseService');
const { validateInput } = require('../utils/validators');
const logger = require('../utils/logger');

class HomepageController {
  /**
   * 获取首页内容（公开接口）
   */
  async getHomepageContent(req, res) {
    try {
      const result = await databaseService.query(
        'SELECT content_key, content_value FROM homepage_contents ORDER BY content_key'
      );
      
      const content = {};
      result.rows.forEach(row => {
        try {
          // 尝试解析JSON，如果失败则使用原始字符串
          content[row.content_key] = JSON.parse(row.content_value);
        } catch {
          content[row.content_key] = row.content_value;
        }
      });
      
      // 如果没有内容，返回默认内容
      if (Object.keys(content).length === 0) {
        content = this.getDefaultContent();
      }
      
      res.json({
        success: true,
        data: { content },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '获取首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 获取管理员首页内容
   */
  async getAdminHomepageContent(req, res) {
    try {
      const result = await databaseService.query(
        'SELECT * FROM homepage_contents ORDER BY content_key'
      );
      
      const content = result.rows.map(row => ({
        ...row,
        content_value: (() => {
          try {
            return JSON.parse(row.content_value);
          } catch {
            return row.content_value;
          }
        })()
      }));
      
      res.json({
        success: true,
        data: { content },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取管理员首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '获取管理员首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 更新首页内容项
   */
  async updateHomepageContent(req, res) {
    try {
      const { contentKey } = req.params;
      const { content, isActive = true, displayOrder = 0, description } = req.body;
      
      // 输入验证
      if (!content) {
        return res.status(400).json({
          success: false,
          error: '内容不能为空'
        });
      }
      
      const contentValue = typeof content === 'object' ? JSON.stringify(content) : content;
      
      await databaseService.query(
        `INSERT INTO homepage_contents (content_key, content_value, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (content_key) 
         DO UPDATE SET 
           content_value = $2, 
           updated_at = NOW()`,
        [contentKey, contentValue]
      );
      
      logger.info(`首页内容更新 - ${contentKey} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '首页内容更新成功',
        data: {
          contentKey,
          content,
          isActive,
          displayOrder
        }
      });
    } catch (error) {
      logger.error('更新首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '更新首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 批量更新首页内容
   */
  async batchUpdateHomepage(req, res) {
    try {
      const { contents } = req.body;
      
      if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({
          success: false,
          error: '无效的内容格式，需要数组'
        });
      }
      
      const results = [];
      const errors = [];
      
      await databaseService.transaction(async (client) => {
        for (const item of contents) {
          try {
            const { contentKey, content, isActive = true, displayOrder = 0, description } = item;
            
            if (!contentKey || !content) {
              errors.push({ contentKey, error: '内容键和内容不能为空' });
              continue;
            }
            
            const contentValue = typeof content === 'object' ? JSON.stringify(content) : content;
            
            await client.query(
              `INSERT INTO homepage_contents (content_key, content_value, updated_at) 
               VALUES ($1, $2, NOW()) 
               ON CONFLICT (content_key) 
               DO UPDATE SET 
                 content_value = $2, 
                 updated_at = NOW()`,
              [contentKey, contentValue]
            );
            
            results.push({ contentKey, success: true });
          } catch (error) {
            errors.push({ contentKey: item.contentKey, error: error.message });
          }
        }
      });
      
      logger.info(`批量更新首页内容 - 成功: ${results.length}, 失败: ${errors.length} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: `批量更新完成，成功 ${results.length} 项，失败 ${errors.length} 项`,
        data: {
          results,
          errors,
          summary: {
            total: contents.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      logger.error('批量更新首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '批量更新首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 重置首页内容为默认值
   */
  async resetHomepageContent(req, res) {
    try {
      const defaultContent = this.getDefaultContent();
      
      await databaseService.transaction(async (client) => {
        // 清空现有内容
        await client.query('DELETE FROM homepage_contents');
        
        // 插入默认内容
        for (const [key, value] of Object.entries(defaultContent)) {
          const contentValue = typeof value === 'object' ? JSON.stringify(value) : value;
          
          await client.query(
            'INSERT INTO homepage_contents (content_key, content_value, updated_at) VALUES ($1, $2, NOW())',
            [key, contentValue]
          );
        }
      });
      
      logger.info(`首页内容重置为默认值 by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '首页内容已重置为默认值',
        data: { defaultContent }
      });
    } catch (error) {
      logger.error('重置首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '重置首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 预览首页内容
   */
  async previewHomepageContent(req, res) {
    try {
      const { contents } = req.body;
      
      if (!contents || typeof contents !== 'object') {
        return res.status(400).json({
          success: false,
          error: '无效的内容格式'
        });
      }
      
      // 这里可以添加内容验证和预处理逻辑
      const processedContent = {};
      
      for (const [key, value] of Object.entries(contents)) {
        try {
          // 验证内容格式
          if (typeof value === 'string' && value.startsWith('{')) {
            processedContent[key] = JSON.parse(value);
          } else {
            processedContent[key] = value;
          }
        } catch (error) {
          processedContent[key] = value; // 保持原始值
        }
      }
      
      res.json({
        success: true,
        message: '内容预览生成成功',
        data: {
          preview: processedContent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('预览首页内容失败:', error);
      res.status(500).json({
        success: false,
        error: '预览首页内容失败',
        message: error.message
      });
    }
  }

  /**
   * 获取首页统计数据
   */
  async getHomepageStats(req, res) {
    try {
      const stats = await Promise.all([
        // 总体统计
        databaseService.query(`
          SELECT 
            (SELECT COUNT(*) FROM works WHERE privacy = 'public') as total_works,
            (SELECT COUNT(*) FROM annotations) as total_annotations,
            (SELECT COUNT(DISTINCT character_name) FROM annotations) as unique_characters,
            (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users
        `),
        // 最新作品
        databaseService.query(`
          SELECT w.*, u.username as uploader_name
          FROM works w
          LEFT JOIN users u ON w.user_id = u.id
          WHERE w.privacy = 'public'
          ORDER BY w.upload_time DESC
          LIMIT 6
        `),
        // 热门字符
        databaseService.query(`
          SELECT a.character_name, COUNT(*) as count
          FROM annotations a
          JOIN works w ON a.work_id = w.id
          WHERE w.privacy = 'public'
          GROUP BY a.character_name
          ORDER BY count DESC
          LIMIT 10
        `)
      ]);
      
      const overview = stats[0].rows[0];
      const recentWorks = stats[1].rows.map(work => ({
        ...work,
        imageUrl: `/images/${work.filename}`,
        tags: work.tags ? JSON.parse(work.tags) : []
      }));
      const popularCharacters = stats[2].rows;
      
      res.json({
        success: true,
        data: {
          overview: {
            totalWorks: parseInt(overview.total_works),
            totalAnnotations: parseInt(overview.total_annotations),
            uniqueCharacters: parseInt(overview.unique_characters),
            activeUsers: parseInt(overview.active_users)
          },
          recentWorks,
          popularCharacters: popularCharacters.map(char => ({
            character: char.character_name,
            count: parseInt(char.count)
          }))
        }
      });
    } catch (error) {
      logger.error('获取首页统计数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取首页统计数据失败',
        message: error.message
      });
    }
  }

  /**
   * 获取首页推荐内容
   */
  async getRecommendations(req, res) {
    try {
      const { type = 'mixed', limit = 12 } = req.query;
      const userId = req.user?.userId;
      
      let recommendations = [];
      
      if (type === 'works' || type === 'mixed') {
        // 推荐作品（基于标注数量和最近活跃度）
        const worksQuery = `
          SELECT w.*, u.username as uploader_name,
                 COUNT(a.id) as annotation_count
          FROM works w
          LEFT JOIN users u ON w.user_id = u.id
          LEFT JOIN annotations a ON w.id = a.work_id
          WHERE w.privacy = 'public' AND w.upload_time > NOW() - INTERVAL '30 days'
          GROUP BY w.id, u.username
          ORDER BY annotation_count DESC, w.upload_time DESC
          LIMIT $1
        `;
        
        const worksResult = await databaseService.query(worksQuery, [Math.ceil(limit / 2)]);
        
        recommendations.push(...worksResult.rows.map(work => ({
          type: 'work',
          id: work.id,
          title: work.original_filename,
          description: work.description,
          imageUrl: `/images/${work.filename}`,
          author: work.work_author,
          uploader: work.uploader_name,
          annotationCount: parseInt(work.annotation_count),
          uploadTime: work.upload_time
        })));
      }
      
      if (type === 'characters' || type === 'mixed') {
        // 推荐字符（基于最近标注活跃度）
        const charactersQuery = `
          SELECT a.character_name, COUNT(*) as recent_count,
                 COUNT(DISTINCT a.work_id) as work_count
          FROM annotations a
          JOIN works w ON a.work_id = w.id
          WHERE w.privacy = 'public' AND a.annotation_time > NOW() - INTERVAL '7 days'
          GROUP BY a.character_name
          ORDER BY recent_count DESC
          LIMIT $1
        `;
        
        const charactersResult = await databaseService.query(charactersQuery, [Math.floor(limit / 2)]);
        
        recommendations.push(...charactersResult.rows.map(char => ({
          type: 'character',
          character: char.character_name,
          recentCount: parseInt(char.recent_count),
          workCount: parseInt(char.work_count)
        })));
      }
      
      // 打乱推荐顺序
      recommendations = recommendations.sort(() => Math.random() - 0.5).slice(0, limit);
      
      res.json({
        success: true,
        data: {
          recommendations,
          type,
          total: recommendations.length
        }
      });
    } catch (error) {
      logger.error('获取首页推荐内容失败:', error);
      res.status(500).json({
        success: false,
        error: '获取推荐内容失败',
        message: error.message
      });
    }
  }

  /**
   * 获取轮播图项目
   */
  async getCarouselItems(req, res) {
    try {
      const result = await databaseService.query(
        `SELECT * FROM homepage_carousel 
         WHERE is_active = true 
         ORDER BY display_order ASC, created_at DESC`
      );
      
      const items = result.rows.map(item => ({
        ...item,
        config: item.config ? JSON.parse(item.config) : {}
      }));
      
      res.json({
        success: true,
        data: { items }
      });
    } catch (error) {
      logger.error('获取轮播图失败:', error);
      res.status(500).json({
        success: false,
        error: '获取轮播图失败',
        message: error.message
      });
    }
  }

  /**
   * 添加轮播图项目
   */
  async addCarouselItem(req, res) {
    try {
      const { title, description, imageUrl, linkUrl, isActive = true, displayOrder = 0, config = {} } = req.body;
      
      // 输入验证
      const validation = validateInput({ title, imageUrl }, {
        title: { required: true, type: 'string', maxLength: 200 },
        imageUrl: { required: true, type: 'string', maxLength: 500 }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      const result = await databaseService.query(
        `INSERT INTO homepage_carousel (title, description, image_url, link_url, is_active, display_order, config, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
         RETURNING *`,
        [title, description, imageUrl, linkUrl, isActive, displayOrder, JSON.stringify(config)]
      );
      
      logger.info(`轮播图添加 - ${title} by ${req.user.username}`);
      
      res.status(201).json({
        success: true,
        message: '轮播图添加成功',
        data: { item: result.rows[0] }
      });
    } catch (error) {
      logger.error('添加轮播图失败:', error);
      res.status(500).json({
        success: false,
        error: '添加轮播图失败',
        message: error.message
      });
    }
  }

  /**
   * 更新轮播图项目
   */
  async updateCarouselItem(req, res) {
    try {
      const { id } = req.params;
      const { title, description, imageUrl, linkUrl, isActive, displayOrder, config } = req.body;
      
      const result = await databaseService.query(
        `UPDATE homepage_carousel 
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             image_url = COALESCE($3, image_url),
             link_url = COALESCE($4, link_url),
             is_active = COALESCE($5, is_active),
             display_order = COALESCE($6, display_order),
             config = COALESCE($7, config),
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [title, description, imageUrl, linkUrl, isActive, displayOrder, config ? JSON.stringify(config) : null, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: '轮播图项目不存在'
        });
      }
      
      logger.info(`轮播图更新 - ID: ${id} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '轮播图更新成功',
        data: { item: result.rows[0] }
      });
    } catch (error) {
      logger.error('更新轮播图失败:', error);
      res.status(500).json({
        success: false,
        error: '更新轮播图失败',
        message: error.message
      });
    }
  }

  /**
   * 删除轮播图项目
   */
  async deleteCarouselItem(req, res) {
    try {
      const { id } = req.params;
      
      const result = await databaseService.query(
        'DELETE FROM homepage_carousel WHERE id = $1',
        [id]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: '轮播图项目不存在'
        });
      }
      
      logger.info(`轮播图删除 - ID: ${id} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '轮播图删除成功'
      });
    } catch (error) {
      logger.error('删除轮播图失败:', error);
      res.status(500).json({
        success: false,
        error: '删除轮播图失败',
        message: error.message
      });
    }
  }

  /**
   * 获取默认首页内容
   */
  getDefaultContent() {
    return {
      title: '楷书字库',
      subtitle: '传承中华文化，弘扬书法艺术',
      description: '专业的楷书字体标注与管理平台，致力于保护和传承中华传统书法文化。',
      features: [
        {
          title: '智能标注',
          description: '基于AI的智能字符识别和标注功能',
          icon: 'smart'
        },
        {
          title: '海量字库',
          description: '收录丰富的楷书字体样本和标注数据',
          icon: 'database'
        },
        {
          title: '协作平台',
          description: '支持多用户协作标注和知识分享',
          icon: 'collaboration'
        }
      ],
      statistics: {
        showStats: true,
        autoUpdate: true
      },
      layout: {
        showCarousel: true,
        showFeatures: true,
        showRecommendations: true,
        showStatistics: true
      }
    };
  }
}

module.exports = new HomepageController();