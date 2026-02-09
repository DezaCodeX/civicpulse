import React from 'react';

const DebugAdminCheck = () => {
  const token = localStorage.getItem('access');
  const userData = localStorage.getItem('user');
  let user = null;
  
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  const isAdmin = user && (user.is_staff || user.is_superuser);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Debug Check</h1>
      
      <div className="space-y-4">
        {/* Token Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold mb-2">Token Status</h2>
          <p>Token Present: <span className={token ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{token ? 'YES' : 'NO'}</span></p>
          {token && <p className="text-sm text-gray-600">Token: {token.substring(0, 30)}...</p>}
        </div>

        {/* User Data from localStorage */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold mb-2">User Data (from Django Backend)</h2>
          {user ? (
            <div className="space-y-1 font-mono text-sm">
              <p>ID: {user.id}</p>
              <p>Email: {user.email}</p>
              <p>First Name: {user.first_name}</p>
              <p>Last Name: {user.last_name}</p>
              <p className="text-red-600 font-bold">is_staff: {String(user.is_staff)}</p>
              <p className="text-red-600 font-bold">is_superuser: {String(user.is_superuser)}</p>
            </div>
          ) : (
            <p className="text-red-600 font-bold">No user data found in localStorage</p>
          )}
        </div>

        {/* Admin Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-bold mb-2">Admin Status</h2>
          <p>Is Admin: <span className={isAdmin ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{isAdmin ? 'YES ✓' : 'NO ✗'}</span></p>
        </div>

        {/* Instructions */}
        {!isAdmin && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <h3 className="font-bold text-red-900 mb-2">Fix Required:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-red-800">
              <li>Make sure you're logged in with an admin account</li>
              <li>Log out (clear localStorage)</li>
              <li>Log in again with your admin email</li>
              <li>If still not working, the user must have is_staff=true in the database</li>
            </ol>
          </div>
        )}

        {isAdmin && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-900 font-bold">✓ You are logged in as an admin! You can access /cadmin</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugAdminCheck;
