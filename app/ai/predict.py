"""
AI Prediction Module
Predicts department for a complaint based on keywords and rule-based matching.
"""

import pickle
import os
import re
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Get the directory of this script
BASE_DIR = Path(__file__).resolve().parent

# Load trained model path
MODEL_PATH = BASE_DIR / "model.pkl"

# Global variable to store loaded model
_model = None


def simple_tokenize(text):
    """Simple text tokenization."""
    text = text.lower()
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    return text.split()


def load_model():
    """Load the trained model."""
    global _model
    
    if _model is not None:
        return True
    
    try:
        if MODEL_PATH.exists():
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
            logger.info("✅ Model loaded successfully")
            return True
        else:
            logger.debug("Model file not found. Using keyword-based fallback.")
            return False
    
    except Exception as e:
        logger.error(f"❌ Error loading model: {str(e)}")
        return False


def predict_department(text, return_confidence=False):
    """
    Predict the department for a complaint based on its text.
    
    Args:
        text (str): The complaint description text
        return_confidence (bool): If True, return tuple (department, confidence)
    
    Returns:
        str: Predicted department name
        tuple: (department, confidence) if return_confidence=True
    """
    
    if not text or not isinstance(text, str):
        return ("Other", 0.0) if return_confidence else "Other"
    
    # Try ML model first
    if load_model() and _model is not None:
        try:
            tokens = simple_tokenize(text)
            token_set = set(tokens)
            
            # Score each department based on matching keywords
            scores = {}
            for dept, model_data in _model.get('keyword_model', {}).items():
                keywords = model_data.get('keywords', set())
                matches = len(token_set & keywords)
                if matches > 0:
                    scores[dept] = matches
            
            if scores:
                best_dept = max(scores, key=scores.get)
                confidence = min(scores[best_dept] / 5.0, 1.0)  # Normalize confidence
                
                if return_confidence:
                    return (best_dept, float(confidence))
                return best_dept
        except Exception as e:
            logger.debug(f"ML prediction failed: {e}. Using fallback.")
    
    # Fallback to keyword-based prediction
    return predict_department_fallback(text, return_confidence)


def predict_department_fallback(text, return_confidence=False):
    """
    Fallback department prediction using keyword matching.
    Used when ML model is not available.
    
    Args:
        text (str): The complaint description text
        return_confidence (bool): If True, return tuple (department, confidence)
    
    Returns:
        str: Predicted department based on keywords
        tuple: (department, confidence) if return_confidence=True
    """
    
    from .constants import DEPARTMENT_KEYWORDS
    
    if not text:
        return ("Other", 0.0) if return_confidence else "Other"
    
    text_lower = text.lower()
    scores = {}
    
    # Score each department based on keyword matches
    for dept, keywords in DEPARTMENT_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in text_lower)
        if score > 0:
            scores[dept] = score
    
    if not scores:
        confidence = 0.0
        department = "Other"
    else:
        # Get department with highest score
        department = max(scores, key=scores.get)
        confidence = min(scores[department] / len(DEPARTMENT_KEYWORDS[department]), 1.0)
    
    if return_confidence:
        return (department, float(confidence))
    return department


def get_all_departments():
    """Return list of all possible departments."""
    from .constants import DEPARTMENTS
    return DEPARTMENTS
