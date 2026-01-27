import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, User } from 'lucide-react'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'

function Navbar({ isLoggedIn }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      localStorage.removeItem('userId')
      localStorage.removeItem('access')
      navigate('/')
      setIsProfileOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              CP
            </div>
            <span className="font-bold text-xl text-gray-900">CivicPulse</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              Home
            </Link>
            <Link to="/complaints" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              Public Complaints
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/submit-complaint" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Submit Complaint
                </Link>
                <Link to="/dashboard" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <User size={18} />
                    <span>Profile</span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        {/* <p className="text-sm text-gray-700">{user.email}</p> */}
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        View Profile
                      </Link>
                      <Link
                        to="/my-complaints"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        My Complaints
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              Home
            </Link>
            <Link to="/complaints" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
              Public Complaints
            </Link>
            
            {isLoggedIn ? (
              <>
                <Link to="/submit-complaint" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Submit Complaint
                </Link>
                <Link to="/dashboard" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link to="/profile" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Profile
                </Link>
                <Link to="/my-complaints" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  My Complaints
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
