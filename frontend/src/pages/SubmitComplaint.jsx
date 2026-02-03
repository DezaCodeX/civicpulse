import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Navigation, FileUp, X } from 'lucide-react'
import { createComplaint, getUserProfile } from '../services/firestore'
import { api } from '../services/api'

function SubmitComplaint() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    description: '',
    latitude: null,
    longitude: null,
  })
  const [files, setFiles] = useState([])
  const [profile, setProfile] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileIncomplete, setProfileIncomplete] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = localStorage.getItem('userId')
        if (!userId) {
          navigate('/login')
          return
        }

        const userData = await getUserProfile(userId)
        if (userData) {
          setProfile(userData)
          // Check if profile is complete
          const isComplete = userData.first_name && userData.last_name && userData.address && userData.city && userData.state && userData.phone_number
          if (!isComplete) {
            setProfileIncomplete(true)
          }
        } else {
          setProfileIncomplete(true)
        }
      } catch (err) {
        console.error("Failed to fetch profile", err)
      }
    }

    loadProfile()

    // Fetch geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }))
        },
        (err) => {
          console.warn("Location access denied:", err)
        }
      )
    }
  }, [navigate])



  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(prev => [...prev, ...selectedFiles])
    e.target.value = ''
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check if profile is incomplete
    if (profileIncomplete) {
      setProfileIncomplete(true)
      return
    }

    if (!formData.title || !formData.location || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setError('User not authenticated. Please log in.')
        navigate('/login')
        return
      }

      // Prepare FormData for file upload
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('location', formData.location)
      submitData.append('description', formData.description)
      submitData.append('latitude', formData.latitude || '')
      submitData.append('longitude', formData.longitude || '')
      submitData.append('firebase_uid', userId)

      // Add files
      files.forEach(file => {
        submitData.append('documents', file)
      })

      console.log('SubmitComplaint: Submitting complaint with', files.length, 'files')
      
      // Submit to Django backend with file uploads
      const response = await api.post('/api/complaints/create/', submitData)
      
      console.log('SubmitComplaint: Response:', response.data)
      setSuccess('Complaint submitted successfully!')
      
      // Also save to Firestore for React state management
      const complaintData = {
        title: formData.title,
        location: formData.location,
        description: formData.description,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: 'pending',
      }

      await createComplaint(userId, complaintData)

      // Reset form
      setFormData({
        title: '',
        location: '',
        description: '',
        latitude: null,
        longitude: null,
      })
      setFiles([])

      setTimeout(() => {
        navigate('/my-complaints')
      }, 1500)
    } catch (err) {
      console.error('Submission failed:', err)
      setError(err.response?.data?.error || 'Failed to submit complaint. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Complaint</h1>
          <p className="text-gray-600">Report an issue and help improve your community</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ {success}
          </div>
        )}

        {/* Profile Incomplete Popup */}
        {profileIncomplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Complete Your Profile</h2>
              <p className="text-gray-600 mb-6">
                To submit a complaint, please complete your profile information including your name, address, city, state, and phone number.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Go to Profile
                </button>
                <button
                  onClick={() => setProfileIncomplete(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Complaint Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Complaint Details</h2>
              <p className="text-sm text-gray-500 mb-6">Provide detailed information about the issue</p>

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complaint Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Brief title of the complaint"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Main Street, Ward 5"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Geolocation Display */}
              {formData.latitude && formData.longitude && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Navigation className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Auto-detected Location</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    Latitude: <strong>{formData.latitude.toFixed(6)}</strong>
                  </p>
                  <p className="text-sm text-blue-800">
                    Longitude: <strong>{formData.longitude.toFixed(6)}</strong>
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail..."
                  rows="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">Be specific and include relevant details for faster resolution</p>
              </div>
            </div>

            {/* File Upload Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Supporting Documents</h2>
              <p className="text-sm text-gray-500 mb-6">Upload photos, videos, or documents to support your complaint (optional)</p>

              <div className="mb-6">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer">
                    <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload files</p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                  </div>
                </label>
              </div>

              {/* Files List */}
              {files.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Files ({files.length})</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <FileUp className="h-4 w-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-500 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SubmitComplaint
