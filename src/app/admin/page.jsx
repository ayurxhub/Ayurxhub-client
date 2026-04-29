"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminOverview() {
    const { authAxios } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authAxios.get("/admin/stats")
            .then((res) => setStats(res.data.stats))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    const statCards = [
        { label: "Total Students", value: stats.totalStudents, color: "#1D9E75" },
        { label: "Total Experts", value: stats.totalExperts, color: "#185FA5" },
        { label: "Total Bookings", value: stats.totalBookings, color: "#854F0B" },
        { label: "Completed", value: stats.completedBookings, color: "#1D9E75" },
        { label: "Cancelled", value: stats.cancelledBookings, color: "#A32D2D" },
        { label: "Pending Verification", value: stats.pendingVerification, color: "#854F0B" },
        { label: "Total Reviews", value: stats.totalReviews, color: "#185FA5" },
        { label: "Total Revenue", value: `₹${stats.totalRevenue?.toLocaleString()}`, color: "#1D9E75" },
    ];

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 20, fontWeight: 500, color: "#ffffff", marginBottom: 4 }}>Overview</h1>
                <p style={{ fontSize: 13, color: "#4a5568" }}>Platform statistics and recent activity</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
                {statCards.map(({ label, value, color }) => (
                    <div key={label} style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "18px 20px" }}>
                        <p style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
                        <p style={{ fontSize: 26, fontWeight: 500, color }}>{value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Recent Users */}
                <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#ffffff" }}>Recent users</p>
                        <button onClick={() => router.push("/admin/users")}
                            style={{ fontSize: 12, color: "#1D9E75", background: "none", border: "none", cursor: "pointer" }}>
                            View all
                        </button>
                    </div>
                    {stats.recentUsers.map((u) => (
                        <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: "white", flexShrink: 0 }}>
                                {u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, color: "#ffffff", marginBottom: 1 }}>{u.name}</p>
                                <p style={{ fontSize: 11, color: "#4a5568" }}>{u.email}</p>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: u.role === "expert" ? "rgba(24,95,165,0.2)" : "rgba(29,158,117,0.2)", color: u.role === "expert" ? "#5BA3E8" : "#1D9E75", textTransform: "capitalize" }}>
                                {u.role}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Recent Bookings */}
                <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "#ffffff" }}>Recent bookings</p>
                        <button onClick={() => router.push("/admin/bookings")}
                            style={{ fontSize: 12, color: "#1D9E75", background: "none", border: "none", cursor: "pointer" }}>
                            View all
                        </button>
                    </div>
                    {stats.recentBookings.map((b) => (
                        <div key={b._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                            <div>
                                <p style={{ fontSize: 13, color: "#ffffff", marginBottom: 1 }}>{b.student?.name} → {b.expert?.name}</p>
                                <p style={{ fontSize: 11, color: "#4a5568" }}>
                                    {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.startTime}
                                </p>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(29,158,117,0.15)", color: "#1D9E75", textTransform: "capitalize" }}>
                                {b.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}