import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div> // Or a spinner component
  }

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Landing isLoggedIn={isLoggedIn} />} />
        <Route path="/login" element={<Login />} />
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
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Public Pages - No Authentication Required */}
        <Route path="/complaints" element={<PublicComplaints />} />
        <Route path="/complaint/:complaintId" element={<PublicComplaint />} />
      </Routes>
    </Router>
  )
}

export default App