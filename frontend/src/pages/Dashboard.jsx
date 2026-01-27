import { useEffect, useState } from "react";
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile } from '../services/firestore';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = localStorage.getItem('userId');
        console.log('Dashboard: userId from localStorage:', userId);
        
        if (!userId) {
          console.log('Dashboard: No userId found in localStorage');
          navigate('/login');
          return;
        }

        const userData = await getUserProfile(userId);
        console.log('Dashboard: userData from Firestore:', userData);
        
        if (userData) {
          setUser(userData);
        } else {
          // User not found in Firestore - create default profile
          console.log('Dashboard: User profile not found in Firestore, creating default profile');
          const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
          setUser({
            email: userEmail,
            first_name: userEmail.split('@')[0],
            last_name: '',
            phone_number: '',
            address: '',
            city: '',
            state: '',
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        console.error("Error details:", err.message, err.code);
        
        // Fallback: Create a basic user object from localStorage
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
        setUser({
          email: userEmail,
          first_name: userEmail.split('@')[0],
          last_name: '',
          phone_number: '',
          address: '',
          city: '',
          state: '',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear local storage
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
    }
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
        <p className="text-red-500 mb-4">Could not load user data. Please check:</p>
        <ol className="text-left inline-block text-gray-700 mb-4">
          <li>✓ Check browser console for error details (Press F12)</li>
          <li>✓ Verify Firestore database has the user profile</li>
          <li>✓ Check Firestore security rules allow reads</li>
        </ol>
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