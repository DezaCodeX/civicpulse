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
import MarkerClusterGroup from "react-leaflet-markercluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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
  summary: null,
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
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const fetchStaticAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryRes, categoryRes, statusRes, locationRes] = await Promise.all([
          api.get("/api/admin/analytics/"),
          api.get("/api/admin/analytics/category/"),
          api.get("/api/admin/analytics/status/"),
          api.get("/api/admin/analytics/location/"),
        ]);

        setData((prev) => ({
          ...prev,
          summary: summaryRes.data || null,
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

  const departmentOptions = useMemo(() => {
    const fromLocations = data.locations.map((item) => item.department || item.category || "");
    const fromCategories = data.category.map((item) => item.category || "");
    return Array.from(new Set([...fromLocations, ...fromCategories].filter(Boolean)));
  }, [data.locations, data.category]);

  const filteredLocations = useMemo(() => {
    if (departmentFilter === "all") {
      return data.locations;
    }
    return data.locations.filter(
      (loc) => (loc.department || loc.category) === departmentFilter
    );
  }, [data.locations, departmentFilter]);

  const mapCenter = useMemo(() => {
    if (filteredLocations.length > 0) {
      return [filteredLocations[0].latitude, filteredLocations[0].longitude];
    }
    return [11.0168, 76.9558];
  }, [filteredLocations]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportError("");

      const params = {};
      if (departmentFilter !== "all") {
        params.department = departmentFilter;
      }
      if (exportStartDate) {
        params.start_date = exportStartDate;
      }
      if (exportEndDate) {
        params.end_date = exportEndDate;
      }

      const response = await api.get("/api/admin/analytics/export/excel/", {
        responseType: "blob",
        params,
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "complaints.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setExportError("Failed to export Excel report");
    } finally {
      setExporting(false);
    }
  };

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

      {data.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total Complaints" value={data.summary.total_complaints} />
          <SummaryCard label="Pending" value={data.summary.pending_complaints} />
          <SummaryCard label="Resolved" value={data.summary.resolved_complaints} />
          <SummaryCard label="Last 7 Days" value={data.summary.complaints_last_7_days} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department Filter</label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(event) => setExportStartDate(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(event) => setExportEndDate(event.target.value)}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col items-start gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
            {exportError && <p className="text-sm text-red-600">{exportError}</p>}
          </div>
        </div>
      </div>

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
        {filteredLocations.length === 0 ? (
          <p className="text-gray-600 text-sm">No location data available.</p>
        ) : (
          <MapContainer center={mapCenter} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MarkerClusterGroup chunkedLoading>
              {filteredLocations.map((loc) => (
                <Marker position={[loc.latitude, loc.longitude]} key={loc.id}>
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">Category: {loc.category}</div>
                      <div>Department: {loc.department || "N/A"}</div>
                      <div>Status: {loc.status}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Heatmap</h3>
        {filteredLocations.length === 0 ? (
          <p className="text-gray-600 text-sm">No location data available.</p>
        ) : (
          <MapContainer center={mapCenter} zoom={12} className="h-96 w-full rounded-lg">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <HeatmapOverlay locations={filteredLocations} />
          </MapContainer>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value ?? 0}</p>
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
