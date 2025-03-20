const { VertexAI } = require('@google-cloud/vertexai');
const config = require('../config');
const { ApiError } = require('../utils/errorHandler');

// Initialize Vertex AI
const vertexAi = new VertexAI({
  project: config.googleCloud.projectId,
  location: config.googleCloud.location,
});

// Get the generative model
const generativeModel = vertexAi.getGenerativeModel({
  model: config.gemini.model,
});

/**
 * Extracts the file ID from a Google Drive URL
 * @param {string} url - The Google Drive URL
 * @returns {string} - The extracted file ID
 */
const extractGoogleDriveFileId = (url) => {
  // Handle different Google Drive URL formats
  const fileIdRegex = /\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(fileIdRegex);
  
  if (match && match[1]) {
    return match[1];
  }
  
  // Try another approach for URLs with different formats
  const idParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParam && idParam[1]) {
    return idParam[1];
  }
  
  console.error('Failed to extract file ID from URL:', url);
  throw new ApiError(400, 'Could not extract file ID from Google Drive URL');
};

/**
 * Generates the prompt for video analysis
 * @param {string} videoUrl - The Google Drive URL of the video
 * @param {Array} customCriteria - Optional custom criteria for analysis
 * @returns {string} - The generated prompt
 */
const generateAnalysisPrompt = (videoUrl, customCriteria = []) => {
  // Check if there are custom categories
  const hasCustomCategories = customCriteria && customCriteria.length > 0;
  
  // Format custom categories if they exist
  let customCategoriesText = '';
  if (hasCustomCategories) {
    customCategoriesText = customCriteria.map(category => `              * ${category}`).join('\n');
  }

  return `
Evaluate the quality of a video review based on the following criteria:

I. General Video Review Quality:

   A. Honesty and Authenticity:
      * Does the review appear genuine and unbiased?
      * Does the reviewer express their honest opinion, whether positive or negative?
   B. Clarity and Presentation:
      * Is the video clear and easy to see?
      * Is the audio clear and easy to hear?
      * Is the reviewer's speech articulate and understandable?
   C. Engagement:
      * Is the review engaging and interesting to watch?
      * Does the reviewer convey their experience in a compelling way?
   D. Detail and Information:
      * Does the review provide specific details about the product?
      * Does the review thoroughly explain the reviewer's experience?
   E. Structure and Organization:
      * Is the review well-structured and easy to follow?
      * Does the review have a logical flow and clear key points?

${hasCustomCategories ? `II. Custom Categories Evaluation:

   IMPORTANT: The following custom categories MUST be evaluated separately with individual scores:
${customCategoriesText}
   
   For EACH custom category listed above:
      * Evaluate to what extent the video meets this specific category requirement
      * Assign a separate score (1-10) to EACH custom category
      * Provide specific feedback on how well each requirement is satisfied
      * Give actionable advice for improvement if needed` : 
`II. Custom Categories Evaluation:
      * No custom categories provided for this evaluation.`}

III. Overall Quality Assessment:

   A. Provide an overall score for the video review's quality, taking into account the following:
       * If custom categories are provided:
           * General Video Review Quality: 65% weight
           * Custom Categories: 35% weight
       * If no custom categories are provided:
           * General Video Review Quality: 100% weight
   B. Justify the score by referencing specific examples from the review and explaining how they contribute to the relevant criteria.
       * If custom categories are provided, explain how examples relate to both General Video Review Quality and Custom Categories.
       * If no custom categories are provided, explain how examples relate to General Video Review Quality.
       * **For any category where the review receives a low score, provide specific and actionable suggestions on how the reviewer can improve in that area.**

Additional Instructions:

* Focus on the quality and content of the review, not the reviewer's personal style or subjective opinions unrelated to the product.
* Remember that the goal is an honest, clear, and well-presented review, not necessarily a positive one.
* Identify areas where the review excels and areas where it can be improved.

Format your response in Markdown with the following sections:
1. Total Score (out of 10)
2. Individual Category Scores (score each main category from 1-10)
   - Honesty and Authenticity
   - Clarity and Presentation
   - Engagement
   - Detail and Information
   - Structure and Organization
   ${hasCustomCategories ? `- Custom Category: ${customCriteria.join('\n   - Custom Category: ')}` : ''}
3. Suggested Improvements (for any category scoring below 6)

The video is available at: ${videoUrl}
`;
};

/**
 * Gets a sample video URL from Google Cloud Storage for testing
 * @returns {string} - A publicly accessible sample video URL
 */
const getSampleVideoUrl = () => {
  // This is a sample video from Google Cloud Storage that is publicly accessible
  return 'gs://cloud-samples-data/generative-ai/video/pixel8.mp4';
};

/**
 * Extracts structured data from the Gemini response text
 * @param {string} analysisText - The raw analysis text from Gemini
 * @returns {Object} - Structured analysis data
 */
const extractStructuredData = (analysisText) => {
  // Extract total score
  const totalScoreMatch = analysisText.match(/Total Score:?\s*(\d+)/i);
  const totalScore = totalScoreMatch ? parseInt(totalScoreMatch[1]) : null;
  
  // Extract category scores directly from the Individual Category Scores section
  const categories = [];
  
  // Find the Individual Category Scores section
  const categoryScoreSection = analysisText.match(/## Individual Category Scores:([\s\S]*?)(?=##|$)/);
  
  if (categoryScoreSection && categoryScoreSection[1]) {
    // Extract each category line
    const categoryLines = categoryScoreSection[1].match(/- \*\*(.*?):\*\* (\d+)\/10/g) || [];
    
    categoryLines.forEach(line => {
      const match = line.match(/- \*\*(.*?):\*\* (\d+)\/10/);
      if (match && match[1] && match[2]) {
        const categoryName = match[1].trim();
        const score = parseInt(match[2]);
        
        // Find the assessment for this category in the improvements section
        let assessment = '';
        const improvementMatch = analysisText.match(new RegExp(`\\* \\*\\*${categoryName}:\\*\\* (.*?)(?=\\*\\*|$)`, 's'));
        if (improvementMatch && improvementMatch[1]) {
          assessment = improvementMatch[1].trim();
        }
        
        categories.push({
          name: categoryName,
          score: score,
          assessment: assessment
        });
      }
    });
  }
  
  // If no categories were found with the above method, fall back to previous methods
  if (categories.length === 0) {
    // Previous extraction code can go here as fallback
    const categoryRegex = /\*\*(.*?):\*\*\s*(\d+)(?:\/10)?\s*-\s*(.*?)(?=\n|$)/g;
    
    let match;
    while ((match = categoryRegex.exec(analysisText)) !== null) {
      categories.push({
        name: match[1].trim(),
        score: parseInt(match[2]),
        assessment: match[3].trim()
      });
    }
    
    // Additional fallback patterns if needed
  }
  
  // Check for specific custom category scores in justification sections
  const customCategoryPattern = /Custom Category:?\s*(.*?):\s*.*?Score:\s*(\d+)/gis;
  let customMatch;
  while ((customMatch = customCategoryPattern.exec(analysisText)) !== null) {
    const categoryName = customMatch[1].trim();
    const score = parseInt(customMatch[2]);
    
    // Check if this category already exists
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase() || 
      cat.name.toLowerCase() === `custom category: ${categoryName.toLowerCase()}`
    );
    
    if (existingCategory) {
      // Update the score to the one found in justification
      existingCategory.score = score;
    } else {
      // Add as a new category
      categories.push({
        name: categoryName,
        score: score,
        assessment: `This custom category received a score of ${score}/10.`
      });
    }
  }
  
  // Extract improvement suggestions
  const improvements = [];
  if (analysisText.includes('Suggested Improvements') || analysisText.includes('Improvement Suggestions')) {
    // Find the improvement section
    let improvementSection = '';
    if (analysisText.includes('Suggested Improvements')) {
      improvementSection = analysisText.split('Suggested Improvements')[1];
    } else if (analysisText.includes('Improvement Suggestions')) {
      improvementSection = analysisText.split('Improvement Suggestions')[1];
    }
    
    // Extract individual category improvements
    const bulletPoints = improvementSection.match(/\* \*\*(.*?):\*\*(.*?)(?=\n\* \*\*|$)/gs) || [];
    
    bulletPoints.forEach(point => {
      const match = point.match(/\* \*\*(.*?):\*\*(.*)/s);
      if (match && match[1] && match[2]) {
        const category = match[1].trim();
        const suggestionsText = match[2].trim();
        
        // Split the suggestions by periods, bullet points, or numbered items
        const suggestionsList = suggestionsText
          .split(/\.\s+|•\s+|\d+\.\s+/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && s !== '-' && s !== '*')
          .map(s => s.endsWith('.') ? s : s + '.');
        
        improvements.push({
          category,
          suggestions: suggestionsList
        });
      }
    });
    
    // If no improvements were found with the first method, try alternative patterns
    if (improvements.length === 0) {
      // Previous improvement extraction code can go here as fallback
    }
  }
  
  // Generate summary based on scores
  let summary = "";
  if (totalScore !== null) {
    // Find strongest and weakest categories
    let strongest = { name: '', score: 0 };
    let weakest = { name: '', score: 10 };
    
    categories.forEach(category => {
      if (category.score > strongest.score) {
        strongest = { name: category.name, score: category.score };
      }
      if (category.score < weakest.score) {
        weakest = { name: category.name, score: category.score };
      }
    });
    
    // Generate appropriate summary based on total score
    if (totalScore >= 8) {
      summary = `This video review is excellent with strong ${strongest.name.toLowerCase()} (${strongest.score}/10). Minor improvements to ${weakest.name.toLowerCase()} would further enhance overall effectiveness.`;
    } else if (totalScore >= 6) {
      summary = `This video review is good with adequate ${strongest.name.toLowerCase()} (${strongest.score}/10). Focus on improving ${weakest.name.toLowerCase()} (${weakest.score}/10) to enhance viewer engagement and message clarity.`;
    } else if (totalScore >= 4) {
      summary = `This video review requires significant improvements to be effective. While ${strongest.name.toLowerCase()} (${strongest.score}/10) shows some promise, major enhancements to ${weakest.name.toLowerCase()} (${weakest.score}/10) are needed.`;
    } else {
      summary = `This video review needs a complete overhaul to improve ${weakest.name.toLowerCase()} and overall quality. Addressing these issues will enhance professionalism, viewer retention, and product messaging effectiveness.`;
    }
  } else {
    summary = "Unable to generate a summary due to missing score data.";
  }
  
  return {
    totalScore,
    categories,
    improvements,
    summary,
    analysisDate: new Date().toISOString()
  };
};

/**
 * Analyzes a video using Vertex AI Gemini
 * @param {string} videoUrl - The video URL (Google Drive or Google Cloud Storage)
 * @param {Array} customCriteria - Optional custom criteria for analysis
 * @param {boolean} useSampleVideo - Whether to use a sample video for testing
 * @returns {Promise<Object>} - The analysis results
 */
const analyzeVideo = async (videoUrl, customCriteria = [], useSampleVideo = false) => {
  try {
    // Use sample video if requested
    if (useSampleVideo) {
      videoUrl = getSampleVideoUrl();
      console.log('Using sample video for testing:', videoUrl);
    }
    
    // Generate the prompt for analysis
    const prompt = generateAnalysisPrompt(videoUrl, customCriteria);
    
    console.log('Analyzing video with URL:', videoUrl);
    console.log('Using project ID:', config.googleCloud.projectId);
    console.log('Using location:', config.googleCloud.location);
    console.log('Using model:', config.gemini.model);

    // Determine the file URI based on the URL type
    let fileUri = videoUrl;
    
    // Handle Google Drive URLs
    if (videoUrl.includes('drive.google.com')) {
      try {
        const fileId = extractGoogleDriveFileId(videoUrl);
        console.log('Extracted file ID:', fileId);
        
        // Use direct download link format
        fileUri = `https://drive.google.com/uc?export=download&id=${fileId}`;
        console.log('Using direct download URL:', fileUri);
      } catch (error) {
        console.error('Error extracting file ID:', error);
        // Continue with the original URL if extraction fails
        fileUri = videoUrl;
      }
    } 
    // Handle Google Cloud Storage URLs - no modification needed, use as is
    else if (videoUrl.startsWith('gs://')) {
      console.log('Using Google Cloud Storage URL directly');
    }

    // Create the request for Gemini
    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              file_data: {
                file_uri: fileUri,
                // Determine mime type based on URL
                mime_type: videoUrl.endsWith('.mp4') ? 'video/mp4' : 'video/mp4', // Default to MP4
              },
            },
          ],
        },
      ],
    };

    console.log('Sending request to Vertex AI...');
    // Generate content using Gemini
    const response = await generativeModel.generateContent(request);
    console.log('Received response from Vertex AI');
    const result = await response.response;

    // Extract the text from the response
    const basicAnalysisText = result.candidates[0].content.parts[0].text;
    
    // Extract structured data from the analysis text
    const structuredData = extractStructuredData(basicAnalysisText);

    return {
      structuredData,
      rawText: basicAnalysisText,
      rawResponse: result,
    };
  } catch (error) {
    console.error('DETAILED ERROR INFORMATION:');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error stack:', error.stack);
    
    if (error.message.includes('permission') || error.message.includes('access') || 
        error.message.includes('Cannot fetch content from the provided URL')) {
      if (videoUrl.includes('drive.google.com')) {
        throw new ApiError(403, 
          'Unable to access the Google Drive video. Please use a Google Cloud Storage URL instead (gs://). ' +
          'For testing, you can use: ' + getSampleVideoUrl());
      } else {
        throw new ApiError(403, 'Unable to access the video. Please check the URL and permissions.');
      }
    }
    
    if (error.message.includes('not found') || error.message.includes('invalid')) {
      throw new ApiError(404, 'Video not found or invalid URL format.');
    }
    
    throw new ApiError(500, 'Error analyzing video. Please try again later.');
  }
};

module.exports = {
  analyzeVideo,
}; 