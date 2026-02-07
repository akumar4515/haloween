"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function TablesManager() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, page);
    }
  }, [selectedTable, page]);

  const getAuthHeader = () => {
    const authData = localStorage.getItem("adminAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const credentials = btoa("flovex_admin:flovex.admin@00");
      return `Basic ${credentials}`;
    }
    return null;
  };

  const fetchTables = async () => {
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/tables`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setTables(data.data);
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName, pageNum = 1) => {
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(
        `${API_BASE}/api/admin/tables/${tableName}?page=${pageNum}&per_page=50`,
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setTableData(data.data);
      }
    } catch (error) {
      console.error("Error fetching table data:", error);
    }
  };

  const handleDelete = async (row) => {
    if (!confirm("Are you sure you want to delete this row?")) {
      return;
    }

    try {
      // Find primary key
      const primaryKey = tableData.columns.find((col) => col.COLUMN_KEY === "PRI");
      if (!primaryKey) {
        alert("Table has no primary key");
        return;
      }

      const rowId = row[primaryKey.COLUMN_NAME];
      const authHeader = getAuthHeader();
      const res = await fetch(
        `${API_BASE}/api/admin/tables/${selectedTable}/${rowId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        fetchTableData(selectedTable, page);
      } else {
        alert(data.error || "Failed to delete row");
      }
    } catch (error) {
      console.error("Error deleting row:", error);
      alert("Failed to delete row");
    }
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    const rowData = {};
    tableData.columns.forEach((col) => {
      if (col.EXTRA !== "auto_increment") {
        rowData[col.COLUMN_NAME] = row[col.COLUMN_NAME] ?? "";
      }
    });
    setFormData(rowData);
    setShowEditModal(true);
  };

  const handleAdd = () => {
    const newData = {};
    tableData.columns.forEach((col) => {
      if (col.EXTRA !== "auto_increment") {
        newData[col.COLUMN_NAME] = "";
      }
    });
    setFormData(newData);
    setShowAddModal(true);
  };

  const handleSave = async (isEdit = false) => {
    try {
      const authHeader = getAuthHeader();
      let url, method;

      if (isEdit) {
        // Find primary key
        const primaryKey = tableData.columns.find((col) => col.COLUMN_KEY === "PRI");
        if (!primaryKey) {
          alert("Table has no primary key");
          return;
        }
        const rowId = editingRow[primaryKey.COLUMN_NAME];
        url = `${API_BASE}/api/admin/tables/${selectedTable}/${rowId}`;
        method = "PUT";
      } else {
        url = `${API_BASE}/api/admin/tables/${selectedTable}`;
        method = "POST";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(formData),
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setShowEditModal(false);
        setFormData({});
        fetchTableData(selectedTable, page);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading tables...</div>;
  }

  if (!selectedTable) {
    return (
      <div className={styles.tablesList}>
        <h2>Select a Table</h2>
        <div className={styles.tableGrid}>
          {tables.map((table) => (
            <div
              key={table.name}
              className={styles.tableCard}
              onClick={() => setSelectedTable(table.name)}
            >
              <h3>{table.name}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!tableData) {
    return <div className={styles.loading}>Loading table data...</div>;
  }

  // Find primary key
  const primaryKey = tableData.columns.find((col) => col.COLUMN_KEY === "PRI");

  return (
    <div className={styles.tableManager}>
      <div className={styles.tableHeader}>
        <button
          className={styles.backButton}
          onClick={() => {
            setSelectedTable(null);
            setTableData(null);
            setPage(1);
          }}
        >
          ← Back to Tables
        </button>
        <h2>{selectedTable}</h2>
        <button className={styles.addButton} onClick={handleAdd}>
          + Add Row
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {tableData.columns.map((col) => (
                <th key={col.COLUMN_NAME}>{col.COLUMN_NAME}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, idx) => (
              <tr key={row[primaryKey?.COLUMN_NAME] || idx}>
                {tableData.columns.map((col) => (
                  <td key={col.COLUMN_NAME}>
                    {row[col.COLUMN_NAME] !== null &&
                    row[col.COLUMN_NAME] !== undefined
                      ? String(row[col.COLUMN_NAME])
                      : ""}
                  </td>
                ))}
                <td>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(row)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(row)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tableData.pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} of {tableData.pagination.totalPages}
          </span>
          <button
            disabled={page >= tableData.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add New Row</h3>
            <div className={styles.form}>
              {tableData.columns
                .filter((col) => col.EXTRA !== "auto_increment")
                .map((col) => (
                  <div key={col.COLUMN_NAME} className={styles.formGroup}>
                    <label>{col.COLUMN_NAME}</label>
                    <input
                      type="text"
                      value={formData[col.COLUMN_NAME] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [col.COLUMN_NAME]: e.target.value,
                        })
                      }
                      placeholder={col.IS_NULLABLE === "YES" ? "Optional" : "Required"}
                    />
                  </div>
                ))}
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
              <button onClick={() => handleSave(false)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Edit Row</h3>
            <div className={styles.form}>
              {tableData.columns
                .filter((col) => col.EXTRA !== "auto_increment")
                .map((col) => (
                  <div key={col.COLUMN_NAME} className={styles.formGroup}>
                    <label>{col.COLUMN_NAME}</label>
                    <input
                      type="text"
                      value={formData[col.COLUMN_NAME] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [col.COLUMN_NAME]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
              <button onClick={() => handleSave(true)}>Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
