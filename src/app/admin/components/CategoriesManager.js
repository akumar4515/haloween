"use client";

import { useState, useEffect } from "react";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function CategoriesManager() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
      
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
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Error loading categories. Please check if the API server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `${API_BASE}/api/categories/${editingCategory}`
        : `${API_BASE}/api/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name }),
      });

      if (res.ok) {
        await fetchCategories();
        resetForm();
        alert(editingCategory ? "Category updated successfully!" : "Category added successfully!");
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await res.json();
          alert(`Error: ${error.message || error.error || "Failed to save category"}`);
        } else {
          const text = await res.text();
          console.error("Error response:", text);
          alert(`Error: Failed to save category (Status: ${res.status})`);
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error saving category. Please check console for details.");
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`Are you sure you want to delete category "${category}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/categories/${encodeURIComponent(category)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchCategories();
        alert("Category deleted successfully!");
      } else {
        alert("Error deleting category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category");
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: "" });
    setEditingCategory(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading categories...</div>;
  }

  return (
    <div className={styles.managerContainer}>
      <div className={styles.managerHeader}>
        <h2 className={styles.managerTitle}>Categories ({categories.length})</h2>
        <button
          className={styles.addButton}
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          + Add Category
        </button>
      </div>

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3 className={styles.formTitle}>
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label>Category Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Action, Comedy, Drama"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingCategory ? "Update" : "Create"} Category
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
              <th>Category Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="2" className={styles.emptyCell}>
                  No categories found
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr key={index}>
                  <td>{category}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(category)}
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

