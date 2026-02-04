import React, { useState } from "react";
import api from "../services/api";

const TrackComplaint = () => {
  const [trackingId, setTrackingId] = useState("");
  const [phone, setPhone] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  const trackComplaint = async () => {
    setError("");
    try {
      const res = await api.get("/api/track/", {
        params: { tracking_id: trackingId, phone }
      });
      setComplaint(res.data);
    } catch (e) {
      setError("Complaint not found");
      setComplaint(null);
    }
  };

  return (
    <div>
      <h2>Track Complaint</h2>
      <input
        placeholder="Tracking ID"
        value={trackingId}
        onChange={e => setTrackingId(e.target.value)}
      />
      <span> OR </span>
      <input
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      />
      <button onClick={trackComplaint}>Track</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {complaint && (
        <div style={{ marginTop: 20 }}>
          <h4>{complaint.title}</h4>
          <p>Status: {complaint.status}</p>
          <ul>
            {complaint.status_history && complaint.status_history.map((s, i) => (
              <li key={i}>
                {s.action || s.status} – {new Date(s.ts || s.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackComplaint;
