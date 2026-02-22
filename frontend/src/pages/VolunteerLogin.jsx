import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Badge, CheckCircle, Loader, Mail } from "lucide-react";
import { supabase } from "../supabaseClient";
import api from "../services/api";
import { checkSupabaseSessionAndSync, signInWithGoogle, syncSupabaseWithDjango } from "../services/supabaseAuthService";

const VolunteerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  const checkVolunteerApproval = async () => {
    try {
      await api.post("/api/volunteer/check-approval/");
      navigate("/volunteer/dashboard");
      return true;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError("You are not approved as a volunteer yet. Please contact the administrator.");
      } else if (status === 404) {
        setError("Volunteer profile not found. Please contact the administrator.");
      } else {
        setError("Unable to verify volunteer status. Please try again.");
      }
      return false;
    }
  };

  useEffect(() => {
    const bootstrapSession = async () => {
      try {
        const existingAccess = localStorage.getItem("access");
        if (existingAccess) {
          await checkVolunteerApproval();
          return;
        }

        const sessionData = await checkSupabaseSessionAndSync();
        if (sessionData?.session) {
          await checkVolunteerApproval();
        }
      } catch (_err) {
        // no-op, user can login manually
      } finally {
        setCheckingSession(false);
      }
    };

    bootstrapSession();
  }, []);

  const handleVolunteerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError || !data.session) {
        throw signInError || new Error("Failed to sign in.");
      }

      await syncSupabaseWithDjango(data.session);
      await checkVolunteerApproval();
    } catch (err) {
      const message = err?.message || "Failed to login. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle("/volunteer/login");
    } catch (err) {
      setError(err?.message || "Failed to login with Google. Please try again.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-700">Checking volunteer access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Badge className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Volunteer Login</h1>
          </div>
          <p className="text-gray-600">Sign in as an approved volunteer to verify complaints</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-medium py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-6"
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

        <form onSubmit={handleVolunteerLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Sign In with Email
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Approval Required</p>
              <p className="text-xs text-blue-700 mt-1">
                Only approved volunteers can access the verification dashboard. If you have not been approved yet, contact the administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerLogin;
