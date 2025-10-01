/**
 * Cloudinary服务配置
 * 用于处理图片上传到Cloudinary云存储
 */

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// 初始化Cloudinary配置
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * 上传文件到Cloudinary
 * @param {Buffer} fileBuffer - 文件buffer
 * @param {string} fileName - 文件名
 * @param {string} folder - 存储文件夹
 * @returns {Promise<Object>} 上传结果
 */
async function uploadToCloudinary(fileBuffer, fileName, folder = 'kaishu') {
  try {
    // 创建可读流
    const stream = Readable.from(fileBuffer);
    
    // 创建上传流
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileName.split('.')[0], // 使用文件名作为public_id
          resource_type: 'auto',
          overwrite: true
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      stream.pipe(uploadStream);
    });
  } catch (error) {
    console.error('Cloudinary上传错误:', error);
    throw error;
  }
}

/**
 * 从Cloudinary删除文件
 * @param {string} publicId - 文件的public_id
 * @returns {Promise<Object>} 删除结果
 */
async function deleteFromCloudinary(publicId) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary删除错误:', error);
    throw error;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};