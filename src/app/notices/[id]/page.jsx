"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPE_COLORS = {
    important: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444", label: "Important" },
    info: { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6", label: "Info" },
    event: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b", label: "Event" },
    general: { bg: "#f0fdf4", color: "#166534", dot: "#22c55e", label: "General" },
};

export default function NoticeDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [notice, setNotice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API}/announcements/${id}`)
            .then(r => setNotice(r.data.announcement || r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const fmt = (d) => new Date(d).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    if (loading) return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!notice) return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <p style={{ fontSize: 36 }}>📭</p>
            <p style={{ fontSize: 15, color: "#6b7280" }}>Notice not found</p>
            <button onClick={() => router.push("/notices")}
                style={{ padding: "8px 20px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>
                ← Back to Notices
            </button>
        </div>
    );

    const type = TYPE_COLORS[notice.type] || TYPE_COLORS.general;

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", padding: "24px 16px" }}>
            <div style={{ maxWidth: 680, margin: "0 auto" }}>

                <button onClick={() => router.push("/notices")}
                    style={{ background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 4 }}>
                    ← All Notices
                </button>

                <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                    {/* Top color bar */}
                    <div style={{ height: 4, background: type.dot }} />

                    <div style={{ padding: "24px 24px 32px" }}>
                        {/* Type + date */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: type.bg, color: type.color, fontWeight: 700 }}>
                                {type.label}
                            </span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{fmt(notice.createdAt)}</span>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 800, color: "#111827", margin: "0 0 20px", lineHeight: 1.3 }}>
                            {notice.title}
                        </h1>

                        {/* Divider */}
                        <div style={{ height: 1, background: "#f3f4f6", margin: "0 0 20px" }} />

                        {/* Content */}
                        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                            {notice.message || notice.content || notice.body || "No details available."}
                        </div>

                        {/* Link if present */}
                        {notice.link && (
                            <a href={notice.link} target="_blank" rel="noopener noreferrer"
                                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, padding: "9px 18px", borderRadius: 8, background: "#00256e", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                                View Link →
                            </a>
                        )}
                    </div>
                </div>

                {/* Back button */}
                <div style={{ textAlign: "center", marginTop: 20 }}>
                    <button onClick={() => router.push("/notices")}
                        style={{ padding: "9px 24px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                        ← Back to Notices
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}