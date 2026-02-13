import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import api from "../../services/api";

import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

const TREND_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const emptyState = {
  category: [],
  status: [],
  trend: [],
  locations: [],
};

const formatTrendLabel = (value, period) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return String(value || "");
  }

  if (period === "monthly") {
    return parsed.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }

  if (period === "weekly") {
    return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const AdminAnalytics = () => {
  const [trendPeriod, setTrendPeriod] = useState("daily");
  const [data, setData] = useState(emptyState);
  const [loading, setLoading] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStaticAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [categoryRes, statusRes, locationRes] = await Promise.all([
          api.get("/api/admin/analytics/category/"),
          api.get("/api/admin/analytics/status/"),
          api.get("/api/admin/analytics/location/"),
        ]);

        setData((prev) => ({
          ...prev,
          category: categoryRes.data || [],
          status: statusRes.data || [],
          locations: (locationRes.data || []).filter(
            (item) => item.latitude != null && item.longitude != null
          ),
        }));
      } catch (err) {
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics charts");
      } finally {
        setLoading(false);
      }
    };

    fetchStaticAnalytics();
  }, []);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setTrendLoading(true);
        setError("");
        const response = await api.get(`/api/admin/analytics/${trendPeriod}/`);
        setData((prev) => ({
          ...prev,
          trend: response.data || [],
        }));
      } catch (err) {
        console.error("Trend fetch error:", err);
        setError("Failed to load trend data");
      } finally {
        setTrendLoading(false);
      }
    };

    fetchTrend();
  }, [trendPeriod]);

  const categoryChart = useMemo(() => {
    return {
      labels: data.category.map((item) => item.category || "Uncategorized"),
      datasets: [
        {
          label: "Complaints",
          data: data.category.map((item) => item.count || 0),
          backgroundColor: "rgba(59, 130, 246, 0.65)",
        },
      ],
    };
  }, [data.category]);

  const statusChart = useMemo(() => {
    const labels = data.status.map((item) => item.status || "Unknown");
    const values = data.status.map((item) => item.count || 0);
    return {
      labels,
      datasets: [
        {
          label: "Complaints",
          data: values,
          backgroundColor: [
            "rgba(251, 191, 36, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(248, 113, 113, 0.8)",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [data.status]);

  const trendChart = useMemo(() => {
    const labels = data.trend.map((item) => {
      const key = item.day || item.week || item.month;
      return formatTrendLabel(key, trendPeriod);
    });

    return {
      labels,
      datasets: [
        {
          label: `${TREND_OPTIONS.find((opt) => opt.value === trendPeriod)?.label} Complaints`,
          data: data.trend.map((item) => item.count || 0),
          borderColor: "rgba(34, 197, 94, 0.9)",
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [data.trend, trendPeriod]);

  const mapCenter = useMemo(() => {
    if (data.locations.length > 0) {
      return [data.locations[0].latitude, data.locations[0].longitude];
    }
    return [11.0168, 76.9558];
  }, [data.locations]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600">Loading analytics charts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Overview</h3>
          {data.category.length === 0 ? (
            <p className="text-gray-600 text-sm">No category data available.</p>
          ) : (
            <Bar data={categoryChart} />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          {data.status.length === 0 ? (
            <p className="text-gray-600 text-sm">No status data available.</p>
          ) : (
            <Doughnut data={statusChart} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Complaint Trends</h3>
          <div className="flex gap-2">
            {TREND_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setTrendPeriod(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  trendPeriod === option.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {trendLoading ? (
          <p className="text-gray-600 text-sm">Loading trend data...</p>
        ) : data.trend.length === 0 ? (
          <p className="text-gray-600 text-sm">No trend data available.</p>
        ) : (
          <Line data={trendChart} />
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Map</h3>
        {data.locations.length === 0 ? (
          <p className="text-gray-600 text-sm">No location data available.</p>
        ) : (
          <MapContainer center={mapCenter} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {data.locations.map((loc) => (
              <Marker position={[loc.latitude, loc.longitude]} key={loc.id}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">Category: {loc.category}</div>
                    <div>Status: {loc.status}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Heatmap</h3>
        {data.locations.length === 0 ? (
          <p className="text-gray-600 text-sm">No location data available.</p>
        ) : (
          <MapContainer center={mapCenter} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapOverlay locations={data.locations} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

const HeatmapOverlay = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || locations.length === 0) {
      return undefined;
    }

    const heatLayer = L.heatLayer(
      locations.map((loc) => [loc.latitude, loc.longitude, 1]),
      { radius: 25, blur: 18, maxZoom: 17 }
    ).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, locations]);

  return null;
};

export default AdminAnalytics;
