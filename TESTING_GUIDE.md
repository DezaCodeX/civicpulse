# 🧪 TESTING GUIDE - Step by Step

## 🎯 Phase 1: DATABASE & ADMIN SETUP (5 minutes)

### Step 1: Verify Migrations Applied ✅
```bash
cd civicpulse
python manage.py showmigrations app
# Should show: [X] 0005_complaintdocument_alter_complaint_options_and_more
```

### Step 2: Create Admin Account
```bash
python manage.py createsuperuser
# Email: admin@test.com
# Password: testpass123
```

### Step 3: Mark Account as Admin
```
Option A - Via Django Shell:
python manage.py shell
>>> from app.models import CustomUser
>>> user = CustomUser.objects.get(email='admin@test.com')
>>> user.is_staff = True
>>> user.is_superuser = True
>>> user.save()

Option B - Via Django Admin UI (/admin):
1. Login with email/password
2. Click Users
3. Edit your user
4. Check "Staff Status" and "Superuser Status"
5. Save
```

---

## 🎯 Phase 2: TEST FILE UPLOAD (5 minutes)

### Step 1: Start Backend
```bash
python manage.py runserver
# Should show: Starting development server at http://127.0.0.1:8000/
```

### Step 2: Start Frontend (new terminal)
```bash
cd frontend
npm install  # if needed
npm run dev
# Should show: VITE v... listening on http://localhost:5173
```

### Step 3: Test Submission
1. Open http://localhost:5173
2. Click **"Login"** → Signup with new email
3. Fill profile (First Name, Last Name, Phone)
4. Navigate to **"Submit Complaint"**
5. Fill form:
   - **Title**: "Pothole on Main Street"
   - **Category**: "Roads & Infrastructure"
   - **Location**: "Main Street, Downtown"
   - **Description**: "Large pothole causing accidents"
   - **Upload Files**: Select 2-3 files (image, pdf, etc.)
6. Click **"Submit"**

### Step 4: Verify Files Saved
```bash
# Check files created
ls media/complaints/
# Should show: 2026/01/27/ (date-based folders)
ls media/complaints/2026/01/27/
# Should show: your uploaded files

# Check database
python manage.py shell
>>> from app.models import Complaint, ComplaintDocument
>>> c = Complaint.objects.last()
>>> c.title
'Pothole on Main Street'
>>> c.documents.count()
3
>>> for doc in c.documents.all():
...     print(doc.file_name)
```

---

## 🎯 Phase 3: TEST PUBLIC VIEW (5 minutes)

### Step 1: Navigate to Public Complaints
1. Open http://localhost:5173/complaints
2. **Verify**:
   - ✅ No login required
   - ✅ List shows your complaint
   - ✅ **NO creator email/name visible**
   - ✅ Shows: title, department, location, support count

### Step 2: Search & Filter
1. Type "pothole" in search → Filters results
2. Select department filter → Shows only that department
3. **Verify**: Filtering works in real-time

### Step 3: Click Complaint Detail
1. Click on your complaint in the list
2. **Verify**:
   - ✅ Shows title, description, location
   - ✅ Shows geolocation coordinates
   - ✅ Shows uploaded files with download links
   - ✅ **NO creator identity visible**
   - ✅ Shows support count: 0

### Step 4: Support Complaint
1. Click **"Support This Complaint"** button
2. Count updates to 1
3. Refresh page → Still shows 1 support
4. Try clicking again → Button disabled (localStorage prevention)

---

## 🎯 Phase 4: TEST ADMIN DASHBOARD (5 minutes)

### Step 1: Login as Admin
1. Click **"Logout"** (top right)
2. Navigate to **"Login"**
3. Login with admin account: admin@test.com / testpass123

### Step 2: Access Admin Panel
1. Click **"My Dashboard"** (should appear in navbar for admin)
2. OR navigate directly: http://localhost:5173/admin
3. **Verify**: AdminDashboard loads with data

### Step 3: View Complaints Tab
1. Should see table with:
   - **Title**: Your complaint title
   - **User**: Your email ✅ (now visible to admin)
   - **Department**: "Roads" (auto-classified)
   - **Status**: "pending" (dropdown)
   - **Support**: 1 (from public vote)

### Step 4: Search & Filter
1. Search box: Type complaint title → Filters
2. Status dropdown: Select "resolved" → Re-filters
3. Department dropdown: Select different dept → Shows none (correct)

### Step 5: Change Status
1. Click Status dropdown for your complaint
2. Select "in_progress"
3. **Verify**: 
   - ✅ Updates immediately in table
   - ✅ No page refresh needed
   - ✅ Database updated (check with `python manage.py shell`)

### Step 6: Analytics Tab
1. Click **"Analytics"** tab
2. **Verify** stats:
   - **Total Complaints**: 1
   - **Pending**: 0 (now in_progress)
   - **Resolved**: 0
   - **Last 7 Days**: 1
3. **Verify** distribution charts:
   - **Department Distribution**: Shows "Roads - 1"
   - **Top Supported**: Shows your complaint with 1 support

---

## 🎯 Phase 5: VERIFY DATABASE (3 minutes)

### Django Shell Verification
```bash
python manage.py shell

# Check complaints
>>> from app.models import Complaint, ComplaintDocument
>>> complaint = Complaint.objects.first()
>>> complaint.title
'Pothole on Main Street'
>>> complaint.department
'Roads'
>>> complaint.status
'in_progress'
>>> complaint.support_count
1
>>> complaint.is_public
True

# Check documents
>>> complaint.documents.count()
3
>>> for doc in complaint.documents.all():
...     print(f"{doc.file_name} - {doc.file_size} bytes")

# Check privacy (admin sees user)
>>> complaint.user.email
'test@example.com'
```

---

## 🎯 Phase 6: API TESTING (Optional - Postman/curl)

### Test Public Endpoint (No Auth)
```bash
# Get all public complaints
curl http://localhost:8000/api/public/complaints/

# Get specific complaint (replace ID)
curl http://localhost:8000/api/public/complaints/1/

# Support complaint
curl -X POST http://localhost:8000/api/complaints/1/support/
```

### Test Admin Endpoint (Requires Auth)
```bash
# Get admin token
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"testpass123"}'

# Use returned access token
curl http://localhost:8000/api/admin/complaints/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get analytics
curl http://localhost:8000/api/admin/analytics/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ✅ SUCCESS CHECKLIST

### File Upload
- [ ] Can upload multiple files during complaint creation
- [ ] Files saved in `media/complaints/YYYY/MM/DD/` folder
- [ ] ComplaintDocument records created in database
- [ ] Files accessible from public view with download links

### Public View
- [ ] Can view complaints at `/complaints` without login
- [ ] Creator email/name NOT visible
- [ ] Search and filter work
- [ ] Can support complaint
- [ ] Support count updates
- [ ] localStorage prevents duplicate votes

### Admin Panel
- [ ] Can access `/admin` only when logged in as staff
- [ ] View all complaints with creator email visible
- [ ] Can change complaint status
- [ ] Analytics tab shows correct stats
- [ ] Department distribution chart visible
- [ ] Search & filters work

### Privacy
- [ ] Public users see anonymized complaints
- [ ] Admin users see full creator details
- [ ] Permissions enforced (non-admin can't access /admin)
- [ ] is_public flag controls visibility

### Performance
- [ ] Complaints load quickly (<1s)
- [ ] File upload completes without errors
- [ ] Status updates instant (no page reload)
- [ ] Analytics calculations fast

---

## 🚨 TROUBLESHOOTING

### Issue: "File upload fails"
**Solution**:
```bash
# Ensure media folder exists
mkdir -p media/complaints

# Check permissions
ls -la media/

# Check MEDIA settings in settings.py
python manage.py shell
>>> from django.conf import settings
>>> print(settings.MEDIA_ROOT)
>>> print(settings.MEDIA_URL)
```

### Issue: "Admin can't see analytics"
**Solution**:
```bash
# Verify user is staff
python manage.py shell
>>> from app.models import CustomUser
>>> user = CustomUser.objects.get(email='admin@test.com')
>>> print(user.is_staff, user.is_superuser)
# Both should be True
```

### Issue: "Public complaints show creator"
**Solution**: This shouldn't happen - check `public_complaint_detail` view returns correct fields (no user object).

### Issue: "Files not downloading from public page"
**Solution**:
```bash
# Ensure MEDIA_URL serving is enabled
# In civic/urls.py, check media serving code is present
python manage.py runserver --insecure  # Force serve media in dev
```

---

## 📊 Expected Results Summary

After successful testing:

| Feature | Status | Evidence |
|---------|--------|----------|
| File Upload | ✅ | Files in media/ folder |
| Public List | ✅ | /complaints shows complaints |
| Public Detail | ✅ | No creator email visible |
| Support Vote | ✅ | Count increments |
| Admin View | ✅ | Creator email visible to admin only |
| Status Update | ✅ | Dropdown changes status |
| Analytics | ✅ | Correct stats displayed |
| Database | ✅ | Models & records present |

---

## 🎓 FOR VIVA DEMONSTRATION

**Show these three things:**

1. **Public View** (Share screen without login):
   - "Here anonymous users can view complaints without login"
   - "Notice creator name is NOT visible - privacy protected"
   - "Users can search, filter, and support complaints"

2. **Admin View** (Login as admin):
   - "Only admins see creator email - full visibility"
   - "Admins can change status and monitor all complaints"
   - "Analytics show patterns - department distribution and trends"

3. **Files** (Show terminal):
   - "Multiple documents uploaded for each complaint"
   - "Files organized by date in media/ folder"
   - "Database records link files to complaints"

---

**You're ready to test! 🚀**
