"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const EMPTY = {
    title: "", description: "", subject: "", topic: "",
    tags: "", videoType: "youtube", videoUrl: "", thumbnail: "",
    duration: "", isFree: "true", order: "0",
};

function formatDuration(secs) {
    if (!secs) return "—";
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AdminLectures() {
    const { authAxios } = useAuth();
    const [lectures, setLectures] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [videoFile, setVideoFile] = useState(null);
    const [filterSubject, setFilterSubject] = useState("");
    const fileRef = useRef(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lec, sub] = await Promise.all([
                authAxios.get("/lectures/admin/all"),
                authAxios.get("/subjects"),
            ]);
            setLectures(lec.data.lectures);
            setSubjects(sub.data.subjects || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title || !form.subject) return setMsg({ text: "Title and subject are required", type: "error" });
        if (!videoFile && !form.videoUrl) return setMsg({ text: "Provide a video file or URL", type: "error" });
        setSaving(true); setMsg({ text: "", type: "" });
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (videoFile) fd.append("video", videoFile);

            if (editing) {
                await authAxios.put(`/lectures/${editing}`, fd);
                setMsg({ text: "Updated!", type: "success" });
            } else {
                await authAxios.post("/lectures", fd);
                setMsg({ text: "Lecture created! Publish it to make it visible.", type: "success" });
            }
            setForm(EMPTY); setEditing(null); setShowForm(false); setVideoFile(null);
            fetchAll();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed", type: "error" });
        } finally { setSaving(false); }
    };

    const handleEdit = (l) => {
        setForm({
            title: l.title, description: l.description, subject: l.subject,
            topic: l.topic, tags: l.tags?.join(", ") || "",
            videoType: l.videoType, videoUrl: l.videoUrl, thumbnail: l.thumbnail,
            duration: String(l.duration), isFree: String(l.isFree), order: String(l.order),
        });
        setEditing(l._id); setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggle = async (l) => {
        await authAxios.put(`/lectures/${l._id}/publish`);
        fetchAll();
    };

    const handleToggleFeatured = async (l) => {
        await authAxios.put(`/lectures/${l._id}/feature`);
        fetchAll();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this lecture? This cannot be undone.")) return;
        await authAxios.delete(`/lectures/${id}`);
        fetchAll();
    };

    const f = form;
    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const filtered = filterSubject ? lectures.filter(l => l.subject === filterSubject) : lectures;
    const subjectList = [...new Set(lectures.map(l => l.subject))];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Lecture Videos</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{lectures.length} lectures · shown subject-wise in Curriculum</p>
                </div>
                <button onClick={() => { setForm(EMPTY); setEditing(null); setVideoFile(null); setShowForm(!showForm); }}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showForm ? "Cancel" : "+ Add Lecture"}
                </button>
            </div>

            {msg.text && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: msg.type === "success" ? "#d1fae5" : "#fee2e2", color: msg.type === "success" ? "#065f46" : "#991b1b", fontSize: 13 }}>
                    {msg.text}
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "clamp(16px,4vw,24px)", marginBottom: 24 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                        {editing ? "Edit Lecture" : "Add New Lecture"}
                    </p>

                    {/* Video source toggle */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {[["youtube", "🎬 YouTube / URL"], ["cloudinary", "☁️ Upload Video"]].map(([val, label]) => (
                            <button key={val} onClick={() => set("videoType", val)}
                                style={{
                                    padding: "7px 14px", borderRadius: 8, cursor: "pointer",
                                    border: `2px solid ${f.videoType === val ? "#00256e" : "#e5e7eb"}`,
                                    background: f.videoType === val ? "#eff6ff" : "#fff",
                                    color: f.videoType === val ? "#00256e" : "#6b7280",
                                    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                                }}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Video URL or file upload */}
                    {f.videoType === "youtube" ? (
                        <div style={{ marginBottom: 12 }}>
                            <p style={lbl}>YouTube Embed URL or Direct Video URL *</p>
                            <input value={f.videoUrl} onChange={e => set("videoUrl", e.target.value)}
                                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                                style={inp} />
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>
                                For YouTube: Share → Embed → copy the src URL (e.g. youtube.com/embed/abc123)
                            </p>
                        </div>
                    ) : (
                        <div onClick={() => fileRef.current?.click()}
                            style={{ border: `2px dashed ${videoFile ? "#1D9E75" : "#e5e7eb"}`, borderRadius: 8, padding: 20, textAlign: "center", cursor: "pointer", marginBottom: 12, background: videoFile ? "#f0fdf4" : "#f9fafb" }}>
                            <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => setVideoFile(e.target.files[0])} />
                            {videoFile ? (
                                <p style={{ fontSize: 13, color: "#1D9E75", fontWeight: 600, margin: 0 }}>📹 {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)</p>
                            ) : (
                                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Click to select video file (max 500MB)</p>
                            )}
                        </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <p style={lbl}>Title *</p>
                            <input value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Introduction to Dravyaguna" style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Subject *</p>
                            <input value={f.subject} onChange={e => set("subject", e.target.value)}
                                placeholder="e.g. Dravyaguna Vigyan" list="subject-list" style={inp} />
                            <datalist id="subject-list">
                                {subjects.map(s => <option key={s._id} value={s.name} />)}
                            </datalist>
                        </div>
                        <div>
                            <p style={lbl}>Topic / Chapter</p>
                            <input value={f.topic} onChange={e => set("topic", e.target.value)} placeholder="e.g. Chapter 1 - Paribhasha" style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Duration (seconds)</p>
                            <input type="number" value={f.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 1800 = 30 min" style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Sort Order</p>
                            <input type="number" value={f.order} onChange={e => set("order", e.target.value)} style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Access</p>
                            <select value={f.isFree} onChange={e => set("isFree", e.target.value)} style={inp}>
                                <option value="true">Free</option>
                                <option value="false">Pro only</option>
                            </select>
                        </div>
                        <div>
                            <p style={lbl}>Tags (comma separated)</p>
                            <input value={f.tags} onChange={e => set("tags", e.target.value)} placeholder="ayurveda, herbs, basics" style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Custom Thumbnail URL</p>
                            <input value={f.thumbnail} onChange={e => set("thumbnail", e.target.value)} placeholder="Optional — auto-generated for YouTube" style={inp} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <p style={lbl}>Description</p>
                        <textarea value={f.description} rows={3} onChange={e => set("description", e.target.value)}
                            placeholder="What will students learn in this lecture?" style={{ ...inp, resize: "vertical", width: "100%" }} />
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        style={{ padding: "10px 24px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Saving..." : editing ? "Update Lecture" : "Save Lecture"}
                    </button>
                </div>
            )}

            {/* Filter */}
            {subjectList.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <button onClick={() => setFilterSubject("")} style={{ ...pill, background: !filterSubject ? "#00256e" : "#fff", color: !filterSubject ? "#fff" : "#374151", borderColor: !filterSubject ? "#00256e" : "#e5e7eb" }}>All</button>
                    {subjectList.map(s => (
                        <button key={s} onClick={() => setFilterSubject(s)} style={{ ...pill, background: filterSubject === s ? "#00256e" : "#fff", color: filterSubject === s ? "#fff" : "#374151", borderColor: filterSubject === s ? "#00256e" : "#e5e7eb" }}>{s}</button>
                    ))}
                </div>
            )}

            {/* List */}
            {loading ? <p style={{ color: "#6b7280", padding: "40px 0", textAlign: "center" }}>Loading...</p>
                : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px dashed #e5e7eb" }}>
                        <p style={{ fontSize: 32, margin: "0 0 8px" }}>🎬</p>
                        <p style={{ fontSize: 14, color: "#374151", fontWeight: 600, margin: "0 0 4px" }}>No lectures yet</p>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>Add your first lecture video above</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {filtered.map(l => (
                            <div key={l._id} style={{
                                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                                padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                                opacity: l.isPublished ? 1 : 0.7,
                            }}>
                                {/* Thumbnail */}
                                <div style={{ width: 72, height: 48, borderRadius: 8, overflow: "hidden", background: "#f3f4f6", flexShrink: 0, position: "relative" }}>
                                    {l.thumbnail ? (
                                        <img src={l.thumbnail} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎬</div>
                                    )}
                                    <span style={{ position: "absolute", bottom: 3, right: 3, fontSize: 9, background: "rgba(0,0,0,0.7)", color: "#fff", padding: "1px 4px", borderRadius: 4 }}>
                                        {formatDuration(l.duration)}
                                    </span>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</p>
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>
                                        {l.subject}{l.topic ? ` · ${l.topic}` : ""} · {l.views} views · {l.isFree ? "Free" : "Pro"}
                                    </p>
                                </div>

                                {/* Status */}
                                <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: l.isPublished ? "#d1fae5" : "#f3f4f6", color: l.isPublished ? "#065f46" : "#6b7280", flexShrink: 0 }}>
                                    {l.isPublished ? "Published" : "Draft"}
                                </span>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => handleToggle(l)}
                                        style={{ ...btn, color: l.isPublished ? "#d97706" : "#059669" }}>
                                        {l.isPublished ? "Unpublish" : "Publish"}
                                    </button>
                                    <button onClick={() => handleToggleFeatured(l)}
                                        title={l.isFeatured ? "Remove from home" : "Feature on home"}
                                        style={{ ...btn, color: l.isFeatured ? "#f59e0b" : "#6b7280", background: l.isFeatured ? "#fef9c3" : "#fff", borderColor: l.isFeatured ? "#fde68a" : "#e5e7eb" }}>
                                        {l.isFeatured ? "⭐" : "☆"}
                                    </button>
                                    <button onClick={() => handleEdit(l)} style={btn}>Edit</button>
                                    <button onClick={() => handleDelete(l._id)} style={{ ...btn, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
        </div>
    );
}

const lbl = { fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" };
const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 };
const pill = { padding: "5px 12px", borderRadius: 20, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };