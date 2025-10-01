/**
 * Supabase Storage服务配置
 * 用于处理图片上传到Supabase Storage云存储
 */

const { createClient } = require('@supabase/supabase-js');

// 延迟初始化Supabase客户端
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    // 统一使用SUPABASE_SERVICE_KEY环境变量名
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase配置不完整，跳过Supabase服务初始化');
      console.warn('需要配置环境变量: SUPABASE_URL, SUPABASE_SERVICE_KEY');
      return null;
    }
    
    console.log('初始化Supabase客户端...');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// 默认存储桶名称
const DEFAULT_BUCKET = 'kaishu';

/**
 * 确保存储桶存在
 * @param {string} bucketName - 存储桶名称
 */
async function ensureBucketExists(bucketName = DEFAULT_BUCKET) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    // 检查存储桶是否存在
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    // 如果不存在则创建
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true // 设置为公开访问
      });
      
      if (error) throw error;
      console.log(`创建存储桶: ${bucketName}`);
    }
  } catch (error) {
    console.error('确保存储桶存在时出错:', error);
    throw error;
  }
}

/**
 * 上传文件到Supabase Storage
 * @param {Buffer} fileBuffer - 文件buffer
 * @param {string} fileName - 文件名
 * @param {string} bucketName - 存储桶名称
 * @returns {Promise<Object>} 上传结果
 */
async function uploadToSupabase(fileBuffer, fileName, bucketName = DEFAULT_BUCKET) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase客户端未初始化');
    }
    
    // 确保存储桶存在
    await ensureBucketExists(bucketName);
    
    // 上传文件
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        upsert: true, // 如果文件已存在则覆盖
        contentType: getContentType(fileName) // 根据文件扩展名设置内容类型
      });
    
    if (error) throw error;
    
    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
    
    return {
      ...data,
      publicUrl: urlData.publicUrl
    };
  } catch (error) {
    console.error('Supabase上传错误:', error);
    throw error;
  }
}

/**
 * 从Supabase Storage删除文件
 * @param {string} fileName - 文件名
 * @param {string} bucketName - 存储桶名称
 * @returns {Promise<Object>} 删除结果
 */
async function deleteFromSupabase(fileName, bucketName = DEFAULT_BUCKET) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Supabase客户端未初始化');
    }
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Supabase删除错误:', error);
    throw error;
  }
}

/**
 * 根据文件名获取内容类型
 * @param {string} fileName - 文件名
 * @returns {string} 内容类型
 */
function getContentType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf'
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

module.exports = {
  uploadToSupabase,
  deleteFromSupabase,
  ensureBucketExists
};