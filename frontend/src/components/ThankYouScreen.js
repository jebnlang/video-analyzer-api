import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYouScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have results in sessionStorage to confirm this is a valid flow
    const analysisResults = sessionStorage.getItem('analysisResults');
    
    if (!analysisResults) {
      // If no results are found, redirect to the home page
      navigate('/');
    }
  }, [navigate]);

  const handleFinish = () => {
    // Clear all data from sessionStorage
    sessionStorage.removeItem('videoUrl');
    sessionStorage.removeItem('analysisResults');
    
    // Navigate back to the home page
    navigate('/');
  };

  return (
    <div>
      <div className="success-container">
        <svg
          className="checkmark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 52 52"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            display: 'block',
            margin: '0 auto 20px',
            backgroundColor: 'var(--success-color)',
            padding: '10px'
          }}
        >
          <path
            fill="none"
            stroke="#fff"
            strokeWidth="4"
            d="M14 27l7.8 7.8L38 15"
          />
        </svg>
        
        <h2 style={{ textAlign: 'center', color: 'var(--success-color)' }}>
          Thank you for your video review!
        </h2>
        
        <p className="success-message">
          Your video has been successfully submitted and meets all our quality criteria.
        </p>
        
        <p style={{ textAlign: 'center' }}>
          We appreciate your contribution and will process it shortly.
        </p>
        
        <button onClick={handleFinish}>
          Finish
        </button>
      </div>
    </div>
  );
};

export default ThankYouScreen; 