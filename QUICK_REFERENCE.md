# Firebase Migration - Quick Reference Card

## One-Page Cheat Sheet

### Import Statements
```javascript
// Firebase Authentication
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';

// Firestore Service Layer
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  createComplaint,
  getUserComplaints,
  subscribeToUserComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  getAllComplaints
} from '../services/firestore';
```

---

## Common Code Patterns

### Sign Up
```javascript
const handleSignUp = async (email, password, name) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const userId = result.user.uid;
    
    await createUserProfile(userId, {
      email,
      first_name: name.split(' ')[0],
      last_name: name.split(' ')[1] || '',
    });
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message);
  }
};
```

### Login
```javascript
const handleLogin = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem('userId', result.user.uid);
    localStorage.setItem('userEmail', result.user.email);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message);
  }
};
```

### Google OAuth
```javascript
const googleProvider = new GoogleAuthProvider();

const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const userId = result.user.uid;
    
    // Create profile if doesn't exist
    const profile = await getUserProfile(userId);
    if (!profile) {
      await createUserProfile(userId, {
        email: result.user.email,
        first_name: result.user.displayName?.split(' ')[0] || '',
        last_name: result.user.displayName?.split(' ')[1] || '',
      });
    }
    
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', result.user.email);
    navigate('/dashboard');
  } catch (err) {
    setError(err.message);
  }
};
```

### Logout
```javascript
const handleLogout = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    navigate('/login');
  } catch (err) {
    console.error('Logout error:', err);
  }
};
```

### Get User Profile
```javascript
useEffect(() => {
  const loadProfile = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/login');
      return;
    }
    
    const profile = await getUserProfile(userId);
    setProfile(profile);
  };
  
  loadProfile();
}, []);
```

### Update Profile
```javascript
const handleSaveProfile = async (updatedData) => {
  const userId = localStorage.getItem('userId');
  await updateUserProfile(userId, updatedData);
  setSuccess('Profile updated!');
};
```

### Submit Complaint
```javascript
const handleSubmitComplaint = async (formData) => {
  const userId = localStorage.getItem('userId');
  
  await createComplaint(userId, {
    category: formData.category,
    location: formData.location,
    description: formData.description,
    latitude: formData.latitude,
    longitude: formData.longitude,
    status: 'pending',
  });
  
  navigate('/my-complaints');
};
```

### Get User Complaints
```javascript
useEffect(() => {
  const loadComplaints = async () => {
    const userId = localStorage.getItem('userId');
    const complaints = await getUserComplaints(userId);
    setComplaints(complaints);
  };
  
  loadComplaints();
}, []);
```

### Real-time Complaints Listener
```javascript
useEffect(() => {
  const userId = localStorage.getItem('userId');
  
  const unsubscribe = subscribeToUserComplaints(userId, (complaints) => {
    setComplaints(complaints);
  });
  
  return () => unsubscribe();
}, []);
```

---

## Error Codes Quick Lookup

| Code | Meaning | Solution |
|------|---------|----------|
| `auth/user-not-found` | Email not registered | Direct to signup |
| `auth/wrong-password` | Incorrect password | Show error, try again |
| `auth/invalid-email` | Bad email format | Validate email |
| `auth/email-already-in-use` | Email taken | Suggest login |
| `auth/weak-password` | Password too weak | Show requirements |
| `auth/popup-blocked` | Google popup blocked | Allow popups |
| `auth/popup-closed-by-user` | User closed popup | Show cancelled message |
| `permission-denied` | Firestore rules | Check rules/user |
| `not-found` | Document doesn't exist | Create or redirect |
| `RESOURCE_EXHAUSTED` | Rate limited | Reduce queries |

---

## LocalStorage Keys
```javascript
localStorage.getItem('userId')      // Firebase UID
localStorage.getItem('userEmail')   // User's email
```

---

## Firestore Collections
```
/users/{userId}
  ├── email
  ├── first_name
  ├── last_name
  ├── phone_number
  ├── address
  ├── city
  ├── state
  ├── created_at
  └── updated_at

/complaints/{complaintId}
  ├── user_id
  ├── category
  ├── location
  ├── description
  ├── latitude
  ├── longitude
  ├── status
  ├── created_at
  └── updated_at
```

---

## Firestore Service Functions

### Users
| Function | Parameters | Returns |
|----------|-----------|---------|
| `createUserProfile` | userId, userData | Promise |
| `getUserProfile` | userId | Object \| null |
| `updateUserProfile` | userId, updates | Promise |

### Complaints
| Function | Parameters | Returns |
|----------|-----------|---------|
| `createComplaint` | userId, data | Promise<string> |
| `getUserComplaints` | userId | Promise<Array> |
| `subscribeToUserComplaints` | userId, callback | function |
| `getComplaint` | complaintId | Object \| null |
| `updateComplaint` | complaintId, updates | Promise |
| `deleteComplaint` | complaintId | Promise |
| `getAllComplaints` | - | Promise<Array> |

---

## Firestore Query Examples

### Get user's complaints
```javascript
const complaints = await getUserComplaints(userId);
```

### Subscribe to live updates
```javascript
const unsubscribe = subscribeToUserComplaints(userId, (data) => {
  console.log('Complaints updated:', data);
});
```

### Get single complaint
```javascript
const complaint = await getComplaint(complaintId);
```

### Update complaint status
```javascript
await updateComplaint(complaintId, { status: 'resolved' });
```

---

## Testing Checklist

- [ ] Signup with email → check Firebase Auth
- [ ] Check profile in Firestore /users
- [ ] Login with that email
- [ ] Google OAuth signup → check Firebase
- [ ] Profile page loads user data
- [ ] Update profile → persists in Firestore
- [ ] Submit complaint → appears in Firestore
- [ ] View complaints → shows submitted
- [ ] Logout → clears localStorage
- [ ] No console errors

---

## Common File Paths

```
frontend/src/
├── firebase.js .................. Firebase config
├── services/
│   └── firestore.js ............ All Firestore operations
├── pages/
│   ├── Signup.jsx ............. Email/Password signup
│   ├── Login.jsx .............. Email/Password + Google login
│   ├── Profile.jsx ............ Edit user profile
│   ├── Dashboard.jsx .......... Welcome page
│   ├── MyComplaints.jsx ....... View complaints list
│   └── SubmitComplaint.jsx .... Submit new complaint
└── App.jsx .................... Main app component
```

---

## Environment Variables (.env)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

---

## Firestore Security Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write own profile only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Users can read/write own complaints only
    match /complaints/{complaintId} {
      allow read, write: if request.auth.uid == resource.data.user_id;
    }
  }
}
```

---

## Debugging Tips

```javascript
// Check if authenticated
console.log('Current user:', auth.currentUser);
console.log('User UID:', auth.currentUser?.uid);

// Check localStorage
console.log('UserId:', localStorage.getItem('userId'));
console.log('Email:', localStorage.getItem('userEmail'));

// Test Firestore read
const testProfile = await getUserProfile('test-uid');
console.log('Profile:', testProfile);

// Enable Firestore logging
import { enableLogging } from 'firebase/firestore';
enableLogging(true);
```

---

## Quick Start (30 seconds)

1. **Install**: `npm install` in frontend
2. **Configure**: Add Firebase credentials to `.env`
3. **Run**: `npm run dev` 
4. **Test**: Signup → check Firebase Console
5. **Deploy**: `npm run build` then upload dist/

---

## Status Check

- ✅ Authentication implemented
- ✅ Firestore integration complete
- ✅ All CRUD operations working
- ✅ Real-time listeners available
- ⚠️ Security rules need production setup
- ⚠️ Environment variables need configuration

---

**Print this page for desk reference!**

Last Updated: 2024 | Firebase Migration Complete
