import React, { useState } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';

const ModelTrainer = ({ apiUrl, datasetInfo, onModelTrained, onError }) => {
  const [formData, setFormData] = useState({
    target_column: '',
    feature_columns: [],
    test_size: 0.2,
    max_depth: '',  // Empty string means 'None' (unlimited depth)
    min_samples_split: 2,
    random_state: 42
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'max_depth') {
      // Allow empty string (which will be null) or positive integers
      if (value === '' || parseInt(value) > 0) {
        setFormData({ ...formData, [name]: value });
      }
    } else if (name === 'min_samples_split' || name === 'random_state') {
      // Only positive integers for these fields
      if (parseInt(value) > 0) {
        setFormData({ ...formData, [name]: parseInt(value) });
      }
    } else if (name === 'test_size') {
      // Value between 0 and 1
      const numValue = parseFloat(value);
      if (numValue > 0 && numValue < 1) {
        setFormData({ ...formData, [name]: numValue });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFeatureToggle = (column) => {
    const currentFeatures = [...formData.feature_columns];
    
    if (currentFeatures.includes(column)) {
      // Remove column if already selected
      setFormData({
        ...formData,
        feature_columns: currentFeatures.filter(c => c !== column)
      });
    } else {
      // Add column if not already selected
      setFormData({
        ...formData,
        feature_columns: [...currentFeatures, column]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.target_column) {
      onError('Please select a target column');
      return;
    }
    
    if (formData.feature_columns.length === 0) {
      onError('Please select at least one feature column');
      return;
    }
    
    // Ensure the target column is not also selected as a feature
    if (formData.feature_columns.includes(formData.target_column)) {
      onError('Target column cannot also be a feature column');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare the payload (convert empty max_depth to null)
      const payload = {
        ...formData,
        max_depth: formData.max_depth === '' ? null : parseInt(formData.max_depth)
      };
      
      const response = await axios.post(`${apiUrl}/train/`, payload);
      onModelTrained(response.data);
    } catch (error) {
      console.error('Error training model:', error);
      onError(error.response?.data?.detail || 'Error training model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Train Decision Tree Model</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Target Column</Form.Label>
                  <Form.Select 
                    name="target_column"
                    value={formData.target_column}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select target column</option>
                    {datasetInfo?.columns.map(column => (
                      <option key={column} value={column}>
                        {column} {datasetInfo.categorical_features[column] ? 
                          `(Categorical - ${datasetInfo.categorical_features[column].length} classes)` : 
                          ''}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select the column you want to predict. Typically categorical.
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Test Size</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="test_size"
                    value={formData.test_size}
                    onChange={handleChange}
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    required
                  />
                  <Form.Text className="text-muted">
                    Proportion of data to use for testing (0.1 to 0.9)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Depth</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="max_depth"
                    value={formData.max_depth}
                    onChange={handleChange}
                    min="1"
                    placeholder="Unlimited"
                  />
                  <Form.Text className="text-muted">
                    Maximum depth of the tree (leave empty for unlimited)
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Min Samples Split</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="min_samples_split"
                    value={formData.min_samples_split}
                    onChange={handleChange}
                    min="2"
                    required
                  />
                  <Form.Text className="text-muted">
                    Minimum samples required to split a node
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Random State</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="random_state"
                    value={formData.random_state}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                  <Form.Text className="text-muted">
                    Random seed for reproducibility
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-4">
              <Form.Label>Feature Columns</Form.Label>
              <div className="feature-selector border rounded p-3">
                <Row>
                  {datasetInfo?.columns.map(column => (
                    <Col md={4} key={column}>
                      <Form.Check 
                        type="checkbox"
                        id={`feature-${column}`}
                        label={column}
                        checked={formData.feature_columns.includes(column)}
                        onChange={() => handleFeatureToggle(column)}
                        disabled={column === formData.target_column}
                        className="mb-2"
                      />
                    </Col>
                  ))}
                </Row>
              </div>
              <Form.Text className="text-muted">
                Select columns to use as features for prediction.
              </Form.Text>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading || !formData.target_column || formData.feature_columns.length === 0}
              className="mt-2"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Training Model...
                </>
              ) : (
                'Train Model'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {formData.target_column && datasetInfo?.categorical_features[formData.target_column] && (
        <Alert variant="info">
          <strong>Target Classes:</strong>{' '}
          {datasetInfo.categorical_features[formData.target_column].join(', ')}
        </Alert>
      )}
    </div>
  );
};

export default ModelTrainer;