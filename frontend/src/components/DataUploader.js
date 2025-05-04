import React, { useState } from 'react';
import { Form, Button, Alert, Card, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';

const DataUploader = ({ apiUrl, onDatasetUploaded, onError }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      setFile(null);
      onError('Please select a valid CSV file');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      onError('Please select a file to upload');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiUrl}/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPreview(response.data);
      onDatasetUploaded(response.data);
    } catch (error) {
      console.error('Error uploading file:', error);
      onError(error.response?.data?.detail || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Upload Dataset</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleUpload}>
            <Form.Group className="mb-3">
              <Form.Label>Select CSV File</Form.Label>
              <Form.Control 
                type="file" 
                accept=".csv" 
                onChange={handleFileChange}
                disabled={loading}
              />
              <Form.Text className="text-muted">
                Please upload a CSV file with a target column and features.
              </Form.Text>
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Uploading...
                </>
              ) : (
                'Upload Dataset'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {preview && (
        <div>
          <h3>Dataset Preview</h3>
          <p>
            <strong>Filename:</strong> {preview.filename}<br />
            <strong>Rows:</strong> {preview.rows}<br />
          </p>

          <h4>Sample Data</h4>
          {preview.sample_data && preview.sample_data.length > 0 && (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    {Object.keys(preview.sample_data[0]).map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample_data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, valueIndex) => (
                        <td key={valueIndex}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <h4>Columns</h4>
          <div className="table-responsive">
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>Data Type</th>
                  <th>Categorical</th>
                </tr>
              </thead>
              <tbody>
                {preview.columns.map((column) => (
                  <tr key={column}>
                    <td>{column}</td>
                    <td>{preview.dtypes[column]}</td>
                    <td>
                      {preview.categorical_features[column] ? 
                        `Yes (${preview.categorical_features[column].length} values)` : 
                        'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <Alert variant="success">
            Dataset uploaded successfully! You can now proceed to the Train Model tab.
          </Alert>
        </div>
      )}
    </div>
  );
};

export default DataUploader;