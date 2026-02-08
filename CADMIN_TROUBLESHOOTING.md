# AdminDashboard Empty Page - Troubleshooting Guide

## Quick Fix Steps

### Step 1: Check Browser Console for Errors
1. Open your browser console: **F12** → **Console** tab
2. Look for red error messages
3. Share the error message with the exact details

### Step 2: Hard Refresh
```
Press: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
```

### Step 3: Verify Backend Server is Running
```bash
# In your terminal, confirm you see:
Starting development server at http://127.0.0.1:8000/
```

## Common Issues & Solutions

### Issue: "Failed to load complaints data"
**Cause**: The backend API endpoint is not responding

**Solution:**
```bash
# Test the endpoint directly in terminal:
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://127.0.0.1:8000/api/admin/complaints/
```

If it returns 401 Unauthorized:
- Log out and log back in
- Clear localStorage: `localStorage.clear()`

If it returns 404:
- The URL endpoint might be wrong
- Check `app/urls.py` - ensure admin routes are registered

If it returns 500:
- Check Django logs in your terminal window

### Issue: Page shows "Loading..." indefinitely
**Cause**: The API request is hanging

**Solution:**
1. Open browser DevTools → Network tab
2. Reload the page
3. Look for the request to `http://127.0.0.1:8000/api/admin/complaints/`
4. Check if it's stuck or getting a timeout

### Issue: User not recognized as admin
**Cause**: The user object doesn't have `is_staff=True`

**Solution:**
1. Go to `http://localhost:3000/debug/admin`
2. Check if `is_staff: true` is shown
3. If false, the user in database needs to be made admin:
   ```bash
   python manage.py shell
   ```
   ```python
   from app.models import CustomUser
   user = CustomUser.objects.get(email='admin@example.com')
   user.is_staff = True
   user.is_superuser = True
   user.save()
   exit()
   ```

## Step-by-Step Debugging

### 1. Verify You're Logged In As Admin
```javascript
// Open console and run:
JSON.parse(localStorage.getItem('user'))

// Should show:
// {
//   id: X,
//   email: "admin@example.com",
//   is_staff: true,        ← This must be TRUE
//   is_superuser: true,    ← This must be TRUE
//   ...
// }
```

If user data is missing or shows false, log out and log back in.

### 2. Check API Token
```javascript
// In console:
localStorage.getItem('access')
```

Should show a long JWT token. If not, you're not logged in.

### 3. Test API Manually
```javascript
// In browser console:
fetch('http://127.0.0.1:8000/api/admin/complaints/', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err))
```

This will show:
- If authentication is working
- What data the backend returns
- Any error messages

### 4. Check Django Logs
Look at the terminal window running Django. You should see:
```
GET /api/admin/complaints/ HTTP/1.1" 200 12345
```

If you see `401` or `403`, authentication is failing.

## What Each Tab Requires

| Tab | Endpoint | Requirement |
|-----|----------|------------|
| Complaints | `/api/admin/complaints/` | is_staff=True |
| Verification | `/api/admin/verification-queue/` | is_staff=True |
| Volunteers | `/api/admin/volunteers/` | is_staff=True |
| Analytics | `/api/admin/analytics/` | is_staff=True |
| Exports | No API call | Just displays UI |

## Quick Test: Exports Tab
1. Click "Exports" tab (rightmost)
2. Should show 3 buttons: "Export as CSV", "Export as PDF", "Export Volunteers"
3. If you see these buttons, the component is rendering

If Exports tab works but others don't:
- Issue is with API endpoints, not the component itself

## Still Not Working?

### Collect This Info & Share:
1. Screenshot of browser console (F12 → Console tab)
2. Output of: `JSON.parse(localStorage.getItem('user'))`
3. Django terminal output (last 10 lines)
4. What error message appears at the top of /cadmin page

### Check Django Settings
```python
# In civic/settings.py, verify:
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
```

If not set correctly, frontend requests will be blocked.

## Backend Verification

Make sure these are imported and exported in `app/views.py`:
```python
admin_complaints_list
admin_verification_queue
admin_volunteers_list
admin_approve_volunteer
admin_create_volunteer
analytics_dashboard
analytics_geographic
```

Check they're in `app/urls.py`:
```python
path('admin/complaints/', admin_complaints_list, name='admin_complaints_list'),
path('admin/verification-queue/', admin_verification_queue, name='admin_verification_queue'),
# ... etc
```

---

**After making changes to views.py or urls.py, always restart Django:**
```bash
# Press Ctrl+C to stop, then:
python manage.py runserver
```
