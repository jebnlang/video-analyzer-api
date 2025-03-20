import axios from 'axios';

// Set the base URL for API calls
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : 'http://localhost:3001/api/v1';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Submit a video URL for analysis
 * @param {string} videoUrl - The URL of the video to analyze
 * @param {Array} customCategories - Optional custom categories for analysis (defaults to empty array)
 * @returns {Promise} - The analysis results
 */
export const analyzeVideo = async (videoUrl, customCategories = []) => {
  try {
    // Only include customCategories in the request if there are any
    const requestData = {
      videoUrl
    };
    
    // Add custom categories to the request only if there are any
    if (Array.isArray(customCategories) && customCategories.length > 0) {
      requestData.customCriteria = customCategories;
      console.log('Sending custom categories to API:', customCategories);
    } else {
      console.log('No custom categories provided, using default evaluation categories');
    }
    
    const response = await api.post('/analyze', requestData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing video:', error);
    
    // Extract the error message from the API response if available
    const message = error.response?.data?.message || 'Failed to analyze video. Please try again.';
    throw new Error(message);
  }
};

/**
 * Check the health status of the API
 * @returns {Promise} - The health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw new Error('API health check failed');
  }
}; 