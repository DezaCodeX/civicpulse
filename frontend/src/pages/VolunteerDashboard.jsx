import React, { useEffect, useState } from "react";
import api from "../services/api";

const VolunteerDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [notes, setNotes] = useState({});
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    api.get("/api/volunteer/complaints/").then(res => setComplaints(res.data));
  }, []);

  const uploadImage = async (complaintId, file) => {
    setUploading(u => ({ ...u, [complaintId]: true }));
    const formData = new FormData();
    formData.append("image", file);
    await api.post(`/api/volunteer/complaints/${complaintId}/upload-image/`, formData);
    setUploading(u => ({ ...u, [complaintId]: false }));
    // Optionally refetch complaints or update state
  };

  const verifyComplaint = async (id, action) => {
    await api.post(`/api/volunteer/complaints/${id}/verify/`, {
      action,
      notes: notes[id] || ""
    });
    // Optionally refetch complaints or update state
  };

  return (
    <div>
      <h2>Volunteer Dashboard</h2>
      {complaints.map(c => (
        <div key={c.id} style={{ border: "1px solid #ccc", margin: 12, padding: 12 }}>
          <h4>{c.title}</h4>
          <p>{c.description}</p>
          <div>
            <strong>Status:</strong> {c.status} <br />
            <strong>Ward:</strong> {c.ward} <br />
            <strong>Zone:</strong> {c.zone} <br />
            <strong>Area:</strong> {c.area_name}
          </div>
          <div>
            <input
              type="file"
              onChange={e => uploadImage(c.id, e.target.files[0])}
              disabled={uploading[c.id]}
            />
            {uploading[c.id] && <span>Uploading...</span>}
          </div>
          <textarea
            placeholder="Verification notes"
            value={notes[c.id] || ""}
            onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
          />
          <button onClick={() => verifyComplaint(c.id, "approve")}>✅ Approve</button>
          <button onClick={() => verifyComplaint(c.id, "reject")}>❌ Reject</button>
        </div>
      ))}
    </div>
  );
};

export default VolunteerDashboard;
