"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const TYPES = [
    { key: "institution", label: "Institution", icon: "🏛️" },
    { key: "ebook", label: "E-Book", icon: "📖" },
    { key: "journal", label: "Journal", icon: "📰" },
];

const EMPTY = {
    type: "institution", name: "", shortName: "", description: "",
    url: "", location: "", instType: "", source: "", language: "",
    category: "", publisher: "", order: "0",
};

export default function AdminReferences() {
    const { authAxios } = useAuth();
    const [refs, setRefs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [filterType, setFilterType] = useState("all");

    useEffect(() => { fetchRefs(); }, []);

    const fetchRefs = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/references/admin/all");
            setRefs(res.data.references);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    const handleSave = async () => {
        setSaving(true); setMsg({ text: "", type: "" });
        try {
            const payload = { ...form, order: Number(form.order) || 0 };
            if (editing) {
                await authAxios.put(`/references/${editing}`, payload);
                setMsg({ text: "Updated!", type: "success" });
            } else {
                await authAxios.post("/references", payload);
                setMsg({ text: "Added successfully!", type: "success" });
            }
            setForm(EMPTY); setEditing(null); setShowForm(false); fetchRefs();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed", type: "error" });
        } finally { setSaving(false); }
    };

    const handleEdit = (r) => {
        setForm({
            type: r.type, name: r.name || "", shortName: r.shortName || "",
            description: r.description || "", url: r.url || "",
            location: r.location || "", instType: r.instType || "",
            source: r.source || "", language: r.language || "",
            category: r.category || "", publisher: r.publisher || "",
            order: String(r.order || 0),
        });
        setEditing(r._id); setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleToggle = async (r) => {
        await authAxios.put(`/references/${r._id}`, { isActive: !r.isActive });
        fetchRefs();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this reference?")) return;
        await authAxios.delete(`/references/${id}`);
        fetchRefs();
    };

    const filtered = filterType === "all" ? refs : refs.filter(r => r.type === filterType);

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>References</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manage institutions, e-books and journals shown in References section</p>
                </div>
                <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(!showForm); }}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showForm ? "Cancel" : "+ Add Reference"}
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
                        {editing ? "Edit Reference" : "Add New Reference"}
                    </p>

                    {/* Type selector */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                        {TYPES.map(t => (
                            <button key={t.key} onClick={() => set("type", t.key)} style={{
                                padding: "7px 16px", borderRadius: 8, cursor: "pointer",
                                border: `2px solid ${form.type === t.key ? "#00256e" : "#e5e7eb"}`,
                                background: form.type === t.key ? "#eff6ff" : "#fff",
                                color: form.type === t.key ? "#00256e" : "#6b7280",
                                fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                            }}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Common fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 12, marginBottom: 12 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <p style={lbl}>Name</p>
                            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Charaka Samhita" style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Link URL</p>
                            <input value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://..." style={inp} />
                        </div>
                        <div>
                            <p style={lbl}>Sort Order</p>
                            <input type="number" value={form.order} onChange={e => set("order", e.target.value)} style={inp} />
                        </div>

                        {/* Institution specific */}
                        {form.type === "institution" && (<>
                            <div>
                                <p style={lbl}>Short Name</p>
                                <input value={form.shortName} onChange={e => set("shortName", e.target.value)} placeholder="e.g. NIA" style={inp} />
                            </div>
                            <div>
                                <p style={lbl}>Location</p>
                                <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Jaipur, Rajasthan" style={inp} />
                            </div>
                            <div>
                                <p style={lbl}>Type</p>
                                <input value={form.instType} onChange={e => set("instType", e.target.value)} placeholder="e.g. Government Institute" style={inp} />
                            </div>
                        </>)}

                        {/* Ebook specific */}
                        {form.type === "ebook" && (<>
                            <div>
                                <p style={lbl}>Source</p>
                                <input value={form.source} onChange={e => set("source", e.target.value)} placeholder="e.g. NIIMH" style={inp} />
                            </div>
                            <div>
                                <p style={lbl}>Language</p>
                                <input value={form.language} onChange={e => set("language", e.target.value)} placeholder="e.g. Sanskrit / English" style={inp} />
                            </div>
                            <div>
                                <p style={lbl}>Category</p>
                                <input value={form.category} onChange={e => set("category", e.target.value)} placeholder="e.g. Classical Text" style={inp} />
                            </div>
                        </>)}

                        {/* Journal specific */}
                        {form.type === "journal" && (
                            <div>
                                <p style={lbl}>Publisher</p>
                                <input value={form.publisher} onChange={e => set("publisher", e.target.value)} placeholder="e.g. CCRAS" style={inp} />
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <p style={lbl}>Description</p>
                        <textarea value={form.description} rows={3} onChange={e => set("description", e.target.value)}
                            placeholder="Brief description (optional)" style={{ ...inp, resize: "vertical", width: "100%" }} />
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        style={{ padding: "10px 24px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Saving..." : editing ? "Update" : "Add Reference"}
                    </button>
                </div>
            )}

            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
                {[{ key: "all", label: "All" }, ...TYPES].map(t => (
                    <button key={t.key} onClick={() => setFilterType(t.key)} style={{
                        padding: "8px 14px", fontSize: 12, background: "none", border: "none",
                        borderBottom: filterType === t.key ? "2px solid #00256e" : "2px solid transparent",
                        color: filterType === t.key ? "#00256e" : "#6b7280",
                        cursor: "pointer", fontFamily: "inherit", fontWeight: filterType === t.key ? 700 : 400,
                    }}>
                        {t.icon || ""} {t.label} {t.key !== "all" && `(${refs.filter(r => r.type === t.key).length})`}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? <p style={{ color: "#6b7280", padding: "40px 0", textAlign: "center" }}>Loading...</p>
                : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "1.5px dashed #e5e7eb" }}>
                        <p style={{ fontSize: 13, color: "#9ca3af" }}>No {filterType === "all" ? "references" : filterType + "s"} added yet</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {filtered.map(r => {
                            const t = TYPES.find(t => t.key === r.type);
                            return (
                                <div key={r._id} style={{
                                    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                                    padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                                    opacity: r.isActive ? 1 : 0.6,
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                        {t?.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name || "—"}</p>
                                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", fontWeight: 600 }}>{t?.label}</span>
                                            {!r.isActive && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", fontWeight: 600 }}>Hidden</span>}
                                        </div>
                                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {r.url ? <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>{r.url}</a> : "No link"}
                                            {r.location ? ` · ${r.location}` : ""}
                                            {r.publisher ? ` · ${r.publisher}` : ""}
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                        <button onClick={() => handleToggle(r)} style={{ ...btn, color: r.isActive ? "#d97706" : "#059669" }}>
                                            {r.isActive ? "Hide" : "Show"}
                                        </button>
                                        <button onClick={() => handleEdit(r)} style={btn}>Edit</button>
                                        <button onClick={() => handleDelete(r._id)} style={{ ...btn, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
        </div>
    );
}

const lbl = { fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" };
const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const btn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 };