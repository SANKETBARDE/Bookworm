import { useEffect, useState } from "react";
import { AtSign, CalendarDays, Mail, ShieldCheck, UserRoundX } from "lucide-react";
import AdminSubnav from "./AdminSubnav";
import api from "../services/api";

function UserAvatar({ user }) {
  const [hasImageError, setHasImageError] = useState(false);
  const initial = (user.full_name || user.username || user.email || "U").charAt(0).toUpperCase();

  if (user.profile_image_url && !hasImageError) {
    return (
      <img
        className="admin-user-avatar"
        src={user.profile_image_url}
        alt={user.full_name || user.username || "User profile"}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return <div className="admin-user-avatar avatar-fallback">{initial}</div>;
}

function formatDate(value) {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deactivateUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to deactivate user");
    }
  };

  return (
    <div className="page">
      <AdminSubnav />

      <div className="page-header">
        <h1>Manage Users</h1>
        <p className="muted">{users.length} registered users</p>
      </div>

      {isLoading && <p>Loading users...</p>}
      {message && <p className="alert">{message}</p>}

      <div className="list user-list">
        {!isLoading && !message && users.length === 0 && <p>No users found.</p>}

        {users.map((user) => (
          <article className="list-card admin-user-card" key={user.id}>
            <UserAvatar user={user} />

            <div className="admin-user-main">
              <div className="admin-user-title-row">
                <div>
                  <h3>{user.full_name || "Unnamed user"}</h3>
                  <div className="admin-user-handle">
                    <AtSign size={14} />
                    <span>{user.username || "No username"}</span>
                  </div>
                </div>
              </div>

              <div className="admin-user-meta">
                <span>
                  <Mail size={15} />
                  {user.email || "No email"}
                </span>
                <span>
                  <ShieldCheck size={15} />
                  {user.role || "user"}
                </span>
                <span>
                  <CalendarDays size={15} />
                  Joined {formatDate(user.created_at)}
                </span>
              </div>
            </div>

            <div className="admin-user-actions">
              <div className="admin-user-badges">
                <span className={`status ${user.role === "admin" ? "approved" : "pending"}`}>
                  {user.role || "user"}
                </span>
                <span className={`status ${user.is_active ? "approved" : "removed"}`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {user.is_active ? (
                <button className="btn-small danger" onClick={() => deactivateUser(user.id)}>
                  <UserRoundX size={16} />
                  Deactivate
                </button>
              ) : (
                <span className="admin-user-note">Deactivated</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ManageUsers;
