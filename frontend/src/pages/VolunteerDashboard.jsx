import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FileUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Plus,
  Loader,
  MapPin,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";

const VolunteerDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [volunteerInfo, setVolunteerInfo] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    ward: "",
    zone: "",
    area: "",
    status: "",
    category: "",
  });

  // Verification states
  const [verifying, setVerifying] = useState({});
  const [verificationNotes, setVerificationNotes] = useState({});
  const [uploadingImages, setUploadingImages] = useState({});
  const [expandedComplaint, setExpandedComplaint] = useState(null);

  // Check if user is approved volunteer and fetch complaints
  useEffect(() => {
    const checkApprovalAndFetchComplaints = async () => {
      try {
        // Check volunteer approval
        const approvalResponse = await api.post("/api/volunteer/check-approval/");
        setVolunteerInfo(approvalResponse.data.volunteer);

        // Fetch complaints with current filters
        fetchComplaints();
      } catch (err) {
        console.error("Approval check error:", err);
        setError("You are not approved as a volunteer.");
        setTimeout(() => navigate("/volunteer/login"), 2000);
      }
    };

    checkApprovalAndFetchComplaints();
  }, [navigate]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      // Build query string from filters
      const params = new URLSearchParams();
      if (filters.ward) params.append("ward", filters.ward);
      if (filters.zone) params.append("zone", filters.zone);
      if (filters.area) params.append("area", filters.area);
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);

      const response = await api.get(
        `/api/volunteer/dashboard/?${params.toString()}`
      );
      setComplaints(response.data);
    } catch (err) {
      console.error("Fetch complaints error:", err);
      setError("Failed to fetch complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const applyFilters = () => {
    fetchComplaints();
  };

  const resetFilters = () => {
    setFilters({
      ward: "",
      zone: "",
      area: "",
      status: "",
      category: "",
    });
    // Fetch after reset
    setTimeout(fetchComplaints, 100);
  };

  const uploadVerificationImage = async (complaintId, file) => {
    if (!file) return;

    try {
      setUploadingImages((prev) => ({ ...prev, [complaintId]: true }));
      setError("");

      const formData = new FormData();
      formData.append("image", file);

      await api.post(
        `/api/volunteer/complaints/${complaintId}/upload-image/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Refresh complaints
      fetchComplaints();
      alert("Image uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      const errorMsg = err.response?.data?.error || "Failed to upload image";
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setUploadingImages((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const verifyComplaint = async (complaintId, action) => {
    try {
      setVerifying((prev) => ({ ...prev, [complaintId]: true }));
      setError("");

      await api.post(
        `/api/volunteer/complaints/${complaintId}/verify/`,
        {
          action,
          notes: verificationNotes[complaintId] || "",
        }
      );

      // Refresh complaints
      fetchComplaints();
      setVerificationNotes((prev) => {
        const newNotes = { ...prev };
        delete newNotes[complaintId];
        return newNotes;
      });
      setExpandedComplaint(null);

      alert(
        action === "approve"
          ? "Complaint approved! It will now go to admin for verification."
          : "Complaint rejected."
      );
    } catch (err) {
      console.error("Verification error:", err);
      setError("Failed to verify complaint. Please try again.");
      alert("Failed to verify complaint. Please try again.");
    } finally {
      setVerifying((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const raiseComplaint = () => {
    // Navigate to submit complaint with pre-filled volunteer location data
    navigate("/submit-complaint", {
      state: {
        preFilledData: {
          ward: volunteerInfo?.ward,
          zone: volunteerInfo?.zone,
          area: volunteerInfo?.area,
        },
      },
    });
  };

  if (!volunteerInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">
            Verifying volunteer status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Volunteer Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Ward: {volunteerInfo.ward} | Zone: {volunteerInfo.zone} | Area:{" "}
                {volunteerInfo.area}
              </p>
            </div>
            <button
              onClick={raiseComplaint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Plus className="w-5 h-5" />
              Raise Complaint
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Filter Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Complaints</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* Ward Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ward
              </label>
              <input
                type="text"
                name="ward"
                value={filters.ward}
                onChange={handleFilterChange}
                placeholder="Filter by ward"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <input
                type="text"
                name="zone"
                value={filters.zone}
                onChange={handleFilterChange}
                placeholder="Filter by zone"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area
              </label>
              <input
                type="text"
                name="area"
                value={filters.area}
                onChange={handleFilterChange}
                placeholder="Filter by area"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                placeholder="Filter by category"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600 ml-3">Loading complaints...</p>
          </div>
        )}

        {/* Complaints List */}
        {!loading && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {complaints.length} complaint
                {complaints.length !== 1 ? "s" : ""} to verify
              </p>
            </div>

            {complaints.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  No unverified complaints in your area.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
                  >
                    {/* Complaint Card Header */}
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() =>
                        setExpandedComplaint(
                          expandedComplaint === complaint.id ? null : complaint.id
                        )
                      }
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {complaint.title}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {complaint.description.substring(0, 150)}
                            {complaint.description.length > 150 ? "..." : ""}
                          </p>

                          {/* Location Info */}
                          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                            {complaint.ward && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Ward: {complaint.ward}
                              </span>
                            )}
                            {complaint.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Zone: {complaint.zone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              Category: {complaint.category}
                            </span>
                          </div>

                          {/* Support Count */}
                          <div className="mt-3 inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            👥 {complaint.support_count} supports
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                            {complaint.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Verification Section */}
                    {expandedComplaint === complaint.id && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {/* Documents Section */}
                        {complaint.documents && complaint.documents.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <ImageIcon className="w-5 h-5" />
                              Attached Documents ({complaint.documents.length})
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {complaint.documents.map((doc) => (
                                <a
                                  key={doc.id}
                                  href={doc.file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-3 bg-white border border-gray-300 rounded-lg text-center hover:shadow-md transition"
                                >
                                  <p className="text-xs text-gray-600 truncate">
                                    {doc.file_name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {(doc.file_size / 1024).toFixed(2)} KB
                                  </p>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verification Images Upload */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FileUp className="w-5 h-5" />
                            Upload Verification Proof
                          </h4>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                e.target.files &&
                                uploadVerificationImage(complaint.id, e.target.files[0])
                              }
                              disabled={uploadingImages[complaint.id]}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                            {uploadingImages[complaint.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
                                <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Upload clear images as proof of verification
                          </p>
                        </div>

                        {/* Uploaded Verification Images */}
                        {complaint.verification_images &&
                          complaint.verification_images.length > 0 && (
                            <div className="mb-6">
                              <h5 className="font-medium text-gray-900 mb-2 text-sm">
                                Verification Images ({complaint.verification_images.length})
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {complaint.verification_images.map((img) => (
                                  <a
                                    key={img.id}
                                    href={img.image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative h-24 bg-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                                  >
                                    <img
                                      src={img.image}
                                      alt="Verification"
                                      className="w-full h-full object-cover"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Verification Notes */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Verification Notes
                          </label>
                          <textarea
                            value={verificationNotes[complaint.id] || ""}
                            onChange={(e) =>
                              setVerificationNotes((prev) => ({
                                ...prev,
                                [complaint.id]: e.target.value,
                              }))
                            }
                            placeholder="Add your verification notes here..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() =>
                              verifyComplaint(complaint.id, "approve")
                            }
                            disabled={verifying[complaint.id]}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifying[complaint.id] ? (
                              <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              verifyComplaint(complaint.id, "reject")
                            }
                            disabled={verifying[complaint.id]}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifying[complaint.id] ? (
                              <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="w-5 h-5" />
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
