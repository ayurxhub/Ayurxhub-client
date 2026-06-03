"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const publicApi = axios.create({ baseURL: API });

const TYPE_LABELS = {
    crash_course: { label: "Crash Course", emoji: "🚀" },
    mock_series: { label: "Mock Series", emoji: "📝" },
    subject_sprint: { label: "Sprint", emoji: "⚡" },
};

export default function CoursesPage() {
    const { user, authAxios } = useAuth();
    const router = useRouter();

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrolledSlugs, setEnrolledSlugs] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [batchRes] = await Promise.all([publicApi.get("/batches")]);
                setBatches(batchRes.data.batches || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!user) return;
        // Pull enrolled slugs from the user object if available, else fetch profile
        if (user.enrolledBatches) setEnrolledSlugs(user.enrolledBatches);
    }, [user]);

    const fmt = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 60%, #0e4f3b 100%)", padding: "36px 32px 28px" }}>
                <div style={{ maxWidth: 900, margin: "0 auto" }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>AyuRxHub</p>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Courses & Batches</h1>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0 }}>
                        Structured crash courses, mock series and subject sprints
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : batches.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 80 }}>
                        <p style={{ fontSize: 36, margin: "0 0 12px" }}>📚</p>
                        <p style={{ fontSize: 16, color: "#6b7280" }}>No courses published yet. Check back soon!</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {batches.map((b) => {
                            const enrolled = enrolledSlugs.includes(b.slug);
                            const typeInfo = TYPE_LABELS[b.type] || { label: b.type, emoji: "📚" };
                            const isFree = b.price === 0;

                            return (
                                <button
                                    key={b._id}
                                    onClick={() => router.push(`/courses/${b.slug}`)}
                                    style={{
                                        background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 55%, #0e4f3b 100%)",
                                        borderRadius: 16,
                                        padding: "22px 26px",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 16,
                                        border: "none",
                                        width: "100%",
                                        boxShadow: "0 4px 20px rgba(0,37,110,0.18)",
                                        fontFamily: "inherit",
                                        textAlign: "left",
                                        transition: "transform 0.15s, box-shadow 0.15s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,37,110,0.28)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,37,110,0.18)"; }}
                                >
                                    {/* Left — icon + info */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                        <div style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{b.icon || "📚"}</div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{b.title}</span>
                                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                                                    {typeInfo.emoji} {typeInfo.label}
                                                </span>
                                                {enrolled && (
                                                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(29,158,117,0.4)", color: "#fff", fontWeight: 700 }}>
                                                        ✓ Enrolled
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                                                    📅 {b.durationDays} days
                                                </span>
                                                {b.totalTests > 0 && (
                                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                                                        📋 {b.totalTests} tests
                                                    </span>
                                                )}
                                                {b.startDate && (
                                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                                                        🗓 Starts {fmt(b.startDate)}
                                                    </span>
                                                )}
                                                {b.subjects?.length > 0 && (
                                                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                                                        {b.subjects.slice(0, 2).join(", ")}{b.subjects.length > 2 ? ` +${b.subjects.length - 2}` : ""}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right — price + CTA */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: isFree ? "#4ade80" : "#fbbf24" }}>
                                            {isFree ? "FREE" : `₹${b.price}`}
                                        </span>
                                        <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                                            {enrolled ? "Continue →" : "View Course →"}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}