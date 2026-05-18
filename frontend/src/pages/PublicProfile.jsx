import { useCallback, useEffect, useState } from "react";
import { Camera, Save, X } from "lucide-react";
import { useParams } from "react-router-dom";
import api, { getProfile, updateStoredProfile } from "../services/api";
import BookCard from "../components/BookCard";

const emptyForm = {
  full_name: "",
  username: "",
  bio: "",
};

function PublicProfile() {
  const { id } = useParams();
  const currentProfile = getProfile();
  const isOwnProfile = currentProfile?.id === id;

  const [data, setData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const syncForm = (profile) => {
    setForm({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
    });
    setImageFile(null);
    setImagePreview("");
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get(`/users/${id}/profile`);
      setData(response.data.data);
      syncForm(response.data.data?.profile);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to load profile");
    }
  }, [id]);

  useEffect(() => {
    window.queueMicrotask(() => {
      fetchProfile();
    });
  }, [fetchProfile]);

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const cancelEdit = () => {
    syncForm(data?.profile);
    setEditing(false);
    setMessage("");
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("full_name", form.full_name);
    formData.append("username", form.username);
    formData.append("bio", form.bio);

    if (imageFile) {
      formData.append("profile_image", imageFile);
    }

    try {
      const response = await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const updatedProfile = response.data.data;

      setData((prev) => ({
        ...prev,
        profile: updatedProfile,
      }));
      updateStoredProfile(updatedProfile);
      syncForm(updatedProfile);
      setEditing(false);
      setMessage("Profile updated successfully");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <div className="page">
        {message ? <p className="alert">{message}</p> : "Loading profile..."}
      </div>
    );
  }

  const profile = data.profile;
  const profileImage = imagePreview || profile?.profile_image_url;
  const initial = profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || "U";

  return (
    <div className="page">
      {message && <p className="alert">{message}</p>}

      <div className="profile-header">
        <div className="profile-photo-wrap">
          {profileImage ? (
            <img src={profileImage} alt={profile?.full_name || "Profile"} />
          ) : (
            <div className="profile-avatar-placeholder">{initial}</div>
          )}

          {editing && (
            <label className="profile-photo-control">
              <Camera size={16} />
              <span>Photo</span>
              <input accept="image/*" onChange={handleImageChange} type="file" />
            </label>
          )}
        </div>

        <div className="profile-details">
          {editing ? (
            <form className="profile-edit-form" onSubmit={saveProfile}>
              <input
                name="full_name"
                onChange={handleChange}
                placeholder="Full name"
                required
                type="text"
                value={form.full_name}
              />

              <input
                name="username"
                onChange={handleChange}
                placeholder="Username"
                type="text"
                value={form.username}
              />

              <textarea
                name="bio"
                onChange={handleChange}
                placeholder="Bio"
                value={form.bio}
              />

              <div className="profile-actions">
                <button className="btn primary" disabled={saving} type="submit">
                  <Save size={16} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button className="btn" onClick={cancelEdit} type="button">
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1>{profile?.full_name}</h1>
              <p className="muted">@{profile?.username || "username"}</p>
              <p>{profile?.bio || "No bio yet."}</p>

              <div className="profile-stats-inline">
                <span>Uploaded Books: {data.stats?.total_uploaded_books}</span>
                <span>Total Reviews: {data.stats?.total_reviews}</span>
              </div>

              {isOwnProfile && (
                <button className="btn primary" onClick={() => setEditing(true)} type="button">
                  Edit Profile
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <section className="section">
        <h2>Uploaded Books</h2>

        <div className="book-grid">
          {data.uploads?.length > 0 ? (
            data.uploads.map((book) => <BookCard book={book} key={book.id} />)
          ) : (
            <p>No approved uploads yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default PublicProfile;
