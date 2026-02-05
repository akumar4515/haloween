"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ChannelsManager() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    profile_pic: "",
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/channels`, { cache: "no-store" });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response");
      }

      const data = await res.json();
      setChannels(data.data || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
      alert("Error loading channels. Please check if the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingChannel
        ? `${API_BASE}/api/channels/${editingChannel.id}`
        : `${API_BASE}/api/channels`;
      const method = editingChannel ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchChannels();
        resetForm();
        alert(editingChannel ? "Channel updated successfully!" : "Channel added successfully!");
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          alert(`Error: ${error.message || error.error || "Failed to save channel"}`);
        } else {
          const text = await res.text();
          console.error("Error response:", text);
          alert(`Error: Failed to save channel (Status: ${res.status})`);
        }
      }
    } catch (error) {
      console.error("Error saving channel:", error);
      alert("Error saving channel. Please check console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/channels/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchChannels();
        alert("Channel deleted successfully!");
      } else {
        alert("Error deleting channel");
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      alert("Error deleting channel");
    }
  };

  const handleEdit = (channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name || "",
      slug: channel.slug || "",
      description: channel.description || "",
      profile_pic: channel.profile_pic || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      profile_pic: "",
    });
    setEditingChannel(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading channels...</div>;
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Channels ({channels.length})</h2>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Channel
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>
            {editingChannel ? "Edit Channel" : "Add New Channel"}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                placeholder="channel-slug"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Profile Picture URL</label>
              <input
                type="url"
                value={formData.profile_pic}
                onChange={(e) => setFormData({ ...formData, profile_pic: e.target.value })}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingChannel ? "Update" : "Create"} Channel
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Profile</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyCell}>
                  No channels found
                </td>
              </tr>
            ) : (
              channels.map((channel) => (
                <tr key={channel.id}>
                  <td>{channel.id}</td>
                  <td>
                    {channel.profile_pic ? (
                      <img
                        src={channel.profile_pic}
                        alt={channel.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <span className={styles.noAvatar}>No image</span>
                    )}
                  </td>
                  <td>{channel.name || "Untitled"}</td>
                  <td>{channel.slug || "-"}</td>
                  <td className={styles.descriptionCell}>
                    {channel.description || "-"}
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(channel)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(channel.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

