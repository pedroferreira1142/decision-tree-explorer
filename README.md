# Decision Tree Explorer

A full-stack web application that demonstrates the usability of Decision Trees in machine learning. This project includes a FastAPI backend and a React frontend, allowing users to upload datasets, train decision tree models, visualize them, and make predictions.


## Features

- **Data Upload**: Upload CSV datasets to analyze with decision trees
- **Model Training**: Configure and train decision tree models with adjustable parameters
- **Visualization**: View the trained tree structure, feature importance, and model metrics
- **Prediction**: Make predictions using the trained model and see decision paths

## Tech Stack

- **Backend**: Python, FastAPI, Scikit-learn
- **Frontend**: React, React-Bootstrap, Axios
- **Containerization**: Docker, Docker Compose

## Project Structure

```
decision-tree-explorer/
│
├── backend/                     # FastAPI backend
│   ├── main.py                  # Main API file
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend Docker configuration
│
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── App.js               # Main application component
│   │   ├── App.css              # Application styles
│   │   └── components/          # React components
│   │       ├── DataUploader.js  # Data upload component
│   │       ├── ModelTrainer.js  # Model training component
│   │       ├── ModelVisualizer.js # Visualization component
│   │       └── Predictor.js     # Prediction component
│   ├── package.json             # Node.js dependencies
│   └── Dockerfile               # Frontend Docker configuration
│
├── docker-compose.yml           # Docker Compose configuration
└── README.md                    # Project documentation
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.9+ (for local development)

### Installation and Setup

#### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/decision-tree-explorer.git
   cd decision-tree-explorer
   ```

2. Create the project structure:
   ```bash
   mkdir -p backend frontend/src/components
   ```

3. Copy all the provided files into their respective directories.

4. Build and run the containers:
   ```bash
   docker-compose up --build
   ```

5. Access the application at [http://localhost:3000](http://localhost:3000)

#### Manual Setup (Development)

1. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. Access the application at [http://localhost:3000](http://localhost:3000)

## Usage Guide

### 1. Upload a Dataset

- Click on the "1. Upload Data" tab
- Select a CSV file from your computer
- View the dataset preview and column information

### 2. Train a Model

- Move to the "2. Train Model" tab
- Select a target column (what you want to predict)
- Select feature columns (what you want to use for prediction)
- Configure model parameters:
  - Test size: Proportion of data to use for testing
  - Max depth: Maximum depth of the tree (leave empty for unlimited)
  - Min samples split: Minimum samples required to split a node
  - Random state: Random seed for reproducibility
- Click "Train Model"

### 3. Visualize the Model

- Explore the "3. Visualize" tab
- View the decision tree diagram
- Check feature importance rankings
- Review classification metrics

### 4. Make Predictions

- Go to the "4. Predict" tab
- Enter values for each feature
- Click "Make Prediction" to get results
- Review the prediction, class probabilities, and decision path

## Sample Datasets

You can use these sample datasets to test the application:

- [Iris Dataset](https://archive.ics.uci.edu/ml/datasets/iris)
- [Titanic Dataset](https://www.kaggle.com/c/titanic/data)
- [Wine Quality Dataset](https://archive.ics.uci.edu/ml/datasets/wine+quality)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Scikit-learn for their implementation of decision trees
- FastAPI for the backend framework
- React and React-Bootstrap for the frontend components