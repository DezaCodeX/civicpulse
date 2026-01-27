# CivicPulse - Community Civic Engagement Platform

## 🎉 Firebase Migration Complete! ✅

This application has been successfully migrated to **Firebase Authentication + Firestore Database**. All user data and complaints are now stored in Firestore, and authentication is handled by Firebase Auth.

## 📚 Quick Links

### Getting Started
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Overview of changes (5 min read)
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Developer cheat sheet
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete documentation guide

### Setup & Deployment
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Full setup instructions
- **[VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)** - Testing procedures

### Technical Details
- **[FIREBASE_MIGRATION_COMPLETE.md](FIREBASE_MIGRATION_COMPLETE.md)** - Technical architecture
- **[FIRESTORE_DATA_STRUCTURE.md](FIRESTORE_DATA_STRUCTURE.md)** - Database schema

### Support
- **[TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions
- **[STATUS_REPORT.md](STATUS_REPORT.md)** - Migration completion report

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase project (create at https://firebase.google.com/)

### Installation

1. **Clone and navigate to frontend:**
```bash
cd frontend
npm install
```

2. **Create `.env` file** with Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. **Run development server:**
```bash
npm run dev
```

4. **Visit:** http://localhost:3000

## 🔐 Authentication

### Supported Methods
- ✅ Email/Password signup and login
- ✅ Google OAuth 2.0
- ✅ Password reset via email

### How It Works
```
User Signs Up
    ↓
Creates Firebase Auth account
    ↓
Saves profile to Firestore
    ↓
Stores userId in localStorage
    ↓
Redirects to dashboard
```

## 💾 Database (Firestore)

### Collections
- **users** - User profiles with contact information
- **complaints** - Civic complaints with status tracking

### Key Features
- Real-time synchronization
- Automatic offline persistence
- Server-side timestamps
- Query optimization

## 📱 Features

### User Features
- Create account with email/password
- Sign in with Google
- Manage user profile
- Submit civic complaints
- View complaint status
- Track personal complaints
- Reset forgotten password

### Admin Features (Future)
- View all complaints
- Update complaint status
- User management
- Analytics dashboard

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Tailwind CSS for styling
- Lucide React for icons
- Firebase SDK for auth/database

### Backend
- Firebase Authentication
- Cloud Firestore (NoSQL)
- Cloud Storage (optional)
- Firebase Hosting (optional)

## 📋 Project Structure

```
civicpulse/
├── frontend/                          # React frontend application
│   ├── src/
│   │   ├── firebase.js               # Firebase configuration
│   │   ├── services/
│   │   │   └── firestore.js          # Firestore service layer
│   │   ├── pages/
│   │   │   ├── Signup.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   └── SubmitComplaint.jsx
│   │   └── components/
│   ├── package.json
│   └── vite.config.js
├── app/                               # Django backend (legacy)
├── civic/                             # Django configuration (legacy)
└── [Documentation files]              # Guides and references
```

## 🧪 Testing

### Test User Flow
1. **Sign up** with new email
2. Check **Firebase Console** → Users
3. Check **Firestore** → users collection
4. **Login** with that account
5. **Update profile** → verify Firestore update
6. **Submit complaint** → verify in Firestore
7. **Logout** → verify localStorage clear

### Run Tests
```bash
# Frontend tests (if configured)
npm test

# Build test
npm run build
```

## 🚀 Deployment

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase init hosting
npm run build
firebase deploy
```

### Other Options
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`
- Traditional: Upload dist/ folder to server

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔒 Security

### Firestore Security Rules
- Users can only read/write their own profile
- Users can only read/write their own complaints
- All access requires authentication

See [FIRESTORE_DATA_STRUCTURE.md](FIRESTORE_DATA_STRUCTURE.md) for production rules.

## 💰 Costs

### Firestore Pricing (as of 2024)
- **Free**: 50k reads/day, 20k writes/day
- **Paid**: $0.06 per 100k reads, $0.18 per 100k writes
- **100 users estimate**: ~$0.10/month

## 🐛 Troubleshooting

### Common Issues

**"Permission Denied" errors**
→ Check Firestore security rules and user authentication

**User not appearing after signup**
→ Check Firebase Console → Authentication tab

**Complaints not loading**
→ Check Firestore → complaints collection, verify user_id

**Google login not working**
→ Add localhost:3000 to OAuth authorized URIs

See [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md) for more issues and solutions.

## 📚 Documentation

Comprehensive documentation available:
- **MIGRATION_SUMMARY.md** - Overview of Firebase migration
- **DEPLOYMENT_GUIDE.md** - Setup and deployment
- **FIRESTORE_DATA_STRUCTURE.md** - Database schema
- **VALIDATION_CHECKLIST.md** - Testing guide
- **TROUBLESHOOTING_GUIDE.md** - Problem solving
- **QUICK_REFERENCE.md** - Developer cheat sheet
- **DOCUMENTATION_INDEX.md** - Navigation guide
- **STATUS_REPORT.md** - Migration completion report

Start with [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for guided navigation.

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create pull request

## 📞 Support

For help:
1. Check [TROUBLESHOOTING_GUIDE.md](TROUBLESHOOTING_GUIDE.md)
2. Review [FIRESTORE_DATA_STRUCTURE.md](FIRESTORE_DATA_STRUCTURE.md)
3. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. Search [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

## 📄 License

[Add your license here]

## 📞 Contact

[Add contact information here]

---

## 🎯 Next Steps

1. Read [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
2. Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. Test using [VALIDATION_CHECKLIST.md](VALIDATION_CHECKLIST.md)
4. Deploy with confidence!

**Happy coding! 🚀**

```