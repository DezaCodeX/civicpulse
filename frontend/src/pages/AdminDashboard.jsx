import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import { api } from '../services/api'

function AdminDashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('complaints')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      navigate('/login')
      return
    }

    loadComplaintsAndAnalytics()
  }, [navigate, statusFilter, departmentFilter])

  const loadComplaintsAndAnalytics = async () => {
    try {
      setLoading(true)
      
      // Load complaints
      let complaintUrl = '/api/admin/complaints/'
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (departmentFilter) params.append('department', departmentFilter)
      if (params.toString()) complaintUrl += `?${params.toString()}`

      const complaintsRes = await api.get(complaintUrl)
      setComplaints(complaintsRes.data)

      // Load analytics
      const analyticsRes = await api.get('/api/admin/analytics/')
      setAnalytics(analyticsRes.data)
    } catch (err) {
      console.error('Failed to load data', err)
      if (err.response?.status === 403) {
        setError('You do not have admin access')
        navigate('/')
      } else {
        setError('Failed to load admin data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      await api.patch(`/api/admin/complaints/${complaintId}/status/`, {
        status: newStatus
      })
      // Reload complaints
      loadComplaintsAndAnalytics()
    } catch (err) {
      console.error('Failed to update status', err)
      setError('Failed to update complaint status')
    }
  }

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  if (error && error.includes('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">Manage complaints and view analytics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'complaints'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition ${
              activeTab === 'analytics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Departments</option>
                  <option value="Water">Water</option>
                  <option value="Roads">Roads</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Safety">Safety</option>
                  <option value="General">General</option>
                </select>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                Total: <strong>{filteredComplaints.length}</strong> complaint{filteredComplaints.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Complaints Table */}
            {!loading && filteredComplaints.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg shadow-md">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Department</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Support</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map(complaint => (
                      <tr key={complaint.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 line-clamp-2">{complaint.title}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{complaint.user.name || complaint.user.email}</p>
                            <p className="text-gray-500 text-xs">{complaint.user.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">{complaint.department}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(complaint.status)}
                            <span className="text-sm font-medium capitalize">{complaint.status.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-blue-600">{complaint.support_count}</span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={complaint.status}
                            onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredComplaints.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">No complaints found</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Total Complaints</h3>
              <p className="text-3xl font-bold text-blue-600">{analytics.total_complaints}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Pending</h3>
              <p className="text-3xl font-bold text-red-600">{analytics.pending_complaints}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Resolved</h3>
              <p className="text-3xl font-bold text-green-600">{analytics.resolved_complaints}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-600 text-sm font-medium mb-2">Last 7 Days</h3>
              <p className="text-3xl font-bold text-purple-600">{analytics.complaints_last_7_days}</p>
            </div>

            {/* Department Distribution */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <div className="space-y-3">
                {analytics.department_distribution.map(dept => (
                  <div key={dept.department} className="flex items-center justify-between">
                    <p className="text-sm text-gray-700">{dept.department || 'Unclassified'}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(dept.count / analytics.total_complaints) * 100}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 w-8">{dept.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
              <div className="space-y-2">
                {analytics.status_distribution.map(status => (
                  <div key={status.status} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 capitalize">{status.status}</span>
                    <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Supported */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Supported Complaints</h3>
              <div className="space-y-3">
                {analytics.top_supported_complaints.map((complaint, idx) => (
                  <div key={complaint.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                    <span className="text-sm font-bold text-blue-600">#{idx + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{complaint.title}</p>
                      <p className="text-xs text-gray-500">{complaint.department}</p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">{complaint.support_count} supports</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
