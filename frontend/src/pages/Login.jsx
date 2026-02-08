import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithGoogle, logOut } from "../services/supabaseAuthService";
import { Shield, Mail, Loader } from 'lucide-react';

const Login = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = location.state?.isAdmin || false;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      // Initiate Supabase Google OAuth
      await signInWithGoogle();
      
      // Supabase will redirect to callback URL (dashboard)
      // The auth state listener in App.jsx will handle the sync
      
      console.log("✅ Google login initiated, waiting for redirect...");
    } catch (err) {
      console.error('❌ Google login error:', err);
      const errorMsg = err.message || "Failed to login with Google. Please try again.";
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Shield size={28} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAdmin ? 'Admin Login' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? 'Sign in to the admin dashboard' : 'Sign in to your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!isAdmin && (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1.393,12.545,1.393 c-6.256,0-11.331,5.075-11.331,11.322c0,6.247,5.075,11.322,11.331,11.322c10.684,0,11.965-9.869,11.304-14.61H12.545Z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <p className="text-center text-gray-600 text-sm mt-6">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign up here
              </Link>
            </p>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
              <p className="font-semibold mb-1">✅ Powered by Supabase</p>
              <p>Secure authentication with Google Sign-In</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
