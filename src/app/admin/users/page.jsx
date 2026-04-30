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

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter, page]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.append("search", search);
            if (roleFilter) params.append("role", roleFilter);
            const res = await authAxios.get(`/admin/users?${params}`);
            setUsers(res.data.users);
            setTotal(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (userId) => {
        try {
            await authAxios.put(`/admin/users/${userId}/toggle`);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed", "error");
        }
    };

    const handleVerify = async (userId) => {
        try {
            await authAxios.put(`/admin/users/${userId}/verify`);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed", "error");
        }
    };

    const handleDelete = async (userId) => {
        const ok = await confirm("Are you sure you want to delete this user?");
        if (!ok) return;
        try {
            await authAxios.delete(`/admin/users/${userId}`);
            fetchUsers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed");
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", marginBottom: 4 }}>Users</h1>
                <p style={{ fontSize: 13, color: "#4a5568" }}>{total} total users</p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input placeholder="Search name or email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={inputStyle} />
                <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} style={inputStyle}>
                    <option value="">All roles</option>
                    <option value="student">Students</option>
                    <option value="expert">Experts</option>
                    <option value="admin">Admins</option>
                </select>
            </div>

            {/* Table */}
            <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                            {["User", "Role", "Status", "Joined", "Actions"].map((h) => (
                                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#4a5568" }}>Loading...</td></tr>
                        ) : users.map((u) => (
                            <tr key={u._id} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "white", flexShrink: 0 }}>
                                            {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, color: "#ffffff" }}>{u.name}</p>
                                            <p style={{ fontSize: 11, color: "#4a5568" }}>{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: u.role === "expert" ? "rgba(24,95,165,0.2)" : u.role === "admin" ? "rgba(133,79,11,0.2)" : "rgba(29,158,117,0.2)", color: u.role === "expert" ? "#5BA3E8" : u.role === "admin" ? "#EF9F27" : "#1D9E75", textTransform: "capitalize" }}>
                                        {u.role}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: u.isActive ? "rgba(29,158,117,0.15)" : "rgba(163,45,45,0.15)", color: u.isActive ? "#1D9E75" : "#E24B4A" }}>
                                        {u.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 16px", fontSize: 12, color: "#4a5568" }}>
                                    {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => router.push(`/admin/users/${u._id}`)} style={actionBtn}>View</button>
                                        {u.role === "expert" && !u.isVerified && (
                                            <button onClick={() => handleVerify(u._id)} style={{ ...actionBtn, color: "#1D9E75", borderColor: "rgba(29,158,117,0.3)" }}>Verify</button>
                                        )}
                                        <button onClick={() => handleToggle(u._id)}
                                            style={{ ...actionBtn, color: u.isActive ? "#E24B4A" : "#1D9E75", borderColor: u.isActive ? "rgba(226,75,74,0.3)" : "rgba(29,158,117,0.3)" }}>
                                            {u.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                        <button onClick={() => handleDelete(u._id)} style={{ ...actionBtn, color: "#E24B4A", borderColor: "rgba(226,75,74,0.3)" }}>Delete</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
                <p style={{ fontSize: 12, color: "#4a5568" }}>Showing {users.length} of {total}</p>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={actionBtn}>Previous</button>
                    <span style={{ fontSize: 12, color: "#ffffff", padding: "6px 12px" }}>Page {page}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} style={actionBtn}>Next</button>
                </div>
            </div>
            {ToastElement}
            {ConfirmElement}
        </div>
    );
}

const inputStyle = { padding: "8px 12px", borderRadius: 8, border: "0.5px solid rgba(255,255,255,0.1)", background: "#161b27", color: "#ffffff", fontSize: 13, outline: "none", minWidth: 200 };
const actionBtn = { padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(255,255,255,0.1)", background: "transparent", color: "#6b7280", fontSize: 11, cursor: "pointer", fontFamily: "var(--font-sans)" };