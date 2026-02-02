"""
Simplified AI Model Training without sklearn dependencies
Uses a simple rule-based + TF-IDF hybrid approach
"""

import pickle
import os
import re
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).resolve().parent


def simple_tokenize(text):
    """Simple text tokenization."""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text.split()


def calculate_tf_idf(docs, labels):
    """Calculate simple TF-IDF manually."""
    all_words = set()
    
    # Collect all unique words
    for doc in docs:
        all_words.update(simple_tokenize(doc))
    
    # Calculate word frequencies
    word_to_dept = {word: {} for word in all_words}
    
    for doc, label in zip(docs, labels):
        tokens = simple_tokenize(doc)
        for word in set(tokens):
            if label not in word_to_dept[word]:
                word_to_dept[word][label] = 0
            word_to_dept[word][label] += 1
    
    return word_to_dept, all_words


def train_model_simple():
    """Train a simple model without ML libraries."""
    
    print("=" * 60)
    print("🤖 CivicPulse AI Model Training (Simplified)")
    print("=" * 60)
    
    # Load dataset
    csv_path = BASE_DIR / "data" / "complaints.csv"
    print(f"\n📂 Loading training data from: {csv_path}")
    
    # Simple CSV reading
    docs = []
    labels = []
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            for i, line in enumerate(lines[1:]):  # Skip header
                if not line.strip():
                    continue
                # Simple CSV parsing
                parts = line.strip().rsplit(',', 1)
                if len(parts) == 2:
                    text = parts[0].strip().strip('"')
                    dept = parts[1].strip()
                    docs.append(text)
                    labels.append(dept)
        
        print(f"✅ Loaded {len(docs)} training examples")
    except Exception as e:
        print(f"❌ Error loading CSV: {str(e)}")
        return False
    
    # Display dataset info
    dept_counts = Counter(labels)
    print(f"\n📊 Dataset Information:")
    print(f"   - Total samples: {len(docs)}")
    print(f"   - Departments: {len(dept_counts)}")
    print(f"\n   Department distribution:")
    for dept, count in sorted(dept_counts.items()):
        print(f"      {dept}: {count}")
    
    # Train model (simple approach)
    print(f"\n🧠 Training Model (Keyword + Rule-based)...")
    
    # Build keyword model
    keyword_model = {}
    for dept in dept_counts.keys():
        keyword_model[dept] = {'keywords': set(), 'count': 0}
    
    # Extract keywords for each department
    for doc, label in zip(docs, labels):
        tokens = simple_tokenize(doc)
        keyword_model[label]['keywords'].update(tokens)
        keyword_model[label]['count'] += 1
    
    print(f"✅ Model training complete")
    
    # Save model
    print(f"\n💾 Saving trained model...")
    model_path = BASE_DIR / "model.pkl"
    
    model_data = {
        'keyword_model': keyword_model,
        'docs': docs,
        'labels': labels,
        'departments': list(dept_counts.keys())
    }
    
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)
    print(f"✅ Model saved: {model_path}")
    
    # Test predictions
    print(f"\n🧪 Testing predictions on sample data:")
    test_texts = [
        "Water pipe is leaking in my street",
        "Pothole on main road is dangerous",
        "Street lights not working at night"
    ]
    
    try:
        from predict import predict_department
        
        for text in test_texts:
            pred = predict_department(text)
            print(f"\n   Input: '{text}'")
            print(f"   Predicted: {pred}")
    except Exception as e:
        print(f"\n   (Skipping test predictions: {e})")
    
    print(f"\n" + "=" * 60)
    print(f"✅ AI Model Training Complete!")
    print(f"=" * 60)
    
    return True


if __name__ == "__main__":
    train_model_simple()
