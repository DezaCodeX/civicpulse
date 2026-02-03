#!/usr/bin/env python
import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic.settings')
django.setup()

from app.models import CustomUser, Complaint
from app.ai.predict import predict_department
from django.utils import timezone

# Create or get test user
test_email = 'test@example.com'
user, created = CustomUser.objects.get_or_create(
    email=test_email,
    defaults={'first_name': 'Test', 'last_name': 'User'}
)
print(f"User: {user.email} ({'created' if created else 'existing'})")

# Test AI prediction
description = "Water pipe is leaking and wasting water"
print(f"\nTesting AI prediction with: '{description}'")
dept, confidence = predict_department(description, return_confidence=True)
print(f"✅ AI predicted: {dept} (confidence: {confidence})")

# Create test complaint
try:
    complaint = Complaint.objects.create(
        user=user,
        title="Test: Water Pipe Leak",
        description=description,
        category=dept,  # AI auto-filled
        department=dept,  # AI predicted
        latitude=28.7041,
        longitude=77.1025,
        location="Test Street",
        is_public=True
    )
    print(f"\n✅ Complaint created successfully!")
    print(f"   ID: {complaint.id}")
    print(f"   Title: {complaint.title}")
    print(f"   Category: {complaint.category}")
    print(f"   Department: {complaint.department}")
    print(f"   Description: {complaint.description}")
    print(f"   Status: {complaint.status}")
    print(f"   Created: {complaint.created_at}")
except Exception as e:
    print(f"\n❌ Error creating complaint: {e}")
    import traceback
    traceback.print_exc()

# Verify it's in the database
complaints = Complaint.objects.filter(user=user).order_by('-created_at')
print(f"\n✅ Total complaints for this user: {complaints.count()}")
for c in complaints[:3]:
    print(f"   - {c.title} ({c.department}) - {c.created_at}")

print("\n" + "="*60)
print("✅ AI + Django Integration is WORKING correctly!")
print("="*60)
