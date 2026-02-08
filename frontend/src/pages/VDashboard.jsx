import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  FileUp,
  Camera,
  ChevronDown,
  ChevronUp,
  Loader,
  BarChart3,
  LogOut,
  User,
} from 'lucide-react'

function VDashboard() {
  const navigate = useNavigate()
  const [volunteerInfo, setVolunteerInfo] = useState(null)
  const [complaints, setComplaints] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [verifyingId, setVerifyingId] = useState(null)
  const [uploadingId, setUploadingId] = useState(null)
  const [verificationNotes, setVerificationNotes] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [verificationStatus, setVerificationStatus] = useState({})

  // Check volunteer approval and fetch data
  useEffect(() => {
    checkVolunteerAndFetchData()
  }, [])

  const checkVolunteerAndFetchData = async () => {
    try {
      setLoading(true)

      // Check if volunteer is approved
      const approvalRes = await api.post('/api/volunteer/check-approval/')
      setVolunteerInfo(approvalRes.data.volunteer)

      // Fetch complaints for verification
      const complaintsRes = await api.get('/api/volunteer/complaints/')
      setComplaints(complaintsRes.data)

      // Calculate stats
      const total = complaintsRes.data.length
      const verified = complaintsRes.data.filter(
        (c) => c.verification_status === 'verified'
      ).length
      const rejected = complaintsRes.data.filter(
        (c) => c.verification_status === 'rejected'
      ).length
      const pending = total - verified - rejected

      setStats({ total, verified, pending, rejected })
      setError('')
    } catch (err) {
      console.error('Error:', err)
      setError('Not authorized as volunteer. Redirecting...')
      setTimeout(() => navigate('/volunteer/login'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadImage = async (complaintId) => {
    const file = selectedFiles[complaintId]
    if (!file) {
      alert('Please select an image first')
      return
    }

    try {
      setUploadingId(complaintId)
      const formData = new FormData()
      formData.append('image', file)

      await api.post(
        `/api/volunteer/complaints/${complaintId}/upload-image/`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )

      alert('Image uploaded successfully!')
      setSelectedFiles((prev) => ({ ...prev, [complaintId]: null }))
      setUploadingId(null)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload image')
      setUploadingId(null)
    }
  }

  const handleVerifyComplaint = async (complaintId, action) => {
    try {
      setVerifyingId(complaintId)

      const response = await api.post(
        `/api/volunteer/complaints/${complaintId}/verify/`,
        {
          action: action, // 'verified' or 'rejected'
          notes: verificationNotes[complaintId] || '',
        }
      )

      // Update complaint status
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId
            ? { ...c, verification_status: action }
            : c
        )
      )

      // Update stats
      setStats((prev) => {
        const newStats = { ...prev }
        if (action === 'verified') {
          newStats.pending = Math.max(0, newStats.pending - 1)
          newStats.verified += 1
        } else if (action === 'rejected') {
          newStats.pending = Math.max(0, newStats.pending - 1)
          newStats.rejected += 1
        }
        return newStats
      })

      setVerificationNotes((prev) => ({ ...prev, [complaintId]: '' }))
      setVerifyingId(null)
      alert(`Complaint ${action} successfully!`)
    } catch (err) {
      console.error('Verification error:', err)
      alert('Failed to verify complaint')
      setVerifyingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading volunteer dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Volunteer Dashboard
              </h1>
              {volunteerInfo && (
                <p className="text-gray-600 mt-1">
                  Welcome, {volunteerInfo.user?.first_name || 'Volunteer'}!
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Complaints</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pending}
                </p>
              </div>
              <AlertCircle className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Verified</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.verified}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Complaints for Verification
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Review and verify citizen complaints
            </p>
          </div>

          {complaints.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-600 text-lg">
                No complaints to verify
              </p>
              <p className="text-gray-500 text-sm mt-2">
                All complaints have been reviewed!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="p-6 hover:bg-gray-50">
                  {/* Collapsed View */}
                  <div
                    onClick={() =>
                      setExpandedId(
                        expandedId === complaint.id ? null : complaint.id
                      )
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {complaint.title}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              complaint.verification_status === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : complaint.verification_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {complaint.verification_status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-gray-600 text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin size={16} />
                            <span>{complaint.area || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={16} />
                            <span>
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        {expandedId === complaint.id ? (
                          <ChevronUp size={24} className="text-gray-600" />
                        ) : (
                          <ChevronDown size={24} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded View */}
                  {expandedId === complaint.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      {/* Complaint Details */}
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Description
                        </h4>
                        <p className="text-gray-700">
                          {complaint.description}
                        </p>
                      </div>

                      {/* Category & Status */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Category</p>
                          <p className="font-semibold text-gray-900">
                            {complaint.category}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold text-gray-900">
                            {complaint.status}
                          </p>
                        </div>
                      </div>

                      {/* Image Upload Section */}
                      {complaint.verification_status !== 'verified' &&
                        complaint.verification_status !== 'rejected' && (
                          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                              <Camera size={18} className="inline mr-2" />
                              Upload Verification Image
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setSelectedFiles((prev) => ({
                                    ...prev,
                                    [complaint.id]:
                                      e.target.files?.[0] || null,
                                  }))
                                }
                                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                              />
                              <button
                                onClick={() => handleUploadImage(complaint.id)}
                                disabled={
                                  !selectedFiles[complaint.id] ||
                                  uploadingId === complaint.id
                                }
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
                              >
                                {uploadingId === complaint.id ? (
                                  <Loader size={16} className="animate-spin" />
                                ) : (
                                  <FileUp size={16} />
                                )}
                                Upload
                              </button>
                            </div>
                          </div>
                        )}

                      {/* Verification Notes */}
                      {complaint.verification_status !== 'verified' &&
                        complaint.verification_status !== 'rejected' && (
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">
                              Verification Notes (Optional)
                            </label>
                            <textarea
                              value={verificationNotes[complaint.id] || ''}
                              onChange={(e) =>
                                setVerificationNotes((prev) => ({
                                  ...prev,
                                  [complaint.id]: e.target.value,
                                }))
                              }
                              placeholder="Add any notes about this verification..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              rows="3"
                            />
                          </div>
                        )}

                      {/* Action Buttons */}
                      {complaint.verification_status !== 'verified' &&
                        complaint.verification_status !== 'rejected' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                handleVerifyComplaint(complaint.id, 'verified')
                              }
                              disabled={verifyingId === complaint.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
                            >
                              {verifyingId === complaint.id ? (
                                <Loader size={18} className="animate-spin" />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                              Verify
                            </button>
                            <button
                              onClick={() =>
                                handleVerifyComplaint(complaint.id, 'rejected')
                              }
                              disabled={verifyingId === complaint.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition"
                            >
                              {verifyingId === complaint.id ? (
                                <Loader size={18} className="animate-spin" />
                              ) : (
                                <XCircle size={18} />
                              )}
                              Reject
                            </button>
                          </div>
                        )}

                      {(complaint.verification_status === 'verified' ||
                        complaint.verification_status === 'rejected') && (
                        <div
                          className={`p-4 rounded-lg text-center ${
                            complaint.verification_status === 'verified'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <p className="font-semibold">
                            {complaint.verification_status === 'verified'
                              ? '✓ This complaint has been verified'
                              : '✗ This complaint has been rejected'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VDashboard
