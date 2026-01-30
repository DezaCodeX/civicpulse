import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { Shield, Mail, Loader } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const googleProvider = new GoogleAuthProvider();

  const isAdmin = location.state?.isAdmin || false;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Call your backend to get the JWT token
      const response = await fetch("http://127.0.0.1:8000/api/firebase-login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend.");
      }

      const data = await response.json();

      // Store tokens and user info in localStorage
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userEmail", data.user.email);

      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      
      let errorMsg = "Failed to login. Please try again.";
      
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'Email not found. Please sign up first.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email address.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Call your backend to get the JWT token
      const response = await fetch("http://127.0.0.1:8000/api/firebase-login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to authenticate with backend.");
      }

      const data = await response.json();

      // Store tokens and user info in localStorage
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userEmail", data.user.email);

      navigate("/dashboard");
    } catch (err) {
      console.error('Google login error:', err);
      const errorMsg = err.message || "Failed to login with Google.";
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setError(""); // Clear any previous errors
      alert("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error('Password reset error:', err);
      setError("Failed to send password reset email. Please try again.");
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{isAdmin ? 'Admin Login' : 'Welcome Back'}</h1>
          <p className="text-gray-600">{isAdmin ? 'Sign in to the admin dashboard' : 'Sign in to your account'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-3 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white font-semibold py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading && <Loader size={18} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-center text-blue-600 hover:text-blue-700 text-sm font-medium py-2 transition-colors"
          >
            Forgot password?
          </button>
        </form>
        {!isAdmin && (
        <>
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-sm text-gray-500">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1.393,12.545,1.393 c-6.256,0-11.331,5.075-11.331,11.322c0,6.247,5.075,11.322,11.331,11.322c10.684,0,11.965-9.869,11.304-14.61H12.545Z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-gray-600 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up here
            </Link>
          </p>
        </>
        )}
      </div>
    </div>
  );
};

export default Login;
