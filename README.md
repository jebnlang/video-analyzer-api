# Video Review Analysis API

## Overview
This API is designed to analyze video reviews based on predefined and customizable key categories. The system processes videos by sending a Google Drive link to Vertex AI Studio for analysis using the Gemini Video Analyzer, and returns a structured evaluation with scores and improvement suggestions.

## Key Features
- **Customizable Prompts:** Merchants can specify their own requirements for video review analysis (e.g., talking head format, clear product demonstration, etc.).
- **Structured Scoring System:**
  - Each category receives an individual score (1-10).
  - An overall total score (1-10) is calculated.
- **Markdown Response Format:** The response is formatted in Markdown, making it easy to integrate with other platforms.
- **Improvement Suggestions:** If a category score is below 6, the response includes recommendations for improvement.
- **Scalability:** The system is designed to scale, targeting the ability to process up to 1,000 videos per hour in later phases.

## Prerequisites
- Node.js (v18 or higher)
- Google Cloud account with Vertex AI API enabled
- Google Cloud project with billing enabled

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-analyzer-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-flash-001
```

4. Set up Google Cloud authentication:
```bash
gcloud auth application-default login
```

## Running the API

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/v1/health
```

### Analyze Video
```
POST /api/v1/analyze
```

Request body:
```json
{
  "videoUrl": "https://drive.google.com/file/d/your-file-id/view",
  "customCriteria": [
    "Talking head requirement - Is the reviewer visible in the video?",
    "Product demonstration clarity - Is the product clearly demonstrated?"
  ]
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "analysis": "### Video Review Analysis Report\n\n**Total Score:** 7.5/10\n\n#### Category Scores:\n- Clarity: 8/10\n- Relevance: 7/10\n- Engagement: 6/10\n- Quality: 9/10\n- Talking Head Presence: 5/10 *(Improvement Needed)*\n\n#### Suggested Improvements:\n- **Talking Head Presence:** Ensure that the reviewer is visible throughout the video to increase credibility.\n- **Engagement:** Add more dynamic elements such as close-ups or interactive visuals.",
    "rawResponse": { /* Raw response from Vertex AI */ }
  }
}
```

## Google Cloud Setup

1. Create a Google Cloud project:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. Enable the Vertex AI API:
   - In the Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Vertex AI API" and enable it

3. Set up authentication:
   - Create a service account with appropriate permissions
   - Download the service account key as JSON
   - Set the environment variable: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"`

## Testing with Postman

1. Start the API server
2. Open Postman
3. Create a new POST request to `http://localhost:3000/api/v1/analyze`
4. Set the request body to JSON format with the following structure:
```json
{
  "videoUrl": "https://drive.google.com/file/d/your-file-id/view",
  "customCriteria": [
    "Talking head requirement - Is the reviewer visible in the video?",
    "Product demonstration clarity - Is the product clearly demonstrated?"
  ]
}
```
5. Send the request and view the response

## Troubleshooting

- **Authentication Issues**: Ensure you have set up Google Cloud authentication correctly
- **Video Access Issues**: Make sure the Google Drive video is publicly accessible or shared with the service account
- **API Limits**: Be aware of Vertex AI API quotas and limits

## Next Steps

1. Add authentication to the API
2. Implement batch processing for multiple videos
3. Add a web interface for easier interaction
4. Implement caching to improve performance
5. Add more detailed analytics and reporting