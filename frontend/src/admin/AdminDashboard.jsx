import { useEffect, useState } from "react";
import AdminSubnav from "./AdminSubnav";
import api from "../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="page">
      <AdminSubnav />

      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage the Bookworm platform.</p>
      </div>

      {!stats ? (
        <p>Loading admin dashboard...</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h2>{stats.total_users}</h2>
            <p>Total Users</p>
          </div>

          <div className="stat-card">
            <h2>{stats.total_books}</h2>
            <p>Total Books</p>
          </div>

          <div className="stat-card">
            <h2>{stats.approved_books}</h2>
            <p>Approved Books</p>
          </div>

          <div className="stat-card">
            <h2>{stats.pending_books}</h2>
            <p>Pending Books</p>
          </div>

          <div className="stat-card">
            <h2>{stats.total_reviews}</h2>
            <p>Total Reviews</p>
          </div>

          <div className="stat-card">
            <h2>{stats.pending_requests}</h2>
            <p>Pending Requests</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
