import { useEffect, useState } from "react";
import AdminSubnav from "./AdminSubnav";
import api from "../services/api";

function ManageRequests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/admin/book-requests");
      setRequests(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/book-requests/${id}/status`, { status });
      fetchRequests();
    } catch (error) {
      alert("Failed to update request");
    }
  };

  return (
    <div className="page">
      <AdminSubnav />

      <div className="page-header">
        <h1>Manage Book Requests</h1>
      </div>

      <div className="list">
        {requests.map((req) => (
          <div className="list-card" key={req.id}>
            <h3>{req.title}</h3>
            <p>Author: {req.author}</p>
            <p>Requested by: {req.profiles?.full_name}</p>
            <p>Status: <span className={`status ${req.status}`}>{req.status}</span></p>

            <div className="card-actions">
              <button className="btn-small" onClick={() => updateStatus(req.id, "accepted")}>
                Accept
              </button>

              <button className="btn-small primary" onClick={() => updateStatus(req.id, "fulfilled")}>
                Fulfilled
              </button>

              <button className="btn-small danger" onClick={() => updateStatus(req.id, "rejected")}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageRequests;
