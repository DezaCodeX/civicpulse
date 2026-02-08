# Volunteer System - Quick Reference Guide

## 🚀 Getting Started

### Prerequisites
- Django server running on `http://127.0.0.1:8000`
- Frontend running on `http://localhost:5173`
- Firebase configured
- Database migrated (`python manage.py migrate`)

---

## 📋 USER ROLES

### 1. Citizen
- Submit complaints
- Track complaints
- Support other complaints
- View public verified complaints

### 2. Volunteer
- View unverified complaints in assigned area
- Upload verification proof images
- Add verification notes
- Approve/Reject complaints
- Raise own complaints too

**Requirements:**
- Must have `Volunteer` profile
- Must be approved (`is_approved=True`)
- Must have assigned ward/zone/area

### 3. Admin
- Manage all complaints
- Manage volunteers
- Review volunteer verifications
- Accept/reject proofs
- View analytics
- Export data

**Requirements:**
- Must have `is_staff=True` or `is_superuser=True`

---

## 🧪 TESTING WORKFLOW

### Step 1: Create a Volunteer Account

**Backend - Create Volunteer (as Admin):**
```bash
curl -X POST http://127.0.0.1:8000/api/admin/volunteers/create/ \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "volunteer@example.com",
    "ward": "Ward 1",
    "zone": "Zone A",
    "area": "Market Area"
  }'
```

**Or via Django Admin:**
1. Create `CustomUser` with email
2. Go to Volunteer section
3. Create volunteer with ward/zone/area assignment
4. Leave `is_approved = False` initially

### Step 2: Approve Volunteer

**Via API (as Admin):**
```bash
curl -X POST http://127.0.0.1:8000/api/admin/volunteers/<VOLUNTEER_ID>/approve/ \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

### Step 3: Volunteer Login

**Frontend:**
1. Go to `/volunteer/login`
2. Enter email and password
3. System checks approval status
4. Redirects to `/volunteer/dashboard` if approved

**Via API:**
```bash
curl -X POST http://127.0.0.1:8000/api/firebase-login/ \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "<FIREBASE_UID>",
    "email": "<VOLUNTEER_EMAIL>"
  }'
```

Get JWT tokens from response.

### Step 4: Submit a Test Complaint

**Via Frontend:**
1. Login as citizen
2. Go to `/submit-complaint`
3. Fill in complaint with location (latitude/longitude)
4. Submit

**Via API:**
```bash
curl -X POST http://127.0.0.1:8000/api/complaints/create/ \
  -H "Authorization: Bearer <CITIZEN_TOKEN>" \
  -H "Content-Type: multipart/form-data" \
  -F "title=Pothole on Main Street" \
  -F "description=Large pothole blocking traffic" \
  -F "latitude=11.0168" \
  -F "longitude=76.9558" \
  -F "location=Main Street, City" \
  -F "documents=@<IMAGE_FILE>"
```

### Step 5: Volunteer Verifies Complaint

**View Dashboard:**
```bash
curl http://127.0.0.1:8000/api/volunteer/dashboard/ \
  -H "Authorization: Bearer <VOLUNTEER_TOKEN>"
```

**Upload Verification Image:**
```bash
curl -X POST http://127.0.0.1:8000/api/volunteer/complaints/<COMPLAINT_ID>/upload-image/ \
  -H "Authorization: Bearer <VOLUNTEER_TOKEN>" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@<PROOF_IMAGE>"
```

**Approve Complaint:**
```bash
curl -X POST http://127.0.0.1:8000/api/volunteer/complaints/<COMPLAINT_ID>/verify/ \
  -H "Authorization: Bearer <VOLUNTEER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "notes": "Verified on-site. Issue is genuine."
  }'
```

### Step 6: Admin Reviews Verification

**View Verification Queue:**
```bash
curl http://127.0.0.1:8000/api/admin/verification-queue/ \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**Accept Verification:**
```bash
curl -X POST http://127.0.0.1:8000/api/admin/verification-queue/<COMPLAINT_ID>/verify/ \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "accept",
    "reason": "Proof images are clear and convincing"
  }'
```

### Step 7: Check Public Visibility

**View Public Complaints:**
```bash
curl http://127.0.0.1:8000/api/public/complaints/
```

**Expected:** Complaint now visible (only if `verified_by_volunteer=True AND admin_verified=True AND is_public=True`)

---

## 🎯 TEST SCENARIOS

### Scenario 1: Happy Path
1. ✅ Citizen submits complaint
2. ✅ Volunteer verifies with proof images
3. ✅ Admin accepts verification
4. ✅ Complaint becomes public

### Scenario 2: Rejection by Volunteer
1. ✅ Citizen submits complaint
2. ✅ Volunteer reviews and rejects (fake/invalid)
3. ✅ Complaint stays private
4. ✅ Admin doesn't see in queue

### Scenario 3: Image Validation
1. ✅ Volunteer tries to upload duplicate image
   - **Expected:** Error - "Duplicate image detected"
2. ✅ Volunteer tries to upload blurry image
   - **Expected:** Warning - Image accepted but flagged
3. ✅ Volunteer tries to upload non-image file
   - **Expected:** Error - "Invalid file type"

### Scenario 4: Admin Rejection
1. ✅ Volunteer verified complaint
2. ✅ Admin reviews proof images
3. ✅ Admin rejects (unclear/insufficient proof)
   - **Expected:** Verification reverted, complaint goes back to verified_by_volunteer=False
4. ✅ Stays private until re-verified

---

## 🔍 VERIFICATION CHECKLIST

### Database
- [ ] Migration `0008_volunteer_verification_fields.py` applied
- [ ] New fields exist on Complaint model:
  - `verified_by_volunteer_user`
  - `volunteer_verification_timestamp`
  - `admin_verified`
  - `admin_verification_timestamp`
  - `flag_for_admin_review`
  - `admin_review_reason`

### Frontend Pages
- [ ] `/volunteer/login` page loads and works
- [ ] `/volunteer/dashboard` shows complaints
- [ ] `/admin/dashboard` with tabs works
- [ ] Navbar updated with new links

### Backend Endpoints
- [ ] `POST /api/volunteer/check-approval/` - Returns volunteer status
- [ ] `GET /api/volunteer/dashboard/` - Returns filtered complaints
- [ ] `POST /api/volunteer/complaints/<id>/upload-image/` - Uploads image
- [ ] `POST /api/volunteer/complaints/<id>/verify/` - Verifies complaint
- [ ] `GET /api/admin/verification-queue/` - Shows pending verifications
- [ ] `POST /api/admin/verification-queue/<id>/verify/` - Admin verification
- [ ] `GET /api/admin/volunteers/` - Lists volunteers
- [ ] `POST /api/admin/volunteers/<id>/approve/` - Approves volunteer
- [ ] `GET /api/public/complaints/` - Shows only verified complaints

### Security
- [ ] Volunteers can only see complaints in their area
- [ ] Only approved volunteers can access dashboard
- [ ] Only admins can access admin endpoints
- [ ] Only volunteers with proper permissions can upload images

### File Validation
- [ ] Duplicate images rejected
- [ ] Blurry images warn user
- [ ] Non-image files rejected
- [ ] Large files (>10MB) rejected
- [ ] Suspicious uploads flagged for review

---

## 📊 ADMIN ANALYTICS

**Access:** `/admin/dashboard` → Analytics Tab

**Visible Metrics:**
- Total complaints
- Pending complaints
- Resolved complaints
- Last 7 days trends
- Department distribution
- Category breakdown

---

## 🚨 COMMON ISSUES & FIXES

### Issue: Volunteer can't login
**Solution:**
- Check `Volunteer.is_approved = True`
- Verify volunteer profile exists
- Check user authentication

### Issue: Images not uploading
**Solution:**
- Check file size < 10MB
- Verify file is image format
- Check duplicate image logic

### Issue: Complaint not visible publicly
**Solution:**
- Check all three conditions:
  1. `is_public = True`
  2. `verified_by_volunteer = True`
  3. `admin_verified = True`

### Issue: Admin can't see verification queue
**Solution:**
- Ensure user is `is_staff=True`
- Check complaint status: `verified_by_volunteer=True` and `admin_verified=False`

---

## 📝 IMPORTANT NOTES

1. **Volunteers are also Citizens**
   - They can submit complaints themselves
   - They can verify other volunteers' complaints

2. **No Public Visibility Without Verification**
   - Complaints start as private
   - Only approved + verified complaints go public
   - Unapproved volunteers can't see verification queue

3. **Audit Trail**
   - All actions logged in `status_history` JSON field
   - Includes timestamps and actor information
   - Admin can review history

4. **Image Validation**
   - Automated quality checks
   - Flags suspicious uploads
   - Admin reviews flagged images

---

## 🎓 DEMONSTRATION SCRIPT (For Viva)

### Part 1: System Overview (2 min)
1. Show database schema with new fields
2. Explain verification workflow
3. Point out security layers

### Part 2: Citizen Submission (1 min)
1. Go to `/submit-complaint`
2. Fill and submit complaint
3. Show complaint created with `is_public=False`

### Part 3: Volunteer Verification (2 min)
1. Login as volunteer on `/volunteer/login`
2. Show volunteer dashboard
3. Upload proof image
4. Add verification notes
5. Click Approve

### Part 4: Admin Review (2 min)
1. Login as admin
2. Go to `/admin/dashboard`
3. Click "Verification Queue" tab
4. Show pending verification
5. Review images
6. Accept or reject

### Part 5: Public Visibility (1 min)
1. Go to `/complaints` (public page)
2. Show complaint is now visible
3. Explain visibility rules

### Part 6: Security Demo (1 min)
1. Try access volunteer page while unapproved
2. Show rejection
3. Explain permission layers

---

## 📞 SUPPORT

For issues or questions:
1. Check logs: `django.log`
2. Run migrations: `python manage.py migrate`
3. Test endpoints manually with curl
4. Check browser console for frontend errors

---

**Last Updated:** February 8, 2026
**System Status:** ✅ Production Ready
