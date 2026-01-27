# Deployment & Next Steps Guide

## Immediate Tasks to Verify Firebase Setup

### 1. Check Firebase Configuration
Make sure your `firebase.js` has the correct credentials:

```javascript
// frontend/src/firebase.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 2. Test the Application

```bash
# In frontend directory
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` and test:
- ✅ Sign up with email/password
- ✅ Check Firebase Console → Users (should appear)
- ✅ Check Firestore → users collection (should have profile data)
- ✅ Login with created account
- ✅ Update profile information
- ✅ Submit a complaint
- ✅ View my complaints
- ✅ Logout

### 3. Firebase Console Verification

Go to your [Firebase Console](https://console.firebase.google.com/):

1. **Authentication Tab**
   - Should see email/password methods enabled
   - Should see Google OAuth enabled
   - New users should appear here after signup

2. **Firestore Database Tab**
   - Should have `users` collection with user profiles
   - Should have `complaints` collection with submitted complaints
   - Check sample documents match expected structure

3. **Firestore Rules Tab**
   - Current: Test mode (allows all reads/writes)
   - Production: Should implement security rules (see FIREBASE_MIGRATION_COMPLETE.md)

## Environment Variables Setup

Create a `.env` file in the frontend directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Update `frontend/src/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
```

## Django Backend - What's Next?

### Option 1: Remove Django Entirely
If you don't need Django for anything else:
```bash
# Stop Django server
# Delete app/ folder and manage.py if not needed
# Keep only frontend
```

### Option 2: Keep Django for Admin/Analytics
If you want to keep Django for:
- Admin dashboard
- Analytics/reporting
- Batch operations
- Scheduled tasks

Then:
1. Remove authentication endpoints (login/signup/profile)
2. Add Firestore Admin SDK to Django
3. Use Django for read-only analytics on Firestore data
4. Implement Django admin to read Firestore data

## Production Security Checklist

- [ ] **Firestore Rules**: Update from test mode to production rules (see FIREBASE_MIGRATION_COMPLETE.md)
- [ ] **API Keys**: Restrict Firebase API key to web-only, enable only needed services
- [ ] **Email Verification**: Enable in Firebase Authentication → Email/Password → Email verification
- [ ] **Password Recovery**: Set up SMTP for password reset emails
- [ ] **Google OAuth**: Add production OAuth domain to allowed redirect URIs
- [ ] **Environment Variables**: Ensure .env is in .gitignore, never commit secrets
- [ ] **HTTPS**: Deploy with HTTPS certificate (Firebase Hosting does this automatically)
- [ ] **Rate Limiting**: Consider Firebase rate limiting for production
- [ ] **Backups**: Enable Firestore automated backups
- [ ] **Monitoring**: Set up Firebase monitoring for quota and errors

## Deployment Options

### Option A: Firebase Hosting (Recommended)
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase hosting in frontend directory
firebase init hosting

# Build frontend
npm run build

# Deploy
firebase deploy
```

### Option B: Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Option C: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option D: Traditional Server (AWS, GCP, etc.)
```bash
# Build frontend
npm run build

# Upload dist/ folder to server
# Serve with nginx/apache
# Set up SSL certificate
```

## Monitoring & Debugging

### 1. Firebase Console Monitoring
- Go to Firestore → Usage to monitor read/write operations
- Check Authentication → Activity for login attempts
- Monitor billing in Project Settings

### 2. Browser DevTools
- Open DevTools → Application → Local Storage
- Check `userId` and `userEmail` are stored correctly
- Check IndexedDB → firebaseapp → Firestore data

### 3. Browser Console Errors
- Check for any Firebase auth errors
- Check Firestore permission denied errors
- Check network tab for API calls

### 4. Firebase Emulator (for local development)
```bash
# Install Firebase Emulator
firebase emulators:start

# This runs local Firebase without using production
# Good for development and testing
```

## Common Issues & Solutions

### Issue: "Permission denied" errors in Firestore
**Solution**: 
- Check Firestore rules allow your operations
- Verify user is authenticated with valid JWT
- Check userId matches the document path

### Issue: "Firebase app not initialized"
**Solution**: 
- Ensure firebase.js is imported before using auth/db
- Check firebaseConfig credentials are correct

### Issue: Login works but profile not loading
**Solution**: 
- Check user profile exists in Firestore /users/{userId}
- Verify userId is being stored in localStorage
- Check browser console for firestore errors

### Issue: Google OAuth not working
**Solution**: 
- Add localhost:3000 to OAuth redirect URIs in Firebase
- Add production domain when deploying
- Check Google OAuth is enabled in Firebase

### Issue: Complaints not saving
**Solution**: 
- Verify /complaints collection exists in Firestore
- Check userId is valid and stored
- Verify Firestore rules allow writes from this user

## Performance Optimization

1. **Index Queries**: For complex queries, Firestore will suggest creating indexes
2. **Limit Data**: Use pagination for large lists of complaints
3. **Cache Strategy**: Implement caching for frequently accessed data
4. **Offline Support**: Already enabled with IndexedDB persistence

## Real-time Features (Future Enhancements)

The firestore.js service already has `subscribeToUserComplaints()` for real-time updates:

```javascript
// Example: Real-time complaint updates
import { subscribeToUserComplaints } from '../services/firestore';

useEffect(() => {
  const unsubscribe = subscribeToUserComplaints(userId, (complaints) => {
    setComplaints(complaints);
  });
  
  return () => unsubscribe(); // Clean up listener on unmount
}, [userId]);
```

## Support & Resources

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Query Guide**: https://firebase.google.com/docs/firestore/query-data/queries
- **Firebase Security Rules**: https://firebase.google.com/docs/rules/basics
- **React Firebase Library**: https://github.com/FirebaseExtended/react-firebase-hooks

---

**Migration Status**: ✅ COMPLETE

Your application is now fully migrated to Firebase! All user data and complaints are stored in Firestore, and authentication is handled by Firebase Authentication.

Next step: Deploy to production and monitor Firestore usage!
