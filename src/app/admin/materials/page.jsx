"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
    "Classical Texts", "Pharmacology", "Anatomy", "Diagnosis",
    "Panchakarma", "Nutrition", "Research", "Clinical", "Other"
];

export default function AdminMaterials() {
    const { authAxios } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        title: "", description: "", category: "Classical Texts",
        subject: "", author: "", language: "English", tags: "",
    });
    const [file, setFile] = useState(null);

    useEffect(() => { fetchMaterials(); }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/materials/admin/all");
            setMaterials(res.data.materials);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return setMsg({ text: "Please select a PDF file", type: "error" });
        if (!form.title) return setMsg({ text: "Title is required", type: "error" });
        setUploading(true);
        setMsg({ text: "", type: "" });
        try {
            const fd = new FormData();
            fd.append("file", file);
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            await authAxios.post("/materials", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsg({ text: "Uploaded successfully!", type: "success" });
            setShowUpload(false);
            setFile(null);
            setForm({
                title: "", description: "", category: "Classical Texts",
                subject: "", author: "", language: "English", tags: ""
            });
            fetchMaterials();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || "Upload failed", type: "error" });
        } finally {
            setUploading(false);
        }
    };

    const handleTogglePublish = async (id) => {
        try {
            await authAxios.put(`/materials/${id}/publish`);
            fetchMaterials();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || "Failed", type: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this material?")) return;
        try {
            await authAxios.delete(`/materials/${id}`);
            fetchMaterials();
        } catch (err) {
            setMsg({ text: err.response?.data?.message || "Failed", type: "error" });
        }
    };
    const formatSize = (bytes) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", marginBottom: 4 }}>Study Materials</h1>
                    <p style={{ fontSize: 13, color: "#4a5568" }}>{materials.length} materials uploaded</p>
                </div>
                <button onClick={() => setShowUpload(!showUpload)}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#1D9E75", color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                    {showUpload ? "Cancel" : "+ Upload PDF"}
                </button>
            </div>

            {msg.text && (
                <div style={{
                    padding: "10px 14px", borderRadius: 8, marginBottom: 16,
                    background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(226,75,74,0.15)",
                    color: msg.type === "success" ? "#1D9E75" : "#E24B4A", fontSize: 13
                }}>
                    {msg.text}
                </div>
            )}

            {/* Upload Form */}
            {showUpload && (
                <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "#ffffff", marginBottom: 16 }}>Upload New Material</p>

                    {/* File Drop Zone */}
                    <div onClick={() => fileRef.current?.click()}
                        style={{ border: `2px dashed ${file ? "#1D9E75" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", marginBottom: 16, background: file ? "rgba(29,158,117,0.05)" : "transparent" }}>
                        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
                            onChange={(e) => setFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <p style={{ fontSize: 14, color: "#1D9E75", fontWeight: 500 }}>📄 {file.name}</p>
                                <p style={{ fontSize: 12, color: "#4a5568" }}>{formatSize(file.size)}</p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: 14, color: "#4a5568" }}>Click to select PDF</p>
                                <p style={{ fontSize: 12, color: "#4a5568" }}>Max 50MB</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        {[["Title *", "title"], ["Author", "author"], ["Subject", "subject"], ["Tags (comma separated)", "tags"]].map(([label, key]) => (
                            <div key={key}>
                                <p style={{ fontSize: 11, color: "#4a5568", marginBottom: 4 }}>{label}</p>
                                <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    style={inputStyle} />
                            </div>
                        ))}
                        <div>
                            <p style={{ fontSize: 11, color: "#4a5568", marginBottom: 4 }}>Category *</p>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: "#4a5568", marginBottom: 4 }}>Language</p>
                            <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={inputStyle}>
                                {["English", "Hindi", "Sanskrit", "Other"].map((l) => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, color: "#4a5568", marginBottom: 4 }}>Description</p>
                        <textarea value={form.description} rows={3}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            style={{ ...inputStyle, resize: "vertical", width: "100%" }} />
                    </div>

                    <button onClick={handleUpload} disabled={uploading}
                        style={{ padding: "9px 24px", borderRadius: 8, background: "#1D9E75", color: "white", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
                        {uploading ? "Uploading..." : "Upload Material"}
                    </button>
                </div>
            )}

            {/* Table */}
            <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                            {["Title", "Category", "Size", "Downloads", "Status", "Actions"].map((h) => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#4a5568" }}>Loading...</td></tr>
                        ) : materials.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#4a5568" }}>No materials yet. Upload your first PDF.</td></tr>
                        ) : materials.map((m) => (
                            <tr key={m._id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "12px 16px" }}>
                                    <p style={{ fontSize: 13, color: "#ffffff", marginBottom: 2 }}>{m.title}</p>
                                    <p style={{ fontSize: 11, color: "#4a5568" }}>{m.author || "Unknown author"}</p>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(24,95,165,0.2)", color: "#5BA3E8" }}>{m.category}</span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 12, color: "#4a5568" }}>{formatSize(m.fileSize)}</td>
                                <td style={{ padding: "12px 16px", fontSize: 13, color: "#ffffff" }}>{m.downloads}</td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span style={{
                                        fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 500,
                                        background: m.isPublished ? "rgba(29,158,117,0.2)" : "rgba(133,79,11,0.2)",
                                        color: m.isPublished ? "#1D9E75" : "#EF9F27"
                                    }}>
                                        {m.isPublished ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => handleTogglePublish(m._id)}
                                            style={{ ...actionBtn, color: m.isPublished ? "#EF9F27" : "#1D9E75", borderColor: m.isPublished ? "rgba(239,159,39,0.3)" : "rgba(29,158,117,0.3)" }}>
                                            {m.isPublished ? "Unpublish" : "Publish"}
                                        </button>
                                        <button onClick={() => handleDelete(m._id)}
                                            style={{ ...actionBtn, color: "#E24B4A", borderColor: "rgba(226,75,74,0.3)" }}>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 6,
    border: "0.5px solid rgba(255,255,255,0.1)", background: "#0f1117",
    color: "#ffffff", fontSize: 13, outline: "none", fontFamily: "var(--font-sans)"
};
const actionBtn = {
    padding: "5px 10px", borderRadius: 6,
    border: "0.5px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#6b7280",
    fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)"
};