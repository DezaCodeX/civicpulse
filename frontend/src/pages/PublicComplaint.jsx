import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ThumbsUp, FileDown, MapPin, Calendar } from 'lucide-react'
import { api } from '../services/api'

function PublicComplaint() {
  const { complaintId } = useParams()
  const navigate = useNavigate()
  const [complaint, setComplaint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [supportCount, setSupportCount] = useState(0)
  const [hasSupported, setHasSupported] = useState(false)
  const [profileComplete, setProfileComplete] = useState(true)

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const response = await api.get(`/api/public/complaints/${complaintId}/`)
        setComplaint(response.data)
        setSupportCount(response.data.support_count)
        
        // Check if already supported (using localStorage)
        const supported = localStorage.getItem(`supported_${complaintId}`)
        if (supported) {
          setHasSupported(true)
        }
      } catch (err) {
        console.error('Failed to load complaint', err)
        setError('Complaint not found or is not public')
      } finally {
        setLoading(false)
      }
    }

    // Fetch profile completeness
    api.get("/api/profile/").then(res => {
      setProfileComplete(res.data.profile_complete !== false);
    }).catch(() => setProfileComplete(false));

    loadComplaint()
  }, [complaintId])

  const handleSupport = async () => {
    try {
      const response = await api.post(`/api/complaints/${complaintId}/support/`)
      setSupportCount(response.data.support_count)
      setHasSupported(true)
      localStorage.setItem(`supported_${complaintId}`, 'true')
    } catch (err) {
      console.error('Failed to support complaint', err)
      setError('Failed to record your support. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!complaint) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ChevronLeft size={20} />
          Back
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{complaint.title}</h1>
                <div className="flex items-center gap-2 text-blue-100">
                  <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-medium">
                    {complaint.department || complaint.category}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <p className="text-xs text-blue-100">Status</p>
                  <p className="text-sm font-semibold capitalize">{complaint.status}</p>
                </div>
              </div>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500">
              <div>
                <p className="text-xs text-blue-100">Location</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin size={16} />
                  <p className="text-sm font-medium">{complaint.location}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-100">Reported</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar size={16} />
                  <p className="text-sm font-medium">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Description */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
            </section>

            {/* Location Details */}
            {complaint.latitude && complaint.longitude && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Exact Location</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    <strong>Coordinates:</strong> {complaint.latitude.toFixed(6)}, {complaint.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    This information helps authorities locate and address the issue more efficiently.
                  </p>
                </div>
              </section>
            )}

            {/* Documents */}
            {complaint.documents && complaint.documents.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents ({complaint.documents.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {complaint.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <FileDown className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Support Section */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Show Your Support</h2>
              <p className="text-sm text-gray-700 mb-4">
                Do you face the same issue? Support this complaint to help prioritize action.
              </p>
              <div className="flex items-center gap-6">
                <button
                  disabled={!profileComplete || hasSupported}
                  onClick={handleSupport}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
                    hasSupported
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <ThumbsUp size={20} />
                  {hasSupported ? 'Supported' : 'Support This Complaint'}
                </button>
                {!profileComplete && (
                  <p className="text-red-500 text-sm">
                    Please complete your profile to support complaints.
                  </p>
                )}
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{supportCount}</p>
                  <p className="text-sm text-gray-600">people support this</p>
                </div>
              </div>
            </section>

            {/* Privacy Notice */}
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 <strong>Privacy Note:</strong> This is a public complaint. Your identity is hidden from other viewers.
                Only administrators can see who submitted this complaint.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicComplaint
