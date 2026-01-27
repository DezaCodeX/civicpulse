import React, { useEffect } from 'react';

const AdminDashboard = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:8000/admin';
  }, []);

  return <div>Redirecting to admin...</div>;
};

export default AdminDashboard;

