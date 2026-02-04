import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Bar, Line } from "react-chartjs-2";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [mapPoints, setMapPoints] = useState([]);

  useEffect(() => {
    api.get("/api/admin/analytics/").then((res) => setAnalytics(res.data));
    api
      .get("/api/admin/analytics/geographic/")
      .then((res) => setMapPoints(res.data));
  }, []);

  if (!analytics) return <div>Loading analytics...</div>;

  const categoryData = {
    labels: analytics.category_distribution.map((c) => c.category),
    datasets: [
      {
        label: "Complaints by Category",
        data: analytics.category_distribution.map((c) => c.count),
        backgroundColor: "#36a2eb",
      },
    ],
  };

  const trendData = {
    labels: ["7 days ago", "Now"],
    datasets: [
      {
        label: "Complaints (last 7 days)",
        data: [0, analytics.complaints_last_7_days],
        fill: false,
        borderColor: "#4bc0c0",
      },
    ],
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <div style={{ width: 400, margin: 20 }}>
        <Bar data={categoryData} />
      </div>
      <div style={{ width: 400, margin: 20 }}>
        <Line data={trendData} />
      </div>
      <div style={{ height: 400, width: 600, margin: 20 }}>
        <MapContainer
          center={[11.0168, 76.9558]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {mapPoints.map((p, i) => (
            <CircleMarker
              key={i}
              center={[p.latitude, p.longitude]}
              radius={5 + (p.support_count || 1)}
              color="#e74c3c"
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;

