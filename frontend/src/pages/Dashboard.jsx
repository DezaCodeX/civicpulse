import api from "../services/api";
import { useEffect, useState } from "react";
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/profile/")
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch profile", err);
        // If the token is invalid or expired, API interceptor should handle it.
        // For an explicit unauthorized error, redirect to login.
        if (err.response && err.response.status === 401) {
          navigate('/login');
        }
        setLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    // This should be handled by the API service to clear the token
    // For now, let's simulate it and redirect
    localStorage.removeItem('access'); // Correct key for access token
    api.defaults.headers.common['Authorization'] = null;
    navigate('/login');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500">Could not load user data. Please try logging in again.</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.first_name || user.email.split('@')[0]}
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Dashboard content goes here */}
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4 text-center">
              <h2 className="text-2xl font-semibold text-gray-700">Your Dashboard</h2>
              <p className="mt-2 text-gray-600">
                This is your personal dashboard. You can view your complaints, profile, and more.
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Example Cards */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">My Complaints</h3>
                  <p className="mt-2 text-gray-600">View the status of all your submitted complaints.</p>
                  <button onClick={() => navigate('/my-complaints')} className="mt-4 text-blue-500 hover:underline">View Complaints</button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">Submit a New Complaint</h3>
                  <p className="mt-2 text-gray-600">Lodge a new complaint to be addressed by officials.</p>
                  <button onClick={() => navigate('/submit-complaint')} className="mt-4 text-blue-500 hover:underline">Submit Now</button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-gray-900">Profile Settings</h3>
                  <p className="mt-2 text-gray-600">Update your personal information and password.</p>
                  <button onClick={() => navigate('/profile')} className="mt-4 text-blue-500 hover:underline">Update Profile</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;