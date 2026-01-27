import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield } from 'lucide-react';

const Verify = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    const accessToken = localStorage.getItem("access");
    if (accessToken) {
      navigate("/dashboard");
    } else {
      // Otherwise redirect to login
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Shield size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication</h1>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600">Checking your authentication status...</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting you shortly...</p>
        </div>
      </div>
    </div>
  );
};

export default Verify;
