"""
AI Model Training Script
This script trains a TF-IDF + Logistic Regression model on complaint data
to automatically classify complaints into departments.

Usage:
    python app/ai/train_model.py

Output:
    - app/ai/model.pkl (trained model)
    - app/ai/vectorizer.pkl (fitted vectorizer)
"""

import pandas as pd
import pickle
import os
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Get the directory of this script
BASE_DIR = Path(__file__).resolve().parent


def train_model():
    """Train the AI model for department classification."""
    
    print("=" * 60)
    print("🤖 CivicPulse AI Model Training")
    print("=" * 60)
    
    # Load dataset
    csv_path = BASE_DIR / "data" / "complaints.csv"
    print(f"\n📂 Loading training data from: {csv_path}")
    
    try:
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} training examples")
    except FileNotFoundError:
        print(f"❌ Error: Could not find {csv_path}")
        return False
    
    # Display dataset info
    print(f"\n📊 Dataset Information:")
    print(f"   - Total samples: {len(df)}")
    print(f"   - Departments: {df['department'].nunique()}")
    print(f"\n   Department distribution:")
    print(df['department'].value_counts())
    
    # Prepare data
    X = df["text"]
    y = df["department"]
    
    # Split data (80-20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"\n📈 Data Split:")
    print(f"   - Training samples: {len(X_train)}")
    print(f"   - Test samples: {len(X_test)}")
    
    # Text vectorization
    print(f"\n🔤 Text Vectorization (TF-IDF)...")
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=100,
        min_df=1,
        max_df=0.9
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    print(f"✅ Created TF-IDF vectors with {X_train_vec.shape[1]} features")
    
    # Train model
    print(f"\n🧠 Training Logistic Regression Model...")
    model = LogisticRegression(max_iter=1000, random_state=42, n_jobs=-1)
    model.fit(X_train_vec, y_train)
    print(f"✅ Model training complete")
    
    # Evaluate model
    print(f"\n📊 Model Evaluation:")
    y_train_pred = model.predict(X_train_vec)
    y_test_pred = model.predict(X_test_vec)
    
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    
    print(f"\n   Training Accuracy: {train_accuracy:.2%}")
    print(f"   Test Accuracy:     {test_accuracy:.2%}")
    
    print(f"\n📋 Classification Report (Test Set):")
    print(classification_report(y_test, y_test_pred))
    
    print(f"\n🔥 Confusion Matrix (Test Set):")
    cm = confusion_matrix(y_test, y_test_pred)
    print(cm)
    
    # Save model
    print(f"\n💾 Saving trained model...")
    model_path = BASE_DIR / "model.pkl"
    vectorizer_path = BASE_DIR / "vectorizer.pkl"
    
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"✅ Model saved: {model_path}")
    
    with open(vectorizer_path, "wb") as f:
        pickle.dump(vectorizer, f)
    print(f"✅ Vectorizer saved: {vectorizer_path}")
    
    # Test predictions
    print(f"\n🧪 Testing predictions on sample data:")
    test_texts = [
        "Water pipe is leaking in my street",
        "Pothole on main road is dangerous",
        "Street lights not working at night"
    ]
    
    for text in test_texts:
        X_sample = vectorizer.transform([text])
        pred = model.predict(X_sample)[0]
        proba = model.predict_proba(X_sample)[0]
        confidence = max(proba)
        print(f"\n   Input: '{text}'")
        print(f"   Predicted: {pred} (confidence: {confidence:.2%})")
    
    print(f"\n" + "=" * 60)
    print(f"✅ AI Model Training Complete!")
    print(f"=" * 60)
    
    return True


if __name__ == "__main__":
    train_model()
