import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, AlertCircle, X, FileUp, Download, Trash2, MapPin, User, Calendar, Tag, RefreshCw } from 'lucide-react'
import api from '../services/api'

function MyComplaints() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadComplaints()
  }, [navigate])

  // Add visibility listener to refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadComplaints()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const loadComplaints = async () => {
    try {
      setRefreshing(true)
      const token = localStorage.getItem('access')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await api.get('/api/complaints/')
      setComplaints(response.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to fetch complaints:', err)
      setError('Failed to load complaints.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint)
    setShowModal(true)
  }

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || !selectedComplaint) return

    setUploadingFiles(true)
    setDeleteError('')

    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      const response = await api.post(
        `/api/complaints/${selectedComplaint.id}/upload-documents/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      // Update the selected complaint with ALL documents (from the updated complaint data)
      const updatedComplaint = response.data.complaint || {
        ...selectedComplaint,
        documents: response.data.documents || [],
      }
      setSelectedComplaint(updatedComplaint)

      // Update the complaints list
      setComplaints(
        complaints.map(c => (c.id === selectedComplaint.id ? updatedComplaint : c))
      )
    } catch (err) {
      console.error('File upload failed:', err)
      setDeleteError('Failed to upload files. Please try again.')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!selectedComplaint) return

    try {
      const response = await api.delete(
        `/api/complaints/${selectedComplaint.id}/documents/${documentId}/`
      )

      // Update the selected complaint with the updated data from backend
      const updatedComplaint = response.data.complaint || {
        ...selectedComplaint,
        documents: selectedComplaint.documents.filter(d => d.id !== documentId),
      }
      setSelectedComplaint(updatedComplaint)

      // Update the complaints list
      setComplaints(
        complaints.map(c => (c.id === selectedComplaint.id ? updatedComplaint : c))
      )
    } catch (err) {
      console.error('Failed to delete document:', err)
      setDeleteError('Failed to delete document. Please try again.')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Complaints</h1>
            <p className="text-gray-600">Track the status of your submissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadComplaints}
              disabled={refreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => navigate('/submit-complaint')}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Submit New Complaint
            </button>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Complaints List or Empty State */}
        {complaints.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle size={64} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No complaints yet</h3>
            <p className="text-gray-600 mb-8">Submit your first complaint to get started</p>
            <button
              onClick={() => navigate('/submit-complaint')}
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Submit Complaint
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {complaints.map(complaint => (
              <div
                key={complaint.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(complaint)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {complaint.title || 'Untitled Complaint'}
                    </h3>
                    <p className="text-gray-600 mb-3">{complaint.description?.substring(0, 100)}...</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getStatusColor(complaint.status)}`}>
                    {complaint.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag size={16} />
                    <span>{complaint.category || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} />
                    <span>{complaint.location?.substring(0, 20) || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} />
                    <span>{formatDate(complaint.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileUp size={16} />
                    <span>{complaint.documents?.length || 0} files</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedComplaint.title}</h2>
                <p className="text-gray-600 mt-1">Complaint ID: #{selectedComplaint.id}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status?.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Description</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Category</h3>
                  <p className="text-gray-700">{selectedComplaint.category || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Department</h3>
                  <p className="text-gray-700">{selectedComplaint.department || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Location</h3>
                  <p className="text-gray-700">{selectedComplaint.location || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Support Count</h3>
                  <p className="text-gray-700">{selectedComplaint.support_count || 0}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Submitted</h3>
                  <p className="text-gray-700">{formatDate(selectedComplaint.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Last Updated</h3>
                  <p className="text-gray-700">{formatDate(selectedComplaint.updated_at)}</p>
                </div>
              </div>

              {/* Location Details */}
              {selectedComplaint.latitude && selectedComplaint.longitude && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase">Coordinates</h3>
                  <p className="text-gray-700">
                    Latitude: {selectedComplaint.latitude.toFixed(4)}, Longitude: {selectedComplaint.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Documents Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attached Files</h3>

                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {deleteError}
                  </div>
                )}

                {/* File Upload */}
                <div className="mb-6">
                  <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                      className="hidden"
                      accept="*"
                    />
                    <div className="text-center">
                      <FileUp size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        {uploadingFiles ? 'Uploading...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF, DOC and other files up to 25MB</p>
                    </div>
                  </label>
                </div>

                {/* Files List */}
                {selectedComplaint.documents && selectedComplaint.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedComplaint.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileUp size={20} className="text-blue-500 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <a
                            href={doc.file}
                            download={doc.file_name}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Download file"
                          >
                            <Download size={18} />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete file"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No files attached yet</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyComplaints
