"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useParams } from "next/navigation";

import ProtectedRoute from "../../components/ProtectedRoute";

export default function ExpertProfilePage() {
    return <ProtectedRoute><ExpertProfile /></ProtectedRoute>;
}

function ExpertProfile() {
    const { authAxios, user } = useAuth();
    const router = useRouter();
    const { id } = useParams();

    const [expert, setExpert] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("about");

    useEffect(() => {
        if (id) loadAll();
    }, [id]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [expRes, avRes] = await Promise.all([
                authAxios.get(`/profile/experts/${id}`),
                authAxios.get(`/availability/${id}`),
            ]);
            setExpert(expRes.data.expert);
            setAvailability(avRes.data.availableSlots || []);

            // Try to load reviews (may not have route yet — handle gracefully)
            try {
                const revRes = await authAxios.get(`/profile/experts/${id}/reviews`);
                setReviews(revRes.data.reviews || []);
            } catch { setReviews([]); }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initials = (name) =>
        name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const formatDay = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
    };

    if (loading) return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!expert) return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            <Navbar title="Expert Profile" />
            <div style={{ textAlign: "center", padding: 80, color: "#757682" }}>Expert not found</div>
        </div>
    );

    const nextSlots = availability.slice(0, 3);
    const canBook = user?.role !== "expert" && expert.isAvailable;

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>


            <div style={{ padding: "28px 32px", maxWidth: 900 }}>

                {/* Back */}
                <button onClick={() => router.back()} style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
                    background: "none", border: "none", color: "#757682", cursor: "pointer",
                    fontSize: 13, fontFamily: "inherit",
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                    Back to experts
                </button>

                {/* Hero card */}
                <div style={{
                    background: "#fff", borderRadius: 20, border: "0.5px solid rgba(197,198,211,0.35)",
                    boxShadow: "0 1px 8px rgba(0,37,110,0.05)", padding: 28, marginBottom: 20,
                }}>
                    <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                        {/* Avatar */}
                        {expert.avatar ? (
                            <img src={expert.avatar} alt={expert.name} style={{
                                width: 100, height: 100, borderRadius: "50%",
                                objectFit: "cover", border: "3px solid #9FE1CB", flexShrink: 0,
                            }} />
                        ) : (
                            <div style={{
                                width: 100, height: 100, borderRadius: "50%", flexShrink: 0,
                                background: "#E1F5EE", display: "flex", alignItems: "center",
                                justifyContent: "center", fontSize: 28, fontWeight: 700,
                                color: "#0F6E56", border: "3px solid #9FE1CB",
                            }}>{initials(expert.name)}</div>
                        )}

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
                                <div>
                                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", marginBottom: 4 }}>
                                        {expert.name}
                                    </h1>
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {expert.isVerified && (
                                            <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#E1F5EE", color: "#0F6E56", fontWeight: 600 }}>✓ Verified</span>
                                        )}
                                        <span style={{
                                            fontSize: 11, padding: "2px 10px", borderRadius: 20, fontWeight: 600,
                                            background: expert.isAvailable ? "#E6F1FB" : "#f2f4f7",
                                            color: expert.isAvailable ? "#185FA5" : "#9ca3af",
                                        }}>
                                            {expert.isAvailable ? "● Available" : "○ Unavailable"}
                                        </span>
                                        <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 20, background: "#f7f9fc", color: "#444651", border: "0.5px solid rgba(197,198,211,0.5)" }}>
                                            {expert.officialId}
                                        </span>
                                    </div>
                                </div>

                                {canBook && (
                                    <button
                                        onClick={() => router.push(`/consultations/${id}/book`)}
                                        style={{
                                            padding: "11px 24px", borderRadius: 12,
                                            background: "linear-gradient(135deg, #00256e, #1f3c88)",
                                            color: "#fff", border: "none", fontSize: 14,
                                            fontWeight: 600, cursor: "pointer",
                                            boxShadow: "0 4px 12px rgba(0,37,110,0.20)",
                                        }}
                                    >
                                        Book Consultation
                                    </button>
                                )}
                            </div>

                            {/* Qualifications */}
                            {expert.qualifications?.length > 0 && (
                                <p style={{ fontSize: 13, color: "#757682", marginBottom: 10 }}>
                                    {expert.qualifications.map((q) => `${q.degree}${q.institution ? ` — ${q.institution}` : ""}`).join(" · ")}
                                </p>
                            )}

                            {/* Stats */}
                            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                {[
                                    ["Experience", expert.experience > 0 ? `${expert.experience} yrs` : "—"],
                                    ["Fee/session", expert.consultationFee > 0 ? `₹${expert.consultationFee}` : "Free"],
                                    ["Rating", expert.totalReviews > 0 ? `★ ${expert.rating?.toFixed(1)} (${expert.totalReviews})` : "No reviews yet"],
                                ].map(([label, val]) => (
                                    <div key={label}>
                                        <p style={{ fontSize: 10, color: "#757682", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#191c1e" }}>{val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Languages */}
                    {expert.languages?.length > 0 && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "0.5px solid rgba(197,198,211,0.4)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 6, color: "#757682" }}>language</span>
                            <span style={{ fontSize: 13, color: "#757682" }}>Speaks: {expert.languages.join(", ")}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, marginBottom: 20, border: "0.5px solid rgba(197,198,211,0.35)", width: "fit-content" }}>
                    {["about", "availability", "reviews"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 500, textTransform: "capitalize", fontFamily: "inherit",
                            background: activeTab === tab ? "#00256e" : "transparent",
                            color: activeTab === tab ? "#fff" : "#757682",
                            transition: "all 0.15s",
                        }}>{tab}</button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === "about" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                        {/* Bio */}
                        {expert.bio && (
                            <Section title="About">
                                <p style={{ fontSize: 14, color: "#444651", lineHeight: 1.8 }}>{expert.bio}</p>
                            </Section>
                        )}

                        {/* Specializations */}
                        {expert.specializations?.length > 0 && (
                            <Section title="Specializations">
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                    {expert.specializations.map((s) => (
                                        <span key={s} style={{
                                            padding: "6px 14px", borderRadius: 20, fontSize: 13,
                                            background: "#dbe1ff", color: "#00256e",
                                            border: "0.5px solid rgba(0,37,110,0.1)",
                                        }}>{s}</span>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Qualifications */}
                        {expert.qualifications?.length > 0 && (
                            <Section title="Qualifications">
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {expert.qualifications.map((q, i) => (
                                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0F6E56" }}>school</span>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: "#191c1e" }}>{q.degree}</p>
                                                {q.institution && <p style={{ fontSize: 12, color: "#757682" }}>{q.institution}{q.year ? ` · ${q.year}` : ""}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Session modes */}
                        <Section title="Session Modes">
                            <div style={{ display: "flex", gap: 10 }}>
                                {[
                                    { icon: "videocam", label: "Video Call", desc: "Face-to-face consultation" },
                                    { icon: "chat", label: "Chat", desc: "Text based session" },
                                    { icon: "call", label: "Phone Call", desc: "Voice consultation" },
                                ].map(({ icon, label, desc }) => (
                                    <div key={label} style={{
                                        flex: 1, padding: "14px 12px", borderRadius: 12, textAlign: "center",
                                        border: "0.5px solid rgba(197,198,211,0.5)", background: "#f7f9fc",
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#00256e", display: "block", marginBottom: 6 }}>{icon}</span>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", marginBottom: 2 }}>{label}</p>
                                        <p style={{ fontSize: 11, color: "#757682" }}>{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </div>
                )}

                {activeTab === "availability" && (
                    <Section title="Available Slots — Next 14 Days">
                        {availability.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 40, color: "#757682" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 8, color: "#c5c6d3" }}>calendar_today</span>
                                <p>No available slots in the next 14 days</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {availability.map((day) => (
                                    <div key={day.date} style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                                        <div style={{ width: 110, flexShrink: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e" }}>{formatDay(day.date)}</p>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, flex: 1 }}>
                                            {day.slots.map((slot) => (
                                                <button
                                                    key={slot.startTime}
                                                    onClick={() => canBook && router.push(`/consultations/${id}/book?date=${day.date}&start=${slot.startTime}&end=${slot.endTime}`)}
                                                    style={{
                                                        padding: "6px 12px", borderRadius: 8, fontSize: 12,
                                                        border: "0.5px solid rgba(0,37,110,0.2)",
                                                        background: canBook ? "#E6F1FB" : "#f2f4f7",
                                                        color: canBook ? "#185FA5" : "#9ca3af",
                                                        cursor: canBook ? "pointer" : "default",
                                                        fontFamily: "inherit",
                                                    }}
                                                >
                                                    {slot.startTime} – {slot.endTime}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {canBook && availability.length > 0 && (
                            <button
                                onClick={() => router.push(`/consultations/${id}/book`)}
                                style={{
                                    marginTop: 20, padding: "11px 24px", borderRadius: 12,
                                    background: "linear-gradient(135deg, #00256e, #1f3c88)",
                                    color: "#fff", border: "none", fontSize: 14,
                                    fontWeight: 600, cursor: "pointer",
                                }}
                            >
                                Book a Slot
                            </button>
                        )}
                    </Section>
                )}

                {activeTab === "reviews" && (
                    <Section title={`Reviews (${reviews.length})`}>
                        {reviews.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 40, color: "#757682" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 8, color: "#c5c6d3" }}>rate_review</span>
                                <p>No reviews yet</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {reviews.map((r) => (
                                    <div key={r._id} style={{ padding: 16, borderRadius: 12, border: "0.5px solid rgba(197,198,211,0.35)", background: "#fafafa" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dbe1ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#00256e" }}>
                                                    {initials(r.student?.name)}
                                                </div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e" }}>{r.student?.name}</p>
                                            </div>
                                            <span style={{ color: "#EF9F27", fontSize: 15 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                        </div>
                                        {r.comment && <p style={{ fontSize: 13, color: "#444651", lineHeight: 1.7 }}>{r.comment}</p>}
                                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                                            {new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                )}

                {/* Sticky book button on mobile */}
                {canBook && (
                    <div style={{ marginTop: 24 }}>
                        <button
                            onClick={() => router.push(`/consultations/${id}/book`)}
                            style={{
                                width: "100%", padding: "13px", borderRadius: 12,
                                background: "linear-gradient(135deg, #00256e, #1f3c88)",
                                color: "#fff", border: "none", fontSize: 15,
                                fontWeight: 600, cursor: "pointer",
                                boxShadow: "0 4px 16px rgba(0,37,110,0.20)",
                            }}
                        >
                            Book Consultation — {expert.consultationFee > 0 ? `₹${expert.consultationFee}` : "Free"}
                        </button>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div style={{
            background: "#fff", borderRadius: 16, padding: 22,
            border: "0.5px solid rgba(197,198,211,0.35)",
            boxShadow: "0 1px 8px rgba(0,37,110,0.04)",
        }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#00256e", marginBottom: 16 }}>{title}</h2>
            {children}
        </div>
    );
}