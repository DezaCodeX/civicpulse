import React, { useState } from 'react'
import { BarChart3, Map, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const mockAnalytics = {
    totalComplaints: 1234,
    resolved: 892,
    pending: 234,
    inProgress: 108,
    avgResolutionTime: '3.2 days',
    patternAccuracy: '95%',
  }

  const topPatterns = [
    { pattern: 'Road damage & potholes', count: 234, trend: 'up' },
    { pattern: 'Water supply issues', count: 156, trend: 'down' },
    { pattern: 'Electricity outages', count: 142, trend: 'up' },
    { pattern: 'Sanitation problems', count: 98, trend: 'stable' },
    { pattern: 'Traffic congestion', count: 87, trend: 'down' },
  ]

  const complaints = [
    { id: 1, title: 'Severe pothole on Main Street', category: 'Roads', location: 'Downtown', status: 'High Priority', cluster: 'Road Damage' },
    { id: 2, title: 'Water shortage in residential area', category: 'Water', location: 'Northside', status: 'Medium Priority', cluster: 'Water Supply' },
    { id: 3, title: 'Power cuts during evening', category: 'Electricity', location: 'Eastside', status: 'High Priority', cluster: 'Electricity' },
    { id: 4, title: 'Overflowing drainage', category: 'Sanitation', location: 'Downtown', status: 'Medium Priority', cluster: 'Sanitation' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">AI-Powered Complaint Management & Analytics</p>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900">{mockAnalytics.totalComplaints}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Resolved</p>
                <p className="text-3xl font-bold text-gray-900">{mockAnalytics.resolved}</p>
                <p className="text-xs text-gray-500 mt-1">{Math.round(mockAnalytics.resolved / mockAnalytics.totalComplaints * 100)}% resolution rate</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending + In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{mockAnalytics.pending + mockAnalytics.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Avg time: {mockAnalytics.avgResolutionTime}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'patterns', 'complaints', 'heatmap'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Sections */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                Complaints by Category
              </h2>
              <div className="space-y-4">
                {['Roads', 'Water Supply', 'Electricity', 'Sanitation', 'Traffic'].map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">{cat}</span>
                      <span className="text-sm font-semibold text-gray-900">{(idx + 1) * 45}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full"
                        style={{ width: `${(idx + 1) * 20}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-700">Pattern Detection Accuracy</span>
                  <span className="text-2xl font-bold text-green-600">{mockAnalytics.patternAccuracy}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-700">Avg Resolution Time</span>
                  <span className="text-2xl font-bold text-blue-600">{mockAnalytics.avgResolutionTime}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-700">Complaints Analyzed Today</span>
                  <span className="text-2xl font-bold text-orange-600">42</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">AI Insights Generated</span>
                  <span className="text-2xl font-bold text-purple-600">156</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Detected Patterns & Trends
            </h2>
            <div className="space-y-4">
              {topPatterns.map((pattern, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{pattern.pattern}</p>
                    <p className="text-sm text-gray-600">Occurrences: {pattern.count}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      pattern.trend === 'up' ? 'bg-red-100 text-red-800' :
                      pattern.trend === 'down' ? 'bg-green-100 text-green-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {pattern.trend === 'up' ? '↑ Rising' : pattern.trend === 'down' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'complaints' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Prioritized Complaints</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map(complaint => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{complaint.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{complaint.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{complaint.location}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {complaint.cluster}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          complaint.status.includes('High') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {complaint.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Map className="w-5 h-5 mr-2 text-blue-600" />
              Geographic Distribution
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-12 flex items-center justify-center min-h-96">
              <div className="text-center">
                <Map className="w-24 h-24 text-blue-300 mx-auto mb-4 opacity-50" />
                <p className="text-gray-600">Interactive heatmap would be displayed here showing complaint hotspots</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
