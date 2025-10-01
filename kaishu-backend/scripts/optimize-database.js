/**
 * 数据库优化脚本
 * 添加索引、约束和优化查询性能
 */

const { databaseService } = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * 数据库优化类
 */
class DatabaseOptimizer {
  /**
   * 执行完整的数据库优化
   */
  async optimize() {
    try {
      logger.info('开始数据库优化...');
      
      await this.createIndexes();
      await this.addConstraints();
      await this.createMissingTables();
      await this.updateTableStructures();
      await this.optimizeQueries();
      
      logger.info('数据库优化完成');
    } catch (error) {
      logger.error('数据库优化失败:', error);
      throw error;
    }
  }
  
  /**
   * 创建索引
   */
  async createIndexes() {
    logger.info('创建数据库索引...');
    
    const indexes = [
      // 用户表索引
      {
        name: 'idx_users_username',
        table: 'users',
        columns: ['username'],
        unique: true
      },
      {
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        unique: true,
        condition: 'WHERE email IS NOT NULL'
      },
      {
        name: 'idx_users_status',
        table: 'users',
        columns: ['status']
      },
      {
        name: 'idx_users_created_at',
        table: 'users',
        columns: ['created_at']
      },
      
      // 作品表索引
      {
        name: 'idx_works_user_id',
        table: 'works',
        columns: ['user_id']
      },
      {
        name: 'idx_works_privacy',
        table: 'works',
        columns: ['privacy']
      },
      {
        name: 'idx_works_upload_time',
        table: 'works',
        columns: ['upload_time']
      },
      {
        name: 'idx_works_work_author',
        table: 'works',
        columns: ['work_author']
      },
      {
        name: 'idx_works_group_name',
        table: 'works',
        columns: ['group_name']
      },
      {
        name: 'idx_works_filename',
        table: 'works',
        columns: ['filename'],
        unique: true
      },
      {
        name: 'idx_works_featured',
        table: 'works',
        columns: ['featured'],
        condition: 'WHERE featured = true'
      },
      
      // 标注表索引
      {
        name: 'idx_annotations_work_id',
        table: 'annotations',
        columns: ['work_id']
      },
      {
        name: 'idx_annotations_user_id',
        table: 'annotations',
        columns: ['user_id']
      },
      {
        name: 'idx_annotations_character_name',
        table: 'annotations',
        columns: ['character_name']
      },
      {
        name: 'idx_annotations_annotation_time',
        table: 'annotations',
        columns: ['annotation_time']
      },
      {
        name: 'idx_annotations_verified',
        table: 'annotations',
        columns: ['verified']
      },
      {
        name: 'idx_annotations_work_character',
        table: 'annotations',
        columns: ['work_id', 'character_name']
      },
      {
        name: 'idx_annotations_position',
        table: 'annotations',
        columns: ['position_x', 'position_y']
      },
      
      // 首页内容表索引
      {
        name: 'idx_homepage_content_key',
        table: 'homepage_content',
        columns: ['content_key'],
        unique: true
      },
      {
        name: 'idx_homepage_content_active',
        table: 'homepage_content',
        columns: ['is_active']
      },
      {
        name: 'idx_homepage_content_order',
        table: 'homepage_content',
        columns: ['display_order']
      },
      
      // 评论设置表索引
      {
        name: 'idx_comment_settings_page',
        table: 'comment_settings',
        columns: ['page_path'],
        unique: true
      }
    ];
    
    for (const index of indexes) {
      await this.createIndex(index);
    }
    
    logger.info('索引创建完成');
  }
  
  /**
   * 创建单个索引
   */
  async createIndex(indexConfig) {
    try {
      const { name, table, columns, unique = false, condition = '' } = indexConfig;
      
      // 检查索引是否已存在
      const existsResult = await databaseService.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = $1`,
        [name]
      );
      
      if (existsResult.rows.length > 0) {
        logger.debug(`索引 ${name} 已存在，跳过创建`);
        return;
      }
      
      const uniqueKeyword = unique ? 'UNIQUE' : '';
      const columnList = columns.join(', ');
      
      const sql = `CREATE ${uniqueKeyword} INDEX ${name} ON ${table} (${columnList}) ${condition}`.trim();
      
      await databaseService.query(sql);
      logger.info(`创建索引: ${name}`);
    } catch (error) {
      logger.warn(`创建索引 ${indexConfig.name} 失败:`, error.message);
    }
  }
  
  /**
   * 添加约束
   */
  async addConstraints() {
    logger.info('添加数据库约束...');
    
    const constraints = [
      // 用户表约束
      {
        name: 'chk_users_username_length',
        table: 'users',
        type: 'CHECK',
        definition: 'LENGTH(username) >= 3 AND LENGTH(username) <= 50'
      },
      {
        name: 'chk_users_status',
        table: 'users',
        type: 'CHECK',
        definition: "status IN ('active', 'inactive', 'banned')"
      },
      
      // 作品表约束
      {
        name: 'chk_works_privacy',
        table: 'works',
        type: 'CHECK',
        definition: "privacy IN ('public', 'private', 'unlisted')"
      },
      {
        name: 'chk_works_filename_not_empty',
        table: 'works',
        type: 'CHECK',
        definition: 'LENGTH(filename) > 0'
      },
      
      // 标注表约束
      {
        name: 'chk_annotations_position_positive',
        table: 'annotations',
        type: 'CHECK',
        definition: 'position_x >= 0 AND position_y >= 0 AND width > 0 AND height > 0'
      },
      {
        name: 'chk_annotations_character_not_empty',
        table: 'annotations',
        type: 'CHECK',
        definition: 'LENGTH(character_name) > 0'
      }
    ];
    
    for (const constraint of constraints) {
      await this.addConstraint(constraint);
    }
    
    logger.info('约束添加完成');
  }
  
  /**
   * 添加单个约束
   */
  async addConstraint(constraintConfig) {
    try {
      const { name, table, type, definition } = constraintConfig;
      
      // 检查约束是否已存在
      const existsResult = await databaseService.query(
        `SELECT conname FROM pg_constraint WHERE conname = $1`,
        [name]
      );
      
      if (existsResult.rows.length > 0) {
        logger.debug(`约束 ${name} 已存在，跳过创建`);
        return;
      }
      
      const sql = `ALTER TABLE ${table} ADD CONSTRAINT ${name} ${type} (${definition})`;
      
      await databaseService.query(sql);
      logger.info(`添加约束: ${name}`);
    } catch (error) {
      logger.warn(`添加约束 ${constraintConfig.name} 失败:`, error.message);
    }
  }
  
  /**
   * 创建缺失的表
   */
  async createMissingTables() {
    logger.info('检查并创建缺失的表...');
    
    const tables = [
      {
        name: 'ocr_recognition_history',
        sql: `
          CREATE TABLE IF NOT EXISTS ocr_recognition_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            original_filename VARCHAR(255) NOT NULL,
            file_path TEXT,
            recognition_results JSONB,
            processing_time INTEGER,
            recognition_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'user_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            ocr_config JSONB,
            theme_preference VARCHAR(20) DEFAULT 'light',
            language_preference VARCHAR(10) DEFAULT 'zh-CN',
            notification_settings JSONB,
            privacy_settings JSONB,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'system_settings',
        sql: `
          CREATE TABLE IF NOT EXISTS system_settings (
            setting_key VARCHAR(100) PRIMARY KEY,
            setting_value TEXT,
            description TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'homepage_carousel',
        sql: `
          CREATE TABLE IF NOT EXISTS homepage_carousel (
            id SERIAL PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            image_url VARCHAR(500) NOT NULL,
            link_url VARCHAR(500),
            is_active BOOLEAN DEFAULT true,
            display_order INTEGER DEFAULT 0,
            config JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'work_favorites',
        sql: `
          CREATE TABLE IF NOT EXISTS work_favorites (
            id SERIAL PRIMARY KEY,
            work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(work_id, user_id)
          )
        `
      },
      {
        name: 'work_shares',
        sql: `
          CREATE TABLE IF NOT EXISTS work_shares (
            id SERIAL PRIMARY KEY,
            work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            platform VARCHAR(50),
            share_url TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'annotation_ratings',
        sql: `
          CREATE TABLE IF NOT EXISTS annotation_ratings (
            id SERIAL PRIMARY KEY,
            annotation_id INTEGER REFERENCES annotations(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(annotation_id, user_id)
          )
        `
      }
    ];
    
    for (const table of tables) {
      await this.createTable(table);
    }
    
    logger.info('表创建检查完成');
  }
  
  /**
   * 创建单个表
   */
  async createTable(tableConfig) {
    try {
      const { name, sql } = tableConfig;
      
      await databaseService.query(sql);
      logger.info(`表 ${name} 检查/创建完成`);
    } catch (error) {
      logger.warn(`创建表 ${tableConfig.name} 失败:`, error.message);
    }
  }
  
  /**
   * 更新表结构
   */
  async updateTableStructures() {
    logger.info('更新表结构...');
    
    const alterations = [
      // 为works表添加新字段
      {
        table: 'works',
        column: 'featured',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false'
      },
      {
        table: 'works',
        column: 'view_count',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0'
      },
      {
        table: 'works',
        column: 'updated_at',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
      },
      
      // 为annotations表添加新字段
      {
        table: 'annotations',
        column: 'verified',
        sql: 'ALTER TABLE annotations ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false'
      },
      {
        table: 'annotations',
        column: 'verified_by',
        sql: 'ALTER TABLE annotations ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id)'
      },
      {
        table: 'annotations',
        column: 'verified_at',
        sql: 'ALTER TABLE annotations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP'
      },
      {
        table: 'annotations',
        column: 'verification_note',
        sql: 'ALTER TABLE annotations ADD COLUMN IF NOT EXISTS verification_note TEXT'
      },
      {
        table: 'annotations',
        column: 'updated_at',
        sql: 'ALTER TABLE annotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
      },
      
      // 为users表添加新字段
      {
        table: 'users',
        column: 'last_login',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP'
      },
      {
        table: 'users',
        column: 'updated_at',
        sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
      },
      
      // 为homepage_content表添加新字段
      {
        table: 'homepage_content',
        column: 'is_active',
        sql: 'ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true'
      },
      {
        table: 'homepage_content',
        column: 'display_order',
        sql: 'ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0'
      },
      {
        table: 'homepage_content',
        column: 'description',
        sql: 'ALTER TABLE homepage_content ADD COLUMN IF NOT EXISTS description TEXT'
      }
    ];
    
    for (const alteration of alterations) {
      await this.alterTable(alteration);
    }
    
    logger.info('表结构更新完成');
  }
  
  /**
   * 修改表结构
   */
  async alterTable(alterConfig) {
    try {
      const { table, column, sql } = alterConfig;
      
      await databaseService.query(sql);
      logger.debug(`表 ${table} 字段 ${column} 更新完成`);
    } catch (error) {
      logger.warn(`修改表 ${alterConfig.table} 字段 ${alterConfig.column} 失败:`, error.message);
    }
  }
  
  /**
   * 优化查询
   */
  async optimizeQueries() {
    logger.info('执行查询优化...');
    
    try {
      // 更新表统计信息
      await databaseService.query('ANALYZE');
      logger.info('表统计信息更新完成');
      
      // 清理无用数据
      await this.cleanupData();
      
      // 重建索引（如果需要）
      await databaseService.query('REINDEX DATABASE CONCURRENTLY');
      logger.info('索引重建完成');
      
    } catch (error) {
      logger.warn('查询优化部分失败:', error.message);
    }
  }
  
  /**
   * 清理无用数据
   */
  async cleanupData() {
    logger.info('清理无用数据...');
    
    try {
      // 清理孤立的标注（对应的作品已删除）
      const orphanedAnnotations = await databaseService.query(
        'DELETE FROM annotations WHERE work_id NOT IN (SELECT id FROM works)'
      );
      
      if (orphanedAnnotations.rowCount > 0) {
        logger.info(`清理孤立标注: ${orphanedAnnotations.rowCount} 条`);
      }
      
      // 清理过期的OCR识别历史（超过30天）
      const expiredOcrHistory = await databaseService.query(
        'DELETE FROM ocr_recognition_history WHERE created_at < NOW() - INTERVAL \'30 days\''
      );
      
      if (expiredOcrHistory.rowCount > 0) {
        logger.info(`清理过期OCR历史: ${expiredOcrHistory.rowCount} 条`);
      }
      
    } catch (error) {
      logger.warn('数据清理失败:', error.message);
    }
  }
  
  /**
   * 获取数据库统计信息
   */
  async getDatabaseStats() {
    try {
      const stats = await databaseService.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);
      
      const tableStats = await databaseService.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY tablename
      `);
      
      return {
        columnStats: stats.rows,
        tableStats: tableStats.rows
      };
    } catch (error) {
      logger.error('获取数据库统计信息失败:', error);
      return null;
    }
  }
}

/**
 * 执行优化的主函数
 */
async function main() {
  try {
    const optimizer = new DatabaseOptimizer();
    
    console.log('开始数据库优化...');
    await optimizer.optimize();
    
    console.log('\n获取优化后的统计信息...');
    const stats = await optimizer.getDatabaseStats();
    
    if (stats) {
      console.log('\n表统计信息:');
      console.table(stats.tableStats);
    }
    
    console.log('\n数据库优化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库优化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = DatabaseOptimizer;