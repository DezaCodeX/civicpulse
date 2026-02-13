# 🤖 CivicPulse AI-Based Department Segregation - Testing Guide

**Phase:** Phase 3 - AI-Based Department Segregation (NLP)  
**Date:** February 2, 2026  
**Status:** ✅ IMPLEMENTED & READY FOR TESTING

---

## 📋 OVERVIEW

The AI system automatically classifies complaints into departments based on their text description. No manual department selection needed!

### How It Works:
1. User submits complaint text (description)
2. AI processes text and predicts department
3. Confidence score included (0.0 - 1.0)
4. Department stored in database
5. Used by admin and automation systems

### Departments (8 Total):
- Water
- Electricity
- Roads
- Sanitation
- Health
- Public Safety
- Education
- Other

---

## 🧠 AI MODEL DETAILS

### Model Type:
- **Algorithm:** Keyword + Rule-based Classification
- **Training Data:** 69 labeled examples
- **Department Distribution:**
  - Water: 8 examples
  - Electricity: 10 examples
  - Roads: 10 examples
  - Sanitation: 9 examples
  - Health: 9 examples
  - Public Safety: 9 examples
  - Education: 10 examples
  - Other: 4 examples

### Model Files:
```
app/ai/
├── model.pkl              [Trained model]
├── constants.py           [Department definitions]
├── predict.py             [Prediction function]
├── train_model_simple.py  [Training script]
├── data/
│   └── complaints.csv     [Training dataset]
└── __init__.py
```

---

## 🧪 TEST SCENARIOS

### Test 1: Water Department Classification

**API Endpoint:** `POST /api/complaints/create/`

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=No Water Supply" \
  -F "description=No water supply for 3 days. Pipeline leakage near my house. Please repair immediately." \
  -F "category=Water Supply" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "location=Main Street"
```

**Expected Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "No Water Supply",
  "department": "Water",
  "confidence": 0.850,
  "message": "Complaint created successfully"
}
```

**Verify:**
- [ ] Department = "Water"
- [ ] Confidence > 0.7
- [ ] Check database: `python manage.py dbshell`
  ```sql
  SELECT title, department FROM app_complaint ORDER BY -created_at LIMIT 1;
  ```

---

### Test 2: Electricity Department Classification

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Street Lights Not Working" \
  -F "description=Street light is broken and not working. The power pole is damaged. Electricity supply is very unstable here." \
  -F "category=Electricity" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "location=Broadway"
```

**Expected:**
- [ ] Department = "Electricity"
- [ ] Confidence > 0.7

---

### Test 3: Roads Department Classification

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Potholes on Main Road" \
  -F "description=Potholes on main road are causing accidents. Road damaged after rain. The street surface is uneven." \
  -F "category=Roads" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "location=Main Road"
```

**Expected:**
- [ ] Department = "Roads"
- [ ] Confidence > 0.7

---

### Test 4: Public Safety Department Classification

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Crime Increasing" \
  -F "description=Theft cases increasing in this area. Street crime at night is common. Police not responding to complaints." \
  -F "category=Safety" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "location=Colony Area"
```

**Expected:**
- [ ] Department = "Public Safety"
- [ ] Confidence > 0.7

---

### Test 5: Unknown/Ambiguous Text → "Other"

**Request:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "title=General Issue" \
  -F "description=There is a problem with government services in my area." \
  -F "category=Other" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "location=City Center"
```

**Expected:**
- [ ] Department = "Other"
- [ ] Confidence < 0.5 (low confidence indicates ambiguity)

---

### Test 6: Confidence Score Validation

**Objective:** Verify confidence scores reflect prediction certainty

**Test Cases:**
```
Description                                    Expected Dept    Min Confidence
"Water pipe leaking"                          Water           0.7+
"Power cut every night"                       Electricity     0.7+
"Pothole on road"                             Roads           0.7+
"Garbage not collected"                       Sanitation      0.7+
"Hospital overcrowded"                        Health          0.7+
"Police not responding"                       Public Safety   0.7+
"School building unsafe"                      Education       0.7+
"Problem in area"                             Other           < 0.5
```

**Test Script:**
```bash
#!/bin/bash

test_descriptions=(
  "Water pipe leaking"
  "Power cut every night"
  "Pothole on road"
)

for desc in "${test_descriptions[@]}"
do
  response=$(curl -s -X POST http://127.0.0.1:8000/api/complaints/create/ \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "title=Test" \
    -F "description=$desc" \
    -F "category=Test" \
    -F "latitude=28.61" \
    -F "longitude=77.20" \
    -F "location=Test")
  
  echo "Description: $desc"
  echo "$response" | python -m json.tool
  echo "---"
done
```

---

### Test 7: Frontend Integration

**Test:** Submit complaint via web interface

**Steps:**
1. Open `http://localhost:5173/submit-complaint`
2. Fill form:
   - Title: "Water Supply Issue"
   - Category: (user selects)
   - Location: "Block A"
   - Description: "No water for 3 days, pipe leaking"
3. Select files (optional)
4. Click Submit
5. Should redirect to `/my-complaints`

**Verify:**
- [ ] Complaint created successfully
- [ ] In database: department = "Water" (AI-predicted)
- [ ] Check response includes confidence score

**API Call Captured:**
```javascript
// In browser DevTools Network tab
POST /api/complaints/create/
Response:
{
  "id": "...",
  "department": "Water",      // ← AI predicted
  "confidence": 0.850,         // ← Confidence score
  "message": "Complaint created successfully"
}
```

---

### Test 8: Admin Dashboard Visibility

**Test:** Admin sees AI-predicted department

**Steps:**
1. Login as admin user
2. Go to `/admin/complaints/` (if accessible)
3. View complaint list

**Verify:**
- [ ] Department column shows AI prediction (e.g., "Water", "Roads")
- [ ] Department is not empty
- [ ] Matches expected classification

---

### Test 9: Public Listing Accuracy

**Test:** Public complaints show correct department

**Steps:**
1. Create multiple complaints with different content
2. Go to `/complaints` (public page)
3. Check department badges on cards

**Sample Data to Create:**
```
Title: "Water Shortage"
Description: "No water supply for days"
Expected: Water ✅

Title: "Broken Streetlight"
Description: "Power supply to street light is cut"
Expected: Electricity ✅

Title: "Road Full of Potholes"
Description: "Damaged road surface"
Expected: Roads ✅

Title: "Garbage Pile"
Description: "Waste not collected, unsanitary"
Expected: Sanitation ✅
```

**Verify:**
- [ ] All complaints have departments assigned
- [ ] Departments match AI predictions
- [ ] No "Unknown" or empty departments

---

### Test 10: Department Filtering Works

**Test:** Filter complaints by AI-predicted department

**API Call:**
```bash
# Get only Water complaints
curl "http://127.0.0.1:8000/api/public/complaints/?department=Water"

# Expected: Only Water department complaints returned
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "title": "Water Supply Issue",
    "department": "Water",  ← Filtered
    "category": "Water Supply"
  }
]
```

**Verify:**
- [ ] Filter returns only matching departments
- [ ] No other departments in response
- [ ] Multiple filters work: `?department=Water&status=pending`

---

## 📊 METRICS TO TRACK

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Avg Confidence Score | > 0.75 | _____ | _____ |
| Water Accuracy | 100% | _____ | _____ |
| Electricity Accuracy | 100% | _____ | _____ |
| Roads Accuracy | 100% | _____ | _____ |
| Sanitation Accuracy | 90%+ | _____ | _____ |
| Health Accuracy | 90%+ | _____ | _____ |
| Public Safety Accuracy | 90%+ | _____ | _____ |
| Education Accuracy | 90%+ | _____ | _____ |
| Other Accuracy | 80%+ | _____ | _____ |

---

## 🔧 DEBUGGING TIPS

### Check Model Status
```bash
cd d:/dezacodex/subash/civicpulse

# Verify model file exists
ls -la app/ai/model.pkl

# Should output file size > 1KB
```

### Test AI Prediction Directly
```bash
python
>>> from app.ai.predict import predict_department
>>> predict_department("Water pipe is leaking", return_confidence=True)
('Water', 0.85)
>>>
```

### Retrain Model
If predictions are inaccurate:
```bash
# Add more examples to app/ai/data/complaints.csv

# Retrain
python app/ai/train_model_simple.py

# Verify (delete old model.pkl first if needed)
```

### View Training Data
```bash
cat app/ai/data/complaints.csv | head -20
```

---

## 🚀 ADVANCED TESTS

### Test 11: Batch Processing

**Objective:** Submit many complaints quickly

**Test:**
```bash
#!/bin/bash

for i in {1..10}
do
  curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: multipart/form-data" \
    -F "title=Test Complaint $i" \
    -F "description=Water pipe leaking near house" \
    -F "category=Water" \
    -F "latitude=28.61" \
    -F "longitude=77.20" \
    -F "location=Test"
done
```

**Verify:**
- [ ] All 10 complaints created
- [ ] All classified as "Water"
- [ ] Confidence scores present
- [ ] No API errors

---

### Test 12: Mixed Language (If applicable)

**Future Test:** Support multiple languages

For now: Test only English descriptions

---

### Test 13: Performance Test

**Objective:** Measure prediction speed

**Test:**
```python
import time
from app.ai.predict import predict_department

texts = [
    "Water pipe leaking",
    "Electricity power cut",
    "Road pothole"
] * 10  # 30 predictions

start = time.time()
for text in texts:
    predict_department(text)
end = time.time()

avg_time = (end - start) / len(texts)
print(f"Average prediction time: {avg_time*1000:.2f}ms")
# Expected: < 10ms per prediction
```

**Expected:**
- [ ] Prediction time < 10ms
- [ ] No timeout errors
- [ ] Consistent performance

---

## ✅ SIGN-OFF CHECKLIST

After running all tests:

- [ ] All 13 tests passed
- [ ] No API errors
- [ ] Confidence scores reasonable (0.5 - 1.0)
- [ ] Departments correctly predicted
- [ ] Frontend integration works
- [ ] Admin can see departments
- [ ] Public page shows departments
- [ ] Filters work by department
- [ ] Performance acceptable
- [ ] Database consistency verified
- [ ] No console errors
- [ ] Ready for production

---

## 📝 TEST RESULT TEMPLATE

```
Test Date: _______________
Tester: _______________

Test 1: Water Classification - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 2: Electricity Classification - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 3: Roads Classification - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 4: Public Safety Classification - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 5: Unknown/Other Classification - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 6: Confidence Scores - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 7: Frontend Integration - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 8: Admin Dashboard - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 9: Public Listing - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED
Test 10: Department Filtering - ✅ PASSED / ⚠️ ISSUES / ❌ FAILED

Issues Found: _______________________________________________

Overall Result: ✅ PASSED / ⚠️ NEEDS FIXES / ❌ FAILED

Sign-off: _______________
```

---

## 🤖 AI RESPONSE EXAMPLES

### Example 1: High Confidence (Clear Department)
```
Input: "Water pipe is leaking from underground"
Response:
{
  "department": "Water",
  "confidence": 0.89
}
```

### Example 2: Medium Confidence (Some Matching Keywords)
```
Input: "Street light near water tank is not working"
Response:
{
  "department": "Electricity",
  "confidence": 0.72
}
```

### Example 3: Low Confidence (Ambiguous)
```
Input: "Problem in my area"
Response:
{
  "department": "Other",
  "confidence": 0.35
}
```

---

**Testing Status:** ✅ READY  
**Next Step:** Execute all test scenarios and document results

---
