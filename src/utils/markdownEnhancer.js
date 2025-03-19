/**
 * Utility to enhance markdown output with beautiful formatting
 */

/**
 * Enhances the basic markdown analysis with beautiful formatting
 * @param {string} basicMarkdown - The original markdown from Gemini
 * @param {Object} rawResponse - The raw response object from Vertex AI
 * @returns {string} - Enhanced beautiful markdown
 */
const enhanceMarkdown = (basicMarkdown, rawResponse = null) => {
  // Extract the total score
  const totalScoreMatch = basicMarkdown.match(/Total Score: (\d+)/);
  const totalScore = totalScoreMatch ? totalScoreMatch[1] : "N/A";
  
  // Format the date - use createTime from rawResponse if available
  let formattedDate;
  if (rawResponse && rawResponse.createTime) {
    const createTime = new Date(rawResponse.createTime);
    formattedDate = createTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else {
    formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Start building the enhanced markdown
  let enhancedMarkdown = `# 📽️ Video Analysis Report  

## 📊 Overall Assessment  
**Total Score: ${totalScore}/10**  
${parseInt(totalScore) >= 7 ? '✅' : '❌'} *${getScoreDescription(parseInt(totalScore))}*  

---

## 📋 Category Breakdown  

| **Category** | **Score** | **Assessment** |
|-------------|:--------:|---------------|
`;

  // Extract and enhance individual category scores
  const categoryScores = extractCategoryScores(basicMarkdown);
  
  // Add category scores to the table
  categoryScores.forEach(category => {
    const emoji = getCategoryEmoji(category.name);
    enhancedMarkdown += `| ${emoji} **${category.name}** | **${category.score}/10** | ${category.description} |\n`;
  });

  enhancedMarkdown += `
---

## 🚀 Improvement Recommendations  
`;

  // Extract and enhance improvement suggestions
  const improvements = extractImprovements(basicMarkdown);
  if (improvements.length > 0) {
    improvements.forEach(improvement => {
      const emoji = getCategoryEmoji(improvement.category);
      
      enhancedMarkdown += `
### ${emoji} **${improvement.category} Enhancements**  
`;
      // Filter out empty suggestions
      const validSuggestions = improvement.suggestions.filter(s => 
        s.trim() !== '.' && s.trim() !== '-.' && s.trim().length > 1
      );
      
      if (validSuggestions.length > 0) {
        validSuggestions.forEach(suggestion => {
          // Add bold formatting to key phrases
          const enhancedSuggestion = addBoldToKeyPhrases(suggestion);
          enhancedMarkdown += `✅ ${enhancedSuggestion}  \n`;
        });
      } else {
        enhancedMarkdown += `No specific suggestions provided.  \n`;
      }
    });
  } else {
    enhancedMarkdown += `
No specific improvements needed at this time.  
`;
  }

  // Add a summary section with concise, actionable insights
  const summary = generateConciseSummary(categoryScores, parseInt(totalScore));
  const [summaryLine1, summaryLine2] = formatSummaryLines(summary);
  
  enhancedMarkdown += `
---

## 📝 Summary  

📌 ${summaryLine1}  
🔹 ${summaryLine2}  

---

<div align="center">🚀 **Enhance clarity, engagement & quality for a stronger impact!** 🚀</div>
`;

  return enhancedMarkdown;
};

/**
 * Format summary into two lines
 * @param {string} summary - The original summary
 * @returns {Array} - Array with two summary lines
 */
const formatSummaryLines = (summary) => {
  // Split the summary at a period or where "Addressing these issues" appears
  const parts = summary.split(/\.\s+|Addressing these issues/);
  
  if (parts.length >= 2) {
    // First part is the first line
    const line1 = parts[0] + '.';
    // Second part (with "Addressing these issues" added back if it was the split point)
    const line2 = summary.includes("Addressing these issues") 
      ? "Addressing these issues" + parts[1]
      : parts[1];
    return [line1, line2];
  }
  
  // If we can't split nicely, return the whole summary as line 1 and a generic line 2
  return [
    summary,
    "Focus on these key areas to significantly improve viewer engagement and effectiveness."
  ];
};

/**
 * Add bold formatting to key phrases in a suggestion
 * @param {string} suggestion - The original suggestion text
 * @returns {string} - Suggestion with key phrases in bold
 */
const addBoldToKeyPhrases = (suggestion) => {
  // List of key phrases to make bold
  const keyPhrases = [
    "product or service", "brand", "relevant details", "irrelevant tangents",
    "demonstrate the product", "features and benefits", "improve lighting",
    "better camera", "video quality", "clearly show", "demonstrate its features",
    "how the product works", "benefits it provides", "professionalism",
    "viewer retention", "product messaging", "effectiveness"
  ];
  
  let enhancedText = suggestion;
  
  // Replace each key phrase with its bold version
  keyPhrases.forEach(phrase => {
    const regex = new RegExp(`(${phrase})`, 'gi');
    enhancedText = enhancedText.replace(regex, '**$1**');
  });
  
  return enhancedText;
};

/**
 * Generate a concise summary based on the scores
 * @param {Array} categoryScores - The category scores
 * @param {number} totalScore - The total score
 * @returns {string} - A concise summary paragraph
 */
const generateConciseSummary = (categoryScores, totalScore) => {
  // Find strongest and weakest categories
  let strongest = { name: '', score: 0 };
  let weakest = { name: '', score: 10 };
  
  categoryScores.forEach(category => {
    const score = parseInt(category.score);
    if (score > strongest.score) {
      strongest = { name: category.name, score: score };
    }
    if (score < weakest.score) {
      weakest = { name: category.name, score: score };
    }
  });
  
  // Generate appropriate summary based on total score
  let summaryText = '';
  
  if (totalScore >= 8) {
    summaryText = `This video is *excellent* with strong ${strongest.name.toLowerCase()} (${strongest.score}/10). Minor improvements to ${weakest.name.toLowerCase()} would further enhance overall effectiveness.`;
  } else if (totalScore >= 6) {
    summaryText = `This video is *good* with adequate ${strongest.name.toLowerCase()} (${strongest.score}/10). Focus on improving ${weakest.name.toLowerCase()} (${weakest.score}/10) to enhance viewer engagement and message clarity.`;
  } else if (totalScore >= 4) {
    summaryText = `This video *requires significant improvements* to be effective. While ${strongest.name.toLowerCase()} (${strongest.score}/10) shows some promise, major enhancements to ${weakest.name.toLowerCase()} (${weakest.score}/10) are needed. Addressing these issues will improve viewer retention and message effectiveness.`;
  } else {
    summaryText = `This video needs a *complete overhaul* to improve ${weakest.name.toLowerCase()}, ${getSecondWeakestCategory(categoryScores, weakest.name)}, and overall quality. Addressing these issues will enhance professionalism, viewer retention, and product messaging effectiveness.`;
  }
  
  return summaryText;
};

/**
 * Get the second weakest category name
 * @param {Array} categoryScores - The category scores
 * @param {string} weakestName - The name of the weakest category to exclude
 * @returns {string} - The name of the second weakest category
 */
const getSecondWeakestCategory = (categoryScores, weakestName) => {
  let secondWeakest = { name: '', score: 10 };
  
  categoryScores.forEach(category => {
    const score = parseInt(category.score);
    if (category.name !== weakestName && score < secondWeakest.score) {
      secondWeakest = { name: category.name, score: score };
    }
  });
  
  return secondWeakest.name.toLowerCase();
};

/**
 * Get a description based on the total score
 * @param {number} score - The total score
 * @returns {string} - A description of the score
 */
const getScoreDescription = (score) => {
  if (score >= 9) return "This video is excellent and highly effective.";
  if (score >= 7) return "This video is good with minor areas for improvement.";
  if (score >= 5) return "This video is average and has several areas for improvement.";
  if (score >= 3) return "This video requires significant improvements to be effective.";
  return "This video needs a complete overhaul to be effective.";
};

/**
 * Get an emoji for a category
 * @param {string} category - The category name
 * @returns {string} - An emoji representing the category
 */
const getCategoryEmoji = (category) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('clarity')) return '🔍';
  if (lowerCategory.includes('relevance')) return '🎯';
  if (lowerCategory.includes('engagement')) return '💫';
  if (lowerCategory.includes('quality')) return '🎬';
  if (lowerCategory.includes('authenticity')) return '✨';
  if (lowerCategory.includes('persuasiveness')) return '🔊';
  if (lowerCategory.includes('talking head')) return '👤';
  if (lowerCategory.includes('product demonstration')) return '🔍';
  return '📌';
};

/**
 * Extract category scores from the markdown
 * @param {string} markdown - The original markdown
 * @returns {Array} - Array of category objects with name, score, and description
 */
const extractCategoryScores = (markdown) => {
  const categories = [];
  const categoryRegex = /\*\*(.*?):\*\* (\d+) - (.*?)(?=\n|$)/g;
  
  let match;
  while ((match = categoryRegex.exec(markdown)) !== null) {
    categories.push({
      name: match[1],
      score: match[2],
      description: match[3].trim()
    });
  }
  
  return categories;
};

/**
 * Extract improvement suggestions from the markdown
 * @param {string} markdown - The original markdown
 * @returns {Array} - Array of improvement objects with category and suggestions
 */
const extractImprovements = (markdown) => {
  const improvements = [];
  
  // Check if there's a Suggested Improvements section
  if (markdown.includes('Suggested Improvements')) {
    const improvementSection = markdown.split('Suggested Improvements')[1];
    
    // Extract individual category improvements
    const categoryRegex = /\*\*(.*?):\*\* (.*?)(?=\n\n|\*\*|$)/gs;
    
    let match;
    while ((match = categoryRegex.exec(improvementSection)) !== null) {
      const category = match[1];
      const suggestionsText = match[2];
      
      // Split the suggestions by periods or bullet points
      const suggestionsList = suggestionsText
        .split(/\.\s+|•\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.endsWith('.') && s !== '-')
        .map(s => s.endsWith('.') ? s : s + '.');
      
      improvements.push({
        category,
        suggestions: suggestionsList
      });
    }
  }
  
  return improvements;
};

module.exports = {
  enhanceMarkdown
}; 