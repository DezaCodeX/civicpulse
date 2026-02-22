import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, ThumbsUp } from 'lucide-react'
import api from '../services/api'

function PublicComplaints() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    loadComplaints()
  }, [departmentFilter])

  const loadComplaints = async () => {
    try {
      setLoading(true)
      let url = '/api/public/complaints/'
      if (departmentFilter) {
        url += `?department=${departmentFilter}`
      }
      const response = await api.get(url)
      setComplaints(response.data)
      
      // Extract unique departments
      const depts = [...new Set(response.data.map(c => c.department).filter(Boolean))]
      setDepartments(depts)
    } catch (err) {
      console.error('Failed to load complaints', err)
      setError('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const filteredComplaints = complaints.filter(complaint =>
    complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedComplaints = filteredComplaints.reduce((groups, complaint) => {
    const category = complaint.category || complaint.department || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(complaint)
    return groups
  }, {})

  const groupedEntries = Object.entries(groupedComplaints).sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Public Complaints</h1>
          <p className="text-gray-600">View complaints from your community and show your support</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="h-5 w-5 text-gray-500" />
            <button
              onClick={() => {
                setDepartmentFilter('')
                loadComplaints()
              }}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                departmentFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Departments
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  departmentFilter === dept ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Found <strong>{filteredComplaints.length}</strong> complaint{filteredComplaints.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Complaints Grid */}
        {!loading && filteredComplaints.length > 0 && (
          <div className="space-y-8">
            {groupedEntries.map(([category, categoryComplaints]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">{category}</h2>
                  <span className="text-sm text-gray-600">
                    {categoryComplaints.length} complaint{categoryComplaints.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryComplaints.map(complaint => (
                    <div
                      key={complaint.id}
                      onClick={() => navigate(`/complaint/${complaint.id}`)}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg hover:border-blue-500 cursor-pointer transition border border-gray-200 overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{complaint.title}</h3>
                          </div>
                          {/* Verification Status Badge in Header */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {complaint.verified_by_volunteer && (
                              <span className="inline-flex items-center justify-center bg-green-400 text-green-900 text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap">
                                ✓ VOLUNTEER VERIFIED
                              </span>
                            )}
                            {complaint.admin_verified && (
                              <span className="inline-flex items-center justify-center bg-yellow-300 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap">
                                ✓ ADMIN VERIFIED
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-700 px-2 py-1 rounded text-xs font-medium">
                            {complaint.department || complaint.category}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                            complaint.status === 'pending' ? 'bg-yellow-600' :
                            complaint.status === 'in_progress' ? 'bg-blue-700' :
                            complaint.status === 'resolved' ? 'bg-green-600' :
                            'bg-red-600'
                          }`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                          {complaint.priority && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              complaint.priority === 'HIGH' ? 'bg-red-600' :
                              complaint.priority === 'MEDIUM' ? 'bg-orange-600' :
                              'bg-green-600'
                            }`}>
                              {complaint.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Tracking ID */}
                        <p className="text-xs text-gray-500 mb-2">
                          ID: {complaint.id} | Tracking: {complaint.tracking_id}
                        </p>

                        {/* Location */}
                        <div className="flex items-start gap-2 mb-3 text-gray-700">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm line-clamp-2">{complaint.location}</p>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {complaint.description}
                        </p>

                        {/* Flagged for Review Badge (only show in body if flagged) */}
                        {complaint.flag_for_admin_review && (
                          <div className="mb-3 flex items-center gap-2 bg-yellow-50 border border-yellow-300 rounded p-2">
                            <span className="text-lg">⚠</span>
                            <span className="text-xs font-semibold text-yellow-800">Flagged for Admin Review</span>
                          </div>
                        )}

                        {/* Volunteer Notes */}
                        {complaint.verification_notes && (
                          <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs font-semibold text-blue-900 mb-1">Volunteer Notes:</p>
                            <p className="text-xs text-blue-800 line-clamp-2">{complaint.verification_notes}</p>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {complaint.admin_review_reason && (
                          <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                            <p className="text-xs font-semibold text-amber-900 mb-1">Admin Notes:</p>
                            <p className="text-xs text-amber-800 line-clamp-2">{complaint.admin_review_reason}</p>
                          </div>
                        )}

                        {/* Verification Images Thumbnails */}
                        {complaint.verification_images_count > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              Proof Images ({complaint.verification_images_count})
                            </p>
                            <div className="flex gap-2 overflow-x-auto">
                              {complaint.verification_images.slice(0, 3).map(img => (
                                <a
                                  key={img.id}
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded overflow-hidden border border-gray-300 hover:border-blue-500 transition"
                                >
                                  <img src={img.url} alt="proof" className="h-full w-full object-cover" />
                                </a>
                              ))}
                              {complaint.verification_images_count > 3 && (
                                <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-xs font-semibold text-gray-600">
                                  +{complaint.verification_images_count - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Support Count */}
                        <div className="flex items-center gap-2 text-blue-600 font-semibold mb-3">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{complaint.support_count} support{complaint.support_count !== 1 ? 's' : ''}</span>
                        </div>

                        {/* Created Date */}
                        <p className="text-xs text-gray-500 pt-2 border-t">
                          {new Date(complaint.created_at).toLocaleDateString()} at {new Date(complaint.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No complaints found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicComplaints
