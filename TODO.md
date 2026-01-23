# TODO: Implement Profile and Complaint Features

## 1. Update Dashboard.jsx ✅
- Remove "Coming Soon" from Profile Settings card
- Make the button functional to navigate to /profile

## 2. Create Complaint Model ✅
- Add Complaint model in app/models.py with fields: user (FK), category, location, description, status, created_at, updated_at

## 3. Create Complaint Serializer ✅
- Add ComplaintSerializer in app/serializers.py

## 4. Create Complaint Views ✅
- Add views for submitting complaint (POST) and listing user complaints (GET) in app/views.py

## 5. Update URLs
- Add URL patterns for complaints in app/urls.py and civic/urls.py

## 6. Update SubmitComplaint.jsx
- Fetch profile data on mount and prefill name, phone, address in the form
- Replace simulated submission with actual API call to submit complaint
- Include profile details in the submission

## 7. Update MyComplaints.jsx
- Replace static data with API call to fetch user's complaints

## 8. Run Migrations
- Create and run migrations for the new Complaint model

## 9. Test the Features
- Test profile editing, complaint submission, and viewing complaints
