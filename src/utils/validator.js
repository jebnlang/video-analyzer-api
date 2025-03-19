const { ApiError } = require('./errorHandler');

/**
 * Validates if a string is a valid Google Drive URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Basic validation for Google Drive URLs
  const googleDriveRegex = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  return googleDriveRegex.test(url);
};

/**
 * Validates if a string is a valid Google Cloud Storage URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const isValidGcsUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  // Basic validation for Google Cloud Storage URLs
  const gcsRegex = /^gs:\/\/([a-zA-Z0-9_.-]+)\/(.+)/;
  return gcsRegex.test(url);
};

/**
 * Validates the analysis request body
 * @param {Object} body - The request body
 * @throws {ApiError} - If validation fails
 */
const validateAnalysisRequest = (body) => {
  if (!body) {
    throw new ApiError(400, 'Request body is required');
  }

  if (!body.videoUrl) {
    throw new ApiError(400, 'Video URL is required');
  }

  // Check if the URL is either a valid Google Drive URL or a valid GCS URL
  const isValidUrl = isValidGoogleDriveUrl(body.videoUrl) || isValidGcsUrl(body.videoUrl);
  if (!isValidUrl) {
    throw new ApiError(400, 'Invalid URL format. Please provide a valid Google Drive or Google Cloud Storage URL');
  }

  // Validate custom criteria if provided
  if (body.customCriteria && !Array.isArray(body.customCriteria)) {
    throw new ApiError(400, 'Custom criteria must be an array');
  }
};

module.exports = {
  isValidGoogleDriveUrl,
  isValidGcsUrl,
  validateAnalysisRequest,
}; 