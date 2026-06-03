"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AdminCoursesPage() {
    const { authAxios } = useAuth();
    const [tab, setTab] = useState("batches");         // "batches" | "enroll"
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null); // for enroll tab

    useEffect(() => { loadBatches(); }, []);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/batches/admin/all");
            setBatches(res.data.batches || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const togglePublish = async (b) => {
        await authAxios.put(`/batches/${b._id}`, { isPublished: !b.isPublished });
        loadBatches();
    };

    const deleteBatch = async (b) => {
        if (!window.confirm(`Delete "${b.title}"? Tests inside will be untagged.`)) return;
        await authAxios.delete(`/batches/${b._id}`);
        loadBatches();
    };

    return (
        <div>
            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>Courses & Batches</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Create crash courses and manage enrollments</p>
                </div>
                <button onClick={() => { setEditingBatch(null); setShowForm(true); }} style={primaryBtn}>
                    + New Batch
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 20 }}>
                {[["batches", "📦 Batches"], ["enroll", "👥 Enrollments"]].map(([key, label]) => (
                    <button key={key} onClick={() => setTab(key)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500, background: tab === key ? "#1D9E75" : "transparent", color: tab === key ? "#fff" : "#6b7280", transition: "all 0.15s" }}>
                        {label}
                    </button>
                ))}
            </div>

            {tab === "batches" && (
                loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : batches.length === 0 ? (
                    <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>No batches yet. Create one above.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {batches.map(b => (
                            <div key={b._id} style={cardRow}>
                                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(0,37,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                                    {b.icon || "📚"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</p>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                        <span style={muted}>{b.slug}</span>
                                        <span style={muted}>· {b.durationDays}d</span>
                                        <span style={muted}>· {b.totalTests || 0} tests</span>
                                        <span style={muted}>· {b.enrolledCount || 0} enrolled</span>
                                        <span style={muted}>· {b.price === 0 ? "Free" : `₹${b.price}`}</span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: b.isPublished ? "rgba(29,158,117,0.2)" : "rgba(74,85,104,0.3)", color: b.isPublished ? "#1D9E75" : "#718096" }}>
                                        {b.isPublished ? "Live" : "Draft"}
                                    </span>
                                    <button onClick={() => togglePublish(b)} style={miniBtn}>{b.isPublished ? "Unpublish" : "Publish"}</button>
                                    <button onClick={() => { setEditingBatch(b); setShowForm(true); }} style={miniBtn}>Edit</button>
                                    <button onClick={() => { setSelectedBatch(b); setTab("enroll"); }} style={miniBtn}>👥 Enroll</button>
                                    <button onClick={() => deleteBatch(b)} style={dangerMiniBtn}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {tab === "enroll" && (
                <EnrollTab authAxios={authAxios} batches={batches} preselected={selectedBatch} />
            )}

            {showForm && (
                <BatchFormModal
                    authAxios={authAxios}
                    editing={editingBatch}
                    onClose={() => setShowForm(false)}
                    onSaved={() => { setShowForm(false); loadBatches(); }}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Enroll Tab ────────────────────────────────────────────────────────────────
function EnrollTab({ authAxios, batches, preselected }) {
    const [batchSlug, setBatchSlug] = useState(preselected?.slug || "");
    const [email, setEmail] = useState("");
    const [enrollMsg, setEnrollMsg] = useState("");
    const [enrollErr, setEnrollErr] = useState("");
    const [enrolling, setEnrolling] = useState(false);
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (preselected) setBatchSlug(preselected.slug);
    }, [preselected]);

    useEffect(() => {
        if (!batchSlug) { setStudents([]); return; }
        loadStudents();
    }, [batchSlug]);

    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            const res = await authAxios.get(`/batches/${batchSlug}/enrolled`);
            setStudents(res.data.students || []);
        } catch { setStudents([]); }
        finally { setLoadingStudents(false); }
    };

    const handleEnroll = async () => {
        if (!batchSlug || !email.trim()) return;
        setEnrolling(true); setEnrollMsg(""); setEnrollErr("");
        try {
            const res = await authAxios.post(`/batches/${batchSlug}/admin-enroll`, { email: email.trim() });
            setEnrollMsg(res.data.message);
            setEmail("");
            loadStudents();
        } catch (e) {
            setEnrollErr(e.response?.data?.message || "Enrollment failed");
        } finally { setEnrolling(false); }
    };

    const handleUnenroll = async (userId) => {
        if (!window.confirm("Remove this student from the batch?")) return;
        await authAxios.delete(`/batches/${batchSlug}/admin-enroll/${userId}`);
        loadStudents();
    };

    return (
        <div>
            {/* Batch selector */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <select value={batchSlug} onChange={e => setBatchSlug(e.target.value)} style={smallSelect}>
                    <option value="">Select a batch…</option>
                    {batches.map(b => <option key={b._id} value={b.slug}>{b.title}</option>)}
                </select>
            </div>

            {batchSlug && (
                <>
                    {/* Manual enroll by email */}
                    <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "0.5px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 12px" }}>Enroll a student by email</p>
                        <div style={{ display: "flex", gap: 10 }}>
                            <input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleEnroll()}
                                placeholder="student@example.com"
                                style={{ ...inp, flex: 1 }}
                            />
                            <button onClick={handleEnroll} disabled={enrolling || !email.trim()} style={primaryBtn}>
                                {enrolling ? "Adding…" : "Enroll"}
                            </button>
                        </div>
                        {enrollMsg && <p style={{ fontSize: 12, color: "#1D9E75", margin: "8px 0 0", fontWeight: 600 }}>✓ {enrollMsg}</p>}
                        {enrollErr && <p style={{ fontSize: 12, color: "#dc2626", margin: "8px 0 0" }}>{enrollErr}</p>}
                    </div>

                    {/* Enrolled students list */}
                    <div style={{ background: "#fff", borderRadius: 12, border: "0.5px solid rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                                Enrolled Students ({students.length})
                            </p>
                        </div>
                        {loadingStudents ? (
                            <p style={{ color: "#9ca3af", textAlign: "center", padding: 24, fontSize: 13 }}>Loading…</p>
                        ) : students.length === 0 ? (
                            <p style={{ color: "#9ca3af", textAlign: "center", padding: 32, fontSize: 13 }}>No students enrolled yet.</p>
                        ) : (
                            students.map(s => (
                                <div key={s._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid #f9fafb" }}>
                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,37,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#00256e", flexShrink: 0 }}>
                                        {s.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", margin: 0 }}>{s.name}</p>
                                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{s.email} · {s.officialId}</p>
                                    </div>
                                    <button onClick={() => handleUnenroll(s._id)} style={dangerMiniBtn}>Remove</button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Batch form modal ──────────────────────────────────────────────────────────
function BatchFormModal({ authAxios, editing, onClose, onSaved }) {
    const [form, setForm] = useState({
        title: editing?.title || "",
        slug: editing?.slug || "",
        description: editing?.description || "",
        icon: editing?.icon || "📚",
        type: editing?.type || "crash_course",
        durationDays: editing?.durationDays || 30,
        startDate: editing?.startDate ? editing.startDate.slice(0, 10) : "",
        endDate: editing?.endDate ? editing.endDate.slice(0, 10) : "",
        price: editing?.price ?? 0,
        subjects: editing?.subjects?.join(", ") || "",
        tags: editing?.tags?.join(", ") || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const autoSlug = (title) =>
        title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        if (!form.title.trim() || !form.slug.trim()) return setError("Title and slug are required");
        setSaving(true);
        try {
            const payload = {
                ...form,
                durationDays: Number(form.durationDays),
                price: Number(form.price),
                subjects: form.subjects.split(",").map(s => s.trim()).filter(Boolean),
                tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
            };
            if (editing) {
                await authAxios.put(`/batches/${editing._id}`, payload);
            } else {
                await authAxios.post("/batches", payload);
            }
            onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Save failed");
        } finally { setSaving(false); }
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 560, border: "0.5px solid rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>{editing ? "Edit Batch" : "Create Batch"}</h2>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 60 }}>
                            <label style={lbl}>Icon</label>
                            <input value={form.icon} onChange={e => set("icon", e.target.value)} style={{ ...inp, textAlign: "center", fontSize: 18 }} maxLength={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={lbl}>Title</label>
                            <input value={form.title} onChange={e => { set("title", e.target.value); if (!editing) set("slug", autoSlug(e.target.value)); }} style={inp} placeholder="BAMS Final Year Crash Course" />
                        </div>
                    </div>

                    <div>
                        <label style={lbl}>Slug (URL identifier)</label>
                        <input value={form.slug} onChange={e => set("slug", e.target.value)} style={inp} placeholder="bams-crash-june-2026" disabled={!!editing} />
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Auto-generated from title · lowercase, hyphens only{editing ? " · cannot change after creation" : ""}</p>
                    </div>

                    <div>
                        <label style={lbl}>Description</label>
                        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="60-day intensive preparation for BAMS finals…" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={lbl}>Type</label>
                            <select value={form.type} onChange={e => set("type", e.target.value)} style={inp}>
                                <option value="crash_course">🚀 Crash Course</option>
                                <option value="mock_series">📝 Mock Series</option>
                                <option value="subject_sprint">⚡ Subject Sprint</option>
                            </select>
                        </div>
                        <div>
                            <label style={lbl}>Duration (days)</label>
                            <input type="number" value={form.durationDays} onChange={e => set("durationDays", e.target.value)} style={inp} min={1} />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                            <label style={lbl}>Start Date</label>
                            <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={inp} />
                        </div>
                        <div>
                            <label style={lbl}>End Date</label>
                            <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} style={inp} />
                        </div>
                    </div>

                    <div>
                        <label style={lbl}>Price ₹ (0 = free)</label>
                        <input type="number" value={form.price} onChange={e => set("price", e.target.value)} style={inp} min={0} />
                    </div>

                    <div>
                        <label style={lbl}>Subjects covered (comma-separated)</label>
                        <input value={form.subjects} onChange={e => set("subjects", e.target.value)} style={inp} placeholder="Dravyaguna, Anatomy, Kayachikitsa" />
                    </div>

                    <div>
                        <label style={lbl}>Tags (comma-separated)</label>
                        <input value={form.tags} onChange={e => set("tags", e.target.value)} style={inp} placeholder="BAMS Final Year, 60-Day, Intensive" />
                    </div>
                </div>

                {error && <p style={{ fontSize: 13, color: "#E24B4A", margin: "12px 0 0" }}>{error}</p>}

                <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                    <button onClick={onClose} style={cancelBtn}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, flex: 2 }}>
                        {saving ? "Saving…" : editing ? "Save Changes" : "Create Batch"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#f8fafc", color: "#111827", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const primaryBtn = { padding: "9px 20px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const cancelBtn = { flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#9ca3af", cursor: "pointer", fontFamily: "inherit" };
const miniBtn = { padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#9ca3af", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const dangerMiniBtn = { padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const smallSelect = { padding: "7px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#111827", fontSize: 12, fontFamily: "inherit", cursor: "pointer" };
const cardRow = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 };
const muted = { fontSize: 11, color: "#6b7280" };