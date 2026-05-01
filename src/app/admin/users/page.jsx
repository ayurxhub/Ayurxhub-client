"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast";
import { useConfirm } from "@/app/components/ConfirmModal";

export default function AdminUsers() {
    const { authAxios } = useAuth();
    const router = useRouter();
    const { showToast, ToastElement } = useToast();
    const { confirm, ConfirmElement } = useConfirm();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    useEffect(() => { fetchUsers(); }, [search, roleFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append("search", search);
            if (roleFilter) params.append("role", roleFilter);
            const res = await authAxios.get(`/admin/users?${params}`);
            setUsers(res.data.users);
            setTotal(res.data.total);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleToggle = async (userId) => {
        try { await authAxios.put(`/admin/users/${userId}/toggle`); fetchUsers(); }
        catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
    };

    const handleDelete = async (userId) => {
        const ok = await confirm("Delete this user?");
        if (!ok) return;
        try { await authAxios.delete(`/admin/users/${userId}`); fetchUsers(); }
        catch (err) { showToast(err.response?.data?.message || "Failed", "error"); }
    };

    const roleBadge = (role) => ({
        expert: { bg: "#dbeafe", color: "#1d4ed8" },
        admin: { bg: "#fef3c7", color: "#92400e" },
        student: { bg: "#d1fae5", color: "#065f46" },
    }[role] || { bg: "#f3f4f6", color: "#374151" });

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Users</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{total} total users</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <input placeholder="Search name or email..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={inp} />
                <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} style={inp}>
                    <option value="">All roles</option>
                    <option value="student">Students</option>
                    <option value="expert">Experts</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>Loading...</div>
            ) : (
                <>
                    {/* Desktop table */}
                    <div className="users-table-wrap">
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: "1px solid #f9fafb" }}>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                                    {u.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{u.name}</p>
                                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: roleBadge(u.role).bg, color: roleBadge(u.role).color }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: u.isActive ? "#d1fae5" : "#fee2e2", color: u.isActive ? "#065f46" : "#991b1b" }}>
                                                {u.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280" }}>
                                            {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                                <button onClick={() => router.push(`/admin/users/${u._id}`)} style={btn}>View</button>
                                                <button onClick={() => handleToggle(u._id)}
                                                    style={{ ...btn, color: u.isActive ? "#dc2626" : "#059669", borderColor: u.isActive ? "#fecaca" : "#a7f3d0" }}>
                                                    {u.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                                <button onClick={() => handleDelete(u._id)} style={{ ...btn, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="users-cards">
                        {users.map(u => (
                            <div key={u._id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                        {u.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</p>
                                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</p>
                                    </div>
                                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: roleBadge(u.role).bg, color: roleBadge(u.role).color, flexShrink: 0 }}>
                                        {u.role}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                                    <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, fontWeight: 600, background: u.isActive ? "#d1fae5" : "#fee2e2", color: u.isActive ? "#065f46" : "#991b1b" }}>
                                        {u.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                                        {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={() => router.push(`/admin/users/${u._id}`)} style={{ ...btn, flex: 1 }}>View</button>
                                    <button onClick={() => handleToggle(u._id)}
                                        style={{ ...btn, flex: 1, color: u.isActive ? "#dc2626" : "#059669", borderColor: u.isActive ? "#fecaca" : "#a7f3d0" }}>
                                        {u.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button onClick={() => handleDelete(u._id)} style={{ ...btn, flex: 1, color: "#dc2626", borderColor: "#fecaca" }}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Showing {users.length} of {total}</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btn}>Previous</button>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", padding: "6px 12px", background: "#f3f4f6", borderRadius: 8 }}>Page {page}</span>
                    <button onClick={() => setPage(p => p + 1)} disabled={users.length < 20} style={btn}>Next</button>
                </div>
            </div>

            {ToastElement}{ConfirmElement}

            <style>{`
                .users-table-wrap {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                .users-cards { display: none; }
                @media (max-width: 640px) {
                    .users-table-wrap { display: none; }
                    .users-cards { display: block; }
                }
            `}</style>
        </div>
    );
}

const inp = { padding: "9px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", fontSize: 13, outline: "none", minWidth: 160 };
const btn = { padding: "6px 12px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 };