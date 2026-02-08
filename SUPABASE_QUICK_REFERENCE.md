# Supabase Auth - Quick Reference Card

## 🔑 Essential Files

| File | Purpose |
|------|---------|
| `frontend/src/supabaseClient.js` | Supabase client initialization |
| `frontend/src/services/supabaseAuthService.js` | Auth service + Django sync |
| `frontend/src/pages/Login.jsx` | Google Sign-In button |
| `frontend/src/pages/Signup.jsx` | Google Sign-Up button |
| `frontend/src/App.jsx` | Auth state listener |
| `frontend/src/components/Navbar.jsx` | Logout handler |
| `app/views.py` | `/api/supabase-login/` endpoint |
| `app/urls.py` | Supabase URL routing |

## ⚡ Quick Setup (10 minutes)

```bash
# 1. Install Supabase package
cd frontend
npm install @supabase/supabase-js

# 2. Create .env.local in frontend folder
echo "VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=YOUR_KEY" >> .env.local
echo "VITE_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard" >> .env.local

# 3. Start development servers
npm run dev
# In another terminal:
cd ../..
python manage.py runserver

# 4. Test login at http://localhost:3000/login
```

## 🔐 Auth Functions

### Sign In (Frontend)
```javascript
import { signInWithGoogle } from '../services/supabaseAuthService';

// User clicks button
await signInWithGoogle();
// Supabase redirects to Google, then back to dashboard
```

### Sign Out (Frontend)  
```javascript
import { logOut } from '../services/supabaseAuthService';

// User clicks logout
await logOut();
// Clears Supabase + Django tokens + localStorage
// Navigates to home
```

### Check Session (Frontend)
```javascript
import { getSession } from '../supabaseClient';

const session = await getSession();
if (session) {
  console.log('user:', session.user.email);
  console.log('token:', session.access_token);
}
```

### Protected API Call (Frontend)
```javascript
import { api } from '../services/api';

// JWT token added automatically via axios interceptor
const response = await api.get('/api/profile/');
// Authorization header: Bearer {jwt_token}
```

## 📊 Data Flow

```
Browser Login Button
    ↓
signInWithGoogle() → Supabase Client
    ↓
Redirect to Google Sign-In
    ↓
User authenticates
    ↓
Supabase redirects to /dashboard
    ↓
Auth state listener triggers
    ↓
setupAuthStateListener() → 'SIGNED_IN' event
    ↓
syncSupabaseWithDjango()
    ↓
POST /api/supabase-login/ (backend)
    ↓
Django: Create/fetch user
    ↓
Django: Generate JWT tokens
    ↓
Frontend: Store tokens in localStorage
    ↓
Dashboard: User is logged in ✅
```

## 🔒 Token Management

| Token | Source | Storage | Lifetime | Use |
|-------|--------|---------|----------|-----|
| Supabase `access_token` | Supabase | Supabase SDK | ~1 hour | OAuth proof |
| Django `access` (JWT) | Django | localStorage | 1 hour | API calls |
| Django `refresh` (JWT) | Django | localStorage | 7 days | Refresh expired token |

## 📁 Environment Variables

### Frontend `.env.local`
```env
# Required - Get from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for OAuth redirect
VITE_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard

# Optional
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Backend Django (existing)
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://yourproduction.com",
]

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

## 🌐 API Endpoints

### GET /api/profile/
Get current user profile
```bash
curl -H "Authorization: Bearer {jwt_token}" \
     http://localhost:8000/api/profile/
```

### PUT /api/profile/
Update user profile
```bash
curl -X PUT \
     -H "Authorization: Bearer {jwt_token}" \
     -H "Content-Type: application/json" \
     -d '{"first_name":"John","last_name":"Doe"}' \
     http://localhost:8000/api/profile/
```

### POST /api/supabase-login/ (Internal)
Sync user with Django (called automatically)
```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","supabase_token":"..."}' \
     http://localhost:8000/api/supabase-login/
```

## 🐛 Debugging

### Check Supabase Session
```javascript
// In browser console
import { getSession } from './supabaseClient';
getSession().then(s => console.log(s));
```

### Check localStorage Tokens
```javascript
// In browser console
console.log('access:', localStorage.getItem('access'));
console.log('user:', JSON.parse(localStorage.getItem('user')));
```

### Check Django User
```bash
python manage.py shell
>>> from app.models import CustomUser
>>> CustomUser.objects.filter(email='user@example.com').first()
```

### View Logs
```bash
# Supabase OAuth logs
# Supabase Dashboard → Logs → Filter "auth"

# Django logs
# Terminal running: python manage.py runserver
# Look for: "Supabase login attempt"

# Browser console
# Open DevTools → Console
# Look for: "🔄 Syncing Supabase user" and "✅" messages
```

## ✅ Testing Checklist

- [ ] Click "Continue with Google" button
- [ ] Google login popup/redirect works
- [ ] Redirected back to /dashboard
- [ ] Browser console shows "✅ Successfully synced with Django"
- [ ] localStorage has `access`, `refresh`, `user`, `userEmail`
- [ ] Dashboard page displays correctly
- [ ] User exists in Django: `CustomUser.objects.all()`
- [ ] Click "Logout" button
- [ ] Redirected to home page
- [ ] localStorage cleared
- [ ] Can login again

## 🚨 Common Errors & Fixes

| Error | Fix |
|-------|-----|
| "Missing Supabase credentials" | Create `.env.local` with credentials |
| "Google OAuth redirect failed" | Add Supabase callback URL to Google Console |
| "Cannot find module 'supabase'" | Run `npm install @supabase/supabase-js` |
| "User not syncing" | Check console logs + verify DJ endpoint exists |
| "Unauthorized 401" | Check JWT token in localStorage |
| "CORS error" | Verify frontend URL in Django CORS_ALLOWED_ORIGINS |

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase + React Guide](https://supabase.com/docs/guides/auth/auth-helpers/react)
- [JWT in Django REST](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 💡 Pro Tips

1. **Always check console logs** - The app logs important events
2. **Clear localStorage when debugging** - Fresh session every time
3. **Use DevTools Network** - See actual API requests/responses
4. **Check Supabase Logs** - Auth events are logged there
5. **Test with incognito** - Avoids browser cache issues

---

**Last Updated**: February 2026  
**Status**: ✅ Production Ready  
**Firebase Removed**: ✅ Yes  
**Supabase Integration**: ✅ Complete
