import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

function Navbar({ isLoggedIn, userRole, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)

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
            {isLoggedIn ? (
              <>
                <Link to="/submit-complaint" className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Submit Complaint
                </Link>
                <Link to={userRole === 'admin' ? '/admin' : '/dashboard'} className="px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
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
            {isLoggedIn ? (
              <>
                <Link to="/submit-complaint" className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Submit Complaint
                </Link>
                <Link to={userRole === 'admin' ? '/admin' : '/dashboard'} className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
                  Dashboard
                </Link>
                <button
                  onClick={onLogout}
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
