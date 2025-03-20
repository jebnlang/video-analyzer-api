# Video Review Analyzer Frontend

This is the frontend application for the Video Review Analyzer, which allows users to submit a video review for evaluation.

## Features

- Submit video reviews via URL
- Process and analyze videos against quality criteria
- Display feedback for videos that don't meet quality standards
- Show confirmation for successful submissions

## Project Structure

```
frontend/
├── src/                    # Source files
│   ├── components/         # React components
│   │   ├── App.js          # Main application component
│   │   ├── VideoSubmitForm.js  # Form for submitting video URLs
│   │   ├── ProcessingScreen.js # Loading screen during video analysis
│   │   ├── EvaluationResults.js # Feedback for rejected videos
│   │   └── ThankYouScreen.js   # Success confirmation
│   ├── utils/              # Utility functions
│   │   └── api.js          # API service functions
│   ├── index.js            # Entry point
│   ├── index.html          # HTML template
│   └── styles.css          # Global styles
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM or Yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```

### Development

Start the development server:
```
npm start
```

This will run the app in development mode. Open [http://localhost:1234](http://localhost:1234) to view it in your browser.

### Build for Production

To build the app for production:
```
npm run build
```

This will generate the optimized files in the `dist` directory.

## API Integration

The frontend connects to the backend API endpoint `/api/analyze` to submit videos for analysis. The API expects a `videoUrl` parameter which should be a valid URL to a supported video platform.

## Tech Stack

- React - UI library
- Formity - Form handling
- React Router - Navigation
- Axios - API requests
- Parcel - Bundler 