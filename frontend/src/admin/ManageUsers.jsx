import { useEffect, useState } from "react";
import api from "../services/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.log(error);
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
      alert("Failed to deactivate user");
    }
  };

  return (
    <div className="page">
      <h1>Manage Users</h1>

      <div className="list">
        {users.map((user) => (
          <div className="list-card" key={user.id}>
            <h3>{user.full_name}</h3>
            <p>{user.email}</p>
            <p>Role: {user.role}</p>
            <p>Status: {user.is_active ? "Active" : "Inactive"}</p>

            {user.is_active && (
              <button className="btn-small danger" onClick={() => deactivateUser(user.id)}>
                Deactivate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageUsers;