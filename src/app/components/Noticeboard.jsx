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

export default function NoticeBoard() {
    const router = useRouter();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/announcements?limit=4&sort=-createdAt`)
            .then(r => setNotices(r.data.announcements || r.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading || notices.length === 0) return null;

    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

    return (
        <div style={{ margin: "24px 16px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "linear-gradient(135deg, #00256e, #1f3c88)", cursor: "pointer" }}
                onClick={() => router.push("/notices")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📢</span>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Notice Board</p>
                    {/* Blinking dot */}
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", animation: "blink 1.2s ease-in-out infinite", display: "inline-block" }} />
                </div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0 }}>View all →</p>
            </div>

            {/* Notice list */}
            <div>
                {notices.map((n, i) => {
                    const type = TYPE_COLORS[n.type] || TYPE_COLORS.general;
                    return (
                        <div key={n._id}
                            onClick={() => router.push(`/notices/${n._id}`)}
                            style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 18px", borderBottom: i < notices.length - 1 ? "1px solid #f3f4f6" : "none", cursor: "pointer", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: type.dot, flexShrink: 0, marginTop: 6 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {n.title}
                                </p>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: type.bg, color: type.color, fontWeight: 600 }}>{type.label}</span>
                                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{fmt(n.createdAt)}</span>
                                </div>
                            </div>
                            <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>›</span>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div onClick={() => router.push("/notices")}
                style={{ padding: "10px 18px", textAlign: "center", cursor: "pointer", borderTop: "1px solid #f3f4f6", background: "#fafafa" }}>
                <p style={{ fontSize: 12, color: "#00256e", fontWeight: 600, margin: 0 }}>View all notices →</p>
            </div>

            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }`}</style>
        </div>
    );
}