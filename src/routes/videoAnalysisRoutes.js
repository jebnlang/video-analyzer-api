const express = require('express');
const { analyzeVideoController, healthCheck } = require('../controllers/videoAnalysisController');

const router = express.Router();

// Health check route
router.get('/health', healthCheck);

// Video analysis route
router.post('/analyze', analyzeVideoController);

module.exports = router; 