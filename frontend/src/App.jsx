import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { setupAuthStateListener } from './services/supabaseAuthService'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import VolunteerLogin from './pages/VolunteerLogin'
import Verify from './pages/Verify'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import SubmitComplaint from './pages/SubmitComplaint'
import MyComplaints from './pages/MyComplaints'
import AdminDashboard from './pages/AdminDashboard'
import PublicComplaints from './pages/PublicComplaints'
import PublicComplaint from './pages/PublicComplaint'
import PrivateRoute from './components/PrivateRoute'
import VolunteerDashboard from './pages/VolunteerDashboard'
import TrackComplaint from './pages/TrackComplaint'
import AdminRoute from './components/AdminRoute'
import DebugAdminCheck from './pages/DebugAdminCheck'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const checkExistingSession = async () => {
      const token = localStorage.getItem('access')
      const userData = localStorage.getItem('user')
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
          setIsLoggedIn(true)
        } catch (err) {
          console.error('Error parsing user data:', err)
        }
      }
      
      // Set up listener for future auth state changes
      const subscription = setupAuthStateListener((event, data) => {
        console.log('🔐 Auth state event:', event)
        
        if (event === 'signed_in') {
          setUser(data?.user)
          setIsLoggedIn(true)
        } else if (event === 'signed_out') {
          setUser(null)
          setIsLoggedIn(false)
        } else if (event === 'user_updated') {
          setUser(data?.user)
        } else if (event === 'error') {
          console.error('Auth error:', data)
        }
      })
      
      setLoading(false)
      
      // Cleanup subscription on unmount
      return () => {
        if (subscription) {
          subscription.unsubscribe()
        }
      }
    }
    
    checkExistingSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Landing isLoggedIn={isLoggedIn} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/volunteer/login" element={<VolunteerLogin />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Dashboard user={user} />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/submit-complaint"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <SubmitComplaint />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-complaints"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn}>
              <MyComplaints />
            </PrivateRoute>
          }
        />
        <Route path="/volunteer/dashboard" element={<VolunteerDashboard />} />
        <Route path="/track" element={<TrackComplaint />} />
        <Route
          path="/cadmin"
          element={
            <AdminRoute isLoggedIn={isLoggedIn}>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        {/* Public Pages - No Authentication Required */}
        <Route path="/complaints" element={<PublicComplaints />} />
        <Route path="/complaint/:complaintId" element={<PublicComplaint />} />
        
        {/* Debug Page */}
        <Route path="/debug/admin" element={<DebugAdminCheck />} />
      </Routes>
    </Router>
  )
}

export default App