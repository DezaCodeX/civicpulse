import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, isLoggedIn }) => {
  // Check token in localStorage as fallback
  const token = localStorage.getItem('access') || localStorage.getItem('access_token');
  const hasToken = !!token;
  
  const isAuthenticated = isLoggedIn || hasToken;
  
  console.log('🔐 PrivateRoute check:', {
    isLoggedIn,
    hasToken,
    isAuthenticated
  });

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
