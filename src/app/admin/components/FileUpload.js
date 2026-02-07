"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteStartDate, setDeleteStartDate] = useState("");
  const [deleteEndDate, setDeleteEndDate] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const getAuthHeader = () => {
    const authData = localStorage.getItem("adminAuth");
    if (authData) {
      const credentials = btoa("flovex_admin:flovex.admin@00");
      return `Basic ${credentials}`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const extension = selectedFile.name.split(".").pop().toLowerCase();
      if (extension !== "xlsx" && extension !== "xls" && extension !== "csv") {
        setError("Please select a valid XLSX or CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const authHeader = getAuthHeader();

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();

      if (data.success) {
        const skipped = typeof data.skipped === "number" ? data.skipped : 0;
        const errorCount = data.errors ? data.errors.length : 0;
        const parts = [`Successfully imported ${data.inserted} rows`];
        if (skipped > 0) {
          parts.push(`${skipped} duplicate data`);
        }
        if (errorCount > 0) {
          parts.push(`${errorCount} errors occurred`);
        }
        setSuccess(parts.join(". ") + ".");
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById("fileInput");
        if (fileInput) fileInput.value = "";
      } else {
        if (data.missingColumns) {
          setError(
            `Not all required columns present. Missing: ${data.missingColumns.join(
              ", "
            )}. Required columns: ${data.requiredColumns.join(", ")}`
          );
        } else {
          setError(data.error || "Upload failed");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };


  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL affiliate data? This cannot be undone.")) {
      return;
    }
    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/delete-all`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        setSuccess(data.message || "All data deleted.");
      } else {
        setError(data.error || "Delete all failed");
      }
    } catch (err) {
      console.error("Delete all error:", err);
      setError("Failed to delete all data. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteByDate = async () => {
    if (!deleteStartDate) {
      setError("Start date is required.");
      return;
    }

    if (
      !window.confirm(
        `Delete data from ${deleteStartDate}${deleteEndDate ? ` to ${deleteEndDate}` : ""}?`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`${API_BASE}/api/admin/delete-by-date`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: deleteStartDate,
          endDate: deleteEndDate || undefined,
        }),
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuth");
        router.push("/admin");
        return;
      }

      const data = await res.json();
      if (data.success) {
        const deleted = typeof data.deleted === "number" ? data.deleted : 0;
        setSuccess(
          `${data.message || "Data deleted."}${deleted ? ` Deleted ${deleted} rows.` : ""}`
        );
      } else {
        setError(data.error || "Delete by date failed");
      }
    } catch (err) {
      console.error("Delete by date error:", err);
      setError("Failed to delete data by date. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={styles.fileUpload}>
      <h2>Upload File Data</h2>
      <div className={styles.uploadForm}>
        <div className={styles.formGroup}>
          <label>Select File (XLSX or CSV) *</label>
          <input
            id="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <p className={styles.fileName}>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {uploading && (
          <div className={styles.uploadProgress}>
            <div className={styles.spinner}></div>
            <p>Uploading... {uploadProgress}%</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>


      <div className={styles.deleteSection}>
        <h3 className={styles.deleteTitle}>Delete Data</h3>
        <div className={styles.formGroup}>
          <label>Start Date (YYYY-MM-DD)</label>
          <input
            type="date"
            value={deleteStartDate}
            onChange={(e) => setDeleteStartDate(e.target.value)}
            disabled={deleting}
          />
        </div>
        <div className={styles.formGroup}>
          <label>End Date (optional)</label>
          <input
            type="date"
            value={deleteEndDate}
            onChange={(e) => setDeleteEndDate(e.target.value)}
            disabled={deleting}
          />
        </div>
        <div className={styles.deleteActions}>
          <button
            className={styles.deleteButton}
            onClick={handleDeleteByDate}
            disabled={deleting || !deleteStartDate}
          >
            {deleting ? "Deleting..." : "Delete by Date"}
          </button>
          <button
            className={styles.deleteButton}
            onClick={handleDeleteAll}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete All"}
          </button>
        </div>
      </div>
    </div>
  );
}
