/**
 * 管理员控制器
 * 处理管理员权限相关的业务逻辑
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { databaseService } = require('../services/databaseService');
const { validateInput, commonRules } = require('../utils/validators');
const logger = require('../utils/logger');

class AdminController {
  /**
   * 获取所有用户
   */
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (search) {
        whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      const query = `
        SELECT id, username, email, is_admin, status, created_at, last_login,
               (SELECT COUNT(*) FROM works WHERE user_id = users.id) as work_count,
               (SELECT COUNT(*) FROM annotations WHERE user_id = users.id) as annotation_count
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(parseInt(limit), offset);
      const result = await databaseService.query(query, params);
      
      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await databaseService.query(countQuery, params.slice(0, -2));
      
      res.json({
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      res.status(500).json({ error: '获取用户列表失败' });
    }
  }

  /**
   * 创建用户
   */
  async createUser(req, res) {
    try {
      const { username, password, email, is_admin = false } = req.body;
      
      // 输入验证
      const validation = validateInput({ username, password, email }, {
        username: commonRules.username,
        password: commonRules.password,
        email: { ...commonRules.email, required: false }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      // 检查用户名是否已存在
      const existingUser = await databaseService.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: '用户名已存在' });
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // 创建用户
      const result = await databaseService.query(
        `INSERT INTO users (username, password, email, is_admin, status, created_at) 
         VALUES ($1, $2, $3, $4, 'active', NOW()) 
         RETURNING id, username, email, is_admin, status, created_at`,
        [username, hashedPassword, email || null, is_admin]
      );
      
      logger.info(`管理员创建用户 - ${username} by ${req.user.username}`);
      
      res.status(201).json({
        message: '用户创建成功',
        user: result.rows[0]
      });
    } catch (error) {
      logger.error('创建用户失败:', error);
      res.status(500).json({ error: '创建用户失败' });
    }
  }

  /**
   * 更新用户信息
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, email, is_admin, status } = req.body;
      
      // 输入验证
      const validation = validateInput({ username, email }, {
        username: { type: 'string', minLength: 3, maxLength: 50 },
        email: { type: 'email' }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: '输入验证失败',
          details: validation.errors
        });
      }
      
      const result = await databaseService.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             is_admin = COALESCE($3, is_admin),
             status = COALESCE($4, status),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, username, email, is_admin, status`,
        [username, email, is_admin, status, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      logger.info(`管理员更新用户 - ID: ${id} by ${req.user.username}`);
      
      res.json({
        message: '用户信息更新成功',
        user: result.rows[0]
      });
    } catch (error) {
      logger.error('更新用户信息失败:', error);
      res.status(500).json({ error: '更新用户信息失败' });
    }
  }

  /**
   * 更新用户密码
   */
  async updateUserPassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      if (!password || password.length < 6) {
        return res.status(400).json({ error: '密码长度不能少于6位' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const result = await databaseService.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, id]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      logger.info(`管理员重置用户密码 - ID: ${id} by ${req.user.username}`);
      
      res.json({ message: '密码更新成功' });
    } catch (error) {
      logger.error('更新用户密码失败:', error);
      res.status(500).json({ error: '更新用户密码失败' });
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // 不能删除自己
      if (parseInt(id) === req.user.userId) {
        return res.status(400).json({ error: '不能删除自己的账户' });
      }
      
      // 使用事务删除用户及相关数据
      await databaseService.transaction(async (client) => {
        // 删除用户的标注
        await client.query('DELETE FROM annotations WHERE user_id = $1', [id]);
        
        // 删除用户的作品
        await client.query('DELETE FROM works WHERE user_id = $1', [id]);
        
        // 删除用户
        const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
        
        if (result.rowCount === 0) {
          throw new Error('用户不存在');
        }
      });
      
      logger.info(`管理员删除用户 - ID: ${id} by ${req.user.username}`);
      
      res.json({ message: '用户删除成功' });
    } catch (error) {
      logger.error('删除用户失败:', error);
      res.status(500).json({ error: error.message || '删除用户失败' });
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'inactive', 'banned'].includes(status)) {
        return res.status(400).json({ error: '无效的用户状态' });
      }
      
      const result = await databaseService.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, id]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      logger.info(`管理员更新用户状态 - ID: ${id}, 状态: ${status} by ${req.user.username}`);
      
      res.json({ message: '用户状态更新成功' });
    } catch (error) {
      logger.error('更新用户状态失败:', error);
      res.status(500).json({ error: '更新用户状态失败' });
    }
  }

  /**
   * 获取所有作品（管理员视图）
   */
  async getAllWorks(req, res) {
    try {
      const { page = 1, limit = 20, privacy, user_id } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (privacy) {
        whereClause += ` AND w.privacy = $${paramIndex}`;
        params.push(privacy);
        paramIndex++;
      }
      
      if (user_id) {
        whereClause += ` AND w.user_id = $${paramIndex}`;
        params.push(user_id);
        paramIndex++;
      }
      
      const query = `
        SELECT w.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM annotations a WHERE a.work_id = w.id) as annotation_count
        FROM works w
        LEFT JOIN users u ON w.user_id = u.id
        ${whereClause}
        ORDER BY w.upload_time DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(parseInt(limit), offset);
      const result = await databaseService.query(query, params);
      
      const countQuery = `SELECT COUNT(*) FROM works w ${whereClause}`;
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
        }
      });
    } catch (error) {
      logger.error('获取作品列表失败:', error);
      res.status(500).json({ error: '获取作品列表失败' });
    }
  }

  /**
   * 删除作品（管理员）
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
        await client.query('DELETE FROM annotations WHERE work_id = $1', [id]);
        await client.query('DELETE FROM works WHERE id = $1', [id]);
      });
      
      // 删除文件
      const filePath = path.join(__dirname, '../../楷书库', work.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          logger.warn('删除文件失败:', error);
        }
      }
      
      logger.info(`管理员删除作品 - ID: ${id}, 文件: ${work.filename} by ${req.user.username}`);
      
      res.json({ message: '作品删除成功' });
    } catch (error) {
      logger.error('删除作品失败:', error);
      res.status(500).json({ error: '删除作品失败' });
    }
  }

  /**
   * 设置作品为精选
   */
  async setWorkFeatured(req, res) {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      
      await databaseService.query(
        'UPDATE works SET featured = $1, updated_at = NOW() WHERE id = $2',
        [featured, id]
      );
      
      logger.info(`管理员设置作品精选 - ID: ${id}, 精选: ${featured} by ${req.user.username}`);
      
      res.json({ message: '作品精选状态更新成功' });
    } catch (error) {
      logger.error('设置作品精选失败:', error);
      res.status(500).json({ error: '设置作品精选失败' });
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
      
      logger.info(`管理员设置作品隐私 - ID: ${id}, 隐私: ${privacy} by ${req.user.username}`);
      
      res.json({ message: '作品隐私设置更新成功' });
    } catch (error) {
      logger.error('设置作品隐私失败:', error);
      res.status(500).json({ error: '设置作品隐私失败' });
    }
  }

  /**
   * 获取系统概览统计
   */
  async getSystemOverview(req, res) {
    try {
      const stats = await Promise.all([
        // 用户统计
        databaseService.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = \'active\') as active FROM users'),
        // 作品统计
        databaseService.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE privacy = \'public\') as public FROM works'),
        // 标注统计
        databaseService.query('SELECT COUNT(*) as total, COUNT(DISTINCT character_name) as unique_chars FROM annotations'),
        // 今日新增统计
        databaseService.query(`
          SELECT 
            (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURRENT_DATE) as new_users,
            (SELECT COUNT(*) FROM works WHERE DATE(upload_time) = CURRENT_DATE) as new_works,
            (SELECT COUNT(*) FROM annotations WHERE DATE(annotation_time) = CURRENT_DATE) as new_annotations
        `)
      ]);
      
      const overview = {
        users: {
          total: parseInt(stats[0].rows[0].total),
          active: parseInt(stats[0].rows[0].active)
        },
        works: {
          total: parseInt(stats[1].rows[0].total),
          public: parseInt(stats[1].rows[0].public)
        },
        annotations: {
          total: parseInt(stats[2].rows[0].total),
          uniqueCharacters: parseInt(stats[2].rows[0].unique_chars)
        },
        today: {
          newUsers: parseInt(stats[3].rows[0].new_users),
          newWorks: parseInt(stats[3].rows[0].new_works),
          newAnnotations: parseInt(stats[3].rows[0].new_annotations)
        }
      };
      
      res.json({ overview });
    } catch (error) {
      logger.error('获取系统概览失败:', error);
      res.status(500).json({ error: '获取系统概览失败' });
    }
  }

  /**
   * 获取用户统计
   */
  async getUserStats(req, res) {
    try {
      const { period = '30' } = req.query;
      
      const dailyStats = await databaseService.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as count
         FROM users 
         WHERE created_at > NOW() - INTERVAL '${period} days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        []
      );
      
      const statusStats = await databaseService.query(
        'SELECT status, COUNT(*) as count FROM users GROUP BY status'
      );
      
      res.json({
        dailyRegistrations: dailyStats.rows,
        statusDistribution: statusStats.rows
      });
    } catch (error) {
      logger.error('获取用户统计失败:', error);
      res.status(500).json({ error: '获取用户统计失败' });
    }
  }

  /**
   * 导出数据
   */
  async exportData(req, res) {
    try {
      const { tables = 'all', format = 'json' } = req.query;
      
      const exportData = {};
      
      if (tables === 'all' || tables.includes('users')) {
        const users = await databaseService.query(
          'SELECT id, username, email, is_admin, status, created_at FROM users ORDER BY id'
        );
        exportData.users = users.rows;
      }
      
      if (tables === 'all' || tables.includes('works')) {
        const works = await databaseService.query(
          'SELECT * FROM works ORDER BY id'
        );
        exportData.works = works.rows;
      }
      
      if (tables === 'all' || tables.includes('annotations')) {
        const annotations = await databaseService.query(
          'SELECT * FROM annotations ORDER BY id'
        );
        exportData.annotations = annotations.rows;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      if (format === 'csv') {
        // 简化的CSV导出（仅导出用户数据）
        const csvData = exportData.users?.map(user => 
          `${user.id},"${user.username}","${user.email || ''}",${user.is_admin},"${user.status}","${user.created_at}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="export_${timestamp}.csv"`);
        res.send('id,username,email,is_admin,status,created_at\n' + csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="export_${timestamp}.json"`);
        res.json({
          exportTime: new Date().toISOString(),
          version: '1.0',
          data: exportData
        });
      }
      
      logger.info(`数据导出 - 表: ${tables}, 格式: ${format} by ${req.user.username}`);
    } catch (error) {
      logger.error('数据导出失败:', error);
      res.status(500).json({ error: '数据导出失败' });
    }
  }

  /**
   * 导入数据
   */
  async importData(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '请上传数据文件' });
      }
      
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      let importData;
      try {
        importData = JSON.parse(fileContent);
      } catch (parseError) {
        return res.status(400).json({ error: '无效的JSON文件格式' });
      }
      
      const results = {
        users: { imported: 0, skipped: 0, errors: [] },
        works: { imported: 0, skipped: 0, errors: [] },
        annotations: { imported: 0, skipped: 0, errors: [] }
      };
      
      // 导入用户数据
      if (importData.data?.users) {
        for (const user of importData.data.users) {
          try {
            // 检查用户是否已存在
            const existing = await databaseService.query(
              'SELECT id FROM users WHERE username = $1',
              [user.username]
            );
            
            if (existing.rows.length > 0) {
              results.users.skipped++;
              continue;
            }
            
            await databaseService.query(
              'INSERT INTO users (username, email, is_admin, status, created_at) VALUES ($1, $2, $3, $4, $5)',
              [user.username, user.email, user.is_admin, user.status, user.created_at]
            );
            
            results.users.imported++;
          } catch (error) {
            results.users.errors.push(`用户 ${user.username}: ${error.message}`);
          }
        }
      }
      
      // 清理临时文件
      fs.unlinkSync(filePath);
      
      logger.info(`数据导入完成 - 用户: ${results.users.imported} by ${req.user.username}`);
      
      res.json({
        message: '数据导入完成',
        results
      });
    } catch (error) {
      logger.error('数据导入失败:', error);
      res.status(500).json({ error: '数据导入失败' });
    }
  }

  /**
   * 获取首页内容
   */
  async getHomepageContent(req, res) {
    try {
      const result = await databaseService.query(
        'SELECT content_key, content_value FROM homepage_contents ORDER BY content_key'
      );
      
      const content = {};
      result.rows.forEach(row => {
        content[row.content_key] = row.content_value;
      });
      
      res.json({ content });
    } catch (error) {
      logger.error('获取首页内容失败:', error);
      res.status(500).json({ error: '获取首页内容失败' });
    }
  }

  /**
   * 更新首页内容
   */
  async updateHomepageContent(req, res) {
    try {
      const { contentKey } = req.params;
      const { content } = req.body;
      
      await databaseService.query(
        `INSERT INTO homepage_contents (content_key, content_value, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (content_key) 
         DO UPDATE SET content_value = $2, updated_at = NOW()`,
        [contentKey, content]
      );
      
      logger.info(`首页内容更新 - ${contentKey} by ${req.user.username}`);
      
      res.json({ message: '首页内容更新成功' });
    } catch (error) {
      logger.error('更新首页内容失败:', error);
      res.status(500).json({ error: '更新首页内容失败' });
    }
  }

  /**
   * 批量更新首页内容
   */
  async batchUpdateHomepage(req, res) {
    try {
      const { contents } = req.body;
      
      if (!contents || typeof contents !== 'object') {
        return res.status(400).json({ error: '无效的内容格式' });
      }
      
      await databaseService.transaction(async (client) => {
        for (const [key, value] of Object.entries(contents)) {
          await client.query(
            `INSERT INTO homepage_content (content_key, content_value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (content_key) 
             DO UPDATE SET content_value = $2, updated_at = NOW()`,
            [key, value]
          );
        }
      });
      
      logger.info(`批量更新首页内容 - ${Object.keys(contents).length}项 by ${req.user.username}`);
      
      res.json({ message: '批量更新首页内容成功' });
    } catch (error) {
      logger.error('批量更新首页内容失败:', error);
      res.status(500).json({ error: '批量更新首页内容失败' });
    }
  }

  /**
   * 获取系统设置
   */
  async getSystemSettings(req, res) {
    try {
      const result = await databaseService.query(
        'SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key'
      );
      
      const settings = {};
      result.rows.forEach(row => {
        try {
          settings[row.setting_key] = JSON.parse(row.setting_value);
        } catch {
          settings[row.setting_key] = row.setting_value;
        }
      });
      
      res.json({ settings });
    } catch (error) {
      logger.error('获取系统设置失败:', error);
      res.status(500).json({ error: '获取系统设置失败' });
    }
  }

  /**
   * 更新系统设置
   */
  async updateSystemSettings(req, res) {
    try {
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: '无效的设置格式' });
      }
      
      await databaseService.transaction(async (client) => {
        for (const [key, value] of Object.entries(settings)) {
          const settingValue = typeof value === 'object' ? JSON.stringify(value) : value;
          
          await client.query(
            `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (setting_key) 
             DO UPDATE SET setting_value = $2, updated_at = NOW()`,
            [key, settingValue]
          );
        }
      });
      
      logger.info(`系统设置更新 - ${Object.keys(settings).length}项 by ${req.user.username}`);
      
      res.json({ message: '系统设置更新成功' });
    } catch (error) {
      logger.error('更新系统设置失败:', error);
      res.status(500).json({ error: '更新系统设置失败' });
    }
  }

  /**
   * 获取数据库状态
   */
  async getDatabaseStatus(req, res) {
    try {
      const healthStatus = await databaseService.getHealthStatus();
      const poolStatus = databaseService.getPoolStatus();
      
      res.json({
        database: healthStatus,
        connectionPool: poolStatus
      });
    } catch (error) {
      logger.error('获取数据库状态失败:', error);
      res.status(500).json({ error: '获取数据库状态失败' });
    }
  }

  /**
   * 优化数据库
   */
  async optimizeDatabase(req, res) {
    try {
      // 执行数据库优化操作
      await databaseService.query('VACUUM ANALYZE');
      
      logger.info(`数据库优化执行 by ${req.user.username}`);
      
      res.json({ message: '数据库优化完成' });
    } catch (error) {
      logger.error('数据库优化失败:', error);
      res.status(500).json({ error: '数据库优化失败' });
    }
  }

  /**
   * 检查OCR服务状态
   */
  async checkOcrStatus(req, res) {
    try {
      // 这里可以添加OCR服务状态检查逻辑
      res.json({
        status: 'healthy',
        message: 'OCR服务正常',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('检查OCR状态失败:', error);
      res.status(500).json({ error: '检查OCR状态失败' });
    }
  }
}

module.exports = new AdminController();