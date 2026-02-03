"""
AI System Verification Script
Tests if the AI module is working correctly.

Usage:
    python app/ai/verify_ai.py
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def verify_ai_system():
    """Verify all AI components are working."""
    
    print("=" * 70)
    print("🤖 CivicPulse AI System Verification")
    print("=" * 70)
    
    all_passed = True
    
    # Test 1: Check if model file exists
    print("\n✓ Test 1: Model File")
    model_path = BASE_DIR / "model.pkl"
    if model_path.exists():
        size_kb = model_path.stat().st_size / 1024
        print(f"  ✅ Model found: {model_path}")
        print(f"  📊 Size: {size_kb:.2f} KB")
    else:
        print(f"  ❌ Model NOT found: {model_path}")
        all_passed = False
    
    # Test 2: Check if training data exists
    print("\n✓ Test 2: Training Data")
    csv_path = BASE_DIR / "data" / "complaints.csv"
    if csv_path.exists():
        with open(csv_path) as f:
            lines = len(f.readlines()) - 1  # Exclude header
        print(f"  ✅ Training data found: {csv_path}")
        print(f"  📊 Examples: {lines}")
    else:
        print(f"  ❌ Training data NOT found: {csv_path}")
        all_passed = False
    
    # Test 3: Check if constants exist
    print("\n✓ Test 3: Department Constants")
    try:
        from constants import DEPARTMENTS, DEPARTMENT_KEYWORDS
        print(f"  ✅ Constants loaded")
        print(f"  📊 Departments: {len(DEPARTMENTS)}")
        print(f"  📊 Keywords: {len(DEPARTMENT_KEYWORDS)}")
    except ImportError as e:
        print(f"  ❌ Failed to load constants: {e}")
        all_passed = False
    
    # Test 4: Test prediction function
    print("\n✓ Test 4: Prediction Function")
    try:
        from predict import predict_department
        
        test_cases = [
            ("Water pipe leaking", "Water"),
            ("Pothole on road", "Roads"),
            ("Street light broken", "Electricity"),
            ("Garbage pile", "Sanitation"),
        ]
        
        predictions_ok = True
        for text, expected in test_cases:
            dept = predict_department(text)
            status = "✅" if dept == expected else "⚠️"
            print(f"  {status} '{text}' → {dept} (expected: {expected})")
            if dept != expected:
                predictions_ok = False
        
        if predictions_ok:
            print(f"  ✅ All predictions correct!")
        else:
            print(f"  ⚠️ Some predictions unexpected (may need retraining)")
            all_passed = False
    
    except Exception as e:
        print(f"  ❌ Prediction failed: {e}")
        all_passed = False
    
    # Test 5: Test confidence scores
    print("\n✓ Test 5: Confidence Scores")
    try:
        from predict import predict_department
        
        dept, confidence = predict_department("Water pipe leaking", return_confidence=True)
        print(f"  ✅ Confidence scoring works")
        print(f"  📊 Example: '{dept}' with confidence {confidence:.3f}")
        
        if 0.0 <= confidence <= 1.0:
            print(f"  ✅ Confidence in valid range (0.0-1.0)")
        else:
            print(f"  ❌ Confidence out of range: {confidence}")
            all_passed = False
    
    except Exception as e:
        print(f"  ❌ Confidence test failed: {e}")
        all_passed = False
    
    # Test 6: Test fallback
    print("\n✓ Test 6: Fallback Mechanism")
    try:
        from predict import predict_department_fallback
        
        dept = predict_department_fallback("Unknown issue")
        print(f"  ✅ Fallback works: 'Unknown issue' → {dept}")
    
    except Exception as e:
        print(f"  ⚠️ Fallback test: {e}")
    
    # Summary
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ AI SYSTEM VERIFICATION: ALL TESTS PASSED!")
        print("🚀 System is ready for production")
    else:
        print("⚠️ AI SYSTEM VERIFICATION: SOME TESTS FAILED")
        print("📋 Please review the issues above")
    
    print("=" * 70)
    
    return all_passed


if __name__ == "__main__":
    success = verify_ai_system()
    sys.exit(0 if success else 1)
