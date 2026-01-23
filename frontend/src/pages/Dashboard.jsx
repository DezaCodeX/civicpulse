import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, List } from 'lucide-react'

function Dashboard() {
  const userName = 'S.' // Replace with actual user name
  
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-lg text-gray-600">
            Submit and track your complaints
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Total Complaints</p>
            <p className="text-4xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Pending</p>
            <p className="text-4xl font-bold text-orange-500">0</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <p className="text-gray-600 text-sm mb-2">Resolved</p>
            <p className="text-4xl font-bold text-teal-600">0</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/submit"
            className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-lg p-4">
                <Plus className="text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Submit Complaint
                </h3>
                <p className="text-gray-600">
                  Report a new issue in your area
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/my-complaints"
            className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="bg-green-100 rounded-lg p-4">
                <List className="text-green-600" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  My Complaints
                </h3>
                <p className="text-gray-600">
                  View and track your submissions
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
