import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const EvaluationResults = () => {
  const [results, setResults] = useState(null);
  const [isImprovementsOpen, setIsImprovementsOpen] = useState(true);
  const [isCategoryScoresOpen, setIsCategoryScoresOpen] = useState(true);
  const [isRawResponseOpen, setIsRawResponseOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [customCategoryScores, setCustomCategoryScores] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get the analysis results from sessionStorage
    const storedResults = sessionStorage.getItem('analysisResults');
    const storedCategories = sessionStorage.getItem('customCategories');
    
    if (!storedResults) {
      navigate('/');
      return;
    }
    
    try {
      const parsedResults = JSON.parse(storedResults);
      setResults(parsedResults);
      console.log('Analysis results:', parsedResults);
      
      // Process the results
      const { structuredData, rawText } = parsedResults.data;
      
      // Ensure categories exist
      const categories = structuredData?.categories || [];
      
      // Ensure improvements exist
      const improvements = structuredData?.improvements || [];
      
      // Find merchant-specific category if it exists
      const merchantCategory = categories.find(cat => 
        cat.name.toLowerCase().includes('merchant') || 
        cat.name.toLowerCase().includes('custom') ||
        cat.name.toLowerCase().includes('specific')
      );
      
      // Process custom categories if available
      let categoryList = [];
      let categoryScores = [];
      
      if (storedCategories) {
        try {
          const parsedCategories = JSON.parse(storedCategories);
          
          // Extract formatted categories to display
          categoryList = Array.isArray(parsedCategories) 
            ? parsedCategories.map(cat => cat.formatted || cat.raw).filter(cat => cat && cat.trim() !== '')
            : [];
          
          // Generate scores for each custom category
          if (merchantCategory) {
            // If there's a merchant category, use its score for all categories
            categoryScores = categoryList.map(() => merchantCategory.score);
          } else {
            // Otherwise, try to find matching category scores from the AI response
            categoryScores = categoryList.map(category => {
              // Look for a category with a similar name in the results
              const matchingCategory = categories.find(cat => 
                cat.name.toLowerCase().includes(category.toLowerCase()) ||
                category.toLowerCase().includes(cat.name.toLowerCase())
              );
              
              return matchingCategory ? matchingCategory.score : structuredData?.totalScore || 5;
            });
          }
          
          setCustomCategories(categoryList);
          setCustomCategoryScores(categoryScores);
        } catch (e) {
          console.error('Error parsing custom categories:', e);
        }
      }
      
      // Calculate total score
      let totalScore = structuredData?.totalScore;
      
      if (!totalScore) {
        // Calculate average score if totalScore is missing
        if (categories.length === 0) {
          totalScore = categoryList.length > 0 ? 
            categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length : 
            0;
        } else {
          const standardCategoriesSum = categories.reduce((total, category) => total + (category.score || 0), 0);
          const standardCategoriesCount = categories.length;
          
          // If no custom categories or we already have a merchant category, just use standard categories
          if (categoryList.length === 0 || merchantCategory) {
            totalScore = Math.round((standardCategoriesSum / standardCategoriesCount) * 10) / 10;
          } else {
            // Include custom categories scores in the calculation
            const totalSum = standardCategoriesSum + categoryScores.reduce((sum, score) => sum + score, 0);
            const totalCount = standardCategoriesCount + categoryScores.length;
            
            totalScore = Math.round((totalSum / totalCount) * 10) / 10;
          }
        }
      }
      
      // Store all processed data in state
      setProcessedData({
        structuredData,
        rawText,
        categories,
        improvements,
        merchantCategory,
        totalScore
      });
      
    } catch (error) {
      console.error('Error parsing results:', error);
      navigate('/');
    }
  }, [navigate]);

  const handleTryAgain = () => {
    // Clear the results but keep the video URL for reference
    sessionStorage.removeItem('analysisResults');
    
    // Navigate back to the submit form
    navigate('/');
  };

  const toggleImprovements = () => {
    setIsImprovementsOpen(!isImprovementsOpen);
  };

  const toggleCategoryScores = () => {
    setIsCategoryScoresOpen(!isCategoryScoresOpen);
  };
  
  const toggleRawResponse = () => {
    setIsRawResponseOpen(!isRawResponseOpen);
  };

  if (!results || !processedData) {
    return <div className="loader"><div className="spinner" /></div>;
  }

  // Extract processed data
  const { structuredData, rawText, categories, improvements, merchantCategory, totalScore } = processedData;

  return (
    <div>
      <h2>Video Review Feedback</h2>
      
      <div className="feedback-section">
        <p>Thank you for submitting your video review. Our analysis shows that there are a few areas that could be improved:</p>
        
        {structuredData && (
          <>
            <div className="score-summary">
              <div className="score-box">
                <h3>Overall Score: {totalScore}/10</h3>
                {structuredData.summary && <p>{structuredData.summary}</p>}
                
                <div className="score-calculation-summary">
                  <h4>How this score was calculated:</h4>
                  <table className="score-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category, index) => (
                        <tr key={index} className={category.score < 6 ? 'low-score' : ''}>
                          <td>{category.name}</td>
                          <td>{category.score}/10</td>
                        </tr>
                      ))}
                      
                      {/* Show individual custom categories if not already in categories */}
                      {customCategories.length > 0 && !merchantCategory && (
                        customCategories.map((category, index) => (
                          <tr 
                            key={`custom-${index}`} 
                            className={`custom-criteria-row ${customCategoryScores[index] >= 8 ? 'custom-high-score' : ''}`}
                          >
                            <td>{category}</td>
                            <td>{customCategoryScores[index]}/10</td>
                          </tr>
                        ))
                      )}
                      
                      <tr className="total-row">
                        <td><strong>Overall Score</strong> {structuredData.totalScore ? '(from AI analysis)' : '(average of all categories)'}</td>
                        <td><strong>{totalScore}/10</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {customCategories.length > 0 && (
                  <div className="custom-criteria-section">
                    <h4>Custom Categories Used:</h4>
                    <ul>
                      {customCategories.map((category, index) => (
                        <li key={index}>
                          <span className="criterion-name">{category}</span>
                          <span className="criterion-score">Score: {customCategoryScores[index]}/10</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {categories.length > 0 && (
              <div className="category-details">
                <div className="section-header" onClick={toggleCategoryScores}>
                  <h3>Category Scores:</h3>
                  <span className={`toggle-icon ${isCategoryScoresOpen ? 'open' : 'closed'}`}>▼</span>
                </div>
                
                <div className={`section-content ${isCategoryScoresOpen ? 'open' : 'closed'}`}>
                  <div className="category-scores">
                    {categories.map((category, index) => (
                      <div key={index} className={`category-score ${category.name.toLowerCase().includes('merchant') || category.name.toLowerCase().includes('custom') ? 'custom-category' : ''}`}>
                        <h4>{category.name}: {category.score}/10</h4>
                        <p>{category.assessment}</p>
                        
                        {(category.name.toLowerCase().includes('merchant') || 
                          category.name.toLowerCase().includes('custom') || 
                          category.name.toLowerCase().includes('specific')) && 
                          customCategories.length > 0 && (
                          <div className="custom-requirements-list">
                            <h5>Your Custom Categories:</h5>
                            <ul>
                              {customCategories.map((category, idx) => (
                                <li key={idx}>{category}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {improvements.length > 0 && (
              <div className="improvement-suggestions">
                <div className="section-header" onClick={toggleImprovements}>
                  <h3>Suggested Improvements</h3>
                  <span className={`toggle-icon ${isImprovementsOpen ? 'open' : 'closed'}`}>▼</span>
                </div>
                
                <div className={`section-content ${isImprovementsOpen ? 'open' : 'closed'}`}>
                  {/* First show any custom categories improvements */}
                  {customCategories.length > 0 && improvements.filter(imp => 
                    imp.category.toLowerCase().includes('merchant') || 
                    imp.category.toLowerCase().includes('custom') ||
                    imp.category.toLowerCase().includes('specific')
                  ).length === 0 && (
                    <div className="improvement-item custom-improvement">
                      <h4>Custom Categories</h4>
                      <p>Ensure your video properly addresses these categories:</p>
                      <ul>
                        {customCategories.map((category, idx) => (
                          <li key={idx}>{category}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Then show all improvements */}
                  {improvements.map((improvement, index) => (
                    <div key={index} className={`improvement-item ${
                      (improvement.category.toLowerCase().includes('merchant') || 
                       improvement.category.toLowerCase().includes('custom') ||
                       improvement.category.toLowerCase().includes('specific')) ? 
                      'custom-improvement' : ''}`}>
                      <h4>{improvement.category}</h4>
                      <ul>
                        {improvement.suggestions.map((suggestion, i) => (
                          <li key={i}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="raw-response-section">
              <div className="section-header" onClick={toggleRawResponse}>
                <h3>Raw API Response <span className="developer-note">(For Developers)</span></h3>
                <span className={`toggle-icon ${isRawResponseOpen ? 'open' : 'closed'}`}>▼</span>
              </div>
              
              <div className={`section-content ${isRawResponseOpen ? 'open' : 'closed'}`}>
                <div className="raw-response-container">
                  <h4>Structured Data:</h4>
                  <pre>{JSON.stringify(structuredData, null, 2)}</pre>
                  
                  <h4>Raw Text:</h4>
                  <div className="raw-text-content">
                    <ReactMarkdown>{rawText}</ReactMarkdown>
                  </div>
                  
                  <h4>Full API Response:</h4>
                  <pre>{JSON.stringify(results, null, 2)}</pre>
                </div>
              </div>
            </div>
          </>
        )}
        
        {!structuredData && (
          <div className="feedback-item">
            <p>Your video didn't meet our quality criteria. Please review the requirements and try again.</p>
            {rawText && (
              <div className="raw-feedback">
                <h3>Detailed Feedback:</h3>
                <ReactMarkdown>{rawText}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="actions">
        <button onClick={handleTryAgain}>
          Submit a New Video
        </button>
      </div>
    </div>
  );
};

export default EvaluationResults; 