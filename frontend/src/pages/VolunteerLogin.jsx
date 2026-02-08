import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { Badge, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const VolunteerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVolunteerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Sign in with Firebase
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userId = result.user.uid;
      const userEmail = result.user.email;

      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", userEmail);

      // Call backend to sync user and get tokens
      const response = await fetch('http://127.0.0.1:8000/api/firebase-login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userId,
          email: userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync with backend');
      }

      const data = await response.json();
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      // Store user data (includes is_staff, is_superuser)
      localStorage.setItem('user', JSON.stringify(data.user));

      // Check if user is an approved volunteer
      const approvalResponse = await fetch('http://127.0.0.1:8000/api/volunteer/check-approval/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.access}`,
          'Content-Type': 'application/json',
        },
      });

      if (approvalResponse.status === 403) {
        setError("You are not approved as a volunteer yet. Please contact the administrator.");
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        return;
      }

      if (!approvalResponse.ok) {
        setError("Volunteer profile not found. Please contact the administrator.");
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        return;
      }

      // Success: redirect to volunteer dashboard
      navigate("/volunteer/dashboard");
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMsg = "Failed to login. Please try again.";
      
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'Email not found. Please contact the administrator.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Login</h1>
          </div>
          <p className="text-gray-600">Sign in as an approved volunteer to verify complaints</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVolunteerLogin} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Approval Requirement */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Approval Required</p>
              <p className="text-xs text-blue-700 mt-1">
                Only approved volunteers can access the verification dashboard. If you haven't been approved yet, please contact the administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">Not a volunteer? </span>
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign in as citizen
          </button>
        </div>
      </div>
    </div>
  );
};

export default VolunteerLogin;
