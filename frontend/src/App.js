import React, { useState } from 'react';
import { Container, Tabs, Tab, Card, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import components
import DataUploader from './components/DataUploader';
import ModelTrainer from './components/ModelTrainer';
import ModelVisualizer from './components/ModelVisualizer';
import Predictor from './components/Predictor';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);
  const [apiUrl] = useState('http://localhost:8000'); // Change this to your API URL

  const handleDatasetUploaded = (data) => {
    setDatasetInfo(data);
    setActiveTab('train');
  };

  const handleModelTrained = (data) => {
    setModelInfo(data);
    setActiveTab('visualize');
  };

  return (
    <Container fluid className="app-container">
      <header className="text-center my-4">
        <h1>Decision Tree Explorer</h1>
        <p className="lead">Upload data, train a decision tree model, visualize it, and make predictions</p>
      </header>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Card className="main-card">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
            <Tab eventKey="upload" title="1. Upload Data">
              <DataUploader 
                apiUrl={apiUrl}
                onDatasetUploaded={handleDatasetUploaded}
                onError={setError}
              />
            </Tab>
            
            <Tab eventKey="train" title="2. Train Model" disabled={!datasetInfo}>
              <ModelTrainer 
                apiUrl={apiUrl}
                datasetInfo={datasetInfo}
                onModelTrained={handleModelTrained}
                onError={setError}
              />
            </Tab>
            
            <Tab eventKey="visualize" title="3. Visualize" disabled={!modelInfo}>
              <ModelVisualizer 
                modelInfo={modelInfo}
              />
            </Tab>
            
            <Tab eventKey="predict" title="4. Predict" disabled={!modelInfo}>
              <Predictor 
                apiUrl={apiUrl}
                datasetInfo={datasetInfo}
                modelInfo={modelInfo}
                onError={setError}
              />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <footer className="text-center mt-4 mb-2">
        <p>Decision Tree Explorer - A full-stack FastAPI and React application</p>
      </footer>
    </Container>
  );
}

export default App;