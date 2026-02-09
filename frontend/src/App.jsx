import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { checkSupabaseSessionAndSync, setupAuthStateListener } from './services/supabaseAuthService'
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
import VDashboard from './pages/VDashboard'
import TrackComplaint from './pages/TrackComplaint'
import AdminRoute from './components/AdminRoute'
import DebugAdminCheck from './pages/DebugAdminCheck'
import AuthDebug from './pages/AuthDebug'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription
    let isMounted = true

    const initializeAuth = async () => {
      console.log('🔍 Checking existing session...')

      const supabaseResult = await checkSupabaseSessionAndSync()

      if (supabaseResult?.user) {
        console.log('✅ Supabase session restored:', supabaseResult.user.email)
        if (isMounted) {
          setUser(supabaseResult.user)
          setIsLoggedIn(true)
        }
      } else {
        const token = localStorage.getItem('access') || localStorage.getItem('access_token')
        const userData = localStorage.getItem('user')

        console.log('📦 Token found:', !!token)
        console.log('📦 User data found:', !!userData)

        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData)
            console.log('✅ Setting user from localStorage:', parsedUser.email)
            if (isMounted) {
              setUser(parsedUser)
              setIsLoggedIn(true)
            }
          } catch (err) {
            console.error('Error parsing user data:', err)
            if (isMounted) {
              setIsLoggedIn(false)
            }
          }
        } else {
          console.log('❌ No valid session found in localStorage')
          if (isMounted) {
            setIsLoggedIn(false)
          }
        }
      }

      subscription = setupAuthStateListener((event, data) => {
        console.log('🔐 Auth state event:', event)

        if (event === 'signed_in') {
          console.log('✅ User signed in via Supabase')
          setUser(data?.user)
          setIsLoggedIn(true)
        } else if (event === 'signed_out') {
          console.log('❌ User signed out')
          setUser(null)
          setIsLoggedIn(false)
        } else if (event === 'user_updated') {
          console.log('🔄 User updated')
          setUser(data?.user)
        } else if (event === 'error') {
          console.error('Auth error:', data)
        }
      })

      if (isMounted) {
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
      if (subscription) {
        subscription.unsubscribe()
      }
    }
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
        <Route path="/vdashboard" element={<VDashboard />} />
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
        
        {/* Debug Pages */}
        <Route path="/debug/admin" element={<DebugAdminCheck />} />
        <Route path="/debug/auth" element={<AuthDebug />} />
      </Routes>
    </Router>
  )
}

export default App