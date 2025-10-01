/**
 * OCR识别控制器
 * 处理百度OCR相关的业务逻辑
 */

const path = require('path');
const fs = require('fs');
const { getAccessToken, recognizeImage } = require('../baidu-ocr');
const { databaseService } = require('../services/databaseService');
const { validateInput } = require('../utils/validators');
const logger = require('../utils/logger');

class OcrController {
  /**
   * 获取百度OCR访问令牌
   */
  async getToken(req, res) {
    try {
      logger.info(`OCR Token请求 - 用户: ${req.user.username}`);
      
      const token = await getAccessToken();
      
      res.json({
        success: true,
        message: '获取访问令牌成功',
        token: token.substring(0, 20) + '***', // 只返回部分token用于调试
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('获取OCR访问令牌失败:', error);
      res.status(500).json({
        success: false,
        error: '获取访问令牌失败',
        message: error.message
      });
    }
  }

  /**
   * OCR图像识别
   */
  async recognizeImage(req, res) {
    let tempFilePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '请上传图片文件'
        });
      }

      tempFilePath = req.file.path;
      const userId = req.user.userId;
      
      const originalFilename = req.originalFilenames?.[req.file.fieldname] || 
                              Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      
      logger.info(`OCR识别请求 - 用户: ${req.user.username}, 文件: ${originalFilename}`);
      
      // 调用百度OCR识别
      const startTime = Date.now();
      const recognitionResults = await recognizeImage(tempFilePath);
      const processingTime = Date.now() - startTime;
      
      // 保存识别记录到数据库
      try {
        await databaseService.query(
          `INSERT INTO ocr_recognition_history (
             user_id, original_filename, file_path, recognition_results, 
             processing_time, recognition_count, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            userId,
            originalFilename,
            tempFilePath,
            JSON.stringify(recognitionResults),
            processingTime,
            recognitionResults.length
          ]
        );
      } catch (dbError) {
        logger.warn('保存OCR识别记录失败:', dbError);
        // 不影响主要功能，继续执行
      }
      
      logger.info(`OCR识别完成 - 用户: ${req.user.username}, 识别数量: ${recognitionResults.length}, 耗时: ${processingTime}ms`);
      
      res.json({
        success: true,
        message: 'OCR识别成功',
        data: {
          results: recognitionResults,
          processingTime,
          totalCount: recognitionResults.length,
          highConfidenceCount: recognitionResults.filter(r => r.confidence >= 90).length,
          mediumConfidenceCount: recognitionResults.filter(r => r.confidence >= 80 && r.confidence < 90).length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('OCR识别失败:', error);
      res.status(500).json({
        success: false,
        error: 'OCR识别失败',
        message: error.message
      });
    } finally {
      // 清理临时文件
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          logger.debug(`临时文件已删除: ${tempFilePath}`);
        } catch (cleanupError) {
          logger.warn('清理临时文件失败:', cleanupError);
        }
      }
    }
  }

  /**
   * OCR文字检测（兼容旧接口）
   */
  async detectText(req, res) {
    // 重定向到新的识别接口
    req.file = req.file || req.files?.[0];
    return this.recognizeImage(req, res);
  }

  /**
   * 批量OCR识别
   */
  async batchRecognize(req, res) {
    const tempFiles = [];
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请上传图片文件'
        });
      }

      const userId = req.user.userId;
      const results = [];
      const errors = [];
      
      logger.info(`批量OCR识别请求 - 用户: ${req.user.username}, 文件数量: ${req.files.length}`);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        tempFiles.push(file.path);
        
        try {
          const originalFilename = req.originalFilenames?.[file.fieldname] || 
                                  Buffer.from(file.originalname, 'latin1').toString('utf8');
          
          const startTime = Date.now();
          const recognitionResults = await recognizeImage(file.path);
          const processingTime = Date.now() - startTime;
          
          results.push({
            filename: originalFilename,
            success: true,
            results: recognitionResults,
            processingTime,
            count: recognitionResults.length
          });
          
          // 保存识别记录
          try {
            await databaseService.query(
              `INSERT INTO ocr_recognition_history (
                 user_id, original_filename, file_path, recognition_results, 
                 processing_time, recognition_count, created_at
               ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
              [
                userId,
                originalFilename,
                file.path,
                JSON.stringify(recognitionResults),
                processingTime,
                recognitionResults.length
              ]
            );
          } catch (dbError) {
            logger.warn('保存批量OCR识别记录失败:', dbError);
          }
        } catch (error) {
          const originalFilename = req.originalFilenames?.[file.fieldname] || 
                                  Buffer.from(file.originalname, 'latin1').toString('utf8');
          
          logger.error(`批量OCR识别单个文件失败 - ${originalFilename}:`, error);
          errors.push({
            filename: originalFilename,
            error: error.message
          });
        }
      }
      
      logger.info(`批量OCR识别完成 - 用户: ${req.user.username}, 成功: ${results.length}, 失败: ${errors.length}`);
      
      res.json({
        success: true,
        message: `批量OCR识别完成，成功 ${results.length} 个，失败 ${errors.length} 个`,
        data: {
          results,
          errors,
          summary: {
            total: req.files.length,
            successful: results.length,
            failed: errors.length,
            totalRecognitions: results.reduce((sum, r) => sum + r.count, 0)
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('批量OCR识别失败:', error);
      res.status(500).json({
        success: false,
        error: '批量OCR识别失败',
        message: error.message
      });
    } finally {
      // 清理所有临时文件
      tempFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (cleanupError) {
            logger.warn('清理临时文件失败:', cleanupError);
          }
        }
      });
    }
  }

  /**
   * 获取OCR识别历史
   */
  async getRecognitionHistory(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const userId = req.user.userId;
      const offset = (page - 1) * limit;
      
      const result = await databaseService.query(
        `SELECT id, original_filename, recognition_results, processing_time, 
                recognition_count, created_at
         FROM ocr_recognition_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await databaseService.query(
        'SELECT COUNT(*) FROM ocr_recognition_history WHERE user_id = $1',
        [userId]
      );
      
      const history = result.rows.map(row => ({
        ...row,
        recognition_results: JSON.parse(row.recognition_results || '[]')
      }));
      
      res.json({
        success: true,
        data: {
          history,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count),
            pages: Math.ceil(countResult.rows[0].count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('获取OCR识别历史失败:', error);
      res.status(500).json({
        success: false,
        error: '获取识别历史失败',
        message: error.message
      });
    }
  }

  /**
   * 获取OCR识别统计
   */
  async getRecognitionStats(req, res) {
    try {
      const userId = req.user.userId;
      
      const statsResult = await databaseService.query(
        `SELECT 
           COUNT(*) as total_recognitions,
           SUM(recognition_count) as total_characters,
           AVG(processing_time) as avg_processing_time,
           MIN(created_at) as first_recognition,
           MAX(created_at) as last_recognition
         FROM ocr_recognition_history 
         WHERE user_id = $1`,
        [userId]
      );
      
      // 获取最近30天的识别统计
      const dailyStatsResult = await databaseService.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(*) as recognition_count,
           SUM(recognition_count) as character_count
         FROM ocr_recognition_history 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [userId]
      );
      
      const stats = statsResult.rows[0];
      
      res.json({
        success: true,
        data: {
          overview: {
            totalRecognitions: parseInt(stats.total_recognitions),
            totalCharacters: parseInt(stats.total_characters || 0),
            avgProcessingTime: parseFloat(stats.avg_processing_time || 0),
            firstRecognition: stats.first_recognition,
            lastRecognition: stats.last_recognition
          },
          dailyStats: dailyStatsResult.rows.map(row => ({
            date: row.date,
            recognitionCount: parseInt(row.recognition_count),
            characterCount: parseInt(row.character_count)
          }))
        }
      });
    } catch (error) {
      logger.error('获取OCR识别统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取识别统计失败',
        message: error.message
      });
    }
  }

  /**
   * 删除OCR识别记录
   */
  async deleteRecognitionRecord(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const result = await databaseService.query(
        'DELETE FROM ocr_recognition_history WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: '识别记录不存在或无权限删除'
        });
      }
      
      logger.info(`OCR识别记录删除 - ID: ${id}, 用户: ${req.user.username}`);
      
      res.json({
        success: true,
        message: '识别记录删除成功'
      });
    } catch (error) {
      logger.error('删除OCR识别记录失败:', error);
      res.status(500).json({
        success: false,
        error: '删除识别记录失败',
        message: error.message
      });
    }
  }

  /**
   * 导出OCR识别结果
   */
  async exportRecognitionResults(req, res) {
    try {
      const { format = 'json', startDate, endDate } = req.query;
      const userId = req.user.userId;
      
      let whereClause = 'WHERE user_id = $1';
      const params = [userId];
      let paramIndex = 2;
      
      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }
      
      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }
      
      const result = await databaseService.query(
        `SELECT original_filename, recognition_results, processing_time, 
                recognition_count, created_at
         FROM ocr_recognition_history 
         ${whereClause}
         ORDER BY created_at DESC`,
        params
      );
      
      const exportData = result.rows.map(row => ({
        filename: row.original_filename,
        results: JSON.parse(row.recognition_results || '[]'),
        processingTime: row.processing_time,
        recognitionCount: row.recognition_count,
        createdAt: row.created_at
      }));
      
      if (format === 'csv') {
        // 生成CSV格式
        const csvHeader = 'filename,character,confidence,x,y,width,height,processing_time,created_at\n';
        const csvRows = [];
        
        exportData.forEach(record => {
          record.results.forEach(result => {
            csvRows.push([
              `"${record.filename}"`,
              `"${result.text}"`,
              result.confidence,
              result.x,
              result.y,
              result.width,
              result.height,
              record.processingTime,
              `"${record.createdAt}"`
            ].join(','));
          });
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="ocr_results.csv"');
        res.send(csvHeader + csvRows.join('\n'));
      } else {
        // 默认JSON格式
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="ocr_results.json"');
        res.json({
          exportTime: new Date().toISOString(),
          totalRecords: exportData.length,
          data: exportData
        });
      }
      
      logger.info(`OCR识别结果导出 - 用户: ${req.user.username}, 格式: ${format}, 记录数: ${exportData.length}`);
    } catch (error) {
      logger.error('导出OCR识别结果失败:', error);
      res.status(500).json({
        success: false,
        error: '导出识别结果失败',
        message: error.message
      });
    }
  }

  /**
   * 获取OCR配置
   */
  async getOcrConfig(req, res) {
    try {
      const userId = req.user.userId;
      
      // 从数据库获取用户的OCR配置
      const result = await databaseService.query(
        'SELECT ocr_config FROM user_settings WHERE user_id = $1',
        [userId]
      );
      
      let config = {
        confidenceThreshold: 80,
        enablePreprocessing: true,
        enableCharacterCorrection: true,
        recognizeGranularity: 'small',
        languageType: 'CHN_ENG'
      };
      
      if (result.rows.length > 0 && result.rows[0].ocr_config) {
        config = { ...config, ...JSON.parse(result.rows[0].ocr_config) };
      }
      
      res.json({
        success: true,
        data: { config }
      });
    } catch (error) {
      logger.error('获取OCR配置失败:', error);
      res.status(500).json({
        success: false,
        error: '获取OCR配置失败',
        message: error.message
      });
    }
  }

  /**
   * 更新OCR配置
   */
  async updateOcrConfig(req, res) {
    try {
      const userId = req.user.userId;
      const { config } = req.body;
      
      // 验证配置
      const validation = validateInput(config, {
        confidenceThreshold: { type: 'number', min: 50, max: 100 },
        enablePreprocessing: { type: 'boolean' },
        enableCharacterCorrection: { type: 'boolean' },
        recognizeGranularity: { type: 'string', pattern: /^(small|big)$/ },
        languageType: { type: 'string', pattern: /^(CHN_ENG|ENG|CHN)$/ }
      });
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: '配置验证失败',
          details: validation.errors
        });
      }
      
      // 更新或插入配置
      await databaseService.query(
        `INSERT INTO user_settings (user_id, ocr_config, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (user_id) 
         DO UPDATE SET ocr_config = $2, updated_at = NOW()`,
        [userId, JSON.stringify(config)]
      );
      
      logger.info(`OCR配置更新 - 用户: ${req.user.username}`);
      
      res.json({
        success: true,
        message: 'OCR配置更新成功',
        data: { config }
      });
    } catch (error) {
      logger.error('更新OCR配置失败:', error);
      res.status(500).json({
        success: false,
        error: '更新OCR配置失败',
        message: error.message
      });
    }
  }

  /**
   * 检查OCR服务状态
   */
  async checkOcrStatus(req, res) {
    try {
      const startTime = Date.now();
      
      // 测试获取访问令牌
      await getAccessToken();
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        status: 'healthy',
        message: 'OCR服务正常',
        responseTime,
        timestamp: new Date().toISOString(),
        service: {
          provider: '百度OCR',
          endpoint: 'https://aip.baidubce.com',
          features: ['手写文字识别', '图像预处理', '字符纠正']
        }
      });
    } catch (error) {
      logger.error('OCR服务状态检查失败:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'OCR服务异常',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new OcrController();