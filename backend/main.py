# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier, plot_tree, export_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import io
import json
import matplotlib.pyplot as plt
import base64
from typing import List, Dict, Any, Optional

app = FastAPI(title="Decision Tree API", description="API for training and visualizing decision trees")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, you may want to restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary storage for dataset and model
class AppState:
    def __init__(self):
        self.dataset = None
        self.model = None
        self.feature_names = None
        self.target_name = None
        self.features = None
        self.target = None
        self.categorical_features = {}

app_state = AppState()

class ModelParams(BaseModel):
    target_column: str
    feature_columns: List[str]
    test_size: float = 0.2
    max_depth: Optional[int] = None
    min_samples_split: int = 2
    random_state: int = 42

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

@app.get("/")
def read_root():
    return {"message": "Decision Tree API is running"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Check if file is a CSV
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    # Read the CSV file
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Store the dataset
        app_state.dataset = df
        
        # Get basic info about the dataset
        columns = df.columns.tolist()
        dtypes = df.dtypes.apply(lambda x: str(x)).to_dict()
        sample_data = df.head(5).to_dict(orient='records')
        
        # Identify categorical features
        app_state.categorical_features = {}
        for col in df.columns:
            if df[col].dtype == 'object' or df[col].nunique() < 10:
                app_state.categorical_features[col] = df[col].unique().tolist()
        
        return {
            "message": "File uploaded successfully",
            "filename": file.filename,
            "columns": columns,
            "dtypes": dtypes,
            "sample_data": sample_data,
            "categorical_features": app_state.categorical_features,
            "rows": len(df)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.post("/train/")
async def train_model(params: ModelParams):
    if app_state.dataset is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
    
    df = app_state.dataset
    
    # Validate column names
    all_columns = set(df.columns)
    if params.target_column not in all_columns:
        raise HTTPException(status_code=400, detail=f"Target column '{params.target_column}' not found in dataset")
    
    for feature in params.feature_columns:
        if feature not in all_columns:
            raise HTTPException(status_code=400, detail=f"Feature column '{feature}' not found in dataset")
    
    # Prepare features and target
    X = df[params.feature_columns].copy()
    y = df[params.target_column].copy()
    
    # Store original feature data for reference (before encoding)
    app_state.categorical_features = {}
    
    # Handle categorical features
    for col in X.columns:
        if X[col].dtype == 'object' or df[col].nunique() < 10:
            # Store the unique values for this categorical feature
            app_state.categorical_features[col] = X[col].unique().tolist()
            # Convert to categorical codes
            X[col] = pd.Categorical(X[col]).codes
    
    # Convert remaining columns to numeric where possible
    for col in X.columns:
        if col not in app_state.categorical_features:
            try:
                X[col] = pd.to_numeric(X[col])
            except:
                # If conversion fails, treat as categorical
                app_state.categorical_features[col] = X[col].unique().tolist()
                X[col] = pd.Categorical(X[col]).codes
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=params.test_size, random_state=params.random_state
    )
    
    # Train the model
    model = DecisionTreeClassifier(
        max_depth=params.max_depth, 
        min_samples_split=params.min_samples_split,
        random_state=params.random_state
    )
    model.fit(X_train, y_train)
    
    # Make predictions on test data
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    
    # Store the model and feature information
    app_state.model = model
    app_state.feature_names = params.feature_columns
    app_state.target_name = params.target_column
    app_state.features = X
    app_state.target = y
    
    # Debug info
    print(f"Categorical features detected: {app_state.categorical_features}")
    print(f"Feature dtypes after processing: {X.dtypes}")
    
    # Check if target is categorical and store its values
    if y.dtype == 'object' or df[params.target_column].nunique() < 10:
        app_state.categorical_features[params.target_column] = df[params.target_column].unique().tolist()
    
    # Generate tree visualization
    plt.figure(figsize=(20, 10))
    plot_tree(model, feature_names=params.feature_columns, class_names=[str(c) for c in model.classes_], 
              filled=True, rounded=True, fontsize=10)
    
    # Save plot to a buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    
    # Convert plot to base64 string
    plot_data = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    # Generate text representation of the tree
    tree_text = export_text(model, feature_names=params.feature_columns)
    
    return {
        "message": "Model trained successfully",
        "accuracy": accuracy,
        "classification_report": report,
        "tree_depth": model.get_depth(),
        "tree_nodes": model.tree_.node_count,
        "feature_importance": dict(zip(params.feature_columns, model.feature_importances_.tolist())),
        "tree_visualization": plot_data,
        "tree_text": tree_text
    }

@app.post("/predict/")
async def predict(request: PredictionRequest):
    if app_state.model is None:
        raise HTTPException(status_code=400, detail="No model trained. Please train a model first.")
    
    # Prepare the input features
    input_data = {}
    
    for feature in app_state.feature_names:
        if feature not in request.features:
            raise HTTPException(status_code=400, detail=f"Feature '{feature}' is missing in the request")
        input_data[feature] = request.features[feature]
    
    # Convert to DataFrame
    input_df = pd.DataFrame([input_data])
    
    # Handle data types and categorical features
    for col in input_df.columns:
        # Handle categorical features explicitly
        if col in app_state.categorical_features:
            # Store original value for checking
            original_value = input_df[col].iloc[0]
            
            # Check if categorical value is in training data
            if original_value not in app_state.categorical_features[col]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Value '{original_value}' for feature '{col}' was not in training data. Allowed values: {app_state.categorical_features[col]}"
                )
            
            # Convert categorical to code (integer index)
            categories = app_state.categorical_features[col]
            input_df[col] = categories.index(original_value)
        else:
            # For numerical features, ensure proper type conversion
            try:
                # Try to convert to numeric
                input_df[col] = pd.to_numeric(input_df[col])
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Feature '{col}' expected numeric value but got '{input_df[col].iloc[0]}'"
                )
    
    # Make prediction
    try:
        prediction = app_state.model.predict(input_df)[0]
        probabilities = app_state.model.predict_proba(input_df)[0].tolist()
        class_labels = app_state.model.classes_.tolist()
        
        # Get the decision path
        node_indicator = app_state.model.decision_path(input_df)
        leaf_id = app_state.model.apply(input_df)
        
        # Extract decision path
        sample_id = 0
        node_index = node_indicator.indices[node_indicator.indptr[sample_id]:
                                           node_indicator.indptr[sample_id + 1]]
        
        decision_path = []
        for node_id in node_index:
            # Continue to the next node if it's a leaf
            if leaf_id[sample_id] == node_id:
                continue
                
            # Get the feature used for this node
            feature = app_state.model.tree_.feature[node_id]
            feature_name = app_state.feature_names[feature]
            
            # Get the threshold for this node
            threshold = app_state.model.tree_.threshold[node_id]
            
            # Get the actual value from input
            value = input_df.iloc[0, feature]
            
            # Format the value based on whether it's categorical
            if feature_name in app_state.categorical_features:
                # Convert index back to category name for display
                categories = app_state.categorical_features[feature_name]
                value_display = categories[int(value)] if int(value) < len(categories) else value
                threshold_display = "N/A (category comparison)"
                
                # For categorical features we show a different message
                if value <= threshold:
                    decision = f"{feature_name} = '{value_display}' (category index: {value}) <= {threshold:.2f} (go left)"
                else:
                    decision = f"{feature_name} = '{value_display}' (category index: {value}) > {threshold:.2f} (go right)"
            else:
                # For numerical features
                if value <= threshold:
                    decision = f"{feature_name} = {value} <= {threshold:.2f} (go left)"
                else:
                    decision = f"{feature_name} = {value} > {threshold:.2f} (go right)"
            
            decision_path.append(decision)
        
        return {
            "prediction": prediction,
            "class_labels": class_labels,
            "probabilities": dict(zip([str(c) for c in class_labels], probabilities)),
            "decision_path": decision_path
        }
    except Exception as e:
        # Include more debugging info in the error
        error_message = f"Error making prediction: {str(e)}"
        print(f"Error details: {e}")
        print(f"Input data types: {input_df.dtypes}")
        raise HTTPException(status_code=500, detail=error_message)

@app.get("/model-info/")
async def model_info():
    if app_state.model is None:
        raise HTTPException(status_code=400, detail="No model trained. Please train a model first.")
    
    return {
        "feature_names": app_state.feature_names,
        "target_name": app_state.target_name,
        "tree_depth": app_state.model.get_depth(),
        "tree_nodes": app_state.model.tree_.node_count,
        "feature_importance": dict(zip(app_state.feature_names, app_state.model.feature_importances_.tolist())),
        "classes": app_state.model.classes_.tolist(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)