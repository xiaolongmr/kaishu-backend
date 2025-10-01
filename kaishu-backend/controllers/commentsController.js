/**
 * 评论控制器
 * 处理Twikoo评论系统的配置管理业务逻辑
 */

const { databaseService } = require('../services/databaseService');
const { validateInput } = require('../utils/validators');
const logger = require('../utils/logger');

class CommentsController {
  /**
   * 获取所有页面的评论设置
   */
  async getAllCommentSettings(req, res) {
    try {
      const result = await databaseService.query(
        'SELECT * FROM comment_settings ORDER BY page_path'
      );
      
      const settings = {};
      result.rows.forEach(row => {
        settings[row.page_path] = {
          enabled: row.enabled,
          config: row.config ? JSON.parse(row.config) : {},
          updatedAt: row.updated_at
        };
      });
      
      res.json({
        success: true,
        data: { settings },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '获取评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 获取特定页面的评论设置
   */
  async getCommentSettings(req, res) {
    try {
      const { pagePath } = req.params;
      
      const result = await databaseService.query(
        'SELECT * FROM comment_settings WHERE page_path = $1',
        [pagePath]
      );
      
      let settings;
      if (result.rows.length > 0) {
        const row = result.rows[0];
        settings = {
          enabled: row.enabled,
          config: row.config ? JSON.parse(row.config) : {},
          updatedAt: row.updated_at
        };
      } else {
        // 返回默认设置
        settings = this.getDefaultCommentSettings();
      }
      
      res.json({
        success: true,
        data: {
          pagePath,
          settings
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取页面评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '获取页面评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 更新页面评论设置
   */
  async updateCommentSettings(req, res) {
    try {
      const { pagePath } = req.params;
      const { enabled, config } = req.body;
      
      // 输入验证
      const validation = validateInput({ enabled }, {
        enabled: { required: true, type: 'boolean' }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      // 验证配置格式
      if (config && typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          error: '配置格式错误，必须是对象类型'
        });
      }
      
      const configJson = config ? JSON.stringify(config) : null;
      
      await databaseService.query(
        `INSERT INTO comment_settings (page_path, enabled, config, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (page_path) 
         DO UPDATE SET 
           enabled = $2, 
           config = $3, 
           updated_at = NOW()`,
        [pagePath, enabled, configJson]
      );
      
      logger.info(`评论设置更新 - ${pagePath}, 启用: ${enabled} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '评论设置更新成功',
        data: {
          pagePath,
          enabled,
          config: config || {}
        }
      });
    } catch (error) {
      logger.error('更新评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '更新评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 批量更新评论设置
   */
  async batchUpdateCommentSettings(req, res) {
    try {
      const { settings } = req.body;
      
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          error: '无效的设置格式，需要数组'
        });
      }
      
      const results = [];
      const errors = [];
      
      await databaseService.transaction(async (client) => {
        for (const setting of settings) {
          try {
            const { pagePath, enabled, config } = setting;
            
            if (!pagePath || typeof enabled !== 'boolean') {
              errors.push({ pagePath, error: '页面路径和启用状态不能为空' });
              continue;
            }
            
            const configJson = config ? JSON.stringify(config) : null;
            
            await client.query(
              `INSERT INTO comment_settings (page_path, enabled, config, updated_at) 
               VALUES ($1, $2, $3, NOW()) 
               ON CONFLICT (page_path) 
               DO UPDATE SET 
                 enabled = $2, 
                 config = $3, 
                 updated_at = NOW()`,
              [pagePath, enabled, configJson]
            );
            
            results.push({ pagePath, success: true });
          } catch (error) {
            errors.push({ pagePath: setting.pagePath, error: error.message });
          }
        }
      });
      
      logger.info(`批量更新评论设置 - 成功: ${results.length}, 失败: ${errors.length} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: `批量更新完成，成功 ${results.length} 项，失败 ${errors.length} 项`,
        data: {
          results,
          errors,
          summary: {
            total: settings.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      logger.error('批量更新评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '批量更新评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 重置评论设置为默认值
   */
  async resetCommentSettings(req, res) {
    try {
      const { pages } = req.body;
      
      if (pages && Array.isArray(pages)) {
        // 重置指定页面
        await databaseService.transaction(async (client) => {
          for (const pagePath of pages) {
            const defaultSettings = this.getDefaultCommentSettings();
            
            await client.query(
              `INSERT INTO comment_settings (page_path, enabled, config, updated_at) 
               VALUES ($1, $2, $3, NOW()) 
               ON CONFLICT (page_path) 
               DO UPDATE SET 
                 enabled = $2, 
                 config = $3, 
                 updated_at = NOW()`,
              [pagePath, defaultSettings.enabled, JSON.stringify(defaultSettings.config)]
            );
          }
        });
        
        logger.info(`重置指定页面评论设置 - 页面数: ${pages.length} by ${req.user.username}`);
      } else {
        // 重置所有页面
        await databaseService.query('DELETE FROM comment_settings');
        
        logger.info(`重置所有评论设置 by ${req.user.username}`);
      }
      
      res.json({
        success: true,
        message: '评论设置已重置为默认值',
        data: {
          defaultSettings: this.getDefaultCommentSettings(),
          resetPages: pages || 'all'
        }
      });
    } catch (error) {
      logger.error('重置评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '重置评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 获取评论统计
   */
  async getCommentStats(req, res) {
    try {
      const stats = await databaseService.query(
        `SELECT 
           COUNT(*) as total_pages,
           COUNT(*) FILTER (WHERE enabled = true) as enabled_pages,
           COUNT(*) FILTER (WHERE enabled = false) as disabled_pages
         FROM comment_settings`
      );
      
      const pagesWithComments = await databaseService.query(
        'SELECT page_path, enabled FROM comment_settings ORDER BY page_path'
      );
      
      const overview = stats.rows[0];
      
      res.json({
        success: true,
        data: {
          overview: {
            totalPages: parseInt(overview.total_pages),
            enabledPages: parseInt(overview.enabled_pages),
            disabledPages: parseInt(overview.disabled_pages)
          },
          pages: pagesWithComments.rows
        }
      });
    } catch (error) {
      logger.error('获取评论统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取评论统计失败',
        message: error.message
      });
    }
  }

  /**
   * 检查评论系统健康状态
   */
  async checkCommentSystemHealth(req, res) {
    try {
      // 检查数据库连接
      const dbCheck = await databaseService.query('SELECT 1');
      
      // 检查评论设置表
      const tableCheck = await databaseService.query(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'comment_settings'"
      );
      
      const isTableExists = parseInt(tableCheck.rows[0].count) > 0;
      
      let settingsCount = 0;
      if (isTableExists) {
        const countResult = await databaseService.query('SELECT COUNT(*) FROM comment_settings');
        settingsCount = parseInt(countResult.rows[0].count);
      }
      
      const health = {
        status: 'healthy',
        database: {
          connected: true,
          responseTime: Date.now() // 简化的响应时间
        },
        commentSettings: {
          tableExists: isTableExists,
          totalSettings: settingsCount
        },
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: { health }
      });
    } catch (error) {
      logger.error('评论系统健康检查失败:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: '评论系统健康检查失败',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 验证评论配置
   */
  async validateCommentConfig(req, res) {
    try {
      const { config } = req.body;
      
      if (!config || typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          error: '配置格式错误'
        });
      }
      
      const validation = {
        isValid: true,
        errors: [],
        warnings: []
      };
      
      // 验证Twikoo配置项
      const requiredFields = ['envId', 'region'];
      const optionalFields = ['path', 'lang', 'avatar', 'placeholder'];
      
      // 检查必需字段
      requiredFields.forEach(field => {
        if (!config[field]) {
          validation.isValid = false;
          validation.errors.push(`缺少必需字段: ${field}`);
        }
      });
      
      // 检查字段类型
      if (config.envId && typeof config.envId !== 'string') {
        validation.isValid = false;
        validation.errors.push('envId 必须是字符串类型');
      }
      
      if (config.region && typeof config.region !== 'string') {
        validation.isValid = false;
        validation.errors.push('region 必须是字符串类型');
      }
      
      // 检查可选字段
      if (config.lang && !['zh-CN', 'zh-TW', 'en', 'ja'].includes(config.lang)) {
        validation.warnings.push('lang 字段值可能不被支持');
      }
      
      res.json({
        success: true,
        data: {
          validation,
          config
        }
      });
    } catch (error) {
      logger.error('验证评论配置失败:', error);
      res.status(500).json({
        success: false,
        error: '验证评论配置失败',
        message: error.message
      });
    }
  }

  /**
   * 导出评论设置
   */
  async exportCommentSettings(req, res) {
    try {
      const { format = 'json' } = req.query;
      
      const result = await databaseService.query(
        'SELECT * FROM comment_settings ORDER BY page_path'
      );
      
      const settings = result.rows.map(row => ({
        pagePath: row.page_path,
        enabled: row.enabled,
        config: row.config ? JSON.parse(row.config) : {},
        updatedAt: row.updated_at
      }));
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (format === 'csv') {
        const csvHeader = 'page_path,enabled,config,updated_at\n';
        const csvRows = settings.map(setting => 
          `"${setting.pagePath}",${setting.enabled},"${JSON.stringify(setting.config).replace(/"/g, '""')}","${setting.updatedAt}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="comment_settings_${timestamp}.csv"`);
        res.send(csvHeader + csvRows);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="comment_settings_${timestamp}.json"`);
        res.json({
          exportTime: new Date().toISOString(),
          version: '1.0',
          totalSettings: settings.length,
          settings
        });
      }
      
      logger.info(`评论设置导出 - 格式: ${format}, 设置数: ${settings.length} by ${req.user.username}`);
    } catch (error) {
      logger.error('导出评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '导出评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 导入评论设置
   */
  async importCommentSettings(req, res) {
    try {
      const { settings, overwrite = false } = req.body;
      
      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          error: '无效的设置格式，需要数组'
        });
      }
      
      const results = {
        imported: 0,
        skipped: 0,
        updated: 0,
        errors: []
      };
      
      await databaseService.transaction(async (client) => {
        for (const setting of settings) {
          try {
            const { pagePath, enabled, config } = setting;
            
            if (!pagePath || typeof enabled !== 'boolean') {
              results.errors.push({ pagePath, error: '页面路径和启用状态不能为空' });
              continue;
            }
            
            // 检查是否已存在
            const existing = await client.query(
              'SELECT page_path FROM comment_settings WHERE page_path = $1',
              [pagePath]
            );
            
            if (existing.rows.length > 0 && !overwrite) {
              results.skipped++;
              continue;
            }
            
            const configJson = config ? JSON.stringify(config) : null;
            
            await client.query(
              `INSERT INTO comment_settings (page_path, enabled, config, updated_at) 
               VALUES ($1, $2, $3, NOW()) 
               ON CONFLICT (page_path) 
               DO UPDATE SET 
                 enabled = $2, 
                 config = $3, 
                 updated_at = NOW()`,
              [pagePath, enabled, configJson]
            );
            
            if (existing.rows.length > 0) {
              results.updated++;
            } else {
              results.imported++;
            }
          } catch (error) {
            results.errors.push({ pagePath: setting.pagePath, error: error.message });
          }
        }
      });
      
      logger.info(`评论设置导入完成 - 导入: ${results.imported}, 更新: ${results.updated}, 跳过: ${results.skipped} by ${req.user.username}`);
      
      res.json({
        success: true,
        message: '评论设置导入完成',
        data: {
          results,
          summary: {
            total: settings.length,
            imported: results.imported,
            updated: results.updated,
            skipped: results.skipped,
            failed: results.errors.length
          }
        }
      });
    } catch (error) {
      logger.error('导入评论设置失败:', error);
      res.status(500).json({
        success: false,
        error: '导入评论设置失败',
        message: error.message
      });
    }
  }

  /**
   * 获取默认评论设置
   */
  getDefaultCommentSettings() {
    return {
      enabled: true,
      config: {
        envId: '',
        region: 'ap-shanghai',
        path: 'window.location.pathname',
        lang: 'zh-CN',
        avatar: 'identicon',
        placeholder: '欢迎评论交流...',
        meta: ['nick', 'mail', 'link'],
        pageSize: 10,
        wordLimit: [0, 2000],
        requiredFields: ['nick'],
        anonymous: false,
        sendMail: true,
        highlight: true,
        mathJax: false
      }
    };
  }
}

module.exports = new CommentsController();