import { useEffect, useState } from "react";
import { LogOut, User, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../services/supabaseAuthService';

const Dashboard = ({ user: passedUser }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('📊 Dashboard loading...');
        
        // First check if user is passed as prop (from App.jsx)
        if (passedUser) {
          console.log('✅ User from props:', passedUser);
          setUser(passedUser);
          setLoading(false);
          return;
        }

        // If not in props, try to get from localStorage
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('access');
        
        if (!token) {
          console.log('❌ No authentication token found');
          navigate('/login');
          return;
        }

        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('✅ User from localStorage:', userData);
            setUser(userData);
          } catch (err) {
            console.error('Error parsing user from localStorage:', err);
            navigate('/login');
            return;
          }
        } else {
          console.log('❌ No user data found');
          navigate('/login');
          return;
        }
      } catch (err) {
        console.error("Failed to load user data", err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [passedUser, navigate]);

  const handleLogout = async () => {
    try {
      await logOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access the dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {(user.first_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome, {user.first_name || user.email.split('@')[0]}!
                </h1>
                <p className="text-gray-600 mt-1">Manage your complaints and activities</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Email</h3>
            </div>
            <p className="text-gray-600 break-all">{user.email}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <User size={24} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Name</h3>
            </div>
            <p className="text-gray-600">
              {user.first_name && user.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || 'Not set'}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/submit-complaint')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              📝 Submit Complaint
            </button>
            <button
              onClick={() => navigate('/my-complaints')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              📋 My Complaints
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              👤 View Profile
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-700">
            <strong>User ID:</strong> {user.id || 'N/A'} | 
            <strong className="ml-4">Role:</strong> {user.role || 'User'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
