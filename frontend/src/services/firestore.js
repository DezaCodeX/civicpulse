import { db } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

// USER PROFILE OPERATIONS

/**
 * Create or update user profile in Firestore
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// COMPLAINT OPERATIONS

/**
 * Create a new complaint in Firestore
 */
export const createComplaint = async (userId, complaintData) => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const docRef = await addDoc(complaintsRef, {
      ...complaintData,
      user_id: userId,
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating complaint:', error);
    throw error;
  }
};

/**
 * Get all complaints for a user
 */
export const getUserComplaints = async (userId) => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting user complaints:', error);
    throw error;
  }
};

/**
 * Subscribe to user complaints in real-time
 */
export const subscribeToUserComplaints = (userId, callback) => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(
      complaintsRef,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const complaints = [];
      querySnapshot.forEach((doc) => {
        complaints.push({ id: doc.id, ...doc.data() });
      });
      callback(complaints);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to complaints:', error);
    throw error;
  }
};

/**
 * Get a single complaint
 */
export const getComplaint = async (complaintId) => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    const docSnap = await getDoc(complaintRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting complaint:', error);
    throw error;
  }
};

/**
 * Update a complaint
 */
export const updateComplaint = async (complaintId, updates) => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await updateDoc(complaintRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

/**
 * Delete a complaint
 */
export const deleteComplaint = async (complaintId) => {
  try {
    const complaintRef = doc(db, 'complaints', complaintId);
    await deleteDoc(complaintRef);
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
};

/**
 * Get all complaints (admin only)
 */
export const getAllComplaints = async () => {
  try {
    const complaintsRef = collection(db, 'complaints');
    const q = query(complaintsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    const complaints = [];
    querySnapshot.forEach((doc) => {
      complaints.push({ id: doc.id, ...doc.data() });
    });
    return complaints;
  } catch (error) {
    console.error('Error getting all complaints:', error);
    throw error;
  }
};
