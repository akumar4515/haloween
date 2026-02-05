"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function VideosManager() {
  const [videos, setVideos] = useState([]);
  const [actors, setActors] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    video_url: "",
    thumbnail_url: "",
    duration: "",
    category: "",
    tags: "",
    channel_id: "",
    views: 0,
    likes: 0,
    is_premium: false,
    description: "",
    actors: [],
  });

  useEffect(() => {
    fetchVideos();
    fetchActors();
    fetchChannels();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/videos?limit=1000`, { cache: "no-store" });
      
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
      setVideos(data.data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      alert("Error loading videos. Please check if the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  const fetchActors = async () => {
    try {
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
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/channels`, { cache: "no-store" });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setChannels(data.data || []);
        } else {
          console.error("Channels endpoint returned non-JSON response");
        }
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.actors || formData.actors.length === 0) {
      alert("Please select at least one actor for this video.");
      return;
    }

    try {
      const videoData = {
        title: formData.title,
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.description || null,
        video_url: formData.video_url,
        thumbnail_url: formData.thumbnail_url || null,
        duration: formData.duration ? parseInt(formData.duration) : null,
        category: formData.category || null,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean).join(',') : null,
        channel_id: formData.channel_id ? parseInt(formData.channel_id) : null,
        views: formData.views ? parseInt(formData.views) : 0,
        likes: formData.likes ? parseInt(formData.likes) : 0,
        is_premium: formData.is_premium === "true" || formData.is_premium === true,
        // Actors will be handled separately via video_actors pivot table
        actor_ids: formData.actors.map(id => parseInt(id)),
      };

      const url = editingVideo
        ? `${API_BASE}/api/videos/${editingVideo.id}`
        : `${API_BASE}/api/videos`;
      const method = editingVideo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(videoData),
      });

      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await res.json();
          const videoId = editingVideo ? editingVideo.id : (result.data?.id || result.id);
          
          // Update actors via video_actors pivot table
          if (videoId && formData.actors.length > 0) {
            await updateVideoActors(videoId, formData.actors);
          }
          
          await fetchVideos();
          resetForm();
          alert(editingVideo ? "Video updated successfully!" : "Video added successfully!");
        } else {
          const text = await res.text();
          console.error("Non-JSON response:", text);
          alert("Server returned invalid response format");
        }
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          alert(`Error: ${error.message || error.error || "Failed to save video"}`);
        } else {
          const text = await res.text();
          console.error("Error response:", text);
          alert(`Error: Failed to save video (Status: ${res.status})`);
        }
      }
    } catch (error) {
      console.error("Error saving video:", error);
      alert("Error saving video. Please check console for details.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/videos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchVideos();
        alert("Video deleted successfully!");
      } else {
        alert("Error deleting video");
      }
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Error deleting video");
    }
  };

  const updateVideoActors = async (videoId, actorIds) => {
    try {
      // First, delete existing actor relationships
      await fetch(`${API_BASE}/api/videos/${videoId}/actors`, {
        method: "DELETE",
      });

      // Then, add new actor relationships
      if (actorIds.length > 0) {
        await fetch(`${API_BASE}/api/videos/${videoId}/actors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actor_ids: actorIds.map(id => parseInt(id)) }),
        });
      }
    } catch (error) {
      console.error("Error updating video actors:", error);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    const videoActors = video.actors || [];
    const actorIds = videoActors.map(actor => String(actor.id || actor.slug || actor.name)).filter(Boolean);
    
    setFormData({
      title: video.title || "",
      slug: video.slug || "",
      video_url: video.video_url || "",
      thumbnail_url: video.thumbnail_url || "",
      duration: video.duration || "",
      category: video.category || "",
      tags: video.tags ? (typeof video.tags === 'string' ? video.tags : video.tags.join(", ")) : "",
      channel_id: video.channel_id ? String(video.channel_id) : (video.channel?.id ? String(video.channel.id) : ""),
      views: video.views || 0,
      likes: video.likes || 0,
      is_premium: video.is_premium || false,
      description: video.description || "",
      actors: actorIds,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      video_url: "",
      thumbnail_url: "",
      duration: "",
      category: "",
      tags: "",
      channel_id: "",
      views: 0,
      likes: 0,
      is_premium: false,
      description: "",
      actors: [],
    });
    setEditingVideo(null);
    setShowForm(false);
  };

  const handleActorToggle = (actorId) => {
    setFormData(prev => {
      const currentActors = prev.actors || [];
      const actorIdStr = String(actorId);
      const isSelected = currentActors.includes(actorIdStr);
      return {
        ...prev,
        actors: isSelected
          ? currentActors.filter(id => id !== actorIdStr)
          : [...currentActors, actorIdStr],
      };
    });
  };

  if (loading) {
    return <div className={styles.loading}>Loading videos...</div>;
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Videos ({videos.length})</h2>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Video
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>
            {editingVideo ? "Edit Video" : "Add New Video"}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Video URL *</label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Thumbnail URL</label>
              <input
                type="url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Channel *</label>
              <select
                value={formData.channel_id}
                onChange={(e) => setFormData({ ...formData, channel_id: e.target.value })}
                required
              >
                <option value="">Select a channel</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated from title if empty"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Views</label>
              <input
                type="number"
                value={formData.views}
                onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Likes</label>
              <input
                type="number"
                value={formData.likes}
                onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
                min="0"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Premium</label>
              <select
                value={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.value === "true" })}
              >
                <option value={false}>Free</option>
                <option value={true}>Premium</option>
              </select>
            </div>

            <div className={styles.formGroupFull}>
              <label>Actors *</label>
              <div className={styles.actorSelector}>
                {actors.length === 0 ? (
                  <p className={styles.noActors}>No actors available. Please add actors first.</p>
                ) : (
                  <div className={styles.actorCheckboxes}>
                    {actors.map((actor) => {
                      const actorId = actor.id;
                      const actorIdStr = String(actorId);
                      const isSelected = formData.actors.includes(actorIdStr);
                      return (
                        <label key={actorId} className={styles.actorCheckbox}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleActorToggle(actorId)}
                          />
                          <span>{actor.name || actor.slug || `Actor #${actorId}`}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
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
              {editingVideo ? "Update" : "Create"} Video
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
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Category</th>
              <th>Channel</th>
              <th>Actors</th>
              <th>Premium</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan="8" className={styles.emptyCell}>
                  No videos found
                </td>
              </tr>
            ) : (
              videos.map((video) => (
                <tr key={video.id}>
                  <td>{video.id}</td>
                  <td>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className={styles.thumbnail}
                      />
                    ) : (
                      <span className={styles.noThumbnail}>No image</span>
                    )}
                  </td>
                  <td className={styles.titleCell}>{video.title || "Untitled"}</td>
                  <td>{video.category || "-"}</td>
                  <td>{video.channel?.name || video.channel_name || "-"}</td>
                  <td className={styles.actorsCell}>
                    {video.actors && Array.isArray(video.actors) && video.actors.length > 0 ? (
                      <div className={styles.actorsList}>
                        {video.actors.slice(0, 2).map((actor, idx) => (
                          <span key={idx} className={styles.actorTag}>
                            {actor.name || actor.slug || actor.id || "Actor"}
                          </span>
                        ))}
                        {video.actors.length > 2 && (
                          <span className={styles.moreActors}>+{video.actors.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className={styles.noActors}>No actors</span>
                    )}
                  </td>
                  <td>{video.is_premium ? "Yes" : "No"}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(video)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(video.id)}
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

