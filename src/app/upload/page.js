"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
const SUBJECTS = ["Anatomy", "Herbology", "Pharmacology", "Clinical", "Research", "Other"];

function UploadForm() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { authAxios } = useAuth();
  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#f2f4f7",
    color: "#191c1e",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.15s",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return alert("Title and file are required");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("description", description);
    formData.append("file", file);

    try {
      const res = await authAxios.post("/materials/upload", formData);
      console.log(res.data);
      setSuccess(true);
      setTitle(""); setSubject(""); setDescription(""); setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="p-8 max-w-[800px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold" style={{ color: "#00256e" }}>
            Upload Resource
          </h1>
          <p className="text-sm mt-1" style={{ color: "#444651" }}>
            Add clinical notes, research papers, or study materials
          </p>
        </div>

        {success && (
          <div
            className="flex items-center gap-3 p-4 rounded-2xl mb-6"
            style={{ background: "#82fba3", color: "#00210c" }}
          >
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-bold">Uploaded successfully!</span>
            <button
              className="ml-auto font-bold text-sm underline"
              onClick={() => setSuccess(false)}
            >
              Upload another
            </button>
          </div>
        )}

        <div
          className="p-8 rounded-2xl"
          style={{
            background: "#ffffff",
            boxShadow: "0 1px 8px rgba(0,37,110,0.06)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#444651" }}
              >
                Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Dravya Guna — Herb Classification Notes"
                style={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => {
                  e.target.style.background = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "#f2f4f7";
                  e.target.style.boxShadow = "none";
                }}
                required
              />
            </div>

            {/* Subject */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#444651" }}
              >
                Subject
              </label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={(e) => {
                  e.target.style.background = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "#f2f4f7";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Select a subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#444651" }}
              >
                Description
              </label>
              <textarea
                placeholder="Brief description of the resource..."
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => {
                  e.target.style.background = "#ffffff";
                  e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.15)";
                }}
                onBlur={(e) => {
                  e.target.style.background = "#f2f4f7";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* File */}
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "#444651" }}
              >
                File *
              </label>
              <label
                className="flex flex-col items-center justify-center w-full h-36 rounded-2xl cursor-pointer transition-all"
                style={{
                  background: file ? "rgba(0,37,110,0.04)" : "#f2f4f7",
                  border: `2px dashed ${file ? "#00256e" : "#c5c6d3"}`,
                }}
              >
                <span
                  className="material-symbols-outlined mb-2"
                  style={{
                    fontSize: "32px",
                    color: file ? "#00256e" : "#c5c6d3",
                  }}
                >
                  {file ? "check_circle" : "cloud_upload"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: file ? "#00256e" : "#757682" }}
                >
                  {file ? file.name : "Click to select PDF or document"}
                </span>
                <span className="text-xs mt-1" style={{ color: "#757682" }}>
                  PDF, DOC, DOCX — max 50MB
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? "#c5c6d3"
                  : "linear-gradient(135deg, #00256e, #1f3c88)",
                boxShadow: loading ? "none" : "0 4px 12px rgba(0,37,110,0.20)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: "16px" }}>
                    progress_activity
                  </span>
                  Uploading...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    upload
                  </span>
                  Upload Resource
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
export default function UploadPage() {
  return <ProtectedRoute><UploadForm /></ProtectedRoute>;
}