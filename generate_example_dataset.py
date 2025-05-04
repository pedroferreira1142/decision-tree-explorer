import pandas as pd
import numpy as np
from sklearn.datasets import make_classification

# Set random seed for reproducibility
np.random.seed(42)

# Generate a synthetic classification dataset
X, y = make_classification(
    n_samples=200,
    n_features=5,
    n_informative=3,
    n_redundant=1,
    n_classes=2,
    weights=[0.7, 0.3],
    random_state=42
)

# Create feature names
feature_names = ['age', 'income', 'education_years', 'debt_ratio', 'credit_score']

# Create a DataFrame
df = pd.DataFrame(X, columns=feature_names)

# Scale the features to more realistic ranges
df['age'] = (df['age'] * 10 + 35).round().astype(int)  # Age between 25-55 roughly
df['income'] = (df['income'] * 20000 + 50000).round(-2)  # Income between 30k-70k
df['education_years'] = (df['education_years'] * 4 + 12).round().clip(8, 22).astype(int)  # Education between 8-22 years
df['debt_ratio'] = (df['debt_ratio'] * 0.2 + 0.3).round(2).clip(0, 0.8)  # Debt ratio between 0.1-0.5
df['credit_score'] = (df['credit_score'] * 200 + 650).round().astype(int).clip(400, 850)  # Credit scores between 450-850

# Add categorical variables
job_categories = ['Professional', 'Technical', 'Management', 'Service', 'Office']
df['job_type'] = np.random.choice(job_categories, size=len(df))

home_status = ['Own', 'Mortgage', 'Rent']
df['home_status'] = np.random.choice(home_status, size=len(df))

# Add target variable (loan approval status)
df['loan_approved'] = y.astype(int)
df['loan_approved'] = df['loan_approved'].map({0: 'Denied', 1: 'Approved'})

# Introduce some patterns to make the decision tree more meaningful
# Higher credit scores more likely to be approved
condition = (df['credit_score'] > 700) & (df['debt_ratio'] < 0.4)
df.loc[condition, 'loan_approved'] = 'Approved'

# Lower credit scores more likely to be denied
condition = (df['credit_score'] < 600) & (df['debt_ratio'] > 0.5)
df.loc[condition, 'loan_approved'] = 'Denied'

# Save the dataset to a CSV file
df.to_csv('loan_approval_data.csv', index=False)

print("Example dataset created: loan_approval_data.csv")
print(f"Shape: {df.shape}")
print("\nDataset preview:")
print(df.head(5))

# Print some statistics
print("\nStatistics:")
print(f"Approval Rate: {(df['loan_approved'] == 'Approved').mean():.2f}")
print("\nFeature Distributions:")
print(df.describe().round(2).T)

print("\nCategorical Distributions:")
for col in ['job_type', 'home_status', 'loan_approved']:
    print(f"\n{col}:")
    print(df[col].value_counts(normalize=True).round(3) * 100)