import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signInWithGoogle } from "../services/supabaseAuthService";
import { Shield, Mail, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from "../supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [useEmailPassword, setUseEmailPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = location.state?.isAdmin || false;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("🔐 Starting Google login...");
      await signInWithGoogle();
      console.log("✅ Google login initiated, redirecting...");
    } catch (err) {
      console.error('❌ Google login error:', err);
      const errorMsg = err.message || "Failed to login with Google. Please try again.";
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
      setLoading(false);
    }
  };

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!email || !password) {
        setError("Please enter both email and password");
        setLoading(false);
        return;
      }

      console.log("🔐 Starting email/password login for:", email);

      // Sign in with Supabase email/password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (signInError) {
        console.error("❌ Supabase auth error:", signInError);
        setError(signInError.message || "Failed to login. Please check your credentials.");
        setLoading(false);
        return;
      }

      console.log("✅ Supabase authentication successful");

      if (!data.session) {
        setError("No session returned from Supabase");
        setLoading(false);
        return;
      }

      // Sync with Django backend
      try {
        console.log("🔄 Syncing with Django backend...");
        const response = await fetch("http://127.0.0.1:8000/api/supabase-login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.user.email,
            supabase_token: data.session.access_token,
            user_metadata: data.user.user_metadata || {},
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("❌ Django sync failed:", errorData);
          throw new Error(errorData.error || errorData.detail || "Failed to sync with backend");
        }

        const backendData = await response.json();
        console.log("✅ Django sync successful");

        // Store tokens and user data
        localStorage.setItem("access_token", backendData.access);
        localStorage.setItem("refresh_token", backendData.refresh);
        localStorage.setItem("access", backendData.access);
        localStorage.setItem("user", JSON.stringify(backendData.user));
        localStorage.setItem("userEmail", backendData.user.email);

        console.log("✅ Tokens stored, redirecting to dashboard...");
        navigate("/dashboard");
      } catch (syncErr) {
        console.error("❌ Backend sync error:", syncErr);
        setError("Login successful but failed to sync with backend. Please try again.");
        setLoading(false);
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("❌ Email/password login error:", err);
      setError(err.message || "Failed to login. Please try again.");
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
            {!useEmailPassword ? (
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

                <div className="my-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUseEmailPassword(true)}
                  disabled={loading}
                  className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  <span>Login with Email & Password</span>
                </button>

                <p className="text-center text-gray-600 text-sm mt-6">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up here
                  </Link>
                </p>

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
                  <p className="font-semibold mb-1">✅ Powered by Supabase</p>
                  <p>Secure authentication with Google Sign-In & Email/Password</p>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      disabled={loading}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    setUseEmailPassword(false);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  disabled={loading}
                  className="w-full mt-4 text-gray-600 hover:text-gray-700 font-medium py-2.5 text-sm disabled:opacity-50"
                >
                  ← Back to Other Options
                </button>

                <p className="text-center text-gray-600 text-sm mt-6">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up here
                  </Link>
                </p>

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs">
                  <p className="font-semibold mb-1">✅ Powered by Supabase</p>
                  <p>Secure authentication with Email/Password</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
