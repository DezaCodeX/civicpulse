import React, { useEffect, useState } from 'react';

const AuthDebug = () => {
  const [authState, setAuthState] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const access = localStorage.getItem('access');
      const accessToken = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      const refresh = localStorage.getItem('refresh');
      const userEmail = localStorage.getItem('userEmail');

      const state = {
        access: access ? 'Present ✅' : 'Missing ❌',
        access_token: accessToken ? 'Present ✅' : 'Missing ❌',
        user: user ? 'Present ✅' : 'Missing ❌',
        refresh: refresh ? 'Present ✅' : 'Missing ❌',
        userEmail: userEmail || 'Not found',
      };

      if (user) {
        try {
          state.userData = JSON.parse(user);
        } catch (e) {
          state.userData = 'Invalid JSON';
        }
      }

      setAuthState(state);
    };

    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">🔐 Authentication Debug</h1>

        {authState ? (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">LocalStorage Status:</h2>
              <div className="space-y-2 font-mono text-sm">
                <div>
                  <strong>access token:</strong> <span className="ml-2">{authState.access}</span>
                </div>
                <div>
                  <strong>access_token:</strong> <span className="ml-2">{authState.access_token}</span>
                </div>
                <div>
                  <strong>refresh token:</strong> <span className="ml-2">{authState.refresh}</span>
                </div>
                <div>
                  <strong>user object:</strong> <span className="ml-2">{authState.user}</span>
                </div>
                <div>
                  <strong>userEmail:</strong> <span className="ml-2">{authState.userEmail}</span>
                </div>
              </div>
            </div>

            {authState.userData && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h2 className="text-lg font-semibold text-green-900 mb-3">User Data:</h2>
                <pre className="text-sm overflow-auto max-h-64">
                  {JSON.stringify(authState.userData, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <a
                href="/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Go to Dashboard
              </a>
              <a
                href="/login"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Go to Login
              </a>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear All & Reload
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthDebug;
