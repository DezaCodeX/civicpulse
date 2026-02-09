import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Users,
  CheckCircle,
  AlertCircle,
  BarChart3,
  FileDown,
  Loader,
  Search,
  Download,
  XCircle,
  Clock,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("complaints");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Complaints Tab
  const [complaints, setComplaints] = useState([]);
  const [complaintFilters, setComplaintFilters] = useState({
    status: "",
    department: "",
  });

  // Verification Queue Tab
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [verifying, setVerifying] = useState({});
  const [verificationReason, setVerificationReason] = useState({});

  // Volunteer Management Tab
  const [volunteers, setVolunteers] = useState([]);
  const [volunteerFilter, setVolunteerFilter] = useState("all");
  const [approvingVolunteer, setApprovingVolunteer] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showCreateVolunteerModal, setShowCreateVolunteerModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [volunteerData, setVolunteerData] = useState({
    ward: "",
    zone: "",
    area: "",
  });
  const [creatingVolunteer, setCreatingVolunteer] = useState(false);
  const [deletingVolunteer, setDeletingVolunteer] = useState({});

  // Analytics Tab
  const [analytics, setAnalytics] = useState(null);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        switch (activeTab) {
          case "complaints":
            await fetchComplaints();
            break;
          case "verification":
            await fetchVerificationQueue();
            break;
          case "volunteers":
            await fetchVolunteers();
            break;
          case "analytics":
            await fetchAnalytics();
            break;
          default:
            break;
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(`Failed to load ${activeTab} data`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const fetchComplaints = async () => {
    const params = new URLSearchParams();
    if (complaintFilters.status) params.append("status", complaintFilters.status);
    if (complaintFilters.department) params.append("department", complaintFilters.department);

    const response = await api.get(`/api/admin/complaints/?${params.toString()}`);
    setComplaints(response.data);
  };

  const fetchVerificationQueue = async () => {
    const response = await api.get("/api/admin/verification-queue/");
    setVerificationQueue(response.data);
  };

  const fetchVolunteers = async () => {
    const params = new URLSearchParams();
    if (volunteerFilter !== "all") {
      params.append("approval", volunteerFilter === "approved" ? "approved" : "pending");
    }
    const response = await api.get(`/api/admin/volunteers/?${params.toString()}`);
    setVolunteers(response.data);
  };

  const fetchAnalytics = async () => {
    const response = await api.get("/api/admin/analytics/");
    setAnalytics(response.data);
  };

  // Action handlers
  const handleComplaintStatusChange = async (complaintId, newStatus) => {
    try {
      await api.patch(`/api/admin/complaints/${complaintId}/status/`, {
        status: newStatus,
      });
      await fetchComplaints();
      alert("Status updated successfully");
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleAdminVerification = async (complaintId, action) => {
    try {
      setVerifying((prev) => ({ ...prev, [complaintId]: true }));

      await api.post(`/api/admin/verification-queue/${complaintId}/verify/`, {
        action,
        reason: verificationReason[complaintId] || "",
      });

      await fetchVerificationQueue();
      setVerificationReason((prev) => {
        const newReasons = { ...prev };
        delete newReasons[complaintId];
        return newReasons;
      });

      alert(
        action === "accept"
          ? "Complaint verified and made public"
          : "Complaint verification rejected"
      );
    } catch (err) {
      alert("Failed to process verification");
    } finally {
      setVerifying((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const handleVolunteerApproval = async (volunteerId, action) => {
    try {
      setApprovingVolunteer((prev) => ({
        ...prev,
        [volunteerId]: true,
      }));

      await api.post(`/api/admin/volunteers/${volunteerId}/approve/`, {
        action,
      });

      await fetchVolunteers();
      alert(action === "approve" ? "Volunteer approved" : "Volunteer blocked");
    } catch (err) {
      alert("Failed to update volunteer status");
    } finally {
      setApprovingVolunteer((prev) => ({
        ...prev,
        [volunteerId]: false,
      }));
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get("/api/admin/available-users/");
      setAvailableUsers(response.data);
    } catch (err) {
      console.error("Error fetching available users:", err);
      alert("Failed to load users");
    }
  };

  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !volunteerData.ward || !volunteerData.zone || !volunteerData.area) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setCreatingVolunteer(true);
      await api.post("/api/admin/volunteers/create/", {
        user_id: selectedUserId,
        ward: volunteerData.ward,
        zone: volunteerData.zone,
        area: volunteerData.area,
      });

      alert("Volunteer created successfully!");
      setShowCreateVolunteerModal(false);
      setSelectedUserId("");
      setVolunteerData({ ward: "", zone: "", area: "" });
      await fetchVolunteers();
    } catch (err) {
      console.error("Create volunteer error:", err);
      alert(err.response?.data?.error || "Failed to create volunteer");
    } finally {
      setCreatingVolunteer(false);
    }
  };

  const handleDeleteVolunteer = async (volunteerId) => {
    if (!window.confirm("Are you sure you want to delete this volunteer? This will mark them as inactive.")) {
      return;
    }

    try {
      setDeletingVolunteer((prev) => ({
        ...prev,
        [volunteerId]: true,
      }));

      await api.delete(`/api/admin/volunteers/${volunteerId}/delete/`);
      alert("Volunteer deleted successfully");
      await fetchVolunteers();
    } catch (err) {
      console.error("Delete volunteer error:", err);
      alert(err.response?.data?.error || "Failed to delete volunteer");
    } finally {
      setDeletingVolunteer((prev) => ({
        ...prev,
        [volunteerId]: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage complaints, volunteers, and verifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-0">
            {[
              { id: "complaints", label: "Complaints", icon: AlertCircle },
              { id: "verification", label: "Verification Queue", icon: Clock },
              { id: "volunteers", label: "Volunteer Management", icon: Users },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "exports", label: "Exports", icon: FileDown },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-semibold">{error}</p>
              <p className="text-xs text-red-600 mt-1">Check browser console (F12) for more details</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600 ml-3">Loading {activeTab} data...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* COMPLAINTS TAB */}
            {activeTab === "complaints" && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Filter Complaints
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={complaintFilters.status}
                      onChange={(e) =>
                        setComplaintFilters((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Filter by department"
                      value={complaintFilters.department}
                      onChange={(e) =>
                        setComplaintFilters((prev) => ({
                          ...prev,
                          department: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={fetchComplaints}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Apply Filters
                  </button>
                </div>

                {/* Complaints List */}
                <div className="space-y-4">
                  {complaints.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No complaints found</p>
                    </div>
                  ) : (
                    complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">
                              By: {complaint.user.name} ({complaint.user.email})
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              Department: {complaint.department}
                            </p>
                            <p className="text-gray-600 text-sm">
                              Status: {complaint.status}
                            </p>
                          </div>
                          <select
                            value={complaint.status}
                            onChange={(e) =>
                              handleComplaintStatusChange(
                                complaint.id,
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VERIFICATION QUEUE TAB */}
            {activeTab === "verification" && (
              <div className="space-y-4">
                {verificationQueue.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">No pending verifications</p>
                  </div>
                ) : (
                  verificationQueue.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Complaint Info */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {complaint.title}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {complaint.description}
                          </p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              <strong>Citizen:</strong> {complaint.citizen.name} ({
                                complaint.citizen.email
                              })
                            </p>
                            <p>
                              <strong>Volunteer:</strong>{" "}
                              {complaint.volunteer.name} ({complaint.volunteer.email})
                            </p>
                            <p>
                              <strong>Category:</strong> {complaint.category}
                            </p>
                            <p>
                              <strong>Verification Notes:</strong>{" "}
                              {complaint.verification_notes}
                            </p>
                          </div>
                        </div>

                        {/* Verification Images */}
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-3">
                            Verification Proof ({
                              complaint.verification_images?.length || 0
                            })
                          </h5>
                          {complaint.verification_images &&
                            complaint.verification_images.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {complaint.verification_images.map((img) => (
                                <a
                                  key={img.id}
                                  href={img.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-24 bg-gray-100 rounded overflow-hidden hover:shadow-md transition"
                                >
                                  <img
                                    src={img.url}
                                    alt="Verification"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm mb-4">
                              No verification images
                            </p>
                          )}

                          {/* Verification Actions */}
                          <div className="space-y-3">
                            <textarea
                              value={verificationReason[complaint.id] || ""}
                              onChange={(e) =>
                                setVerificationReason((prev) => ({
                                  ...prev,
                                  [complaint.id]: e.target.value,
                                }))
                              }
                              placeholder="Reason (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows="2"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAdminVerification(
                                    complaint.id,
                                    "accept"
                                  )
                                }
                                disabled={verifying[complaint.id]}
                                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                              >
                                {verifying[complaint.id] ? "Processing..." : "Accept"}
                              </button>
                              <button
                                onClick={() =>
                                  handleAdminVerification(
                                    complaint.id,
                                    "reject"
                                  )
                                }
                                disabled={verifying[complaint.id]}
                                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                              >
                                {verifying[complaint.id] ? "Processing..." : "Reject"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* VOLUNTEER MANAGEMENT TAB */}
            {activeTab === "volunteers" && (
              <div className="space-y-6">
                {/* Header with Create Button */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Volunteer Management</h3>
                      <p className="text-sm text-gray-600">Create volunteers from existing users or manage current ones</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowCreateVolunteerModal(true);
                        fetchAvailableUsers();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      <Plus size={18} />
                      Create Volunteer
                    </button>
                  </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Filter</h3>
                  <div className="flex gap-2">
                    {["all", "approved", "pending"].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setVolunteerFilter(filter);
                        }}
                        className={`px-4 py-2 rounded-lg transition ${
                          volunteerFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {filter === "all"
                          ? "All Volunteers"
                          : filter === "approved"
                            ? "Approved"
                            : "Pending"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {volunteers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No volunteers found</p>
                    </div>
                  ) : (
                    volunteers.map((volunteer) => (
                      <div
                        key={volunteer.id}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">
                              {volunteer.user.name}
                            </h4>
                            <p className="text-gray-600 text-sm">
                              {volunteer.user.email}
                            </p>
                            <div className="mt-2 text-sm text-gray-600">
                              <p>Ward: {volunteer.ward}</p>
                              <p>Zone: {volunteer.zone}</p>
                              <p>Area: {volunteer.area}</p>
                              <p className="mt-1">
                                Verifications Done: {volunteer.verifications_count}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                volunteer.is_approved
                                  ? "bg-green-50 text-green-700"
                                  : "bg-yellow-50 text-yellow-700"
                              }`}
                            >
                              {volunteer.is_approved ? "Approved" : "Pending"}
                            </span>
                            {!volunteer.is_approved && (
                              <button
                                onClick={() =>
                                  handleVolunteerApproval(volunteer.id, "approve")
                                }
                                disabled={approvingVolunteer[volunteer.id]}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                              >
                                Approve
                              </button>
                            )}
                            {volunteer.is_approved && (
                              <button
                                onClick={() =>
                                  handleVolunteerApproval(volunteer.id, "block")
                                }
                                disabled={approvingVolunteer[volunteer.id]}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
                              >
                                Block
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVolunteer(volunteer.id)}
                              disabled={deletingVolunteer[volunteer.id]}
                              className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition text-sm disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {deletingVolunteer[volunteer.id] ? (
                                <Loader size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                {analytics && (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Total Complaints",
                          value: analytics.total_complaints,
                          color: "bg-blue-50 text-blue-600",
                        },
                        {
                          label: "Pending",
                          value: analytics.pending_complaints,
                          color: "bg-yellow-50 text-yellow-600",
                        },
                        {
                          label: "Resolved",
                          value: analytics.resolved_complaints,
                          color: "bg-green-50 text-green-600",
                        },
                        {
                          label: "Last 7 Days",
                          value: analytics.complaints_last_7_days,
                          color: "bg-purple-50 text-purple-600",
                        },
                      ].map((stat, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-6 ${stat.color}`}
                        >
                          <p className="text-sm font-medium">{stat.label}</p>
                          <p className="text-3xl font-bold mt-2">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Department Distribution */}
                    {analytics.department_distribution && (
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Complaints by Department
                        </h3>
                        <div className="space-y-2">
                          {analytics.department_distribution.map((dept, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">
                                  {dept.department}
                                </span>
                                <span className="text-gray-600">{dept.count}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${(dept.count / Math.max(...analytics.department_distribution.map((d) => d.count))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* EXPORTS TAB */}
            {activeTab === "exports" && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Export Data
                </h2>
                <p className="text-gray-600 mb-6">
                  Export complaint data in various formats for reporting and analysis.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition">
                    <Download className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Export as CSV</p>
                      <p className="text-xs text-gray-600">All complaints</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition">
                    <Download className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Export as PDF</p>
                      <p className="text-xs text-gray-600">Verified complaints</p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition">
                    <Download className="w-6 h-6 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Export Volunteers</p>
                      <p className="text-xs text-gray-600">All volunteer data</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

