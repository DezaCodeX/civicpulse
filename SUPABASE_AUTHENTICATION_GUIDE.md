# Supabase Authentication Integration Guide

## 🎯 Overview

This guide covers the complete migration from Firebase to Supabase Google Sign-In. The system now uses:

- **Supabase**: For OAuth authentication (Google Sign-In)
- **Django**: For user management and role assignment (ADMIN/VOLUNTEER/CITIZEN)

> **CRITICAL**: Do NOT mix Firebase + Supabase in the same application.

---

## 📋 Step 1: Set Up Supabase Project

### 1.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up and create a new project
3. Choose a region close to your target users
4. Set a strong database password

### 1.2 Configure Google OAuth in Supabase
1. In Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google**
3. Enable Google OAuth:
   - **Get OAuth credentials**:
     - Go to [Google Cloud Console](https://console.cloud.google.com)
     - Create OAuth 2.0 credentials (Web Application)
     - Add these Redirect URIs:
       ```
       https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
       http://localhost:3000/dashboard  (for development)
       ```
     - Copy Client ID and Client Secret
   - Paste Client ID and Client Secret into Supabase

4. Save settings

---

## 📁 Step 2: Frontend Configuration

### 2.1 Create `.env.local` in frontend folder

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard

# Backend API
VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Where to find these values:**
- Go to Supabase Dashboard → **Settings** → **API**
- Copy `Project URL` → `VITE_SUPABASE_URL`
- Copy `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 2.2 Verify Frontend Files Created

✅ New files:
- `frontend/src/supabaseClient.js` - Supabase client setup
- `frontend/src/services/supabaseAuthService.js` - Auth logic + Django sync

✅ Updated files:
- `frontend/src/pages/Login.jsx` - Now uses Supabase Google OAuth
- `frontend/src/pages/Signup.jsx` - Now uses Supabase Google OAuth
- `frontend/src/App.jsx` - Uses Supabase auth state listener
- `frontend/src/components/Navbar.jsx` - Uses Supabase sign out

---

## 🔧 Step 3: Backend Configuration

### 3.1 New Django Endpoint Added

A new endpoint has been created at `POST /api/supabase-login/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "supabase_token": "...",  
  "user_metadata": {...}
}
```

**Response:**
```json
{
  "refresh": "...",
  "access": "...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "",
    "last_name": "",
    "is_staff": false,
    "is_superuser": false,
    "role": "CITIZEN"
  }
}
```

### 3.2 How It Works

```
Supabase Google OAuth Login
        ↓
Get Access Token + User Email
        ↓
Send to Django: POST /api/supabase-login/
        ↓
Django checks if user exists:
  - If NO: Create new user
  - If YES: Return existing user
        ↓
Django generates JWT tokens
        ↓
Frontend stores tokens in localStorage
        ↓
Frontend redirects to /dashboard
```

---

## 🌐 Step 4: First Time Setup

### 4.1 Install Supabase Package (Frontend)

```bash
cd frontend
npm install @supabase/supabase-js
```

### 4.2 Test the Flow

1. **Start Django Backend:**
   ```bash
   python manage.py runserver
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Login:**
   - Click "Continue with Google"
   - You'll be redirected to Google Sign-In
   - After signing in, you'll be redirected to dashboard
   - Check browser console for sync logs

4. **Verify in Django:**
   ```bash
   python manage.py shell
   >>> from app.models import CustomUser
   >>> CustomUser.objects.all()
   ```

---

## 🔐 Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER JOURNEY                              │
└─────────────────────────────────────────────────────────────┘

1. USER CLICKS "Continue with Google"
   ↓
2. FRONTEND: signInWithGoogle()
   ├─ Calls supabase.auth.signInWithOAuth(provider='google')
   ├─ Redirects to Google Sign-In page
   ├─ User authenticates with Google
   └─ Supabase redirects back to http://localhost:3000/dashboard

3. SUPABASE AUTH STATE LISTENER TRIGGERED
   ├─ Event: 'SIGNED_IN'
   ├─ Session has access_token + user.email
   └─ Call syncSupabaseWithDjango()

4. SYNC WITH DJANGO
   ├─ POST /api/supabase-login/
   ├─ Data: { email, supabase_token, user_metadata }
   └─ Django response: { access, refresh, user }

5. STORE LOCALLY
   ├─ localStorage.setItem('access', jwt_token)
   ├─ localStorage.setItem('refresh', refresh_token)
   ├─ localStorage.setItem('user', user_data)
   └─ localStorage.setItem('userEmail', email)

6. REDIRECT TO DASHBOARD
   ├─ User sees their dashboard
   └─ App.jsx shows isLoggedIn=true
```

---

## 🛡️ Security Notes

### Token Management

**Supabase Token (expires in ~1 hour):**
- Handled automatically by Supabase
- Sent to Django only during initial login/signup
- NOT stored in localStorage

**Django JWT Token (for API calls):**
- Stored in `localStorage['access']`
- Used in API request headers: `Authorization: Bearer {access_token}`
- Included in axios interceptor (see `api.js`)

### What Django Doesn't Need

❌ Supabase UID
❌ Supabase refresh token
❌ Firebase UID

✅ User email (unique identifier)
✅ User data (first_name, last_name, etc.)

---

## 📝 API Usage

### Login (Automatic via Supabase)

No direct API call needed. Supabase handles everything:
1. User clicks "Continue with Google"
2. Supabase manages OAuth flow
3. Frontend syncs to Django automatically

### Logout

```javascript
import { logOut } from '../services/supabaseAuthService';

const handleLogout = async () => {
  await logOut();
  // Clears:
  // - Supabase session
  // - localStorage tokens
  // - localStorage user data
  navigate('/');
};
```

### Protected API Calls

All authenticated API calls automatically include the Django JWT token:

```javascript
import { api } from '../services/api';

// Token is added automatically by axios interceptor
const response = await api.get('/api/profile/');
```

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase credentials"

**Solution:**
1. Check `.env.local` exists in frontend folder
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart `npm run dev`

### Issue: "Google OAuth redirect failed"

**Solution:**
1. Check Google Cloud Console → Authorized redirect URIs
2. Add: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
3. Add: `http://localhost:3000/dashboard` (for development)

### Issue: "Cannot find module 'supabase'"

**Solution:**
```bash
cd frontend
npm install @supabase/supabase-js
npm run dev
```

### Issue: "User not syncing to Django"

**Solution:**
1. Open browser DevTools → Console
2. Look for logs starting with "🔄 Syncing Supabase user with Django"
3. Check backend logs: `tail -f /var/log/django.log`
4. Ensure `/api/supabase-login/` endpoint exists:
   ```bash
   python manage.py shell
   >>> from app.urls import urlpatterns
   >>> [p.pattern for p in urlpatterns if 'supabase' in str(p)]
   ```

---

## 📊 Monitoring

### Check Supabase Logs

1. Supabase Dashboard → **Logs**
2. Filter by "auth" to see authentication events

### Check Django Logs

```bash
# Enable debug logging
python manage.py shell
>>> import logging
>>> logging.basicConfig(level=logging.INFO)

# Then check /api/supabase-login/ calls
```

---

## ✅ Migration Checklist

- [ ] Supabase project created
- [ ] Google OAuth configured in Supabase
- [ ] `.env.local` created with Supabase credentials
- [ ] `npm install @supabase/supabase-js` run
- [ ] Frontend files created/updated
- [ ] Backend `/api/supabase-login/` endpoint working
- [ ] Test Google Sign-In works
- [ ] User created in Django database
- [ ] JWT tokens in localStorage
- [ ] Dashboard loads correctly
- [ ] Logout works
- [ ] **Remove all Firebase references** ✅

---

## 🚀 Next Steps

1. **Set Django secret_key** (in settings.py)
2. **Configure CORS** in settings.py:
   ```python
   CORS_ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://localhost:5173",
       "https://yourdomain.com",
   ]
   ```
3. **Set up email verification** (optional)
4. **Deploy to production** with proper domain

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [JWT Authentication in Django](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Supabase + React Integration](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
