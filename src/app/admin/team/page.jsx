"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminTeamPage() {
    const { user, authAxios } = useAuth();
    const router = useRouter();

    const isSuperAdmin = user?.role === "superAdmin" ||
        (user?.role === "admin" && user?.adminRole === "super_admin");

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });

    useEffect(() => {
        if (!isSuperAdmin) { router.push("/admin"); return; }
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/admin/admins");
            setAdmins(res.data.admins || []);
        } catch { setMsg({ text: "Failed to load admins", type: "error" }); }
        finally { setLoading(false); }
    };

    const createAdmin = async () => {
        if (!form.name || !form.email || !form.password) {
            return setMsg({ text: "All fields are required", type: "error" });
        }
        setSaving(true);
        try {
            await authAxios.post("/admin/admins", form);
            setMsg({ text: "Admin created successfully", type: "success" });
            setForm({ name: "", email: "", password: "" });
            setShowForm(false);
            loadAdmins();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed to create admin", type: "error" });
        } finally { setSaving(false); }
    };

    const removeAdmin = async (id, name) => {
        if (!window.confirm(`Remove ${name} as admin? This cannot be undone.`)) return;
        try {
            await authAxios.delete(`/admin/admins/${id}`);
            setMsg({ text: `${name} removed`, type: "success" });
            loadAdmins();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed to remove admin", type: "error" });
        }
    };

    const deleteUser = async (id, name) => {
        if (!window.confirm(`Permanently delete ${name}'s account? This cannot be undone.`)) return;
        try {
            await authAxios.delete(`/admin/users/${id}`);
            setMsg({ text: `${name} deleted`, type: "success" });
            loadAdmins();
        } catch (e) {
            setMsg({ text: e.response?.data?.message || "Failed to delete user", type: "error" });
        }
    };

    const roleLabel = (u) => {
        if (u.role === "superAdmin" || u.adminRole === "super_admin") return { label: "👑 Super Admin", color: "#92400e", bg: "#fef3c7" };
        return { label: "🛡️ Admin", color: "#1D9E75", bg: "#dcfce7" };
    };

    if (!isSuperAdmin) return null;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Admin Team</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manage who has admin access to AyurXHub</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    style={{ padding: "9px 18px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    {showForm ? "Cancel" : "+ Add Admin"}
                </button>
            </div>

            {msg.text && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: msg.type === "success" ? "#d1fae5" : "#fee2e2", color: msg.type === "success" ? "#065f46" : "#991b1b", fontSize: 13 }}>
                    {msg.text}
                </div>
            )}

            {/* Create admin form */}
            {showForm && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 14px" }}>Create New Admin</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                        {[["Full Name", "name", "text"], ["Email", "email", "email"], ["Password", "password", "password"]].map(([label, key, type]) => (
                            <div key={key}>
                                <p style={lbl}>{label}</p>
                                <input
                                    type={type}
                                    value={form[key]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    style={inp}
                                    placeholder={label}
                                />
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 12px" }}>
                        New admins can manage tests, materials, blogs, users and lectures — but cannot change settings or pricing.
                    </p>
                    <button onClick={createAdmin} disabled={saving}
                        style={{ padding: "9px 24px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                        {saving ? "Creating…" : "Create Admin"}
                    </button>
                </div>
            )}

            {/* Admins list */}
            {loading ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>Loading…</p>
            ) : admins.length === 0 ? (
                <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>No admins found.</p>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {admins.map(a => {
                        const rl = roleLabel(a);
                        const isSelf = a._id === user._id;
                        const isOwner = a.role === "superAdmin" || a.adminRole === "super_admin";
                        return (
                            <div key={a._id} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(0,37,110,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#00256e", flexShrink: 0 }}>
                                    {a.name?.[0]?.toUpperCase() || "?"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{a.name} {isSelf && <span style={{ fontSize: 11, color: "#9ca3af" }}>(you)</span>}</p>
                                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: rl.bg, color: rl.color, fontWeight: 700 }}>{rl.label}</span>
                                    </div>
                                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{a.email}</p>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    {!isSelf && !isOwner && (
                                        <>
                                            <button onClick={() => removeAdmin(a._id, a.name)}
                                                style={miniBtn}>
                                                Remove Admin
                                            </button>
                                            <button onClick={() => deleteUser(a._id, a.name)}
                                                style={dangerBtn}>
                                                Delete Account
                                            </button>
                                        </>
                                    )}
                                    {isSelf && <span style={{ fontSize: 12, color: "#9ca3af" }}>Your account</span>}
                                    {!isSelf && isOwner && <span style={{ fontSize: 12, color: "#9ca3af" }}>Protected</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const lbl = { fontSize: 11, color: "#6b7280", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" };
const inp = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
const miniBtn = { padding: "6px 12px", borderRadius: 6, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const dangerBtn = { padding: "6px 12px", borderRadius: 6, border: "0.5px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };