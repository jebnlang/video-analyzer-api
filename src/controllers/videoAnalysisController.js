const { validateAnalysisRequest } = require('../utils/validator');
const { analyzeVideo } = require('../services/vertexAiService');
const { ApiError } = require('../utils/errorHandler');

/**
 * Controller for analyzing a video
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const analyzeVideoController = async (req, res, next) => {
  try {
    // Check if we should use the sample video
    const useSampleVideo = req.body.useSampleVideo === true;
    
    // Only validate if not using sample video
    if (!useSampleVideo) {
      validateAnalysisRequest(req.body);
    }

    const { videoUrl, customCriteria } = req.body;

    // Call the service to analyze the video
    const result = await analyzeVideo(videoUrl, customCriteria, useSampleVideo);

    // Return the analysis results
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller for health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  analyzeVideoController,
  healthCheck,
}; 