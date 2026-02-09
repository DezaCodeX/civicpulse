import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children, isLoggedIn }) => {
  if (isLoggedIn === undefined) {
    return null;
  }

  // Check if user is logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  // Get user data from localStorage (stored from firebase-login response)
  const userData = localStorage.getItem('user');
  let isAdmin = false;
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      isAdmin = user.is_staff || user.is_superuser;
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default AdminRoute;
