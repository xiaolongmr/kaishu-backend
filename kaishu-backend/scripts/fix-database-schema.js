/**
 * 数据库表结构修复脚本
 * 添加缺失的字段和表
 */

const { databaseService } = require('../services/databaseService');
const logger = require('../utils/logger');

class DatabaseSchemaFixer {
  async fixSchema() {
    try {
      console.log('开始修复数据库表结构...');
      
      // 1. 修复works表 - 添加缺失的字段
      await this.fixWorksTable();
      
      // 2. 修复homepage_contents表
      await this.fixHomepageTable();
      
      // 3. 创建缺失的表
      await this.createMissingTables();
      
      console.log('数据库表结构修复完成!');
    } catch (error) {
      console.error('数据库表结构修复失败:', error);
      throw error;
    }
  }
  
  async fixWorksTable() {
    console.log('修复works表结构...');
    
    const alterations = [
      {
        name: 'privacy',
        sql: "ALTER TABLE works ADD COLUMN IF NOT EXISTS privacy VARCHAR(20) DEFAULT 'public'"
      },
      {
        name: 'featured',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false'
      },
      {
        name: 'view_count',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0'
      },
      {
        name: 'updated_at',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'
      },
      {
        name: 'file_url',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS file_url TEXT'
      },
      {
        name: 'storage_provider',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50)'
      },
      {
        name: 'cloud_urls',
        sql: 'ALTER TABLE works ADD COLUMN IF NOT EXISTS cloud_urls JSONB'
      }
    ];
    
    for (const alteration of alterations) {
      try {
        await databaseService.query(alteration.sql);
        console.log(`✓ 添加字段 works.${alteration.name}`);
      } catch (error) {
        if (error.code === '42701') {
          console.log(`- 字段 works.${alteration.name} 已存在`);
        } else {
          console.error(`✗ 添加字段 works.${alteration.name} 失败:`, error.message);
        }
      }
    }
    
    // 添加约束
    try {
      await databaseService.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'chk_works_privacy'
          ) THEN
            ALTER TABLE works ADD CONSTRAINT chk_works_privacy 
            CHECK (privacy IN ('public', 'private', 'unlisted'));
          END IF;
        END $$;
      `);
      console.log('✓ 添加privacy约束');
    } catch (error) {
      console.error('✗ 添加privacy约束失败:', error.message);
    }
  }
  
  async fixHomepageTable() {
    console.log('修复homepage表结构...');
    
    // 检查homepage_contents表是否存在
    try {
      await databaseService.query('SELECT 1 FROM homepage_contents LIMIT 1');
      console.log('- homepage_contents表已存在');
    } catch (error) {
      if (error.code === '42P01') {
        // 表不存在，创建它
        try {
          await databaseService.query(`
            CREATE TABLE homepage_contents (
              id SERIAL PRIMARY KEY,
              content_key VARCHAR(50) NOT NULL UNIQUE,
              content_value TEXT NOT NULL,
              content_type VARCHAR(20) DEFAULT 'text',
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('✓ 创建homepage_contents表');
          
          // 插入默认数据
          await this.insertDefaultHomepageContent();
        } catch (createError) {
          console.error('✗ 创建homepage_contents表失败:', createError.message);
        }
      } else {
        console.error('✗ 检查homepage_contents表失败:', error.message);
      }
    }
  }
  
  async insertDefaultHomepageContent() {
    console.log('插入默认首页内容...');
    
    const defaultContents = [
      { key: 'site_name', value: '绍楷字库', type: 'text' },
      { key: 'site_subtitle', value: '字体管理工具', type: 'text' },
      { key: 'hero_title_gradient', value: '绍楷字库', type: 'text' },
      { key: 'hero_title_normal', value: '字体管理工具', type: 'text' },
      { key: 'hero_subtitle', value: '一个专业的楷书字体管理解决方案，帮助您轻松建立、管理和使用完整的楷书字库。', type: 'text' },
      { key: 'feature_section_title', value: '主要特性', type: 'text' },
      { key: 'feature_section_subtitle', value: '绍楷字库字体管理工具提供全面的功能，帮助您轻松管理楷书字体资源', type: 'text' }
    ];
    
    for (const content of defaultContents) {
      try {
        await databaseService.query(
          'INSERT INTO homepage_contents (content_key, content_value, content_type) VALUES ($1, $2, $3) ON CONFLICT (content_key) DO NOTHING',
          [content.key, content.value, content.type]
        );
      } catch (error) {
        console.error(`插入默认内容失败 ${content.key}:`, error.message);
      }
    }
    
    console.log('✓ 默认首页内容插入完成');
  }
  
  async createMissingTables() {
    console.log('创建缺失的表...');
    
    const tables = [
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
      try {
        await databaseService.query(table.sql);
        console.log(`✓ 创建表 ${table.name}`);
      } catch (error) {
        console.error(`✗ 创建表 ${table.name} 失败:`, error.message);
      }
    }
  }
  
  async checkTableStructure() {
    console.log('检查表结构...');
    
    try {
      // 检查works表结构
      const worksColumns = await databaseService.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'works' AND table_schema = 'public'
        ORDER BY ordinal_position
      `);
      
      console.log('works表字段:');
      worksColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });
      
      // 检查是否有privacy字段
      const hasPrivacy = worksColumns.rows.some(col => col.column_name === 'privacy');
      if (!hasPrivacy) {
        console.log('⚠ works表缺少privacy字段');
      } else {
        console.log('✓ works表包含privacy字段');
      }
      
    } catch (error) {
      console.error('检查表结构失败:', error.message);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new DatabaseSchemaFixer();
  
  fixer.checkTableStructure()
    .then(() => fixer.fixSchema())
    .then(() => {
      console.log('数据库修复完成，正在退出...');
      process.exit(0);
    })
    .catch(error => {
      console.error('数据库修复失败:', error);
      process.exit(1);
    });
}

module.exports = DatabaseSchemaFixer;