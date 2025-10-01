/**
 * 百度OCR API服务
 * 提供文字识别功能
 */

const axios = require('axios');
const logger = require('./utils/logger');

/**
 * 获取百度OCR访问令牌
 * @returns {Promise<string>} 访问令牌
 */
async function getAccessToken() {
  try {
    const apiKey = process.env.BAIDU_OCR_API_KEY;
    const secretKey = process.env.BAIDU_OCR_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      throw new Error('百度OCR API密钥未配置');
    }
    
    const response = await axios.post(
      'https://aip.baidubce.com/oauth/2.0/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: secretKey
        }
      }
    );
    
    if (response.data.access_token) {
      logger.info('百度OCR访问令牌获取成功');
      return response.data.access_token;
    } else {
      throw new Error('获取访问令牌失败');
    }
  } catch (error) {
    logger.error('获取百度OCR访问令牌失败:', error.message);
    throw error;
  }
}

/**
 * 识别图片中的文字
 * @param {string} imageBase64 - 图片的base64编码
 * @param {string} accessToken - 访问令牌
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeImage(imageBase64, accessToken) {
  try {
    const response = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      {
        image: imageBase64
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data.words_result) {
      logger.info('百度OCR识别成功');
      return response.data;
    } else {
      throw new Error('OCR识别失败');
    }
  } catch (error) {
    logger.error('百度OCR识别失败:', error.message);
    throw error;
  }
}

module.exports = {
  getAccessToken,
  recognizeImage
};