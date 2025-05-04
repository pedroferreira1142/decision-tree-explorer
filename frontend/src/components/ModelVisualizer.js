import React, { useState } from 'react';
import { Card, Tabs, Tab, Table, ProgressBar, Button, Modal } from 'react-bootstrap';

const ModelVisualizer = ({ modelInfo }) => {
  const [showTextTree, setShowTextTree] = useState(false);

  if (!modelInfo) {
    return <div>No model information available.</div>;
  }

  // Sort features by importance
  const sortedFeatureImportance = Object.entries(modelInfo.feature_importance || {})
    .sort((a, b) => b[1] - a[1]);

  // Format classification report
  const formatReport = () => {
    if (!modelInfo.classification_report) return null;
    
    const report = modelInfo.classification_report;
    
    // Get class names and metrics
    const classes = Object.keys(report).filter(
      key => !['accuracy', 'macro avg', 'weighted avg'].includes(key)
    );
    
    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Class</th>
              <th>Precision</th>
              <th>Recall</th>
              <th>F1-Score</th>
              <th>Support</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(className => (
              <tr key={className}>
                <td>{className}</td>
                <td>{report[className].precision.toFixed(3)}</td>
                <td>{report[className].recall.toFixed(3)}</td>
                <td>{report[className]['f1-score'].toFixed(3)}</td>
                <td>{report[className].support}</td>
              </tr>
            ))}
            
            {/* Add averages */}
            <tr className="table-secondary">
              <td><strong>Macro Avg</strong></td>
              <td>{report['macro avg'].precision.toFixed(3)}</td>
              <td>{report['macro avg'].recall.toFixed(3)}</td>
              <td>{report['macro avg']['f1-score'].toFixed(3)}</td>
              <td>{report['macro avg'].support}</td>
            </tr>
            <tr className="table-secondary">
              <td><strong>Weighted Avg</strong></td>
              <td>{report['weighted avg'].precision.toFixed(3)}</td>
              <td>{report['weighted avg'].recall.toFixed(3)}</td>
              <td>{report['weighted avg']['f1-score'].toFixed(3)}</td>
              <td>{report['weighted avg'].support}</td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div>
      <h2 className="mb-4">Model Visualization</h2>
      
      <div className="row mb-4">
        <div className="col-md-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="display-4">{(modelInfo.accuracy * 100).toFixed(1)}%</h3>
              <p className="lead">Accuracy</p>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="display-4">{modelInfo.tree_depth}</h3>
              <p className="lead">Tree Depth</p>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="display-4">{modelInfo.tree_nodes}</h3>
              <p className="lead">Total Nodes</p>
            </Card.Body>
          </Card>
        </div>
        
        <div className="col-md-3">
          <Card className="text-center h-100">
            <Card.Body>
              <Button 
                variant="outline-primary"
                onClick={() => setShowTextTree(true)}
                className="mt-2"
              >
                View Text Tree
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
      
      <Tabs defaultActiveKey="tree" className="mb-4">
        <Tab eventKey="tree" title="Tree Visualization">
          <Card>
            <Card.Body>
              <div className="text-center">
                {modelInfo.tree_visualization && (
                  <a 
                    href={`data:image/png;base64,${modelInfo.tree_visualization}`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <img 
                      src={`data:image/png;base64,${modelInfo.tree_visualization}`} 
                      alt="Decision Tree Visualization"
                      className="img-fluid tree-visualization mb-3"
                      style={{ maxWidth: '100%', maxHeight: '600px' }}
                    />
                  </a>
                )}
                <p className="text-muted">Click on image to open in full size (new tab)</p>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="importance" title="Feature Importance">
          <Card>
            <Card.Body>
              <h4 className="mb-3">Feature Importance</h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Feature</th>
                      <th>Importance</th>
                      <th>Visualization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFeatureImportance.map(([feature, importance]) => (
                      <tr key={feature}>
                        <td>{feature}</td>
                        <td>{importance.toFixed(4)}</td>
                        <td>
                          <ProgressBar 
                            now={importance * 100} 
                            variant="info" 
                            label={`${(importance * 100).toFixed(1)}%`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="metrics" title="Classification Metrics">
          <Card>
            <Card.Body>
              <h4 className="mb-3">Classification Report</h4>
              {formatReport()}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      
      {/* Text Tree Modal */}
      <Modal 
        show={showTextTree} 
        onHide={() => setShowTextTree(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Decision Tree Text Representation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <pre className="tree-text-view">
            {modelInfo.tree_text}
          </pre>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTextTree(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ModelVisualizer;