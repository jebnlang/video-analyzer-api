import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';

const VideoSubmitForm = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Validation schema using Yup
  const validationSchema = Yup.object({
    videoUrl: Yup.string()
      .required('Video URL is required')
      .test(
        'is-valid-url',
        'Please enter a valid URL',
        value => {
          if (!value) return false;
          // Check for standard URLs (http://, https://)
          const standardUrlPattern = /^(https?:\/\/)/i;
          // Check for Google Cloud Storage URLs (gs://)
          const gcsUrlPattern = /^(gs:\/\/)/i;
          
          return standardUrlPattern.test(value) || gcsUrlPattern.test(value);
        }
      )
      .test(
        'is-supported-platform',
        'Please provide a URL from a supported video platform (YouTube, Vimeo, Google Drive, Dropbox, Loom, or Google Cloud Storage)',
        value => {
          if (!value) return false;
          
          // Check if it's a Google Cloud Storage URL
          if (value.startsWith('gs://')) {
            return true;
          }
          
          try {
            const url = new URL(value);
            const supportedPlatforms = [
              'youtube.com', 'youtu.be', 
              'vimeo.com', 
              'drive.google.com',
              'dropbox.com',
              'loom.com'
            ];
            return supportedPlatforms.some(platform => url.hostname.includes(platform));
          } catch (e) {
            return false;
          }
        }
      ),
    customCategories: Yup.array().of(
      Yup.string().nullable()
    ).nullable()
  });

  // Format custom category text to be more concise for display
  const formatCustomCategory = (text) => {
    if (!text) return '';
    
    // Remove common prefixes
    let formatted = text
      .replace(/^must\s+(have|include|contain|show)\s+a?\s*/i, '')
      .replace(/^should\s+(have|include|contain|show)\s+a?\s*/i, '')
      .replace(/^needs?\s+to\s+(have|include|contain|show)\s+a?\s*/i, '')
      .replace(/^requires?\s+a?\s*/i, '')
      .replace(/^includes?\s+a?\s*/i, '')
      .replace(/^has\s+a?\s*/i, '')
      .replace(/^add\s+a?\s*/i, '');
    
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    return formatted;
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Store the video URL in sessionStorage for use in other components
      sessionStorage.setItem('videoUrl', values.videoUrl);
      
      // Filter out empty categories before storing
      const filteredCategories = values.customCategories
        ? values.customCategories.filter(category => category && category.trim() !== '')
        : [];
      
      // Format custom categories for display
      const formattedCategories = filteredCategories.map(category => ({
        raw: category,
        formatted: formatCustomCategory(category)
      }));
        
      // Only store custom categories if there are any non-empty ones
      if (formattedCategories.length > 0) {
        sessionStorage.setItem('customCategories', JSON.stringify(formattedCategories));
      } else {
        // Remove any previously stored categories
        sessionStorage.removeItem('customCategories');
      }
      
      // Navigate to the processing page
      navigate('/processing');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>Submit Your Video Review</h2>
      <p>Please provide a link to your video review for evaluation. We support videos from YouTube, Vimeo, Google Drive, Dropbox, Loom, and Google Cloud Storage (gs://).</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <Formik
        initialValues={{ videoUrl: '', customCategories: [''] }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, isValid, dirty, values }) => (
          <Form>
            <div className="form-group">
              <label htmlFor="videoUrl">Video URL</label>
              <Field
                id="videoUrl"
                name="videoUrl"
                type="url"
                placeholder="Enter the URL of your video review"
              />
              <ErrorMessage name="videoUrl" component="div" className="error-message" />
            </div>
            
            <div className="form-group">
              <label>Custom Categories <span className="optional-label">(Optional)</span></label>
              <p className="field-description">
                Add specific requirements you want to evaluate in the video review, or leave blank to use our standard evaluation categories. 
                Custom categories will be used alongside our standard metrics to provide a more tailored analysis. Examples:
              </p>
              <ul className="criteria-examples">
                <li>Talking head</li>
                <li>Product demonstration</li>
                <li>Outdoor setting</li>
              </ul>
              
              <FieldArray name="customCategories">
                {({ remove, push }) => (
                  <div>
                    {values.customCategories.length > 0 &&
                      values.customCategories.map((category, index) => (
                        <div key={index} className="criteria-row">
                          <div className="criteria-input">
                            <Field
                              name={`customCategories.${index}`}
                              placeholder="e.g., Talking head, Product demo, Outdoor setting"
                              type="text"
                            />
                            <ErrorMessage
                              name={`customCategories.${index}`}
                              component="div"
                              className="error-message"
                            />
                          </div>
                          
                          <div className="criteria-buttons">
                            <button
                              type="button"
                              className="remove-button"
                              onClick={() => {
                                // Don't remove if it's the last one and empty
                                if (values.customCategories.length > 1) {
                                  remove(index);
                                } else if (values.customCategories.length === 1) {
                                  // If it's the only category, clear it instead of removing
                                  values.customCategories[0] = '';
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    
                    <button
                      type="button"
                      className="secondary add-button"
                      onClick={() => push('')}
                    >
                      + Add Another Category
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || !isValid || !dirty}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Video Review'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default VideoSubmitForm; 