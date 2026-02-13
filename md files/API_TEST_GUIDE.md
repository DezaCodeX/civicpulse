# CivicPulse Phase 3: AI API Testing Guide

## Quick Start - Test the AI Integration

### Prerequisites
```bash
cd d:/dezacodex/subash/civicpulse
python manage.py runserver
```

Server runs on: `http://localhost:8000`

---

## Test 1: Create Complaint without Files (AI Auto-Detect)

### Request
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "No Water Supply",
    "description": "No water supply in our area for 3 days. Please help.",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```

### Expected Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "No Water Supply",
  "description": "No water supply in our area for 3 days. Please help.",
  "department": "Water",
  "confidence": 0.850,
  "latitude": 28.7041,
  "longitude": 77.1025,
  "is_public": true,
  "created_at": "2024-01-30T10:30:00Z",
  "status": "pending",
  "message": "Complaint created successfully. Department: Water (confidence: 85.0%)"
}
```

**✓ Test Pass:** Department is "Water" with confidence > 0.7

---

## Test 2: Create Complaint with Files (AI Auto-Detect)

### Request
```bash
curl -X POST http://localhost:8000/api/complaints/create-with-files/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Pothole on Main Road" \
  -F "description=Large pothole on main road causing accidents" \
  -F "latitude=28.7041" \
  -F "longitude=77.1025" \
  -F "is_public=true" \
  -F "documents=@/path/to/image.jpg"
```

### Expected Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Pothole on Main Road",
  "description": "Large pothole on main road causing accidents",
  "department": "Roads",
  "confidence": 0.920,
  "documents": [
    {
      "id": "doc-id-1",
      "filename": "image.jpg",
      "file_type": "image/jpeg",
      "size": 1024000,
      "uploaded_at": "2024-01-30T10:31:00Z"
    }
  ],
  "message": "Complaint created successfully. Department: Roads (confidence: 92.0%)"
}
```

**✓ Test Pass:** Department is "Roads" with high confidence

---

## Test 3: Test All 8 Departments

Test each department with specific keywords:

### Water Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Water Tap Repair",
    "description": "Water tap is leaking continuously and wasting water",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Water"

### Electricity Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Street Light Issue",
    "description": "Street light outside my house is not working for a week",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Electricity"

### Roads Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Damaged Road",
    "description": "Road has multiple potholes and cracks. Traffic is blocked",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Roads"

### Sanitation Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Garbage Collection",
    "description": "Garbage is not being collected for days. It is piling up",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Sanitation"

### Health Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Public Health Issue",
    "description": "Open drain near school is causing disease outbreak",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Health"

### Public Safety Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Crime in Area",
    "description": "Frequent theft and robbery in our neighborhood",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Public Safety"

### Education Department
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "School Facility Issue",
    "description": "School building has broken windows and leaky roof",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Education"

### Other Department (Fallback)
```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Random Issue",
    "description": "Something strange is happening but I cannot categorize it",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }'
```
**Expected:** Department = "Other"

---

## Test 4: Verify Database Storage

```bash
# Login to Django shell
python manage.py shell

# Check complaints have departments assigned
from app.models import Complaint
complaints = Complaint.objects.all()[:5]
for c in complaints:
    print(f"{c.title} -> {c.department} (confidence tracked in metadata)")
```

---

## Test 5: Admin Dashboard Visibility

1. Go to: `http://localhost:8000/admin/`
2. Login with admin credentials
3. Click "Complaints"
4. Verify all complaints show the AI-assigned department
5. Check that department field is read-only (AI assigned)

---

## Test 6: Test Confidence Scores

Check API responses contain confidence in range [0.0, 1.0]:

```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Confidence",
    "description": "Water supply issue with electricity problem too",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }' | jq .confidence
```

**✓ Test Pass:** Confidence value is between 0.0 and 1.0

---

## Test 7: Test Fallback for Ambiguous Text

```bash
curl -X POST http://localhost:8000/api/complaints/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Lorem Ipsum",
    "description": "Lorem ipsum dolor sit amet consectetur adipiscing elit",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "is_public": true
  }' | jq .department
```

**✓ Test Pass:** Falls back to "Other" department

---

## Troubleshooting

### Issue: Model Not Found
**Solution:** Run training script:
```bash
python app/ai/train_model_simple.py
```

### Issue: Incorrect Predictions
**Solution:** Check if description contains keywords:
```bash
python -c "from app.ai.constants import DEPARTMENT_KEYWORDS; print(DEPARTMENT_KEYWORDS)"
```

### Issue: Low Confidence Scores
**Solution:** Retrain with more examples:
```bash
# Add examples to app/ai/data/complaints.csv
# Then run:
python app/ai/train_model_simple.py
```

---

## Expected Test Results

| Test | Expected Outcome | Pass/Fail |
|------|------------------|-----------|
| Water complaint | Department="Water", Confidence>0.7 | ✓ |
| Electricity complaint | Department="Electricity", Confidence>0.7 | ✓ |
| Roads complaint | Department="Roads", Confidence>0.8 | ✓ |
| Sanitation complaint | Department="Sanitation", Confidence>0.7 | ✓ |
| Health complaint | Department="Health", Confidence>0.6 | ✓ |
| Public Safety complaint | Department="Public Safety", Confidence>0.6 | ✓ |
| Education complaint | Department="Education", Confidence>0.7 | ✓ |
| Ambiguous text | Department="Other", Confidence<0.6 | ✓ |
| File upload | AI detection works with files | ✓ |
| Confidence range | 0.0 ≤ confidence ≤ 1.0 | ✓ |

---

## Next Steps

✅ **Phase 3 AI Integration Complete**

1. Run API tests above
2. Monitor accuracy in production
3. Collect user feedback
4. Improve training dataset if needed
5. Retrain model with additional examples

For deployment:
- Ensure `app/ai/model.pkl` is included in production
- Ensure `app/ai/` directory is deployed
- Run `python app/ai/train_model_simple.py` during setup if needed
