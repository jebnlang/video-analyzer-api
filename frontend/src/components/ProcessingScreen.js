import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeVideo } from '../utils/api';

const ProcessingScreen = () => {
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const processVideo = async () => {
      try {
        // Get the video URL from sessionStorage
        const videoUrl = sessionStorage.getItem('videoUrl');
        
        if (!videoUrl) {
          throw new Error('No video URL found. Please submit a video.');
        }
        
        // Get custom categories if available
        let customCategories = [];
        const storedCategories = sessionStorage.getItem('customCategories');
        
        if (storedCategories) {
          try {
            const parsedCategories = JSON.parse(storedCategories);
            
            // Format categories for API - use the formatted version for evaluation
            customCategories = Array.isArray(parsedCategories) 
              ? parsedCategories.map(cat => cat.formatted || cat.raw).filter(cat => cat && cat.trim() !== '')
              : [];
              
            console.log('Using custom categories:', customCategories);
          } catch (e) {
            console.error('Error parsing custom categories:', e);
          }
        } else {
          console.log('No custom categories provided, using default evaluation categories');
        }
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          if (isMounted) {
            setProgress(prevProgress => {
              const newProgress = prevProgress + 5;
              return newProgress > 90 ? 90 : newProgress; // Cap at 90% until actual completion
            });
          }
        }, 500);
        
        // Call the API to analyze the video with custom categories
        const result = await analyzeVideo(videoUrl, customCategories);
        
        // Clear the interval
        clearInterval(progressInterval);
        
        if (isMounted) {
          setProgress(100);
          
          // Store the analysis results in sessionStorage
          sessionStorage.setItem('analysisResults', JSON.stringify(result));
          
          // Determine where to navigate based on the results
          if (result.data.passed) {
            navigate('/thank-you');
          } else {
            navigate('/results');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    };
    
    processVideo();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div>
      <h2>Analyzing Your Video</h2>
      
      {error ? (
        <div>
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/')}>
            Back to Submit Form
          </button>
        </div>
      ) : (
        <div className="loader">
          <div className="spinner" />
          <p>Please wait while we analyze your video review...</p>
          <div 
            style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden',
              marginTop: '20px'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: 'var(--primary-color)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <p>{progress}% complete</p>
        </div>
      )}
    </div>
  );
};

export default ProcessingScreen; 