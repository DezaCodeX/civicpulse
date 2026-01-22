import React, { useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

function Dashboard() {
  const [complaints] = useState([
    {
      id: 1,
      title: 'Pothole on Main Street',
      category: 'Roads',
      location: 'Main St, Downtown',
      status: 'In Progress',
      date: '2025-01-20',
      priority: 'High',
    },
    {
      id: 2,
      title: 'Water leakage',
      category: 'Water Supply',
      location: 'Oak Avenue',
      status: 'Resolved',
      date: '2025-01-18',
      priority: 'Medium',
    },
    {
      id: 3,
      title: 'Street light malfunction',
      category: 'Electricity',
      location: 'Park Road',
      status: 'Pending',
      date: '2025-01-21',
      priority: 'Low',
    },
  ])

  const stats = [
    { label: 'Total Submitted', value: '24', color: 'blue' },
    { label: 'In Progress', value: '8', color: 'yellow' },
    { label: 'Resolved', value: '14', color: 'green' },
    { label: 'Pending', value: '2', color: 'red' },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600'
      case 'Medium':
        return 'text-yellow-600'
      case 'Low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow p-6">
              <div className="text-gray-600 text-sm font-medium mb-2">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Complaints by Category</h2>
            </div>
            <div className="space-y-4">
              {['Roads', 'Water Supply', 'Electricity', 'Sanitation'].map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat}</span>
                    <span className="text-sm font-semibold text-gray-900">{Math.floor(Math.random() * 10) + 1}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.random() * 80 + 20}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Resolution Trends</h2>
            </div>
            <div className="space-y-4">
              {['January', 'February', 'March', 'April'].map((month, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{month}</span>
                    <span className="text-sm font-semibold text-gray-900">{(idx + 1) * 5} resolved</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${(idx + 1) * 25}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Submitted Complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {complaints.map(complaint => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{complaint.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{complaint.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{complaint.location}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-semibold ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{complaint.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
