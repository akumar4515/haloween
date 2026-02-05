"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function ActorsManager() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingActor, setEditingActor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    profile_pic: "",
    bio: "",
  });

  useEffect(() => {
    fetchActors();
  }, []);

  const fetchActors = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/actors`, { cache: "no-store" });
      
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setActors(data.data || []);
          return;
        }
      }
      
      // Fallback: try channels if actors endpoint doesn't exist
      const channelsRes = await fetch(`${API_BASE}/api/channels`, { cache: "no-store" });
      if (channelsRes.ok) {
        const contentType = channelsRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const channelsData = await channelsRes.json();
          setActors(channelsData.data || []);
        }
      }
    } catch (error) {
      console.error("Error fetching actors:", error);
      alert("Error loading actors. Please check if the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingActor
        ? `${API_BASE}/api/actors/${editingActor.id}`
        : `${API_BASE}/api/actors`;
      const method = editingActor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchActors();
        resetForm();
        alert(editingActor ? "Actor updated successfully!" : "Actor added successfully!");
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          alert(`Error: ${error.message || error.error || "Failed to save actor"}`);
        } else {
          const text = await res.text();
          console.error("Error response:", text);
          alert(`Error: Failed to save actor (Status: ${res.status})`);
        }
      }
    } catch (error) {
      console.error("Error saving actor:", error);
      alert("Error saving actor. Please check console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this actor?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/actors/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchActors();
        alert("Actor deleted successfully!");
      } else {
        alert("Error deleting actor");
      }
    } catch (error) {
      console.error("Error deleting actor:", error);
      alert("Error deleting actor");
    }
  };

  const handleEdit = (actor) => {
    setEditingActor(actor);
    setFormData({
      name: actor.name || "",
      slug: actor.slug || "",
      profile_pic: actor.profile_pic || "",
      bio: actor.bio || actor.description || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      profile_pic: "",
      bio: "",
    });
    setEditingActor(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading actors...</div>;
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Actors ({actors.length})</h2>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Actor
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>
            {editingActor ? "Edit Actor" : "Add New Actor"}
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
                placeholder="actor-slug"
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
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingActor ? "Update" : "Create"} Actor
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
              <th>Bio</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {actors.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.emptyCell}>
                  No actors found
                </td>
              </tr>
            ) : (
              actors.map((actor) => (
                <tr key={actor.id || actor.slug || actor.name}>
                  <td>{actor.id || "-"}</td>
                  <td>
                    {actor.profile_pic ? (
                      <img
                        src={actor.profile_pic}
                        alt={actor.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <span className={styles.noAvatar}>No image</span>
                    )}
                  </td>
                  <td>{actor.name || "Untitled"}</td>
                  <td>{actor.slug || "-"}</td>
                  <td className={styles.descriptionCell}>
                    {actor.bio || actor.description || "-"}
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(actor)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(actor.id)}
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

