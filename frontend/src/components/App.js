import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VideoSubmitForm from './VideoSubmitForm';
import ProcessingScreen from './ProcessingScreen';
import EvaluationResults from './EvaluationResults';
import ThankYouScreen from './ThankYouScreen';

const App = () => {
  return (
    <div className="container">
      <h1>Video Review Analyzer</h1>
      <Routes>
        <Route path="/" element={<VideoSubmitForm />} />
        <Route path="/processing" element={<ProcessingScreen />} />
        <Route path="/results" element={<EvaluationResults />} />
        <Route path="/thank-you" element={<ThankYouScreen />} />
      </Routes>
    </div>
  );
};

export default App; 