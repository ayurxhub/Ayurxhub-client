"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = ["Classical Texts", "Pharmacology", "Anatomy", "Diagnosis", "Panchakarma", "Nutrition", "Research", "Clinical", "Other"];

export default function AdminMaterials() {
    const { authAxios } = useAuth();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const fileRef = useRef(null);
    const [form, setForm] = useState({ title: "", description: "", category: "Classical Texts", subject: "", author: "", language: "English", tags: "" });
    const [file, setFile] = useState(null);

    useEffect(() => { fetchMaterials(); }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/materials/admin/all");
            setMaterials(res.data.materials);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleUpload = async () => {
        if (!file) return setMsg({ text: "Please select a PDF file", type: "error" });
        if (!form.title) return setMsg({ text: "Title is required", type: "error" });
        setUploading(true); setMsg({ text: "", type: "" });
        try {
            const fd = new FormData();
            fd.append("file", file);
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            await authAxios.post("/materials", fd);
            setMsg({ text: "Uploaded successfully!", type: "success" });
            setShowUpload(false); setFile(null);
            setForm({ title: "", description: "", category: "Classical Texts", subject: "", author: "", language: "English", tags: "" });
            fetchMaterials();
        } catch (err) { setMsg({ text: err.response?.data?.message || "Upload failed", type: "error" }); }
        finally { setUploading(false); }
    };

    const handleTogglePublish = async (id) => {
        try { await authAxios.put(`/materials/${id}/publish`); fetchMaterials(); }
        catch (err) { setMsg({ text: err.response?.data?.message || "Failed", type: "error" }); }
    };

    const handleToggleFeatured = async (id) => {
        try { await authAxios.put(`/materials/${id}/feature`); fetchMaterials(); }
        catch (err) { setMsg({ text: err.response?.data?.message || "Failed", type: "error" }); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this material?")) return;
        try { await authAxios.delete(`/materials/${id}`); fetchMaterials(); }
        catch (err) { setMsg({ text: err.response?.data?.message || "Failed", type: "error" }); }
    };

    const formatSize = (bytes) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Study Materials</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{materials.length} materials uploaded</p>
                </div>
                <button onClick={() => setShowUpload(!showUpload)}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showUpload ? "Cancel" : "+ Upload PDF"}
                </button>
            </div>

            {msg.text && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: msg.type === "success" ? "#d1fae5" : "#fee2e2", color: msg.type === "success" ? "#065f46" : "#991b1b", fontSize: 13 }}>
                    {msg.text}
                </div>
            )}

            {/* Upload form */}
            {showUpload && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "clamp(16px,4vw,24px)", marginBottom: 24 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 16 }}>Upload New Material</p>
                    <div onClick={() => fileRef.current?.click()}
                        style={{ border: `2px dashed ${file ? "#1D9E75" : "#e5e7eb"}`, borderRadius: 8, padding: 24, textAlign: "center", cursor: "pointer", marginBottom: 16, background: file ? "#f0fdf4" : "#f9fafb" }}>
                        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <p style={{ fontSize: 14, color: "#1D9E75", fontWeight: 600, margin: 0 }}>📄 {file.name}</p>
                                <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{formatSize(file.size)}</p>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Click to select PDF</p>
                                <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0 0" }}>Max 50MB</p>
                            </div>
                        )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                        {[["Title *", "title"], ["Author", "author"], ["Subject", "subject"], ["Tags", "tags"]].map(([label, key]) => (
                            <div key={key}>
                                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
                                <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inp} />
                            </div>
                        ))}
                        <div>
                            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Category *</p>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Language</p>
                            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} style={inp}>
                                {["English", "Hindi", "Sanskrit", "Other"].map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</p>
                        <textarea value={form.description} rows={3} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inp, resize: "vertical", width: "100%" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <button type="button" onClick={() => setForm(f => ({ ...f, isFree: "true" }))}
                            style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${form.isFree !== "false" ? "#1D9E75" : "#e5e7eb"}`, background: form.isFree !== "false" ? "#dcfce7" : "#fff", color: form.isFree !== "false" ? "#166534" : "#6b7280", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                            🆓 Free
                        </button>
                        <button type="button" onClick={() => setForm(f => ({ ...f, isFree: "false" }))}
                            style={{ flex: 1, padding: "9px", borderRadius: 8, border: `2px solid ${form.isFree === "false" ? "#00256e" : "#e5e7eb"}`, background: form.isFree === "false" ? "#dbeafe" : "#fff", color: form.isFree === "false" ? "#00256e" : "#6b7280", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                            ⭐ Pro Only
                        </button>
                    </div>
                    <button onClick={handleUpload} disabled={uploading}
                        style={{ padding: "9px 24px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: uploading ? 0.7 : 1 }}>
                        {uploading ? "Uploading..." : "Upload Material"}
                    </button>
                </div>
            )}

            {/* Desktop table */}
            <div className="mat-table-wrap">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                            {["Title", "Category", "Size", "Downloads", "Status", "Actions"].map(h => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading...</td></tr>
                        ) : materials.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>No materials yet.</td></tr>
                        ) : materials.map(m => (
                            <tr key={m._id} style={{ borderBottom: "1px solid #f9fafb" }}>
                                <td style={{ padding: "12px 14px" }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{m.title}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{m.author || "Unknown author"}</p>
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "#dbeafe", color: "#1d4ed8", fontWeight: 600 }}>{m.category}</span>
                                </td>
                                <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>{formatSize(m.fileSize)}</td>
                                <td style={{ padding: "12px 14px", fontSize: 13, color: "#111827" }}>{m.downloads}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 600, background: m.isPublished ? "#d1fae5" : "#fef3c7", color: m.isPublished ? "#065f46" : "#92400e" }}>
                                        {m.isPublished ? "Published" : "Draft"}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        <button onClick={() => handleTogglePublish(m._id)} style={{ ...btn, color: m.isPublished ? "#d97706" : "#059669" }}>
                                            {m.isPublished ? "Unpublish" : "Publish"}
                                        </button>
                                        <button onClick={() => handleToggleFeatured(m._id)} style={{ ...btn, color: m.isFeatured ? "#d97706" : "#6b7280", background: m.isFeatured ? "#fef9c3" : "#fff" }}>
                                            {m.isFeatured ? "⭐" : "☆"} Feature
                                        </button>
                                        <button onClick={() => handleDelete(m._id)} style={{ ...btn, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile cards */}
            <div className="mat-cards">
                {loading ? <p style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>Loading...</p>
                    : materials.length === 0 ? <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>No materials yet.</p>
                        : materials.map(m => (
                            <div key={m._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{m.title}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{m.author || "Unknown"} · {m.category} · {formatSize(m.fileSize)} · {m.downloads} downloads</p>
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: m.isPublished ? "#d1fae5" : "#fef3c7", color: m.isPublished ? "#065f46" : "#92400e" }}>
                                        {m.isPublished ? "Published" : "Draft"}
                                    </span>
                                    {m.isFeatured && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "#fef9c3", color: "#92400e", fontWeight: 600 }}>⭐ Featured</span>}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => handleTogglePublish(m._id)} style={{ ...btn, flex: 1, color: m.isPublished ? "#d97706" : "#059669" }}>
                                        {m.isPublished ? "Unpublish" : "Publish"}
                                    </button>
                                    <button onClick={() => handleToggleFeatured(m._id)} style={{ ...btn, flex: 1 }}>
                                        {m.isFeatured ? "⭐" : "☆"}
                                    </button>
                                    <button onClick={() => handleDelete(m._id)} style={{ ...btn, flex: 1, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                </div>
                            </div>
                        ))}
            </div>

            <style>{`
                .mat-table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
                .mat-cards { display: none; }
                @media (max-width: 640px) { .mat-table-wrap { display: none; } .mat-cards { display: block; } }
            `}</style>
        </div>
    );
}

const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btn = { padding: "6px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 };