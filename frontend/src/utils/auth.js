// Decode JWT token without verifying signature (for client-side use only)
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Get the current user data from JWT token
export const getUserFromToken = () => {
  try {
    const token = localStorage.getItem('access');
    if (!token) return null;
    
    const decoded = decodeToken(token);
    return decoded;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

// Check if current user is admin
export const isUserAdmin = () => {
  const user = getUserFromToken();
  return user && (user.is_staff || user.is_superuser);
};
