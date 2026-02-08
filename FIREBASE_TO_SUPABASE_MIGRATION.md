# Firebase → Supabase Migration Summary

## ❌ What Was Removed

### Firebase Dependencies
```bash
# Removed from package.json:
- firebase
- firebase/auth
- firebase/firestore
```

### Firebase Files
```bash
frontend/src/firebase.js                    ❌ REMOVED
frontend/src/services/firestore.js          ⚠️  MARKED AS UNUSED (keep for reference)
```

### Firebase Auth Methods
```javascript
// ❌ These no longer work:
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

const auth = getAuth(app);
const result = await signInWithPopup(auth, googleProvider);
```

---

## ✅ What Was Added

### Supabase Files
```bash
frontend/src/supabaseClient.js                       ✅ NEW
frontend/src/services/supabaseAuthService.js         ✅ NEW
```

### Backend Endpoint
```bash
POST /api/supabase-login/                           ✅ NEW
```

### Environment Variables
```bash
VITE_SUPABASE_URL=...                               ✅ NEW
VITE_SUPABASE_ANON_KEY=...                          ✅ NEW
VITE_SUPABASE_REDIRECT_URL=...                      ✅ NEW
```

---

## 📊 Comparison

### Authentication Flow

#### Firebase (OLD ❌)
```
User clicks "Sign in with Google"
    ↓
Firebase shows Google popup
    ↓
Firebase handles OAuth
    ↓
Frontend sends uid + email to Django
    ↓
Django creates/updates user
    ↓
Django returns JWT tokens
    ↓
Frontend redirects to dashboard
```

#### Supabase (NEW ✅)
```
User clicks "Continue with Google"
    ↓
Supabase redirects to Google sign-in page
    ↓
Supabase handles OAuth (full redirect flow)
    ↓
Supabase redirects back to dashboard
    ↓
Auth state listener detects sign-in
    ↓
Frontend automatically syncs to Django
    ↓
Django creates/updates user
    ↓
Django returns JWT tokens
    ↓
Frontend stores tokens and shows dashboard
```

### Key Differences

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| **OAuth Flow** | Popup-based | Full page redirect |
| **Token Storage** | Firebase SDK manages | Supabase SDK manages |
| **User Creation** | Firebase handles | Supabase handles |
| **Django Sync** | Manual API call | Automatic listener |
| **Database** | Firestore | PostgreSQL (Supabase) |
| **Role Management** | Not in Firebase | In Django only |
| **Session Persistence** | Automatic | localStorage + Supabase |

---

## 🔄 Component Updates

### Login.jsx

#### Before (Firebase)
```javascript
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const googleProvider = new GoogleAuthProvider();

const handleGoogleLogin = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const userId = result.user.uid;
  const userEmail = result.user.email;
  
  // Manual sync to Django
  const response = await fetch('/api/firebase-login/', {...});
};
```

#### After (Supabase)
```javascript
import { signInWithGoogle } from "../services/supabaseAuthService";

const handleGoogleLogin = async () => {
  await signInWithGoogle();
  // Supabase handles redirect
  // Auth state listener handles Django sync
};
```

### App.jsx

#### Before (Firebase)
```javascript
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setIsLoggedIn(!!user);
    setUser(user);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```

#### After (Supabase)
```javascript
import { setupAuthStateListener } from "./services/supabaseAuthService";

useEffect(() => {
  const subscription = setupAuthStateListener((event, data) => {
    if (event === 'signed_in') {
      setUser(data?.user);
      setIsLoggedIn(true);
    } else if (event === 'signed_out') {
      setUser(null);
      setIsLoggedIn(false);
    }
  });
}, []);
```

### Navbar.jsx

#### Before (Firebase)
```javascript
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const handleLogout = async () => {
  await signOut(auth);
  localStorage.removeItem('userId');
  localStorage.removeItem('access');
  navigate('/');
};
```

#### After (Supabase)
```javascript
import { logOut } from "../services/supabaseAuthService";

const handleLogout = async () => {
  await logOut();  // Handles all cleanup
  navigate('/');
};
```

---

## 🗄️ Data Model Changes

### Firebase User Data
```javascript
{
  uid: "firebase_uid_123",
  email: "user@example.com",
  displayName: "John Doe",
  metadata: {
    creationTime: "...",
    lastSignInTime: "..."
  }
}
```

### Supabase User Data
```javascript
{
  email: "user@example.com",
  user_metadata: {
    name: "John Doe",
    picture: "...",
  },
  created_at: "...",
  updated_at: "..."
}
```

### Django User Model (Same)
```python
{
  id: 1,
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  is_staff: False,
  is_superuser: False,
  role: "CITIZEN"  # Custom field
}
```

---

## 🔑 API Endpoint Changes

### Firebase Login (OLD - Still works)
```bash
POST /api/firebase-login/
Content-Type: application/json

{
  "uid": "firebase_uid_123",
  "email": "user@example.com"
}

Response:
{
  "refresh": "...",
  "access": "...",
  "user": {...}
}
```

### Supabase Login (NEW - Preferred)
```bash
POST /api/supabase-login/
Content-Type: application/json

{
  "email": "user@example.com",
  "supabase_token": "...",
  "user_metadata": {...}
}

Response:
{
  "refresh": "...",
  "access": "...",
  "user": {...}
}
```

---

## 🚨 Breaking Changes

### ❌ NO LONGER AVAILABLE

1. **Firebase email/password login**
   - Was: `signInWithEmailAndPassword(auth, email, password)`
   - Now: Use Google OAuth only or add Supabase email auth

2. **Firestore database operations**
   - Was: `getDoc()`, `setDoc()`, etc.
   - Now: Use Django REST API instead

3. **Firebase UID storage**
   - Was: `localStorage.setItem('userId', uid)`
   - Now: Use `localStorage.setItem('userEmail', email)`

4. **Firebase user updates**
   - Was: `updateProfile(user, {displayName: '...'})`
   - Now: Use Django API: `PUT /api/profile/`

---

## 📋 Checklist for Complete Migration

- [x] Remove Firebase imports from frontend
- [x] Create Supabase client file
- [x] Create Supabase auth service
- [x] Update Login.jsx
- [x] Update Signup.jsx
- [x] Update App.jsx
- [x] Update Navbar.jsx
- [x] Create `/api/supabase-login/` backend endpoint
- [x] Add URL routing
- [ ] Run `npm install @supabase/supabase-js`
- [ ] Create `.env.local` with Supabase credentials
- [ ] Set up Google OAuth in Supabase
- [ ] Test login flow end-to-end
- [ ] Verify user creation in Django
- [ ] Check JWT token storage
- [ ] Test logout
- [ ] Test dashboard access with auth
- [ ] Remove firebase.js from codebase
- [ ] Remove Firebase from package.json (optional)

---

## ⚠️ Important Notes

### For Developers

1. **Do not use `firebase.js` anymore** - it will cause conflicts
2. **All auth calls go through Supabase** - no more Firebase SDK calls
3. **Django is the source of truth for roles** - not Supabase
4. **Keep localStorage clean** - only store: `access`, `refresh`, `user`, `userEmail`

### For Deployment

1. **Set Supabase credentials in production**
   - `.env.local` for development
   - Environment variables for production
2. **Update Google OAuth redirect URLs**
   - Add your production domain to Google Cloud Console
   - Add your production domain to Supabase
3. **Keep Django JWT secret secure**
   - Use strong `SECRET_KEY` in Django settings
   - Never commit secrets to version control

### For Testing

```javascript
// Supabase session check
import { getSession } from '../supabaseClient';
const session = await getSession();
console.log('Session:', session);

// Django token check
const token = localStorage.getItem('access');
console.log('JWT Token exists:', !!token);

// User data check
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user?.role);
```

---

## 📞 Support

If you encounter issues:

1. **Check Supabase logs**: Dashboard → Logs → Filter "auth"
2. **Check Django logs**: `python manage.py runserver` output
3. **Check browser console**: Errors usually logged there
4. **Check localStorage**: DevTools → Application → localStorage
5. **Run diagnostics**: 
   ```bash
   python manage.py shell
   >>> from app.models import CustomUser
   >>> CustomUser.objects.all()
   ```
