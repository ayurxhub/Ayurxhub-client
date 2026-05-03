"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const TYPES = ["notice", "job", "exam", "event", "alert", "news"];
const TYPE_CONFIG = {
    notice: { label: "Notice", icon: "📢", color: "#3b82f6" },
    job: { label: "Job", icon: "💼", color: "#10b981" },
    exam: { label: "Exam", icon: "📝", color: "#f59e0b" },
    event: { label: "Event", icon: "🗓️", color: "#8b5cf6" },
    alert: { label: "Alert", icon: "⚠️", color: "#ef4444" },
    news: { label: "News", icon: "📰", color: "#1D9E75" },
};

const EMPTY = { title: "", message: "", type: "notice", expiresAt: "", link: "", linkText: "Learn More" };

export default function AdminAnnouncements() {
    const { authAxios } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => { fetch(); }, []);

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/announcements/admin/all");
            setAnnouncements(res.data.announcements);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title || !form.message) return setMsg({ text: "Title and message are required", type: "error" });
        setSaving(true);
        try {
            const payload = { ...form, expiresAt: form.expiresAt || null };
            if (editing) {
                await authAxios.put(`/announcements/${editing}`, payload);
                setMsg({ text: "Updated successfully!", type: "success" });
            } else {
                await authAxios.post("/announcements", payload);
                setMsg({ text: "Announcement created!", type: "success" });
            }
            setForm(EMPTY); setEditing(null); setShowForm(false); fetch();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed", type: "error" });
        } finally { setSaving(false); }
    };

    const handleEdit = (a) => {
        setForm({
            title: a.title, message: a.message, type: a.type,
            expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "",
            link: a.link || "", linkText: a.linkText || "Learn More",
        });
        setEditing(a._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggle = async (a) => {
        await authAxios.put(`/announcements/${a._id}`, { isActive: !a.isActive });
        fetch();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        await authAxios.delete(`/announcements/${id}`);
        fetch();
    };

    const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.notice;

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Announcements</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Notices, job alerts, and updates shown on the home page hero</p>
                </div>
                <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(!showForm); }}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showForm ? "Cancel" : "+ New Announcement"}
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
                        {editing ? "Edit Announcement" : "New Announcement"}
                    </p>

                    {/* Type selector */}
                    <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>Type</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {TYPES.map(t => {
                            const c = cfg(t);
                            return (
                                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                                    style={{
                                        padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                                        border: `2px solid ${form.type === t ? c.color : "#e5e7eb"}`,
                                        background: form.type === t ? `${c.color}15` : "#fff",
                                        color: form.type === t ? c.color : "#6b7280",
                                        fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                                        transition: "all 0.15s",
                                    }}>
                                    {c.icon} {c.label}
                                </button>
                            );
                        })}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                            <p style={labelSt}>Title *</p>
                            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="e.g. BAMS Admissions Open 2026" style={inp} />
                        </div>
                        <div>
                            <p style={labelSt}>Expires At (optional)</p>
                            <input type="datetime-local" value={form.expiresAt}
                                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                                style={inp} />
                        </div>
                        <div>
                            <p style={labelSt}>Link URL (optional)</p>
                            <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                                placeholder="https://... or /tests" style={inp} />
                        </div>
                        <div>
                            <p style={labelSt}>Link Button Text</p>
                            <input value={form.linkText} onChange={e => setForm(f => ({ ...f, linkText: e.target.value }))}
                                placeholder="Learn More" style={inp} />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <p style={labelSt}>Message *</p>
                        <textarea value={form.message} rows={3}
                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="Describe the announcement in one or two sentences..."
                            style={{ ...inp, resize: "vertical", width: "100%" }} />
                    </div>

                    {/* Preview */}
                    <div style={{ background: "linear-gradient(135deg, #00256e, #1D9E75)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Preview on hero</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                                {cfg(form.type).icon} {cfg(form.type).label.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)" }}>
                                <strong>{form.title || "Title"}</strong>: {form.message || "Your message here..."}
                            </span>
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        style={{ padding: "10px 24px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Saving..." : editing ? "Update Announcement" : "Publish Announcement"}
                    </button>
                </div>
            )}

            {/* List */}
            {loading ? (
                <p style={{ color: "#6b7280", padding: "40px 0", textAlign: "center" }}>Loading...</p>
            ) : announcements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px dashed #e5e7eb" }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>📢</p>
                    <p style={{ fontSize: 14, color: "#374151", fontWeight: 600, margin: "0 0 4px" }}>No announcements yet</p>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Create one to show notices on the home page hero section</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {announcements.map(a => {
                        const c = cfg(a.type);
                        const expired = a.expiresAt && new Date(a.expiresAt) < new Date();
                        return (
                            <div key={a._id} style={{
                                background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                                padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                                opacity: !a.isActive || expired ? 0.6 : 1,
                            }}>
                                {/* Type icon */}
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                    {c.icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${c.color}15`, color: c.color }}>{c.label.toUpperCase()}</span>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{a.title}</p>
                                        {!a.isActive && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>Hidden</span>}
                                        {expired && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#fee2e2", color: "#dc2626", fontWeight: 600 }}>Expired</span>}
                                    </div>
                                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.message}</p>
                                    {a.expiresAt && (
                                        <p style={{ fontSize: 10, color: "#9ca3af", margin: "3px 0 0" }}>
                                            Expires: {new Date(a.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => handleToggle(a)}
                                        style={{ ...btnSt, color: a.isActive ? "#d97706" : "#059669", borderColor: a.isActive ? "#fde68a" : "#a7f3d0" }}>
                                        {a.isActive ? "Hide" : "Show"}
                                    </button>
                                    <button onClick={() => handleEdit(a)} style={btnSt}>Edit</button>
                                    <button onClick={() => handleDelete(a._id)} style={{ ...btnSt, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const labelSt = { fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" };
const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btnSt = { padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 };