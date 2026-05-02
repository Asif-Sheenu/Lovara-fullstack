import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
df = pd.read_csv("data/weather.csv")

# Drop rows with missing values
df = df.dropna()

df['Month'] = pd.to_datetime(df['Date']).dt.month

# Convert Yes/No to 1/0
df['RainTomorrow'] = df['RainTomorrow'].map({'Yes': 1, 'No': 0})

# Select features (keep it simple for now)
features = [
    'MinTemp', 'MaxTemp', 'Rainfall',
    'Humidity9am', 'Humidity3pm',
    'Pressure9am', 'Pressure3pm', 'Month'
]

X = df[features]
y = df['RainTomorrow']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save model
pickle.dump(model, open("app/models/rain_model.pkl", "wb"))

print("Model trained and saved !")