"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPE_COLORS = {
    important: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Important" },
    info: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Info" },
    event: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "Event" },
    general: { bg: "#f0fdf4", color: "#166534", dot: "#22c55e", label: "General" },
};

export default function NoticesPage() {
    const router = useRouter();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        axios.get(`${API}/announcements?sort=-createdAt&limit=50`)
            .then(r => setNotices(r.data.announcements || r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === "all" ? notices : notices.filter(n => n.type === filter);
    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", padding: "24px 16px" }}>
            {/* Header */}
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <button onClick={() => router.back()}
                    style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16, display: "flex", alignItems: "center", gap: 4 }}>
                    ← Back
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <span style={{ fontSize: 24 }}>📢</span>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Notice Board</h1>
                        <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Important announcements and updates</p>
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {["all", "important", "event", "info", "general"].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === f ? "#00256e" : "#e5e7eb"}`, background: filter === f ? "#00256e" : "#fff", color: filter === f ? "#fff" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                            {f === "all" ? "All" : TYPE_COLORS[f]?.label}
                        </button>
                    ))}
                </div>

                {/* Notices */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: 60 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
                        <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
                        <p style={{ fontSize: 14, color: "#6b7280" }}>No notices yet</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {filtered.map(n => {
                            const type = TYPE_COLORS[n.type] || TYPE_COLORS.general;
                            return (
                                <div key={n._id}
                                    onClick={() => router.push(`/notices/${n._id}`)}
                                    style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e5e7eb", cursor: "pointer", transition: "box-shadow 0.15s", display: "flex", gap: 14, alignItems: "flex-start" }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

                                    {/* Type dot */}
                                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: type.dot, flexShrink: 0, marginTop: 5 }} />

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: type.bg, color: type.color, fontWeight: 700 }}>{type.label}</span>
                                            <span style={{ fontSize: 11, color: "#9ca3af" }}>{fmt(n.createdAt)}</span>
                                        </div>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "0 0 6px", lineHeight: 1.4 }}>{n.title}</p>
                                        {n.message && (
                                            <p style={{ fontSize: 12, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                                                {n.message}
                                            </p>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 16, color: "#9ca3af", flexShrink: 0 }}>›</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}