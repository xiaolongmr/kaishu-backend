// 数据库表结构更新脚本
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// 数据库配置
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_6AHlVhKNcLW4@ep-dawn-unit-adsmx7yb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateSchema() {
  try {
    console.log('开始更新数据库表结构...');
    
    // 添加file_url和storage_provider字段
    await pool.query(`
      ALTER TABLE works ADD COLUMN IF NOT EXISTS file_url TEXT;
      ALTER TABLE works ADD COLUMN IF NOT EXISTS storage_provider TEXT;
    `);
    
    console.log('数据库表结构更新成功！');
    process.exit(0);
  } catch (error) {
    console.error('更新数据库表结构失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateSchema();