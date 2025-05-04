import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Table, ProgressBar } from 'react-bootstrap';
import axios from 'axios';

const Predictor = ({ apiUrl, datasetInfo, modelInfo, onError }) => {
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [featureNames, setFeatureNames] = useState([]);

  useEffect(() => {
    // Initialize feature names from model info
    if (modelInfo) {
      const fetchModelInfo = async () => {
        try {
          const response = await axios.get(`${apiUrl}/model-info/`);
          setFeatureNames(response.data.feature_names);
          
          // Initialize form values
          const initialValues = {};
          response.data.feature_names.forEach(feature => {
            initialValues[feature] = '';
          });
          setFormValues(initialValues);
        } catch (error) {
          console.error('Error fetching model info:', error);
          onError('Error fetching model information');
        }
      };
      
      fetchModelInfo();
    }
  }, [apiUrl, modelInfo, onError]);

  const handleInputChange = (feature, value) => {
    // Format the value based on input type
    let formattedValue = value;
    
    // If it's a number input and not empty, convert to number
    if (getInputType(feature) === 'number' && value !== '') {
      formattedValue = parseFloat(value);
      
      // Check if it's actually an integer
      if (Number.isInteger(formattedValue)) {
        formattedValue = parseInt(value, 10);
      }
    }
    
    setFormValues({
      ...formValues,
      [feature]: formattedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all fields have values
    const emptyFields = Object.entries(formValues)
      .filter(([_, value]) => value === '')
      .map(([feature]) => feature);
    
    if (emptyFields.length > 0) {
      onError(`Please fill in values for: ${emptyFields.join(', ')}`);
      return;
    }
    
    // Validate numeric fields
    const invalidNumericFields = Object.entries(formValues)
      .filter(([feature, value]) => {
        // If it's supposed to be a number but isn't one
        return getInputType(feature) === 'number' && 
               typeof value === 'string' && 
               isNaN(parseFloat(value));
      })
      .map(([feature]) => feature);
    
    if (invalidNumericFields.length > 0) {
      onError(`Please enter valid numbers for: ${invalidNumericFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a formatted payload with proper data types
      const formattedFeatures = {};
      
      // Format values according to their expected type
      Object.entries(formValues).forEach(([feature, value]) => {
        if (getInputType(feature) === 'number' && typeof value === 'string') {
          // Convert string numbers to actual numbers
          const numValue = parseFloat(value);
          
          // Check if it should be an integer
          if (Number.isInteger(numValue)) {
            formattedFeatures[feature] = parseInt(value, 10);
          } else {
            formattedFeatures[feature] = numValue;
          }
        } else {
          formattedFeatures[feature] = value;
        }
      });
      
      console.log('Sending prediction request with features:', formattedFeatures);
      
      const response = await axios.post(`${apiUrl}/predict/`, {
        features: formattedFeatures
      });
      
      setPrediction(response.data);
    } catch (error) {
      console.error('Error making prediction:', error);
      onError(error.response?.data?.detail || 'Error making prediction');
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  // Determine input type based on column data
  const getInputType = (feature) => {
    if (!datasetInfo || !datasetInfo.categorical_features) return 'text';
    
    // If it's a categorical feature with defined values
    if (datasetInfo.categorical_features[feature]) {
      return 'select';
    }
    
    // Determine if it's likely a number based on dtype
    if (datasetInfo.dtypes && datasetInfo.dtypes[feature]) {
      const dtype = datasetInfo.dtypes[feature].toLowerCase();
      if (dtype.includes('int') || dtype.includes('float') || 
          dtype.includes('double') || dtype.includes('number')) {
        return 'number';
      }
    }
    
    // Check sample data as a backup method
    if (datasetInfo.sample_data && datasetInfo.sample_data.length > 0) {
      const sampleValue = datasetInfo.sample_data[0][feature];
      if (typeof sampleValue === 'number' || !isNaN(parseFloat(sampleValue))) {
        return 'number';
      }
    }
    
    return 'text';
  };

  return (
    <div>
      <h2 className="mb-4">Make Predictions</h2>
      
      <div className="row">
        <div className="col-md-6">
          <Card className="mb-4">
            <Card.Body>
              <h4 className="mb-3">Enter Feature Values</h4>
              
              <Form onSubmit={handleSubmit}>
                {featureNames.map(feature => (
                  <Form.Group className="mb-3" key={feature}>
                    <Form.Label>{feature}</Form.Label>
                    
                    {getInputType(feature) === 'select' ? (
                      <Form.Select
                        value={formValues[feature] || ''}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                        required
                      >
                        <option value="">Select a value</option>
                        {datasetInfo.categorical_features[feature].map(value => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Form.Select>
                    ) : getInputType(feature) === 'number' ? (
                      <Form.Control
                        type="number"
                        step="any"
                        value={formValues[feature] || ''}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                        required
                      />
                    ) : (
                      <Form.Control
                        type="text"
                        value={formValues[feature] || ''}
                        onChange={(e) => handleInputChange(feature, e.target.value)}
                        required
                      />
                    )}
                    
                    {datasetInfo.categorical_features[feature] && (
                      <Form.Text className="text-muted">
                        Categorical feature with {datasetInfo.categorical_features[feature].length} possible values
                      </Form.Text>
                    )}
                  </Form.Group>
                ))}
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || featureNames.length === 0}
                  className="mt-2"
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Predicting...
                    </>
                  ) : (
                    'Make Prediction'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-6">
          {prediction && (
            <Card className="mb-4">
              <Card.Header>
                <h4 className="my-0">Prediction Results</h4>
              </Card.Header>
              <Card.Body>
                <Alert variant="success" className="text-center mb-4">
                  <h2 className="mb-0">
                    Predicted Class: <strong>{prediction.prediction}</strong>
                  </h2>
                </Alert>
                
                {/* Class Probabilities */}
                <h5>Class Probabilities</h5>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Probability</th>
                      <th>Visualization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prediction.probabilities).sort((a, b) => b[1] - a[1]).map(([className, probability]) => (
                      <tr key={className}>
                        <td>
                          {className}
                          {className === String(prediction.prediction) && (
                            <span className="ms-2 badge bg-success">
                              Predicted
                            </span>
                          )}
                        </td>
                        <td>{(probability * 100).toFixed(2)}%</td>
                        <td>
                          <ProgressBar 
                            now={probability * 100} 
                            variant={className === String(prediction.prediction) ? "success" : "info"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {/* Decision Path */}
                <h5>Decision Path</h5>
                <div className="decision-path mb-3">
                  <ol className="list-group list-group-numbered">
                    {prediction.decision_path.map((decision, index) => (
                      <li key={index} className="list-group-item">
                        {decision}
                      </li>
                    ))}
                  </ol>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predictor;