"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function BookingsPage() {
    return <ProtectedRoute><BookingsList /></ProtectedRoute>;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function toLocalDateStr(d) {
    const date = new Date(d);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getSessionStart(booking) {
    const dateStr = toLocalDateStr(booking.date);
    return new Date(`${dateStr}T${booking.startTime}`);
}

function getSessionEnd(booking) {
    const dateStr = toLocalDateStr(booking.date);
    return new Date(`${dateStr}T${booking.endTime}`);
}

// Session states relative to now
function getSessionState(booking) {
    if (booking.status !== "confirmed") return "not-confirmed";
    const now = new Date();
    const start = getSessionStart(booking);
    const end = getSessionEnd(booking);
    const joinFrom = new Date(start.getTime() - 15 * 60000); // 15 min early
    const joinUntil = new Date(end.getTime() + 15 * 60000);  // 15 min grace

    if (now < joinFrom) return "upcoming";
    if (now >= joinFrom && now <= joinUntil) return "live";
    if (now > joinUntil) return "ended";
    return "upcoming";
}

function useCountdown(booking) {
    const [label, setLabel] = useState("");

    useEffect(() => {
        if (!booking || booking.status !== "confirmed") return;

        const tick = () => {
            const now = new Date();
            const start = getSessionStart(booking);
            const diff = start - now;

            if (diff <= 0) {
                setLabel("now");
                return;
            }
            const totalMins = Math.floor(diff / 60000);
            const days = Math.floor(totalMins / 1440);
            const hrs = Math.floor((totalMins % 1440) / 60);
            const mins = totalMins % 60;

            if (days > 0) setLabel(`in ${days}d ${hrs}h`);
            else if (hrs > 0) setLabel(`in ${hrs}h ${mins}m`);
            else setLabel(`in ${mins} min`);
        };

        tick();
        const timer = setInterval(tick, 30000);
        return () => clearInterval(timer);
    }, [booking]);

    return label;
}

const STATUS_META = {
    pending: { label: "Awaiting Confirmation", bg: "#fef9c3", color: "#854d0e", icon: "⏳" },
    confirmed: { label: "Confirmed", bg: "#dcfce7", color: "#166534", icon: "✅" },
    completed: { label: "Completed", bg: "#dbeafe", color: "#1e40af", icon: "✓" },
    cancelled_student: { label: "Cancelled", bg: "#fee2e2", color: "#991b1b", icon: "✗" },
    cancelled_expert: { label: "Cancelled by Expert", bg: "#fee2e2", color: "#991b1b", icon: "✗" },
    no_show_student: { label: "No Show", bg: "#fee2e2", color: "#991b1b", icon: "✗" },
    no_show_expert: { label: "Expert No Show", bg: "#fee2e2", color: "#991b1b", icon: "✗" },
    expired: { label: "Expired", bg: "#f3f4f6", color: "#6b7280", icon: "○" },
};

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

// ── main component ────────────────────────────────────────────────────────────
function BookingsList() {
    const { authAxios, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("upcoming");
    const [cancelling, setCancelling] = useState(null);
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [successBanner, setSuccessBanner] = useState(searchParams.get("success") === "1");

    const isExpert = user?.role === "expert";
    const TABS = isExpert
        ? ["pending", "confirmed", "completed", "all"]
        : ["upcoming", "confirmed", "completed", "all"];

    useEffect(() => {
        if (successBanner) {
            const t = setTimeout(() => setSuccessBanner(false), 5000);
            return () => clearTimeout(t);
        }
    }, [successBanner]);

    const fetchBookings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const endpoint = isExpert ? "/bookings/expert" : "/bookings/my";
            let statusParam = "";
            if (activeTab === "upcoming") statusParam = "?status=pending&status=confirmed";
            else if (activeTab === "confirmed") statusParam = "?status=confirmed";
            else if (activeTab === "completed") statusParam = "?status=completed";
            else if (activeTab !== "all") statusParam = `?status=${activeTab}`;
            const res = await authAxios.get(`${endpoint}${statusParam}`);
            setBookings(res.data.bookings || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [activeTab, user, isExpert, authAxios]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const handleConfirm = async (id) => {
        try { await authAxios.put(`/bookings/${id}/confirm`); fetchBookings(); }
        catch (e) { alert(e.response?.data?.message || "Failed to confirm"); }
    };

    const handleComplete = async (id) => {
        try { await authAxios.put(`/bookings/${id}/complete`); fetchBookings(); }
        catch (e) { alert(e.response?.data?.message || "Failed to complete"); }
    };

    const handleCancel = async (id) => {
        const reason = window.prompt("Reason for cancellation (optional):");
        if (reason === null) return;
        setCancelling(id);
        try { await authAxios.put(`/bookings/${id}/cancel`, { reason }); fetchBookings(); }
        catch (e) { alert(e.response?.data?.message || "Cancellation failed"); }
        finally { setCancelling(null); }
    };

    const handleReviewSubmit = async () => {
        setSubmittingReview(true);
        try {
            await authAxios.post(`/bookings/${reviewModal}/review`, reviewForm);
            setReviewModal(null);
            setReviewForm({ rating: 5, comment: "" });
            fetchBookings();
        } catch (e) { alert(e.response?.data?.message || "Review failed"); }
        finally { setSubmittingReview(false); }
    };

    const otherPerson = (b) => isExpert ? b.student : b.expert;
    const initials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const formatTab = (s) => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>

            <div style={{ padding: "28px 32px", maxWidth: 860 }}>

                {/* Success banner */}
                {successBanner && (
                    <div style={{
                        padding: "14px 20px", borderRadius: 12, background: "#dcfce7",
                        border: "1px solid #86efac", color: "#166534",
                        fontSize: 14, fontWeight: 500, marginBottom: 24,
                        display: "flex", alignItems: "center", gap: 10,
                    }}>
                        <span style={{ fontSize: 20 }}>🎉</span>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600 }}>Booking request sent!</p>
                            <p style={{ margin: 0, fontSize: 13, opacity: 0.8 }}>
                                The expert will confirm shortly. You'll see the session details below once confirmed.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", margin: "0 0 4px" }}>
                            {isExpert ? "My Consultations" : "My Bookings"}
                        </h1>
                        <p style={{ fontSize: 14, color: "#757682", margin: 0 }}>
                            {isExpert ? "Manage your patient sessions" : "Track and join your consultations"}
                        </p>
                    </div>
                    {!isExpert && (
                        <button onClick={() => router.push("/consultations")} style={{
                            padding: "10px 20px", borderRadius: 12,
                            background: "linear-gradient(135deg, #00256e, #1f3c88)",
                            color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}>
                            + Book Consultation
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{
                    display: "flex", gap: 4, background: "#fff", borderRadius: 12,
                    padding: 4, marginBottom: 24, border: "0.5px solid rgba(197,198,211,0.35)",
                    width: "fit-content",
                }}>
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 12, fontWeight: 500, textTransform: "capitalize", fontFamily: "inherit",
                            background: activeTab === tab ? "#00256e" : "transparent",
                            color: activeTab === tab ? "#fff" : "#757682",
                            transition: "all 0.15s",
                        }}>
                            {tab === "all" ? "All" : formatTab(tab)}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : bookings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 16, border: "0.5px solid rgba(197,198,211,0.35)" }}>
                        <p style={{ fontSize: 36, margin: "0 0 10px" }}>📭</p>
                        <p style={{ fontSize: 15, fontWeight: 500, color: "#444651", marginBottom: 4 }}>No bookings found</p>
                        {!isExpert && (
                            <button onClick={() => router.push("/consultations")} style={{
                                marginTop: 12, padding: "9px 20px", borderRadius: 10,
                                background: "#00256e", color: "#fff", border: "none", fontSize: 13, cursor: "pointer",
                            }}>Browse Experts</button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {bookings.map(booking => (
                            <BookingCard
                                key={booking._id}
                                booking={booking}
                                isExpert={isExpert}
                                otherPerson={otherPerson(booking)}
                                initials={initials}
                                onConfirm={handleConfirm}
                                onComplete={handleComplete}
                                onCancel={handleCancel}
                                cancelling={cancelling}
                                onReview={() => setReviewModal(booking._id)}
                                onJoin={() => router.push(`/consultations/session/${booking._id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
                }}>
                    <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 460 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#00256e", marginBottom: 6 }}>Leave a Review</h2>
                        <p style={{ fontSize: 13, color: "#757682", marginBottom: 20 }}>How was your consultation?</p>
                        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 32, color: star <= reviewForm.rating ? "#EF9F27" : "#d1d5db", padding: 0 }}>
                                    ★
                                </button>
                            ))}
                            <span style={{ fontSize: 13, color: "#757682", alignSelf: "center", marginLeft: 4 }}>
                                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][reviewForm.rating]}
                            </span>
                        </div>
                        <textarea value={reviewForm.comment}
                            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                            placeholder="Share your experience (optional)..."
                            rows={4}
                            style={{
                                width: "100%", padding: "12px 14px", borderRadius: 10,
                                border: "0.5px solid rgba(197,198,211,0.5)", background: "#f7f9fc",
                                color: "#191c1e", fontSize: 13, fontFamily: "inherit",
                                outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 18,
                            }} />
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setReviewModal(null)}
                                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "0.5px solid rgba(197,198,211,0.5)", background: "transparent", color: "#444651", fontSize: 13, cursor: "pointer" }}>
                                Cancel
                            </button>
                            <button onClick={handleReviewSubmit} disabled={submittingReview}
                                style={{ flex: 2, padding: "11px", borderRadius: 10, background: "#00256e", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                                {submittingReview ? "Submitting…" : "Submit Review"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
            `}</style>
        </div>
    );
}

// ── Booking Card ──────────────────────────────────────────────────────────────
function BookingCard({ booking, isExpert, otherPerson, initials, onConfirm, onComplete, onCancel, cancelling, onReview, onJoin }) {
    const sessionState = getSessionState(booking);
    const countdown = useCountdown(booking);
    const isLive = sessionState === "live";
    const meta = STATUS_META[booking.status] || STATUS_META.expired;

    const borderColor = isLive ? "#1D9E75" : booking.status === "pending" ? "#fde68a" : "#e5e7eb";
    const bgColor = isLive ? "#f0fdf4" : "#fff";

    return (
        <div style={{
            background: bgColor, borderRadius: 16,
            border: `1.5px solid ${borderColor}`,
            boxShadow: isLive ? "0 0 0 4px rgba(29,158,117,0.08)" : "0 1px 6px rgba(0,0,0,0.05)",
            overflow: "hidden", animation: "fadeIn 0.2s ease",
        }}>
            {/* ── Live banner ── */}
            {isLive && (
                <div style={{
                    background: "#1D9E75", padding: "10px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1.2s infinite" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Session is live — join now!</span>
                    </div>
                    <button onClick={onJoin} style={{
                        padding: "7px 20px", borderRadius: 20,
                        background: "#fff", border: "none",
                        color: "#0F6E56", fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ fontSize: 15 }}>📹</span> Join Video Call
                    </button>
                </div>
            )}

            {/* ── Pending banner ── */}
            {booking.status === "pending" && !isExpert && (
                <div style={{
                    background: "#fef9c3", padding: "9px 20px",
                    display: "flex", alignItems: "center", gap: 8,
                    borderBottom: "1px solid #fde68a",
                }}>
                    <span style={{ fontSize: 14 }}>⏳</span>
                    <span style={{ fontSize: 13, color: "#854d0e", fontWeight: 500 }}>
                        Waiting for the expert to confirm your booking
                    </span>
                </div>
            )}

            <div style={{ padding: "18px 22px" }}>
                {/* Top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {otherPerson?.avatar ? (
                            <img src={otherPerson.avatar} alt={otherPerson.name}
                                style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb" }} />
                        ) : (
                            <div style={{
                                width: 48, height: 48, borderRadius: "50%",
                                background: isLive ? "#dcfce7" : "#f3f4f6",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 15, fontWeight: 700, color: isLive ? "#166534" : "#374151",
                                border: `2px solid ${isLive ? "#86efac" : "#e5e7eb"}`,
                            }}>{initials(otherPerson?.name)}</div>
                        )}
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>
                                {isExpert ? "" : "Dr. "}{otherPerson?.name}
                            </p>
                            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{otherPerson?.email}</p>
                        </div>
                    </div>
                    <span style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 20,
                        background: meta.bg, color: meta.color,
                    }}>
                        {meta.icon} {meta.label}
                    </span>
                </div>

                {/* Session details grid */}
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                    gap: 10, padding: 14, background: "#f9fafb", borderRadius: 10, marginBottom: 16,
                }}>
                    {[
                        ["📅 Date", formatDate(booking.date)],
                        ["🕐 Time", `${booking.startTime} – ${booking.endTime}`],
                        ["⏱ Duration", `${booking.duration} min`],
                        ["📡 Mode", booking.mode?.charAt(0).toUpperCase() + booking.mode?.slice(1)],
                        ["💳 Fee", booking.payment?.amount > 0 ? `₹${booking.payment.amount}` : "Free"],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* Countdown for confirmed upcoming */}
                {booking.status === "confirmed" && sessionState === "upcoming" && countdown && (
                    <div style={{
                        padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                        background: "#eff6ff", border: "1px solid #bfdbfe",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span style={{ fontSize: 16 }}>⏰</span>
                        <div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#1e40af", margin: 0 }}>
                                Session starts {countdown}
                            </p>
                            <p style={{ fontSize: 11, color: "#3b82f6", margin: 0 }}>
                                The "Join Video Call" button will appear 15 minutes before your session
                            </p>
                        </div>
                    </div>
                )}

                {/* Meeting link (once confirmed) */}
                {booking.status === "confirmed" && booking.meetingLink && sessionState !== "live" && (
                    <div style={{
                        padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                        background: "#f0fdf4", border: "1px solid #86efac",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>🔗</span>
                            <div>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", margin: 0 }}>Meeting link ready</p>
                                <p style={{ fontSize: 11, color: "#16a34a", margin: 0 }}>Join button appears 15 min before session</p>
                            </div>
                        </div>
                        <button onClick={onJoin} style={{
                            padding: "6px 16px", borderRadius: 8, border: "1px solid #86efac",
                            background: "#fff", color: "#166534", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>
                            Open Room Early
                        </button>
                    </div>
                )}

                {/* Prescription */}
                {booking.notes?.prescription && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#dbeafe", marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", marginBottom: 4 }}>📋 Prescription from Expert</p>
                        <p style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6, margin: 0 }}>{booking.notes.prescription}</p>
                    </div>
                )}

                {/* Student notes (visible to expert) */}
                {isExpert && booking.notes?.studentNotes && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fef9c3", marginBottom: 14 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#854d0e", marginBottom: 4 }}>📝 Patient notes</p>
                        <p style={{ fontSize: 13, color: "#854d0e", lineHeight: 1.6, margin: 0 }}>{booking.notes.studentNotes}</p>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                    {/* PRIMARY: Join (live) */}
                    {isLive && (
                        <button onClick={onJoin} style={{
                            ...btnBase, background: "#1D9E75", color: "#fff", border: "none",
                            fontWeight: 700, padding: "9px 20px",
                        }}>
                            📹 Join Video Call
                        </button>
                    )}

                    {/* Expert: confirm pending */}
                    {isExpert && booking.status === "pending" && (
                        <button onClick={() => onConfirm(booking._id)} style={{ ...btnBase, background: "#00256e", color: "#fff", border: "none" }}>
                            ✓ Confirm Booking
                        </button>
                    )}

                    {/* Expert: mark complete */}
                    {isExpert && booking.status === "confirmed" && sessionState === "ended" && (
                        <button onClick={() => onComplete(booking._id)} style={{ ...btnBase, background: "#1e40af", color: "#fff", border: "none" }}>
                            Mark Complete
                        </button>
                    )}

                    {/* Student: leave review */}
                    {!isExpert && booking.status === "completed" && !booking.reviewLeft && (
                        <button onClick={onReview} style={{ ...btnBase, color: "#1e40af", borderColor: "#bfdbfe" }}>
                            ⭐ Leave Review
                        </button>
                    )}

                    {/* Cancel */}
                    {["pending", "confirmed"].includes(booking.status) && (
                        <button onClick={() => onCancel(booking._id)} disabled={cancelling === booking._id}
                            style={{ ...btnBase, color: "#dc2626", borderColor: "#fecaca" }}>
                            {cancelling === booking._id ? "Cancelling…" : "Cancel"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const btnBase = {
    display: "flex", alignItems: "center", gap: 5,
    padding: "8px 16px", borderRadius: 10,
    border: "1px solid rgba(197,198,211,0.5)",
    background: "transparent", color: "#444651",
    fontSize: 13, cursor: "pointer", fontFamily: "inherit",
    fontWeight: 500,
};