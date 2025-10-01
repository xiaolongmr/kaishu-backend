/**
 * 存储服务管理器
 * 用于管理和切换不同的云存储服务
 */

const { uploadToCloudinary, deleteFromCloudinary } = require('./cloudinaryService');
const { uploadToSupabase, deleteFromSupabase } = require('./supabaseService');

// 存储服务类型
const STORAGE_TYPES = {
  CLOUDINARY: 'cloudinary',
  SUPABASE: 'supabase',
  LOCAL: 'local' // 保留本地存储选项
};

// 默认存储服务顺序 - 按优先级排序
const DEFAULT_STORAGE_ORDER = [
  STORAGE_TYPES.CLOUDINARY,
  STORAGE_TYPES.SUPABASE,
  STORAGE_TYPES.LOCAL
];

/**
 * 获取当前启用的存储服务
 * 根据环境变量配置返回可用的存储服务列表
 * @returns {Array<string>} 可用的存储服务列表
 */
function getEnabledStorageServices() {
  const enabledServices = [];
  
  // 检查Cloudinary配置
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                       process.env.CLOUDINARY_API_KEY && 
                       process.env.CLOUDINARY_API_SECRET;
  
  if (hasCloudinary) {
    enabledServices.push(STORAGE_TYPES.CLOUDINARY);
    console.log('✓ Cloudinary存储服务已启用');
  } else {
    console.warn('✗ Cloudinary存储服务未配置 - 缺少环境变量: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
  
  // 检查Supabase配置
  const hasSupabase = process.env.SUPABASE_URL && 
                     (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
  
  if (hasSupabase) {
    enabledServices.push(STORAGE_TYPES.SUPABASE);
    console.log('✓ Supabase存储服务已启用');
  } else {
    console.warn('✗ Supabase存储服务未配置 - 缺少环境变量: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  }
  
  // 始终添加本地存储作为备选
  enabledServices.push(STORAGE_TYPES.LOCAL);
  console.log('✓ 本地存储服务已启用');
  
  console.log(`可用存储服务: ${enabledServices.join(', ')}`);
  return enabledServices;
}

/**
 * 获取存储服务优先级顺序
 * @returns {Array<string>} 存储服务优先级顺序
 */
function getStorageOrder() {
  // 如果环境变量中指定了存储顺序，则使用环境变量中的配置
  if (process.env.STORAGE_ORDER) {
    try {
      const order = process.env.STORAGE_ORDER.split(',').map(s => s.trim().toLowerCase());
      // 验证所有服务类型是否有效
      const validOrder = order.filter(type => Object.values(STORAGE_TYPES).includes(type));
      if (validOrder.length > 0) {
        return validOrder;
      }
    } catch (error) {
      console.error('解析STORAGE_ORDER环境变量出错:', error);
    }
  }
  
  // 默认使用预定义的顺序
  return DEFAULT_STORAGE_ORDER;
}

/**
 * 上传文件到云存储
 * 尝试按优先级顺序上传到可用的存储服务
 * @param {Buffer} fileBuffer - 文件buffer
 * @param {string} fileName - 文件名
 * @param {string} localFilePath - 本地文件路径（用于本地存储）
 * @returns {Promise<Object>} 上传结果
 */
async function uploadFile(fileBuffer, fileName, localFilePath) {
  console.log(`开始上传文件: ${fileName}, 大小: ${fileBuffer.length} bytes`);
  
  const enabledServices = getEnabledStorageServices();
  const storageOrder = getStorageOrder();
  
  // 按优先级排序可用的存储服务
  const orderedServices = storageOrder
    .filter(service => enabledServices.includes(service));
  
  console.log(`上传顺序: ${orderedServices.join(' -> ')}`);
  
  let lastError = null;
  const results = {};
  
  // 尝试按顺序上传到每个可用的存储服务
  for (const service of storageOrder) {
    console.log(`正在尝试上传到 ${service}...`);
    
    const startTime = Date.now(); // 移动到for循环内部但在try外部
    
    try {
      let result;
      
      switch (service) {
        case STORAGE_TYPES.CLOUDINARY:
          result = await uploadToCloudinary(fileBuffer, fileName);
          console.log(`✓ Cloudinary上传成功，耗时: ${Date.now() - startTime}ms`);
          break;
          
        case STORAGE_TYPES.SUPABASE:
          result = await uploadToSupabase(fileBuffer, fileName);
          console.log(`✓ Supabase上传成功，耗时: ${Date.now() - startTime}ms`);
          break;
          
        case STORAGE_TYPES.LOCAL:
          // 本地存储已经由multer处理，这里只返回本地路径信息
          result = { 
            url: `/images/${fileName}`,
            localPath: localFilePath,
            storageType: STORAGE_TYPES.LOCAL
          };
          console.log(`✓ 本地存储确认成功`);
          break;
          
        default:
          console.warn(`未知存储服务类型: ${service}`);
          continue;
      }
      
      // 记录成功的上传结果
      results[service] = {
        success: true,
        result,
        uploadTime: Date.now() - startTime
      };
      
      // 如果是第一个成功的服务，将其标记为主要存储
      if (!results.primaryStorage) {
        results.primaryStorage = service;
        results.primaryUrl = service === STORAGE_TYPES.CLOUDINARY ? 
          result.secure_url : 
          (service === STORAGE_TYPES.SUPABASE ? 
            result.publicUrl : 
            result.url);
        console.log(`设置主要存储: ${service}, URL: ${results.primaryUrl}`);
      }
      
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`✗ ${service}上传失败 (${errorTime}ms):`, {
        message: error.message,
        code: error.code,
        status: error.status || error.statusCode
      });
      
      lastError = error;
      
      // 记录失败的上传结果
      results[service] = {
        success: false,
        error: error.message,
        errorCode: error.code,
        errorTime
      };
    }
  }
  
  // 如果所有服务都上传失败，则抛出最后一个错误
  if (!results.primaryStorage) {
    console.error('所有存储服务上传失败:', results);
    throw lastError || new Error('所有存储服务上传失败');
  }
  
  console.log(`文件上传完成: ${fileName}, 主要存储: ${results.primaryStorage}`);
  
  return {
    ...results,
    fileName,
    allServices: orderedServices,
    uploadSummary: {
      total: orderedServices.length,
      successful: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length
    }
  };
}

/**
 * 从云存储删除文件
 * @param {Object} fileInfo - 文件信息，包含各个存储服务的标识符
 * @returns {Promise<Object>} 删除结果
 */
async function deleteFile(fileInfo) {
  const results = {};
  
  // 如果有Cloudinary信息，尝试从Cloudinary删除
  if (fileInfo.cloudinaryPublicId) {
    try {
      const result = await deleteFromCloudinary(fileInfo.cloudinaryPublicId);
      results.cloudinary = { success: true, result };
    } catch (error) {
      console.error('从Cloudinary删除失败:', error);
      results.cloudinary = { success: false, error: error.message };
    }
  }
  
  // 如果有Supabase信息，尝试从Supabase删除
  if (fileInfo.supabasePath) {
    try {
      const result = await deleteFromSupabase(fileInfo.supabasePath);
      results.supabase = { success: true, result };
    } catch (error) {
      console.error('从Supabase删除失败:', error);
      results.supabase = { success: false, error: error.message };
    }
  }
  
  // 本地文件删除通常由其他代码处理
  
  return results;
}

module.exports = {
  uploadFile,
  deleteFile,
  STORAGE_TYPES,
  getEnabledStorageServices,
  getStorageOrder
};