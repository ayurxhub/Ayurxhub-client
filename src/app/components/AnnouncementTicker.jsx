"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const TYPE_CONFIG = {
    notice: { label: "NOTICE", color: "#60a5fa", bg: "rgba(96,165,250,0.15)", icon: "📢" },
    job: { label: "JOB", color: "#34d399", bg: "rgba(52,211,153,0.15)", icon: "💼" },
    exam: { label: "EXAM", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: "📝" },
    event: { label: "EVENT", color: "#a78bfa", bg: "rgba(167,139,250,0.15)", icon: "🗓️" },
    alert: { label: "ALERT", color: "#f87171", bg: "rgba(248,113,113,0.15)", icon: "⚠️" },
    news: { label: "NEWS", color: "#1D9E75", bg: "rgba(29,158,117,0.15)", icon: "📰" },
};

export default function AnnouncementTicker() {
    const [announcements, setAnnouncements] = useState([]);
    const [current, setCurrent] = useState(0);
    const [visible, setVisible] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        axios.get(`${API}/announcements`).then(res => {
            if (res.data.announcements?.length > 0) {
                setAnnouncements(res.data.announcements);
            }
        }).catch(() => { });
    }, []);

    // Auto-rotate every 4s
    useEffect(() => {
        if (announcements.length <= 1) return;
        timerRef.current = setInterval(() => {
            setVisible(false);
            setTimeout(() => {
                setCurrent(c => (c + 1) % announcements.length);
                setVisible(true);
            }, 300);
        }, 4000);
        return () => clearInterval(timerRef.current);
    }, [announcements.length]);

    if (announcements.length === 0) return null;

    const a = announcements[current];
    const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.notice;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10, padding: "8px 14px",
            marginBottom: 20, flexWrap: "wrap",
            backdropFilter: "blur(8px)",
            transition: "opacity 0.3s",
            opacity: visible ? 1 : 0,
        }}>
            {/* Type badge */}
            <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                padding: "2px 8px", borderRadius: 20,
                background: cfg.bg, color: cfg.color,
                flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
            }}>
                {cfg.icon} {cfg.label}
            </span>

            {/* Divider */}
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />

            {/* Message */}
            <span style={{
                fontSize: 12, color: "rgba(255,255,255,0.9)",
                fontWeight: 500, flex: 1, lineHeight: 1.4,
                minWidth: 0,
            }}>
                <span style={{ fontWeight: 700, marginRight: 4 }}>{a.title}:</span>
                {a.message}
            </span>

            {/* Dots navigation */}
            {announcements.length > 1 && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {announcements.map((_, i) => (
                        <button key={i} onClick={() => { setCurrent(i); clearInterval(timerRef.current); }}
                            style={{
                                width: i === current ? 16 : 6,
                                height: 6, borderRadius: 3, border: "none",
                                background: i === current ? "#fff" : "rgba(255,255,255,0.3)",
                                cursor: "pointer", padding: 0,
                                transition: "all 0.2s",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}