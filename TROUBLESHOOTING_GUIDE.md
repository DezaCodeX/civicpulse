# Firebase Migration - Troubleshooting Guide

## Common Issues & Solutions

### Authentication Issues

#### 1. "Firebase app not initialized" Error
**Symptoms**: 
- App crashes with "Firebase app not initialized"
- getAuth() or getFirestore() returns undefined

**Causes**:
- firebase.js not imported in the page
- Firebase config is missing or incorrect
- App component doesn't load before using Firebase

**Solutions**:
```javascript
// Make sure firebase.js is imported at the TOP of your component
import { auth } from '../firebase';

// In main.jsx, ensure App.jsx loads after Firebase initialization
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

#### 2. "User not authenticated" When Logging In
**Symptoms**:
- Login appears successful in UI
- But subsequent pages show "not authenticated"
- userId not in localStorage

**Causes**:
- localStorage not being set in login handler
- Page refreshing before localStorage is set
- Async timing issues

**Solutions**:
```javascript
// In Login.jsx - ensure this code runs:
const handleEmailLogin = async (e) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const userId = result.user.uid; // Get the UID
  
  // MUST store before navigating
  localStorage.setItem("userId", userId);
  localStorage.setItem("userEmail", result.user.email);
  
  // Now navigate
  navigate("/dashboard");
};
```

---

#### 3. "Permission Denied" Reading User Profile
**Symptoms**:
- Firestore returns permission denied error
- Profile page can't load user data
- Console shows: `FirebaseError: Missing or insufficient permissions`

**Causes**:
- Firestore security rules are too restrictive
- userId doesn't match authenticated user
- User not authenticated (missing token)

**Solutions**:
```javascript
// Check 1: Verify user is authenticated
const userId = localStorage.getItem('userId');
if (!userId) {
  navigate('/login');
  return;
}

// Check 2: Update Firestore rules
// Go to Firebase Console → Firestore → Rules
// Set to test mode temporarily:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

// Check 3: Verify userId matches
// In firestore.js:
console.log("Fetching profile for userId:", userId);
const docRef = doc(db, "users", userId);
const docSnap = await getDoc(docRef);
console.log("Document exists:", docSnap.exists());
console.log("Document data:", docSnap.data());
```

---

#### 4. Google OAuth Not Working
**Symptoms**:
- Google login button does nothing
- Popup blocked or doesn't appear
- "Popup closed by user" error

**Causes**:
- Google OAuth not enabled in Firebase Console
- Wrong OAuth client ID
- Localhost:3000 not authorized for development
- Browser popup blocker

**Solutions**:
```javascript
// Step 1: Enable Google Provider in Firebase Console
// Authentication → Sign-in method → Google → Enable

// Step 2: Add your domain to authorized origins
// Go to Google Cloud Console → APIs & Services → OAuth consent screen
// Add localhost:3000 for development
// Add your domain for production

// Step 3: Update firebase.js
import { GoogleAuthProvider } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  'login_hint': 'user@example.com' // Optional
});

// Step 4: Allow popups in browser
// Check browser settings, disable popup blocker for localhost:3000

// Step 5: Add better error handling
const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.setItem("userId", result.user.uid);
    navigate("/dashboard");
  } catch (err) {
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    
    if (err.code === 'auth/popup-blocked') {
      alert('Popup was blocked. Please allow popups for this site.');
    } else if (err.code === 'auth/popup-closed-by-user') {
      alert('Sign-in was cancelled.');
    }
  }
};
```

---

### Firestore Data Issues

#### 5. "User Profile Not Found" After Signup
**Symptoms**:
- Signup succeeds (user appears in Firebase Auth)
- But profile page shows error: "Could not load user data"
- Profile not in Firestore /users collection

**Causes**:
- createUserProfile() not being called
- Firestore write failed silently
- userId mismatch

**Solutions**:
```javascript
// In Signup.jsx - ensure this full sequence:
const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    // Step 1: Create Firebase Auth user
    const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
    const userId = result.user.uid;
    console.log("Firebase user created:", userId);
    
    // Step 2: Create Firestore profile
    const profileData = {
      email: formData.email,
      first_name: formData.fullName.split(' ')[0],
      last_name: formData.fullName.split(' ')[1] || '',
    };
    console.log("Creating profile:", profileData);
    
    await createUserProfile(userId, profileData);
    console.log("Profile created in Firestore");
    
    // Step 3: Store userId
    localStorage.setItem("userId", userId);
    console.log("userId stored in localStorage");
    
    // Step 4: Navigate
    navigate('/dashboard');
  } catch (err) {
    console.error("Full error:", err);
    setError(err.message);
  }
};

// Verify in Firebase Console:
// 1. Go to Authentication tab → Users
// 2. Check that new user appears
// 3. Copy the user's UID
// 4. Go to Firestore → Collections → users
// 5. Check if document with that UID exists
```

---

#### 6. "Complaints Not Showing" in My Complaints
**Symptoms**:
- Submit complaint succeeds
- Complaint doesn't appear in "My Complaints" list
- Empty state shown instead of complaint list

**Causes**:
- Complaint not saved to Firestore
- userId mismatch (complaint saved with different userId)
- userId not in localStorage when fetching

**Solutions**:
```javascript
// In SubmitComplaint.jsx - add logging:
const handleSubmit = async (e) => {
  const userId = localStorage.getItem('userId');
  console.log("Current userId:", userId);
  
  const complaintData = {
    category: formData.category,
    location: formData.location,
    description: formData.description,
    status: 'pending',
  };
  console.log("Complaint data:", complaintData);
  
  try {
    await createComplaint(userId, complaintData);
    console.log("Complaint created successfully");
    navigate('/my-complaints');
  } catch (err) {
    console.error("Complaint creation failed:", err);
  }
};

// In MyComplaints.jsx - add logging:
const loadComplaints = async () => {
  const userId = localStorage.getItem('userId');
  console.log("Fetching complaints for userId:", userId);
  
  try {
    const userComplaints = await getUserComplaints(userId);
    console.log("Complaints fetched:", userComplaints);
    setComplaints(userComplaints || []);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
};

// Verify in Firebase Console:
// 1. Go to Firestore → Collections → complaints
// 2. Check that complaint documents exist
// 3. Verify each has correct user_id field
// 4. Verify user_id matches your user's UID
```

---

#### 7. "Timestamp is not a function" Error
**Symptoms**:
- MyComplaints page shows error
- Error: `complaint.created_at.toDate is not a function`
- Dates don't display

**Causes**:
- Firestore timestamp not properly converted
- Data from different source (not Firestore)
- Firestore document doesn't have timestamp

**Solutions**:
```javascript
// In MyComplaints.jsx - handle timestamps safely:
{complaints.map(complaint => (
  <tr key={complaint.id}>
    {/* ... other fields ... */}
    <td>
      {complaint.created_at ? (
        // Handle both Firestore Timestamp and regular Date
        new Date(
          complaint.created_at.toDate?.() || complaint.created_at
        ).toLocaleDateString()
      ) : (
        'N/A'
      )}
    </td>
  </tr>
))}

// In firestore.js - ensure timestamps are created:
export async function createComplaint(userId, complaintData) {
  const complaintsRef = collection(db, 'complaints');
  
  const docRef = await addDoc(complaintsRef, {
    ...complaintData,
    user_id: userId,
    status: complaintData.status || 'pending',
    created_at: serverTimestamp(), // Use serverTimestamp()
    updated_at: serverTimestamp(),
  });
  
  return docRef.id;
}
```

---

### Firestore Query Issues

#### 8. "Index Required" Error
**Symptoms**:
- Complex queries fail
- Error: `FAILED_PRECONDITION: The query requires an index`
- Error message includes link to create index

**Causes**:
- Query has multiple conditions on different fields
- Firestore needs a composite index
- Index hasn't been created yet

**Solutions**:
```javascript
// Firestore will provide a link to create the index
// Click the link in the error message
// Or create manually:

// Go to Firebase Console → Firestore → Indexes
// Create composite index for:
// Collection: complaints
// Fields: user_id (Ascending), created_at (Descending)

// After index is created (takes a few minutes):
// Query will work
const q = query(
  collection(db, 'complaints'),
  where('user_id', '==', userId),
  orderBy('created_at', 'desc')
);
```

---

#### 9. "Too Many Requests" / Rate Limiting
**Symptoms**:
- Firebase starts rejecting requests
- Error: `RESOURCE_EXHAUSTED: Quota exceeded`
- Errors appear in Firebase Console → Usage

**Causes**:
- Firestore usage exceeded your pricing tier limits
- Too many reads/writes in short time
- Inefficient queries running repeatedly

**Solutions**:
```javascript
// 1. Reduce query frequency - implement caching:
const [cachedComplaints, setCachedComplaints] = useState(null);
const [cacheTime, setCacheTime] = useState(null);

const loadComplaints = async () => {
  // Don't fetch if cached within last 5 minutes
  if (cachedComplaints && Date.now() - cacheTime < 5 * 60 * 1000) {
    setComplaints(cachedComplaints);
    return;
  }
  
  const userComplaints = await getUserComplaints(userId);
  setCachedComplaints(userComplaints);
  setCacheTime(Date.now());
  setComplaints(userComplaints);
};

// 2. Implement pagination:
const loadComplaints = async (pageSize = 10) => {
  const q = query(
    collection(db, 'complaints'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 3. Use real-time listeners instead of repeated fetches:
const unsubscribe = subscribeToUserComplaints(userId, (complaints) => {
  setComplaints(complaints);
});
// Returns live updates without repeated reads
```

---

### LocalStorage Issues

#### 10. "userId is null" in localStorage
**Symptoms**:
- User logged in but userId not in localStorage
- Dashboard redirects to login
- Every page shows "not authenticated"

**Causes**:
- localStorage not being set on login
- localStorage cleared accidentally
- Private/incognito mode with limits

**Solutions**:
```javascript
// Step 1: Verify localStorage is being set
console.log("Setting userId...");
localStorage.setItem("userId", userId);
console.log("Checking localStorage:", localStorage.getItem("userId"));

// Step 2: Add fallback to get from Firebase auth:
const getUserId = () => {
  let userId = localStorage.getItem('userId');
  
  if (!userId && auth.currentUser) {
    // Fallback to Firebase auth
    userId = auth.currentUser.uid;
    localStorage.setItem('userId', userId);
  }
  
  return userId;
};

// Use throughout app:
const userId = getUserId();

// Step 3: Check browser settings
// Some browsers in private mode restrict localStorage
// Test in normal mode vs private/incognito mode

// Step 4: Use SessionStorage as fallback:
const setAuthData = (userId, email) => {
  try {
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', email);
  } catch (e) {
    // Fallback to sessionStorage if localStorage is unavailable
    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('userEmail', email);
  }
};

const getAuthData = () => {
  return {
    userId: localStorage.getItem('userId') || sessionStorage.getItem('userId'),
    email: localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail'),
  };
};
```

---

### Performance Issues

#### 11. "Page Takes Too Long to Load"
**Symptoms**:
- Dashboard loads slowly
- Profile page slow to display data
- Users complain about lag

**Causes**:
- Loading all data at once
- Network request delays
- Unoptimized queries

**Solutions**:
```javascript
// 1. Implement pagination:
const [complaints, setComplaints] = useState([]);
const [lastDoc, setLastDoc] = useState(null);

const loadMore = async () => {
  const startQuery = lastDoc 
    ? query(
        collection(db, 'complaints'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(20)
      )
    : query(
        collection(db, 'complaints'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(20)
      );
  
  const snapshot = await getDocs(startQuery);
  const newComplaints = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  setComplaints(prev => [...prev, ...newComplaints]);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
};

// 2. Use real-time listeners sparingly:
// Only for critical data that needs to be live
// Use regular queries for static data

// 3. Implement loading skeleton:
{loading ? (
  <div className="animate-pulse">
    {/* Skeleton UI */}
  </div>
) : (
  // Real data
)}

// 4. Monitor in Firebase Console:
// Go to Firestore → Usage
// Check read/write operations
// Look for unusual spikes
```

---

### Development/Testing Issues

#### 12. "Can't Test with Real Firebase"
**Symptoms**:
- Want to test without using live Firebase quota
- Don't want to pollute production data
- Want to test offline

**Solutions**:
```bash
# Use Firebase Emulator Suite
firebase init emulators

# Select Authentication and Firestore emulators
# Then run:
firebase emulators:start

# This starts local Firebase at localhost:4000

# Update firebase.js for development:
import { connectAuthEmulator } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';

if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

---

## Debug Checklist

When something isn't working:

1. **Check Firebase Console**
   - [ ] Go to Authentication → Users (is user there?)
   - [ ] Go to Firestore → Collections (is data there?)
   - [ ] Check Security Rules
   - [ ] Check quotas/usage

2. **Check Browser Console**
   - [ ] Any error messages? Copy them
   - [ ] Add `console.log()` statements to trace flow
   - [ ] Check Network tab for API calls

3. **Check localStorage**
   - [ ] DevTools → Application → Local Storage
   - [ ] Is userId present?
   - [ ] Is userEmail present?

4. **Check IndexedDB** (Firestore offline data)
   - [ ] DevTools → Application → IndexedDB
   - [ ] Check /firebaseapp collections exist
   - [ ] Look for your document data

5. **Test Steps**
   - [ ] Sign up fresh account
   - [ ] Check Firebase Console for user
   - [ ] Check Firestore for profile
   - [ ] Logout → Login
   - [ ] Check console errors during each step

---

## Getting Help

If issue persists:

1. **Search Firestore Documentation**
   - https://firebase.google.com/docs/firestore

2. **Check Firebase Errors**
   - Error message usually includes helpful hints
   - Copy error code and search Firebase docs

3. **Check firestore.js Service Layer**
   - Most common issues are in CRUD operations
   - Verify queries match expected collection structure

4. **Create Minimal Test Case**
   ```javascript
   // Test basic Firestore read/write
   import { db } from '../firebase';
   import { doc, setDoc, getDoc } from 'firebase/firestore';
   
   async function testFirestore() {
     // Write
     await setDoc(doc(db, 'test', 'test-doc'), { data: 'test' });
     
     // Read
     const result = await getDoc(doc(db, 'test', 'test-doc'));
     console.log(result.data());
   }
   ```

5. **Check Firebase Status**
   - https://status.firebase.google.com/
   - See if there are service outages

---

**Last Updated**: 2024
**Covers**: Firebase Auth + Firestore issues
