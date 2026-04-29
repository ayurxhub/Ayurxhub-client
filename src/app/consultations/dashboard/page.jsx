"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ConsultantDashboardPage() {
    return (
        <ProtectedRoute allowedRoles={["expert"]}>
            <ConsultantDashboard />
        </ProtectedRoute>
    );
}

// ── helpers ──────────────────────────────────────────────────────────────────
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function durationLabel(start, end) {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return "";
    if (diff < 60) return `${diff} min`;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function defaultEnd(start) {
    if (!start) return "09:30";
    const [h, m] = start.split(":").map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function timeUntil(date, startTime) {
    const dateStr = new Date(date).toISOString().split("T")[0];
    const sessionStart = new Date(`${dateStr}T${startTime}`);
    const diff = sessionStart - Date.now();
    if (diff < 0) return "Now";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `in ${Math.floor(h / 24)}d`;
    if (h > 0) return `in ${h}h ${m}m`;
    return `in ${m}m`;
}

const STATUS_COLOR = {
    pending: { bg: "#fef9c3", text: "#854d0e", label: "Pending" },
    confirmed: { bg: "#dcfce7", text: "#166534", label: "Confirmed" },
    completed: { bg: "#dbeafe", text: "#1e40af", label: "Completed" },
    cancelled_student: { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
    cancelled_expert: { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
    expired: { bg: "#f3f4f6", text: "#6b7280", label: "Expired" },
};

// ── main component ────────────────────────────────────────────────────────────
function ConsultantDashboard() {
    const { user, authAxios, logout } = useAuth();
    const router = useRouter();

    const [activeSection, setActiveSection] = useState("overview"); // overview | schedule | availability
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
    const [togglingAvail, setTogglingAvail] = useState(false);
    const [toast, setToast] = useState({ text: "", type: "" });

    // Availability state
    const [recurringData, setRecurringData] = useState(
        Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, enabled: false, slots: [], saved: false }))
    );
    const [saving, setSaving] = useState(null);
    const [blockDate, setBlockDate] = useState("");
    const [blocking, setBlocking] = useState(false);
    const [availLoading, setAvailLoading] = useState(false);

    // ── fetch bookings ────────────────────────────────────────────────────────
    const fetchBookings = useCallback(async () => {
        setLoadingBookings(true);
        try {
            const res = await authAxios.get("/bookings/expert");
            setBookings(res.data.bookings || []);
        } catch (e) { console.error(e); }
        finally { setLoadingBookings(false); }
    }, [authAxios]);

    // ── load existing availability ────────────────────────────────────────────
    const loadAvailability = useCallback(async () => {
        if (!user?._id) return;
        setAvailLoading(true);
        try {
            const res = await authAxios.get(`/availability/${user._id}?from=2020-01-01&to=2099-01-01`);
            const slots = res.data.availableSlots || [];
            const dayMap = {};
            slots.forEach((s) => {
                const dow = s.dayOfWeek;
                if (!dayMap[dow]) dayMap[dow] = new Set();
                s.slots.forEach((sl) => dayMap[dow].add(JSON.stringify({ startTime: sl.startTime, endTime: sl.endTime })));
            });
            setRecurringData(prev =>
                prev.map(d => {
                    if (dayMap[d.dayOfWeek]) {
                        const uniqueSlots = [...dayMap[d.dayOfWeek]].map(s => JSON.parse(s));
                        return { ...d, enabled: true, slots: uniqueSlots, saved: true };
                    }
                    return d;
                })
            );
        } catch (e) { console.error(e); }
        finally { setAvailLoading(false); }
    }, [authAxios, user?._id]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);
    useEffect(() => { if (activeSection === "availability") loadAvailability(); }, [activeSection, loadAvailability]);

    // ── show toast ────────────────────────────────────────────────────────────
    const showToast = (text, type = "success") => {
        setToast({ text, type });
        setTimeout(() => setToast({ text: "", type: "" }), 3500);
    };

    // ── toggle global availability ────────────────────────────────────────────
    const toggleAvailability = async () => {
        setTogglingAvail(true);
        try {
            await authAxios.put("/profile/me", { isAvailable: !isAvailable });
            setIsAvailable(v => !v);
            showToast(!isAvailable ? "You're now accepting bookings" : "You've paused new bookings");
        } catch { showToast("Failed to update status", "error"); }
        finally { setTogglingAvail(false); }
    };

    // ── confirm / complete ────────────────────────────────────────────────────
    const handleConfirm = async (id) => {
        try {
            await authAxios.put(`/bookings/${id}/confirm`);
            showToast("Session confirmed");
            fetchBookings();
        } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
    };

    const handleComplete = async (id) => {
        try {
            await authAxios.put(`/bookings/${id}/complete`);
            showToast("Session marked complete");
            fetchBookings();
        } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
    };

    // ── availability helpers ──────────────────────────────────────────────────
    const toggleDay = (dow) => {
        setRecurringData(prev => prev.map(d =>
            d.dayOfWeek === dow
                ? { ...d, enabled: !d.enabled, slots: d.enabled ? [] : [{ startTime: "09:00", endTime: "09:30" }] }
                : d
        ));
    };

    const addSlot = (dow) => {
        setRecurringData(prev => prev.map(d => {
            if (d.dayOfWeek !== dow) return d;
            const last = d.slots[d.slots.length - 1];
            const newStart = last ? last.endTime : "09:00";
            const newEnd = defaultEnd(newStart);
            return { ...d, slots: [...d.slots, { startTime: newStart, endTime: newEnd }] };
        }));
    };

    const removeSlot = (dow, idx) => {
        setRecurringData(prev => prev.map(d =>
            d.dayOfWeek === dow ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d
        ));
    };

    const updateSlot = (dow, idx, field, value) => {
        setRecurringData(prev => prev.map(d => {
            if (d.dayOfWeek !== dow) return d;
            const slots = d.slots.map((s, i) => {
                if (i !== idx) return s;
                if (field === "startTime") return { startTime: value, endTime: defaultEnd(value) };
                return { ...s, [field]: value };
            });
            return { ...d, slots };
        }));
    };

    const saveDay = async (dow) => {
        const day = recurringData.find(d => d.dayOfWeek === dow);
        if (!day) return;
        setSaving(dow);
        try {
            await authAxios.post("/availability/slots", {
                type: "recurring", dayOfWeek: dow, slots: day.slots, isBlocked: false,
            });
            setRecurringData(prev => prev.map(d => d.dayOfWeek === dow ? { ...d, saved: true } : d));
            showToast(`${DAYS[dow]} schedule saved!`);
        } catch (e) { showToast(e.response?.data?.message || "Failed to save", "error"); }
        finally { setSaving(null); }
    };

    const saveAll = async () => {
        const enabled = recurringData.filter(d => d.enabled && d.slots.length > 0);
        if (!enabled.length) { showToast("Enable at least one day with slots", "error"); return; }
        setSaving("all");
        try {
            await Promise.all(enabled.map(day => authAxios.post("/availability/slots", {
                type: "recurring", dayOfWeek: day.dayOfWeek, slots: day.slots, isBlocked: false,
            })));
            setRecurringData(prev => prev.map(d => d.enabled ? { ...d, saved: true } : d));
            showToast(`Schedule saved for ${enabled.length} day${enabled.length > 1 ? "s" : ""}!`);
        } catch (e) { showToast(e.response?.data?.message || "Save failed", "error"); }
        finally { setSaving(null); }
    };

    const handleBlockDate = async () => {
        if (!blockDate) { showToast("Select a date", "error"); return; }
        setBlocking(true);
        try {
            await authAxios.post("/availability/block", { date: blockDate });
            showToast(`${blockDate} blocked`);
            setBlockDate("");
        } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
        finally { setBlocking(false); }
    };

    // ── derived stats ─────────────────────────────────────────────────────────
    const pending = bookings.filter(b => b.status === "pending");
    const upcoming = bookings.filter(b => b.status === "confirmed");
    const completed = bookings.filter(b => b.status === "completed");
    const totalSlots = recurringData.reduce((acc, d) => acc + (d.enabled ? d.slots.length : 0), 0);

    const isSessionNow = (b) => {
        if (b.status !== "confirmed") return false;
        const dateStr = new Date(b.date).toISOString().split("T")[0];
        const start = new Date(`${dateStr}T${b.startTime}`);
        const end = new Date(`${dateStr}T${b.endTime}`);
        const now = new Date();
        return now >= new Date(start.getTime() - 10 * 60000) && now <= new Date(end.getTime() + 10 * 60000);
    };

    const initials = (name) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    // ── nav items ─────────────────────────────────────────────────────────────
    const NAV = [
        { key: "overview", label: "Overview", icon: "📊" },
        { key: "schedule", label: "My Schedule", icon: "📅" },
        { key: "availability", label: "Set Availability", icon: "✅" },
    ];

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>

            {/* ── Sidebar ── */}
            <aside style={{
                width: 240, background: "#0e4f3b", flexShrink: 0,
                display: "flex", flexDirection: "column",
                padding: "28px 0", position: "fixed", height: "100vh", zIndex: 40,
            }}>
                {/* Logo */}
                <div style={{ padding: "0 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: "0 0 2px" }}>AyuRxHub</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                        Expert  Portal
                    </p>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: "16px 14px" }}>
                    {NAV.map(({ key, label, icon }) => (
                        <button key={key}
                            onClick={() => setActiveSection(key)}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                                marginBottom: 4, fontFamily: "inherit",
                                background: activeSection === key ? "rgba(255,255,255,0.12)" : "transparent",
                                color: activeSection === key ? "#fff" : "rgba(255,255,255,0.5)",
                                fontSize: 13, fontWeight: activeSection === key ? 600 : 400,
                                textAlign: "left", transition: "all 0.15s",
                                borderLeft: activeSection === key ? "3px solid #6EE7C7" : "3px solid transparent",
                            }}>
                            <span style={{ fontSize: 15 }}>{icon}</span>
                            {label}
                            {key === "schedule" && pending.length > 0 && (
                                <span style={{
                                    marginLeft: "auto", fontSize: 10, fontWeight: 700,
                                    background: "#ef4444", color: "#fff",
                                    borderRadius: 20, padding: "1px 7px", minWidth: 18, textAlign: "center",
                                }}>{pending.length}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Availability toggle */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                        Accepting Bookings
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, color: isAvailable ? "#6EE7C7" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                            {isAvailable ? "● Available" : "○ Paused"}
                        </span>
                        <button
                            onClick={toggleAvailability}
                            disabled={togglingAvail}
                            style={{
                                width: 44, height: 24, borderRadius: 12, border: "none",
                                background: isAvailable ? "#1D9E75" : "rgba(255,255,255,0.15)",
                                cursor: "pointer", position: "relative", transition: "background 0.25s",
                            }}>
                            <span style={{
                                position: "absolute", top: 3, width: 18, height: 18,
                                borderRadius: "50%", background: "#fff",
                                left: isAvailable ? 22 : 3, transition: "left 0.25s",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                            }} />
                        </button>
                    </div>
                </div>

                {/* Profile + logout */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: "50%",
                            background: "#1D9E75", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>{initials(user?.name)}</div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user?.name}
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Consultant</p>
                        </div>
                    </div>
                    <button onClick={async () => { await logout(); router.push("/login"); }}
                        style={{
                            width: "100%", padding: "8px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
                            background: "transparent", color: "rgba(255,255,255,0.5)",
                            fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                        }}>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main style={{ marginLeft: 240, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>

                {/* Toast */}
                {toast.text && (
                    <div style={{
                        position: "fixed", top: 20, right: 20, zIndex: 100,
                        padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500,
                        background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
                        color: toast.type === "error" ? "#991b1b" : "#166534",
                        border: `1px solid ${toast.type === "error" ? "#fecaca" : "#86efac"}`,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        {toast.type === "error" ? "⚠" : "✓"} {toast.text}
                    </div>
                )}

                {/* ══ OVERVIEW ══════════════════════════════════════════════════ */}
                {activeSection === "overview" && (
                    <>
                        <div style={{ marginBottom: 28 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Dr. {user?.name?.split(" ")[0]} 👋
                            </h1>
                            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                                Here's your practice overview for today
                            </p>
                        </div>

                        {/* Stat cards */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
                            {[
                                { label: "Pending Approval", value: pending.length, icon: "⏳", color: "#854d0e", bg: "#fef9c3", border: "#fde68a" },
                                { label: "Upcoming Sessions", value: upcoming.length, icon: "📅", color: "#166534", bg: "#dcfce7", border: "#86efac" },
                                { label: "Completed", value: completed.length, icon: "✅", color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
                                { label: "Weekly Slots", value: totalSlots, icon: "🗓", color: "#0e4f3b", bg: "#d1fae5", border: "#6ee7b7" },
                            ].map(({ label, value, icon, color, bg, border }) => (
                                <div key={label} style={{
                                    background: "#fff", border: "1px solid #f3f4f6", borderRadius: 14,
                                    padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, fontWeight: 500 }}>{label}</p>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: "grid", placeItems: "center", fontSize: 15 }}>
                                            {icon}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 30, fontWeight: 700, color, margin: 0, letterSpacing: "-0.04em" }}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Quick actions */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                            {[
                                { label: "Set Availability", icon: "✅", onClick: () => setActiveSection("availability"), primary: true },
                                { label: "View Schedule", icon: "📅", onClick: () => setActiveSection("schedule") },
                            ].map(({ label, icon, onClick, primary }) => (
                                <button key={label} onClick={onClick}
                                    style={{
                                        padding: "10px 20px", borderRadius: 10, border: "none",
                                        cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                                        display: "flex", alignItems: "center", gap: 8,
                                        background: primary ? "#0e4f3b" : "#fff",
                                        color: primary ? "#fff" : "#374151",
                                        border: primary ? "none" : "1px solid #e5e7eb",
                                        boxShadow: primary ? "0 2px 8px rgba(14,79,59,0.25)" : "0 1px 3px rgba(0,0,0,0.05)",
                                    }}>
                                    {icon} {label}
                                </button>
                            ))}
                        </div>

                        {/* Pending + Upcoming */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                            {/* Pending */}
                            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>Awaiting Confirmation</p>
                                    {pending.length > 0 && (
                                        <span style={{ fontSize: 10, fontWeight: 700, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a", borderRadius: 20, padding: "2px 8px" }}>
                                            {pending.length} new
                                        </span>
                                    )}
                                </div>
                                {pending.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No pending requests</p>
                                ) : pending.slice(0, 4).map(b => (
                                    <div key={b._id} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "12px 0", borderBottom: "1px solid #f9fafb",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: "50%",
                                                background: "#f0fdf4", display: "flex", alignItems: "center",
                                                justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#166534",
                                                border: "1px solid #bbf7d0",
                                            }}>{initials(b.student?.name)}</div>
                                            <div>
                                                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{b.student?.name}</p>
                                                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                                                    {formatDate(b.date)} · {b.startTime}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleConfirm(b._id)}
                                            style={{
                                                padding: "6px 14px", borderRadius: 8, border: "none",
                                                background: "#0e4f3b", color: "#fff",
                                                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                            }}>
                                            Confirm
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Upcoming */}
                            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 16px" }}>Upcoming Sessions</p>
                                {upcoming.length === 0 ? (
                                    <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No upcoming sessions</p>
                                ) : upcoming.slice(0, 4).map(b => {
                                    const live = isSessionNow(b);
                                    return (
                                        <div key={b._id} style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                            padding: "12px 0", borderBottom: "1px solid #f9fafb",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: "50%",
                                                    background: live ? "#dcfce7" : "#eff6ff",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: 12, fontWeight: 700,
                                                    color: live ? "#166534" : "#1e40af",
                                                    border: `1px solid ${live ? "#86efac" : "#bfdbfe"}`,
                                                }}>{initials(b.student?.name)}</div>
                                                <div>
                                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{b.student?.name}</p>
                                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                                                        {formatDate(b.date)} · {b.startTime}–{b.endTime}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                                {live ? (
                                                    <button onClick={() => router.push(`/consultations/session/${b._id}`)}
                                                        style={{
                                                            padding: "6px 12px", borderRadius: 8, border: "none",
                                                            background: "#1D9E75", color: "#fff",
                                                            fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                                                            display: "flex", alignItems: "center", gap: 5,
                                                        }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "pulse 1.5s infinite" }} />
                                                        Join
                                                    </button>
                                                ) : (
                                                    <span style={{ fontSize: 11, color: "#6b7280" }}>{timeUntil(b.date, b.startTime)}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}

                {/* ══ SCHEDULE ══════════════════════════════════════════════════ */}
                {activeSection === "schedule" && (
                    <>
                        <div style={{ marginBottom: 24 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>My Schedule</h1>
                            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>All your sessions in one place</p>
                        </div>

                        {/* Filter tabs */}
                        {["All", "Pending", "Confirmed", "Completed"].map((tab, i) => {
                            const key = tab.toLowerCase();
                            const filtered = tab === "All" ? bookings : bookings.filter(b =>
                                key === "confirmed" ? b.status === "confirmed" :
                                    key === "pending" ? b.status === "pending" :
                                        b.status === "completed"
                            );
                            return null; // rendered below
                        })}

                        <ScheduleTable
                            bookings={bookings}
                            loading={loadingBookings}
                            onConfirm={handleConfirm}
                            onComplete={handleComplete}
                            onJoin={(id) => router.push(`/consultations/session/${id}`)}
                            isSessionNow={isSessionNow}
                            initials={initials}
                        />
                    </>
                )}

                {/* ══ AVAILABILITY ══════════════════════════════════════════════ */}
                {activeSection === "availability" && (
                    <>
                        <div style={{ marginBottom: 24 }}>
                            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Set Availability</h1>
                            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                                Configure your weekly schedule so patients can book sessions
                            </p>
                        </div>

                        {/* Summary chips */}
                        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                            {[
                                { icon: "📅", label: `${recurringData.filter(d => d.enabled).length} days active`, color: "#1e40af", bg: "#dbeafe", border: "#93c5fd" },
                                { icon: "🕐", label: `${totalSlots} slots per week`, color: "#166534", bg: "#dcfce7", border: "#86efac" },
                            ].map(({ icon, label, color, bg, border }) => (
                                <div key={label} style={{
                                    display: "flex", alignItems: "center", gap: 7,
                                    padding: "7px 14px", borderRadius: 20, background: bg, border: `1px solid ${border}`,
                                }}>
                                    <span style={{ fontSize: 13 }}>{icon}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
                                </div>
                            ))}
                        </div>

                        {availLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #0e4f3b", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                            </div>
                        ) : (
                            <>
                                {/* Day rows */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                    {recurringData.map(day => (
                                        <AvailabilityDayRow
                                            key={day.dayOfWeek}
                                            day={day}
                                            onToggle={() => toggleDay(day.dayOfWeek)}
                                            onAddSlot={() => addSlot(day.dayOfWeek)}
                                            onRemoveSlot={(idx) => removeSlot(day.dayOfWeek, idx)}
                                            onUpdateSlot={(idx, field, val) => updateSlot(day.dayOfWeek, idx, field, val)}
                                            onSave={() => saveDay(day.dayOfWeek)}
                                            saving={saving === day.dayOfWeek}
                                        />
                                    ))}
                                </div>

                                {/* Save all */}
                                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 32 }}>
                                    <button onClick={saveAll} disabled={saving === "all" || recurringData.filter(d => d.enabled).length === 0}
                                        style={{
                                            padding: "11px 28px", borderRadius: 10, border: "none",
                                            background: saving === "all" ? "#9ca3af" : "#0e4f3b",
                                            color: "#fff", fontSize: 13, fontWeight: 600,
                                            cursor: "pointer", fontFamily: "inherit",
                                            boxShadow: "0 2px 8px rgba(14,79,59,0.25)",
                                        }}>
                                        {saving === "all" ? "Saving…" : `Save All Days`}
                                    </button>
                                    <span style={{ fontSize: 12, color: "#9ca3af" }}>Patients can book once saved</span>
                                </div>

                                {/* Block a date */}
                                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                                    <h2 style={{ fontSize: 15, fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>Block a Specific Date</h2>
                                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 18px" }}>
                                        Mark a day as unavailable — no bookings will be accepted.
                                    </p>
                                    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                                        <div>
                                            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Date</label>
                                            <input type="date" value={blockDate}
                                                min={new Date().toISOString().split("T")[0]}
                                                onChange={(e) => setBlockDate(e.target.value)}
                                                style={{
                                                    padding: "9px 14px", borderRadius: 10, fontSize: 13,
                                                    border: "1.5px solid #e5e7eb", background: "#fafafa",
                                                    color: "#111827", fontFamily: "inherit", outline: "none",
                                                }} />
                                        </div>
                                        <button onClick={handleBlockDate} disabled={blocking || !blockDate}
                                            style={{
                                                padding: "10px 22px", borderRadius: 10, border: "none",
                                                background: !blockDate || blocking ? "#9ca3af" : "#dc2626",
                                                color: "#fff", fontSize: 13, fontWeight: 600,
                                                cursor: blockDate ? "pointer" : "not-allowed", fontFamily: "inherit",
                                            }}>
                                            {blocking ? "Blocking…" : "Block Date"}
                                        </button>
                                    </div>
                                    <div style={{
                                        marginTop: 16, padding: "10px 14px", borderRadius: 8,
                                        background: "#fef9c3", border: "1px solid #fde68a", fontSize: 12, color: "#854d0e",
                                    }}>
                                        ⚠ Dates with confirmed bookings cannot be blocked. Cancel those first.
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
            `}</style>
        </div>
    );
}

// ── Schedule table ────────────────────────────────────────────────────────────
function ScheduleTable({ bookings, loading, onConfirm, onComplete, onJoin, isSessionNow, initials }) {
    const [filter, setFilter] = useState("all");

    const filtered = bookings.filter(b => {
        if (filter === "all") return true;
        if (filter === "pending") return b.status === "pending";
        if (filter === "confirmed") return b.status === "confirmed";
        if (filter === "completed") return b.status === "completed";
        return true;
    });

    const TABS = ["all", "pending", "confirmed", "completed"];

    return (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f3f4f6", padding: "0 20px" }}>
                {TABS.map(tab => (
                    <button key={tab} onClick={() => setFilter(tab)}
                        style={{
                            padding: "14px 16px", border: "none", background: "transparent",
                            fontSize: 12, fontWeight: filter === tab ? 600 : 400,
                            cursor: "pointer", fontFamily: "inherit",
                            color: filter === tab ? "#0e4f3b" : "#9ca3af",
                            borderBottom: filter === tab ? "2px solid #0e4f3b" : "2px solid transparent",
                            marginBottom: -1, textTransform: "capitalize", transition: "all 0.15s",
                        }}>
                        {tab}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #0e4f3b", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
                    <p style={{ fontSize: 14, margin: 0 }}>No sessions found</p>
                </div>
            ) : (
                <div>
                    {/* Header */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 130px 130px 100px 140px",
                        padding: "10px 20px", background: "#f9fafb",
                        borderBottom: "1px solid #f3f4f6",
                    }}>
                        {["Patient", "Date", "Time", "Status", "Action"].map(h => (
                            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                        ))}
                    </div>

                    {filtered.map(b => {
                        const sc = STATUS_COLOR[b.status] || STATUS_COLOR.expired;
                        const live = isSessionNow(b);
                        return (
                            <div key={b._id} style={{
                                display: "grid", gridTemplateColumns: "1fr 130px 130px 100px 140px",
                                padding: "14px 20px", borderBottom: "1px solid #f9fafb", alignItems: "center",
                                background: live ? "#f0fdf4" : "transparent",
                                transition: "background 0.15s",
                            }}>
                                {/* Patient */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: "50%",
                                        background: live ? "#dcfce7" : "#f3f4f6",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: live ? "#166534" : "#6b7280",
                                        flexShrink: 0,
                                    }}>{initials(b.student?.name)}</div>
                                    <div>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{b.student?.name}</p>
                                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{b.mode}</p>
                                    </div>
                                </div>

                                {/* Date */}
                                <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                                    {new Date(b.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </p>

                                {/* Time */}
                                <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>{b.startTime} – {b.endTime}</p>

                                {/* Status */}
                                <span style={{
                                    fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                                    background: live ? "#dcfce7" : sc.bg,
                                    color: live ? "#166534" : sc.text,
                                    display: "inline-flex", alignItems: "center", gap: 4,
                                }}>
                                    {live && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", animation: "pulse 1.5s infinite" }} />}
                                    {live ? "Live" : sc.label}
                                </span>

                                {/* Action */}
                                <div>
                                    {live && (
                                        <button onClick={() => onJoin(b._id)}
                                            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                            Join
                                        </button>
                                    )}
                                    {!live && b.status === "pending" && (
                                        <button onClick={() => onConfirm(b._id)}
                                            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#0e4f3b", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                            Confirm
                                        </button>
                                    )}
                                    {!live && b.status === "confirmed" && (
                                        <button onClick={() => onComplete(b._id)}
                                            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "transparent", color: "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                            Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Availability day row ──────────────────────────────────────────────────────
function AvailabilityDayRow({ day, onToggle, onAddSlot, onRemoveSlot, onUpdateSlot, onSave, saving }) {
    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
    return (
        <div style={{
            background: "#fff", borderRadius: 12, border: `1px solid ${day.enabled ? "rgba(14,79,59,0.2)" : "#f3f4f6"}`,
            overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                background: day.enabled ? "rgba(14,79,59,0.03)" : "transparent",
                borderBottom: day.enabled ? "1px solid rgba(14,79,59,0.08)" : "none",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Toggle */}
                    <div onClick={onToggle} style={{
                        width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                        background: day.enabled ? "#0e4f3b" : "#d1d5db",
                        position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}>
                        <div style={{
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            position: "absolute", top: 2, left: day.enabled ? 20 : 2,
                            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                    </div>
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: day.enabled ? "#0e4f3b" : "#9ca3af", margin: 0 }}>
                            {DAYS[day.dayOfWeek]}
                        </p>
                        {isWeekend && <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>Weekend</p>}
                    </div>
                    {day.enabled && day.slots.length > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                            background: day.saved ? "#dcfce7" : "#dbeafe",
                            color: day.saved ? "#166534" : "#1e40af",
                        }}>
                            {day.slots.length} slot{day.slots.length > 1 ? "s" : ""} {day.saved ? "· saved" : "· unsaved"}
                        </span>
                    )}
                </div>
                {day.enabled && day.slots.length > 0 && (
                    <button onClick={onSave} disabled={saving}
                        style={{
                            padding: "6px 16px", borderRadius: 8, border: "none",
                            background: saving ? "#9ca3af" : "#0e4f3b",
                            color: "#fff", fontSize: 12, fontWeight: 600,
                            cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
                        }}>
                        {saving ? "Saving…" : "Save"}
                    </button>
                )}
            </div>

            {day.enabled && (
                <div style={{ padding: "14px 18px" }}>
                    {day.slots.length === 0 && (
                        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>No slots yet</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        {day.slots.map((slot, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <label style={{ fontSize: 11, color: "#6b7280" }}>From</label>
                                    <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => onUpdateSlot(idx, "startTime", e.target.value)}
                                        style={{ padding: "7px 10px", borderRadius: 8, fontSize: 13, border: "1.5px solid #e5e7eb", background: "#fff", color: "#111827", fontFamily: "inherit", outline: "none", cursor: "pointer", width: 108 }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <label style={{ fontSize: 11, color: "#6b7280" }}>To</label>
                                    <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => onUpdateSlot(idx, "endTime", e.target.value)}
                                        style={{ padding: "7px 10px", borderRadius: 8, fontSize: 13, border: "1.5px solid #e5e7eb", background: "#fff", color: "#111827", fontFamily: "inherit", outline: "none", cursor: "pointer", width: 108 }}
                                    />
                                </div>
                                {durationLabel(slot.startTime, slot.endTime) && (
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: "#dcfce7", color: "#166534" }}>
                                        {durationLabel(slot.startTime, slot.endTime)}
                                    </span>
                                )}
                                <button onClick={() => onRemoveSlot(idx)} style={{
                                    width: 26, height: 26, borderRadius: "50%",
                                    border: "1px solid #fecaca", background: "transparent",
                                    color: "#dc2626", cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0,
                                }}>×</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={onAddSlot} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 8,
                        border: "1.5px dashed rgba(14,79,59,0.3)",
                        background: "transparent", color: "#0e4f3b",
                        fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    }}>
                        + Add slot
                    </button>
                </div>
            )}
        </div>
    );
}