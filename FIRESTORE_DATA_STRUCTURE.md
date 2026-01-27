# Firestore Data Structure Reference

## Complete Database Schema

### Collection: `users`

**Path**: `/users/{userId}`

**Document Structure**:
```javascript
{
  // User Profile Information
  email: String,              // User's email address (from Firebase Auth)
  first_name: String,         // First name
  last_name: String,          // Last name
  phone_number: String,       // Phone number (optional)
  address: String,            // Street address (optional)
  city: String,               // City (optional)
  state: String,              // State/Province (optional)
  
  // Timestamps
  created_at: Timestamp,      // Account creation time (auto-set by server)
  updated_at: Timestamp,      // Last profile update time (auto-set by server)
}
```

**Example Document**:
```javascript
{
  email: "john.doe@example.com",
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1-555-123-4567",
  address: "123 Main Street",
  city: "Springfield",
  state: "Illinois",
  created_at: Timestamp(2024, 1, 15, 10, 30, 0),
  updated_at: Timestamp(2024, 1, 20, 14, 45, 0)
}
```

**Index Fields**: `created_at` (descending), `email` (ascending)

---

### Collection: `complaints`

**Path**: `/complaints/{complaintId}`

**Document Structure**:
```javascript
{
  // User Reference
  user_id: String,            // Firebase UID of complaint creator
  
  // Complaint Details
  category: String,           // Category of complaint
                              // Values: "Roads & Infrastructure",
                              //         "Water Supply",
                              //         "Electricity",
                              //         "Sanitation",
                              //         "Traffic",
                              //         "Public Safety",
                              //         "Health Services",
                              //         "Education",
                              //         "Other"
  
  location: String,           // Location description (e.g., "Main Street")
  description: String,        // Detailed complaint description
  
  // Location Coordinates (optional)
  latitude: Number,           // GPS latitude coordinate
  longitude: Number,          // GPS longitude coordinate
  
  // Status Tracking
  status: String,             // Current status of complaint
                              // Values: "pending",
                              //         "in_progress",
                              //         "resolved",
                              //         "rejected"
  
  // Timestamps
  created_at: Timestamp,      // Complaint submission time (auto-set by server)
  updated_at: Timestamp,      // Last status update (auto-set by server)
}
```

**Example Document**:
```javascript
{
  user_id: "abc123xyz789",
  category: "Roads & Infrastructure",
  location: "Main Street near Post Office",
  description: "Large pothole on Main Street causing damage to vehicles",
  latitude: 39.7817,
  longitude: -89.6501,
  status: "in_progress",
  created_at: Timestamp(2024, 1, 18, 9, 15, 0),
  updated_at: Timestamp(2024, 1, 20, 11, 30, 0)
}
```

**Index Fields**:
- `user_id` (ascending), `created_at` (descending)
- `status` (ascending), `created_at` (descending)
- `category` (ascending), `created_at` (descending)

---

## Relationships

### User → Complaints
**One-to-Many Relationship**:
- One user can have multiple complaints
- Complaints are identified by their `user_id` field
- Query complaints for a user:
  ```javascript
  // From firestore.js service
  const complaints = await getUserComplaints(userId);
  ```

### Complaint → User
**Many-to-One Relationship**:
- Each complaint belongs to exactly one user
- User info stored in `/users/{user_id}` collection
- To get complaint author info:
  ```javascript
  const complaintData = await getComplaint(complaintId);
  const userData = await getUserProfile(complaintData.user_id);
  ```

---

## Available Firestore Operations

### User Operations

#### Create/Update User Profile
```javascript
import { createUserProfile, updateUserProfile } from '../services/firestore';

// Create new profile (called during signup)
await createUserProfile(userId, {
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  phone_number: "+1-555-123-4567",
  address: "123 Main St",
  city: "Springfield",
  state: "Illinois"
});

// Update existing profile
await updateUserProfile(userId, {
  phone_number: "+1-555-987-6543"
});
```

#### Read User Profile
```javascript
import { getUserProfile } from '../services/firestore';

const userProfile = await getUserProfile(userId);
console.log(userProfile);
// Returns: { email, first_name, last_name, ... } or null if not exists
```

### Complaint Operations

#### Create Complaint
```javascript
import { createComplaint } from '../services/firestore';

await createComplaint(userId, {
  category: "Roads & Infrastructure",
  location: "Main Street",
  description: "Pothole causing damage",
  latitude: 39.7817,
  longitude: -89.6501
  // status: "pending" is set automatically
});
```

#### Read Complaints
```javascript
import { getUserComplaints, getComplaint, getAllComplaints } from '../services/firestore';

// Get user's complaints
const userComplaints = await getUserComplaints(userId);

// Get single complaint by ID
const complaint = await getComplaint(complaintId);

// Get ALL complaints (admin only - requires rules)
const allComplaints = await getAllComplaints();
```

#### Update Complaint
```javascript
import { updateComplaint } from '../services/firestore';

// Admin or staff updating complaint status
await updateComplaint(complaintId, {
  status: "in_progress"
});

// Or
await updateComplaint(complaintId, {
  status: "resolved"
});
```

#### Delete Complaint
```javascript
import { deleteComplaint } from '../services/firestore';

await deleteComplaint(complaintId);
```

#### Real-time Listener (Live Updates)
```javascript
import { subscribeToUserComplaints } from '../services/firestore';

// Subscribe to real-time updates
const unsubscribe = subscribeToUserComplaints(userId, (complaints) => {
  console.log("Complaints updated:", complaints);
  // This callback fires whenever user's complaints change
});

// Clean up when component unmounts
return () => unsubscribe();
```

---

## Query Patterns

### Get User's Complaints Sorted by Date
```javascript
// Already implemented in firestore.js
const complaints = await getUserComplaints(userId);
// Returns complaints sorted by created_at (newest first)
```

### Get All Pending Complaints (Admin)
```javascript
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const q = query(
  collection(db, 'complaints'),
  where('status', '==', 'pending')
);
const querySnapshot = await getDocs(q);
const pendingComplaints = querySnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

### Search Complaints by Category
```javascript
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const q = query(
  collection(db, 'complaints'),
  where('category', '==', 'Roads & Infrastructure')
);
const querySnapshot = await getDocs(q);
```

---

## Data Types Reference

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `email` | String | User email | "john@example.com" |
| `first_name` | String | Given name | "John" |
| `last_name` | String | Family name | "Doe" |
| `phone_number` | String | Contact number | "+1-555-123-4567" |
| `address` | String | Street address | "123 Main St" |
| `city` | String | City name | "Springfield" |
| `state` | String | State/Province | "Illinois" |
| `category` | String | Complaint category | "Roads & Infrastructure" |
| `location` | String | Complaint location | "Main Street" |
| `description` | String | Detailed description | "Large pothole..." |
| `latitude` | Number | GPS latitude | 39.7817 |
| `longitude` | Number | GPS longitude | -89.6501 |
| `status` | String | Complaint status | "pending" |
| `user_id` | String | Firebase UID | "abc123xyz789" |
| `created_at` | Timestamp | Creation time | Timestamp(...) |
| `updated_at` | Timestamp | Last update | Timestamp(...) |

---

## Storage Limits & Best Practices

### Document Limits
- Max document size: 1 MB
- Max field value size: varies by type (strings: 1 MB)
- Max array items: 20,000

### Read/Write Pricing (as of 2024)
- Read: $0.06 per 100,000 reads
- Write: $0.18 per 100,000 writes
- Delete: $0.02 per 100,000 deletes
- Storage: $0.18 per GB per month

### Best Practices
1. **Index Smart Queries**: Firestore suggests indexes for complex queries
2. **Limit Data Fetching**: Use pagination for large datasets
3. **Archive Old Data**: Move old complaints to archive collection
4. **Use Subcollections**: For very large complaint lists (100,000+), consider subcollections
5. **Implement Caching**: Cache frequently accessed data client-side

---

## Migration from Django Database

### Data Migration Steps (if needed)
```javascript
// If you want to migrate existing Django data to Firestore:

import admin from 'firebase-admin';

async function migrateUsers(djangoUsers) {
  const db = admin.firestore();
  
  for (const user of djangoUsers) {
    await db.collection('users').doc(user.firebase_uid).set({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      created_at: admin.firestore.Timestamp.fromDate(user.created_at),
      updated_at: admin.firestore.Timestamp.fromDate(user.updated_at || user.created_at)
    });
  }
}

async function migrateComplaints(djangoComplaints) {
  const db = admin.firestore();
  
  for (const complaint of djangoComplaints) {
    await db.collection('complaints').add({
      user_id: complaint.user_id, // Must match Firebase UID
      category: complaint.category,
      location: complaint.location,
      description: complaint.description,
      latitude: complaint.latitude || null,
      longitude: complaint.longitude || null,
      status: complaint.status || 'pending',
      created_at: admin.firestore.Timestamp.fromDate(complaint.created_at),
      updated_at: admin.firestore.Timestamp.fromDate(complaint.updated_at || complaint.created_at)
    });
  }
}
```

---

## Summary

- **Users Collection**: Stores user profiles, indexed by Firebase UID
- **Complaints Collection**: Stores complaints, indexed by user_id and status
- **Service Layer**: `firestore.js` provides all CRUD operations
- **Authentication**: Firebase Auth handles login/signup (separate from Firestore)
- **Real-time Support**: Use `subscribeToUserComplaints()` for live updates

For complete usage examples, see:
- [firestore.js](./frontend/src/services/firestore.js) - Service layer implementation
- [Signup.jsx](./frontend/src/pages/Signup.jsx) - User creation example
- [MyComplaints.jsx](./frontend/src/pages/MyComplaints.jsx) - Data fetching example
- [SubmitComplaint.jsx](./frontend/src/pages/SubmitComplaint.jsx) - Data creation example
