import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, MapPin, ThumbsUp } from 'lucide-react'
import { api } from '../services/api'

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map(complaint => (
              <div
                key={complaint.id}
                onClick={() => navigate(`/complaint/${complaint.id}`)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg hover:border-blue-500 cursor-pointer transition border border-gray-200"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{complaint.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {complaint.department || complaint.category}
                    </span>
                    <span className="bg-blue-700 px-2 py-1 rounded text-xs font-medium capitalize">
                      {complaint.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Location */}
                  <div className="flex items-start gap-2 mb-3 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm line-clamp-2">{complaint.location}</p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {complaint.description}
                  </p>

                  {/* Support Count */}
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{complaint.support_count} support{complaint.support_count !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Date */}
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </p>
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
