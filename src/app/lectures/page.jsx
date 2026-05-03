"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ProtectedRoute from "../components/ProtectedRoute";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LecturesPage() {
    return <ProtectedRoute><LecturesBrowser /></ProtectedRoute>;
}

function LecturesBrowser() {
    const [grouped, setGrouped] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState(null);
    const [activeLecture, setActiveLecture] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        axios.get(`${API}/lectures/grouped`).then(res => {
            const g = res.data.grouped || {};
            setGrouped(g);
            const firstSubject = Object.keys(g)[0];
            if (firstSubject) setActiveSubject(firstSubject);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const subjects = Object.keys(grouped);
    const topics = activeSubject ? grouped[activeSubject] || {} : {};

    // Flatten all lectures for search
    const allLectures = Object.values(grouped).flatMap(topics =>
        Object.values(topics).flat()
    );
    const searchResults = search.trim()
        ? allLectures.filter(l =>
            l.title.toLowerCase().includes(search.toLowerCase()) ||
            l.subject.toLowerCase().includes(search.toLowerCase()) ||
            l.topic?.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const totalLectures = allLectures.length;

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 60%, #0e4f3b 100%)", padding: "32px 24px" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>AyurXHub</p>
                    <h1 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                        🎬 Lecture Videos
                    </h1>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
                        {totalLectures} lectures across {subjects.length} subjects
                    </p>
                    {/* Search */}
                    <div style={{ position: "relative", maxWidth: 420 }}>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search lectures, subjects, topics..."
                            style={{ width: "100%", padding: "10px 14px 10px 38px", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, opacity: 0.6 }}>🔍</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading lectures...</div>
            ) : subjects.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60 }}>
                    <p style={{ fontSize: 40, margin: "0 0 12px" }}>🎬</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#374151" }}>No lectures published yet</p>
                    <p style={{ fontSize: 13, color: "#9ca3af" }}>Check back soon — lectures are being added</p>
                </div>
            ) : search.trim() ? (
                /* Search results */
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
                    <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"</p>
                    <div className="lec-grid">
                        {searchResults.map(l => <LectureCard key={l._id} l={l} onPlay={() => setActiveLecture(l)} />)}
                    </div>
                    {searchResults.length === 0 && <p style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>No lectures found for "{search}"</p>}
                </div>
            ) : (
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }} className="lec-layout">

                    {/* Subject sidebar */}
                    <div style={{ position: "sticky", top: 16, height: "fit-content" }}>
                        <p style={{ fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Subjects</p>
                        {subjects.map(s => {
                            const count = Object.values(grouped[s]).flat().length;
                            return (
                                <button key={s} onClick={() => setActiveSubject(s)} style={{
                                    width: "100%", textAlign: "left", padding: "9px 12px",
                                    borderRadius: 8, border: "none", marginBottom: 3,
                                    background: activeSubject === s ? "#eff6ff" : "transparent",
                                    color: activeSubject === s ? "#00256e" : "#374151",
                                    fontSize: 12, fontWeight: activeSubject === s ? 700 : 400,
                                    cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                                    <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0, marginLeft: 4 }}>{count}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Topics & lectures */}
                    <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 20px" }}>{activeSubject}</h2>
                        {Object.entries(topics).map(([topic, lectures]) => (
                            <div key={topic} style={{ marginBottom: 28 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                    <div style={{ height: 1, flex: "none", width: 16, background: "#e5e7eb" }} />
                                    <p style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, whiteSpace: "nowrap" }}>{topic}</p>
                                    <div style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
                                    <span style={{ fontSize: 10, color: "#9ca3af", flexShrink: 0 }}>{lectures.length} lectures</span>
                                </div>
                                <div className="lec-grid">
                                    {lectures.map(l => <LectureCard key={l._id} l={l} onPlay={() => setActiveLecture(l)} />)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Video player modal */}
            {activeLecture && (
                <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
                    onClick={e => e.target === e.currentTarget && setActiveLecture(null)}>
                    <div style={{ background: "#000", borderRadius: 16, width: "100%", maxWidth: 900, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
                        {/* Video */}
                        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                            {activeLecture.videoType === "youtube" || activeLecture.videoType === "external" ? (
                                <iframe src={activeLecture.videoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            ) : (
                                <video src={activeLecture.videoUrl} controls style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "#000" }} />
                            )}
                        </div>
                        {/* Info */}
                        <div style={{ padding: "16px 20px", background: "#111", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{activeLecture.title}</p>
                                <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{activeLecture.subject}{activeLecture.topic ? ` · ${activeLecture.topic}` : ""}</p>
                                {activeLecture.description && <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0 0", lineHeight: 1.5 }}>{activeLecture.description}</p>}
                            </div>
                            <button onClick={() => setActiveLecture(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .lec-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 14px;
                }
                @media (max-width: 768px) {
                    .lec-layout {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

function LectureCard({ l, onPlay }) {
    return (
        <div onClick={onPlay} style={{
            background: "#fff", borderRadius: 12, overflow: "hidden",
            border: "1px solid #e5e7eb", cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            transition: "transform 0.2s, box-shadow 0.2s",
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}>
            {/* Thumbnail */}
            <div style={{ position: "relative", height: 140, background: "#1a1a2e", overflow: "hidden" }}>
                {l.thumbnail ? (
                    <img src={l.thumbnail} alt={l.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🎬</div>
                )}
                {/* Play overlay */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", opacity: 0, transition: "opacity 0.2s" }}
                    className="play-overlay">
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>▶</div>
                </div>
                {/* Duration badge */}
                {l.duration > 0 && (
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "2px 6px", borderRadius: 6 }}>
                        {Math.floor(l.duration / 60)}:{String(l.duration % 60).padStart(2, "0")}
                    </span>
                )}
                {/* Free badge */}
                <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: l.isFree ? "#d1fae5" : "#fef3c7", color: l.isFree ? "#065f46" : "#92400e" }}>
                    {l.isFree ? "FREE" : "PRO"}
                </span>
            </div>

            {/* Content */}
            <div style={{ padding: "10px 12px 12px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>{l.title}</p>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{l.views} views</p>
            </div>
        </div>
    );
}