"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";

const SPECIALIZATIONS = [
    "All", "Panchakarma", "Dravyaguna", "Kayachikitsa", "Shalya Tantra",
    "Prasuti Tantra", "Kaumarabhritya", "Shalakya", "Rasayana", "Manas Roga",
];

export default function ConsultationsPage() {
    return <ProtectedRoute><ExpertListing /></ProtectedRoute>;
}

function ExpertListing() {
    const { authAxios } = useAuth();
    const router = useRouter();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeSpec, setActiveSpec] = useState("All");
    const [maxFee, setMaxFee] = useState("");
    const [onlyAvailable, setOnlyAvailable] = useState(false);
    const [sortBy, setSortBy] = useState("-rating");

    useEffect(() => {
        fetchExperts();
    }, [activeSpec, onlyAvailable, sortBy]);

    const fetchExperts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeSpec !== "All") params.append("specialization", activeSpec);
            if (maxFee) params.append("maxFee", maxFee);
            if (onlyAvailable) params.append("isAvailable", "true");
            params.append("verificationStatus", "approved");  // ← add this
            params.append("sort", sortBy);
            params.append("limit", "30");
            const res = await authAxios.get(`/profile/experts?${params}`);
            setExperts(res.data.experts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initials = (name) =>
        name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const filtered = experts.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.specializations?.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
        e.bio?.toLowerCase().includes(search.toLowerCase())
    );

    const Stars = ({ rating }) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        return (
            <span style={{ color: "#EF9F27", fontSize: 13, letterSpacing: 1 }}>
                {"★".repeat(full)}
                {half ? "½" : ""}
                {"☆".repeat(5 - full - (half ? 1 : 0))}
            </span>
        );
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>

            <div style={{ padding: "28px 32px" }}>
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#00256e", marginBottom: 4 }}>
                        Find an Expert
                    </h1>
                    <p style={{ fontSize: 14, color: "#757682" }}>
                        Book 1-on-1 sessions with verified Ayurveda practitioners
                    </p>
                </div>

                {/* Search + Sort bar */}
                <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                        <span className="material-symbols-outlined" style={{
                            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                            fontSize: 16, color: "#757682", pointerEvents: "none",
                        }}>search</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name, specialization..."
                            style={{ ...inputSt, paddingLeft: 34, width: "100%" }}
                            onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.12)"; }}
                            onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                        />
                    </div>

                    <input
                        type="number"
                        placeholder="Max fee (₹)"
                        value={maxFee}
                        onChange={(e) => { setMaxFee(e.target.value); }}
                        onBlur={fetchExperts}
                        style={{ ...inputSt, width: 140 }}
                    />

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={inputSt}
                    >
                        <option value="-rating">Top Rated</option>
                        <option value="-totalReviews">Most Reviewed</option>
                        <option value="consultationFee">Fee: Low to High</option>
                        <option value="-consultationFee">Fee: High to Low</option>
                        <option value="-experience">Most Experienced</option>
                    </select>

                    <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#444651", whiteSpace: "nowrap" }}>
                        <div
                            onClick={() => setOnlyAvailable(!onlyAvailable)}
                            style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: onlyAvailable ? "#1D9E75" : "#d1d5db",
                                position: "relative", transition: "background 0.2s", cursor: "pointer",
                            }}
                        >
                            <div style={{
                                width: 16, height: 16, borderRadius: "50%", background: "#fff",
                                position: "absolute", top: 2, left: onlyAvailable ? 18 : 2,
                                transition: "left 0.2s",
                            }} />
                        </div>
                        Available only
                    </label>
                </div>

                {/* Specialization Pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
                    {SPECIALIZATIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => setActiveSpec(s)}
                            style={{
                                padding: "5px 14px", borderRadius: 20, border: "0.5px solid",
                                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                                fontWeight: activeSpec === s ? 600 : 400,
                                background: activeSpec === s ? "#00256e" : "#fff",
                                color: activeSpec === s ? "#fff" : "#757682",
                                borderColor: activeSpec === s ? "#00256e" : "rgba(197,198,211,0.5)",
                                transition: "all 0.15s",
                            }}
                        >{s}</button>
                    ))}
                </div>

                {/* Results count */}
                {!loading && (
                    <p style={{ fontSize: 12, color: "#757682", marginBottom: 16 }}>
                        {filtered.length} expert{filtered.length !== 1 ? "s" : ""} found
                    </p>
                )}

                {/* Grid */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 16, border: "0.5px solid rgba(197,198,211,0.35)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#c5c6d3", display: "block", marginBottom: 12 }}>person_search</span>
                        <p style={{ fontSize: 15, color: "#444651", fontWeight: 500 }}>No experts found</p>
                        <p style={{ fontSize: 13, color: "#757682", marginTop: 4 }}>Try changing your filters</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
                        {filtered.map((expert) => (
                            <div
                                key={expert._id}
                                onClick={() => router.push(`/consultations/${expert._id}`)}
                                style={{
                                    background: "#fff", border: "0.5px solid rgba(197,198,211,0.35)",
                                    borderRadius: 16, padding: 22, cursor: "pointer",
                                    transition: "all 0.18s", boxShadow: "0 1px 8px rgba(0,37,110,0.05)",
                                    display: "flex", flexDirection: "column",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,37,110,0.10)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,37,110,0.05)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                {/* Top: avatar + name + badges */}
                                <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                                    {expert.avatar ? (
                                        <img src={expert.avatar} alt={expert.name} style={{
                                            width: 56, height: 56, borderRadius: "50%",
                                            objectFit: "cover", border: "2px solid #9FE1CB", flexShrink: 0,
                                        }} />
                                    ) : (
                                        <div style={{
                                            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                                            background: "#E1F5EE", display: "flex", alignItems: "center",
                                            justifyContent: "center", fontSize: 18, fontWeight: 600,
                                            color: "#0F6E56", border: "2px solid #9FE1CB",
                                        }}>{initials(expert.name)}</div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 15, fontWeight: 600, color: "#191c1e", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {expert.name}
                                        </p>
                                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                            {expert.verificationStatus === "approved" && (
                                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#E1F5EE", color: "#0F6E56", fontWeight: 600 }}>
                                                    ✓ Verified
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                                                background: expert.isAvailable ? "#E6F1FB" : "#f2f4f7",
                                                color: expert.isAvailable ? "#185FA5" : "#9ca3af",
                                            }}>
                                                {expert.isAvailable ? "● Available" : "○ Unavailable"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Qualifications */}
                                {expert.qualifications?.length > 0 && (
                                    <p style={{ fontSize: 12, color: "#757682", marginBottom: 8 }}>
                                        {expert.qualifications.map((q) => q.degree).join(" · ")}
                                    </p>
                                )}

                                {/* Specializations */}
                                {expert.specializations?.length > 0 && (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                                        {expert.specializations.slice(0, 3).map((s) => (
                                            <span key={s} style={{
                                                fontSize: 11, padding: "3px 9px", borderRadius: 20,
                                                background: "#f7f9fc", color: "#444651",
                                                border: "0.5px solid rgba(197,198,211,0.5)",
                                            }}>{s}</span>
                                        ))}
                                        {expert.specializations.length > 3 && (
                                            <span style={{ fontSize: 11, color: "#757682" }}>+{expert.specializations.length - 3} more</span>
                                        )}
                                    </div>
                                )}

                                {/* Bio */}
                                {expert.bio && (
                                    <p style={{
                                        fontSize: 12, color: "#757682", lineHeight: 1.6,
                                        marginBottom: 14, flex: 1,
                                        display: "-webkit-box", WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical", overflow: "hidden",
                                    }}>{expert.bio}</p>
                                )}

                                {/* Stats row */}
                                <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "12px 0", borderTop: "0.5px solid rgba(197,198,211,0.4)",
                                    borderBottom: "0.5px solid rgba(197,198,211,0.4)", marginBottom: 14,
                                }}>
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ fontSize: 11, color: "#757682", marginBottom: 2 }}>Experience</p>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#191c1e" }}>
                                            {expert.experience > 0 ? `${expert.experience} yrs` : "—"}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ fontSize: 11, color: "#757682", marginBottom: 2 }}>Rating</p>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#191c1e" }}>
                                            {expert.totalReviews > 0 ? (
                                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                                    <span style={{ color: "#EF9F27" }}>★</span>
                                                    {expert.rating?.toFixed(1)}
                                                    <span style={{ fontSize: 11, color: "#757682", fontWeight: 400 }}>({expert.totalReviews})</span>
                                                </span>
                                            ) : "New"}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <p style={{ fontSize: 11, color: "#757682", marginBottom: 2 }}>Fee</p>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#191c1e" }}>
                                            {expert.consultationFee > 0 ? `₹${expert.consultationFee}` : "Free"}
                                        </p>
                                    </div>
                                </div>

                                {/* Languages */}
                                {expert.languages?.length > 0 && (
                                    <p style={{ fontSize: 11, color: "#757682", marginBottom: 12 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: "middle", marginRight: 3 }}>language</span>
                                        {expert.languages.join(", ")}
                                    </p>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); router.push(`/consultations/${expert._id}`); }}
                                    style={{
                                        width: "100%", padding: "10px", borderRadius: 10,
                                        background: "linear-gradient(135deg, #00256e, #1f3c88)",
                                        color: "#fff", border: "none", fontSize: 13,
                                        fontWeight: 600, cursor: "pointer", marginTop: "auto",
                                    }}
                                >
                                    View Profile & Book
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const inputSt = {
    padding: "9px 12px", borderRadius: 10,
    border: "0.5px solid rgba(197,198,211,0.5)",
    background: "#fff", color: "#191c1e",
    fontSize: 13, fontFamily: "inherit", outline: "none",
};