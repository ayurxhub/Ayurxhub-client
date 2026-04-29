"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AvailabilityPage() {
    return (
        <ProtectedRoute allowedRoles={["expert"]}>
            <AvailabilityManager />
        </ProtectedRoute>
    );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Free-form time helpers — no fixed intervals
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

function AvailabilityManager() {
    const { authAxios } = useAuth();
    const router = useRouter();

    // ── State ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("weekly"); // "weekly" | "block"
    const [recurringData, setRecurringData] = useState(
        Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, enabled: false, slots: [], saved: false }))
    );
    const [overrides, setOverrides] = useState([]); // fetched date overrides
    const [blockDate, setBlockDate] = useState("");
    const [blockReason, setBlockReason] = useState("");
    const [saving, setSaving] = useState(null); // dayOfWeek being saved
    const [blocking, setBlocking] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [loading, setLoading] = useState(true);

    // ── Load existing availability ────────────────────────────────────────────
    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        setLoading(true);
        try {
            // Get my own expert id from profile
            const meRes = await authAxios.get("/profile/me");
            const expertId = meRes.data.user._id;

            const res = await authAxios.get(`/availability/${expertId}?from=2020-01-01&to=2099-01-01`);

            // Also fetch raw recurring slots directly
            // We'll use a broader date range and reconstruct from the response
            // For now load what we can from the slots response
            const slots = res.data.availableSlots || [];

            // Build a map of dayOfWeek → slots from the returned data
            // Since getAvailability expands to dates, we reverse-engineer by dayOfWeek
            const dayMap = {};
            slots.forEach((s) => {
                const dow = s.dayOfWeek;
                if (!dayMap[dow]) dayMap[dow] = new Set();
                s.slots.forEach((sl) => dayMap[dow].add(JSON.stringify({ startTime: sl.startTime, endTime: sl.endTime })));
            });

            setRecurringData((prev) =>
                prev.map((d) => {
                    if (dayMap[d.dayOfWeek]) {
                        const uniqueSlots = [...dayMap[d.dayOfWeek]].map((s) => JSON.parse(s));
                        return { ...d, enabled: true, slots: uniqueSlots, saved: true };
                    }
                    return d;
                })
            );
        } catch (err) {
            console.error("Failed to load availability:", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Slot helpers ──────────────────────────────────────────────────────────
    const toggleDay = (dow) => {
        setRecurringData((prev) =>
            prev.map((d) =>
                d.dayOfWeek === dow
                    ? { ...d, enabled: !d.enabled, slots: d.enabled ? [] : [{ startTime: "09:00", endTime: "09:30" }] }
                    : d
            )
        );
    };

    const addSlot = (dow) => {
        setRecurringData((prev) =>
            prev.map((d) => {
                if (d.dayOfWeek !== dow) return d;
                const last = d.slots[d.slots.length - 1];
                const newStart = last ? last.endTime : "09:00";
                const newEnd = defaultEnd(newStart);
                return { ...d, slots: [...d.slots, { startTime: newStart, endTime: newEnd }] };
            })
        );
    };

    const removeSlot = (dow, idx) => {
        setRecurringData((prev) =>
            prev.map((d) =>
                d.dayOfWeek === dow
                    ? { ...d, slots: d.slots.filter((_, i) => i !== idx) }
                    : d
            )
        );
    };

    const updateSlot = (dow, idx, field, value) => {
        setRecurringData((prev) =>
            prev.map((d) => {
                if (d.dayOfWeek !== dow) return d;
                const slots = d.slots.map((s, i) => {
                    if (i !== idx) return s;
                    if (field === "startTime") return { startTime: value, endTime: defaultEnd(value) };
                    return { ...s, [field]: value };
                });
                return { ...d, slots };
            })
        );
    };

    // ── Save a single day ─────────────────────────────────────────────────────
    const saveDay = async (dow) => {
        const day = recurringData.find((d) => d.dayOfWeek === dow);
        if (!day) return;

        setSaving(dow);
        setMsg({ text: "", type: "" });
        try {
            await authAxios.post("/availability/slots", {
                type: "recurring",
                dayOfWeek: dow,
                slots: day.slots,
                isBlocked: false,
            });

            setRecurringData((prev) =>
                prev.map((d) => (d.dayOfWeek === dow ? { ...d, saved: true } : d))
            );
            showMsg(`${DAYS[dow]} schedule saved!`, "success");
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed to save", "error");
        } finally {
            setSaving(null);
        }
    };

    // ── Save all enabled days at once ─────────────────────────────────────────
    const saveAll = async () => {
        const enabledDays = recurringData.filter((d) => d.enabled && d.slots.length > 0);
        if (enabledDays.length === 0) {
            showMsg("Enable at least one day with slots first", "error");
            return;
        }
        setSaving("all");
        setMsg({ text: "", type: "" });
        try {
            await Promise.all(
                enabledDays.map((day) =>
                    authAxios.post("/availability/slots", {
                        type: "recurring",
                        dayOfWeek: day.dayOfWeek,
                        slots: day.slots,
                        isBlocked: false,
                    })
                )
            );
            setRecurringData((prev) =>
                prev.map((d) => (d.enabled ? { ...d, saved: true } : d))
            );
            showMsg(`Schedule saved for ${enabledDays.length} day${enabledDays.length > 1 ? "s" : ""}!`, "success");
        } catch (err) {
            showMsg(err.response?.data?.message || "Save failed", "error");
        } finally {
            setSaving(null);
        }
    };

    // ── Block a date ──────────────────────────────────────────────────────────
    const handleBlockDate = async () => {
        if (!blockDate) { showMsg("Select a date to block", "error"); return; }
        setBlocking(true);
        try {
            await authAxios.post("/availability/block", { date: blockDate, reason: blockReason });
            showMsg(`${blockDate} blocked successfully`, "success");
            setBlockDate("");
            setBlockReason("");
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed to block date", "error");
        } finally {
            setBlocking(false);
        }
    };

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: "", type: "" }), 3500);
    };

    const enabledCount = recurringData.filter((d) => d.enabled).length;
    const totalSlots = recurringData.reduce((acc, d) => acc + (d.enabled ? d.slots.length : 0), 0);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>

            <div style={{ padding: "28px 32px", maxWidth: 860 }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#00256e", marginBottom: 4 }}>
                        Manage Availability
                    </h1>
                    <p style={{ fontSize: 14, color: "#757682" }}>
                        Set your weekly schedule and block dates you're unavailable
                    </p>
                </div>

                {/* Summary chips */}
                <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    {[
                        { icon: "calendar_month", label: `${enabledCount} days active`, color: "#E6F1FB", text: "#185FA5" },
                        { icon: "schedule", label: `${totalSlots} slots per week`, color: "#E1F5EE", text: "#0F6E56" },
                    ].map(({ icon, label, color, text }) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 20, background: color }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: text }}>{icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Toast */}
                {msg.text && (
                    <div style={{
                        padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 500,
                        background: msg.type === "success" ? "#E1F5EE" : "#FCEBEB",
                        color: msg.type === "success" ? "#0F6E56" : "#A32D2D",
                        display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {msg.type === "success" ? "check_circle" : "error"}
                        </span>
                        {msg.text}
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 12, padding: 4, marginBottom: 24, border: "0.5px solid rgba(197,198,211,0.35)", width: "fit-content" }}>
                    {[
                        { key: "weekly", icon: "date_range", label: "Weekly Schedule" },
                        { key: "block", icon: "event_busy", label: "Block Dates" },
                    ].map(({ key, icon, label }) => (
                        <button key={key} onClick={() => setActiveTab(key)} style={{
                            display: "flex", alignItems: "center", gap: 7,
                            padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                            fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                            background: activeTab === key ? "#00256e" : "transparent",
                            color: activeTab === key ? "#fff" : "#757682",
                            transition: "all 0.15s",
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Weekly Schedule Tab ── */}
                {activeTab === "weekly" && (
                    <>
                        {loading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {recurringData.map((day) => (
                                        <DayRow
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

                                {/* Save all button */}
                                <div style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "center" }}>
                                    <button
                                        onClick={saveAll}
                                        disabled={saving === "all" || enabledCount === 0}
                                        style={{
                                            padding: "12px 32px", borderRadius: 12,
                                            background: saving === "all" || enabledCount === 0
                                                ? "#9ca3af"
                                                : "linear-gradient(135deg, #00256e, #1f3c88)",
                                            color: "#fff", border: "none", fontSize: 14,
                                            fontWeight: 600, cursor: enabledCount > 0 ? "pointer" : "not-allowed",
                                            boxShadow: enabledCount > 0 ? "0 4px 16px rgba(0,37,110,0.2)" : "none",
                                        }}
                                    >
                                        {saving === "all" ? "Saving..." : `Save All (${enabledCount} days)`}
                                    </button>
                                    <p style={{ fontSize: 12, color: "#9ca3af" }}>
                                        Students can book slots once saved
                                    </p>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ── Block Dates Tab ── */}
                {activeTab === "block" && (
                    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "0.5px solid rgba(197,198,211,0.35)" }}>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#191c1e", marginBottom: 6 }}>Block a Specific Date</h2>
                        <p style={{ fontSize: 13, color: "#757682", marginBottom: 20 }}>
                            Mark a date as unavailable — students won't be able to book on blocked dates.
                            Dates with confirmed bookings cannot be blocked.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#444651", display: "block", marginBottom: 6 }}>Date to block</label>
                                <input
                                    type="date"
                                    value={blockDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setBlockDate(e.target.value)}
                                    style={{
                                        padding: "10px 14px", borderRadius: 10, width: "100%", maxWidth: 280,
                                        border: "0.5px solid rgba(197,198,211,0.5)", background: "#f7f9fc",
                                        color: "#191c1e", fontSize: 13, fontFamily: "inherit", outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.12)"; }}
                                    onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#444651", display: "block", marginBottom: 6 }}>Reason (optional)</label>
                                <input
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    placeholder="e.g. Personal leave, conference..."
                                    style={{
                                        padding: "10px 14px", borderRadius: 10, width: "100%", maxWidth: 400,
                                        border: "0.5px solid rgba(197,198,211,0.5)", background: "#f7f9fc",
                                        color: "#191c1e", fontSize: 13, fontFamily: "inherit", outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.12)"; }}
                                    onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                                />
                            </div>

                            <button
                                onClick={handleBlockDate}
                                disabled={blocking || !blockDate}
                                style={{
                                    padding: "11px 28px", borderRadius: 10, width: "fit-content",
                                    background: blocking || !blockDate ? "#9ca3af" : "#ba1a1a",
                                    color: "#fff", border: "none", fontSize: 14, fontWeight: 600,
                                    cursor: blockDate ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", gap: 7,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event_busy</span>
                                {blocking ? "Blocking..." : "Block This Date"}
                            </button>
                        </div>

                        {/* Info box */}
                        <div style={{ marginTop: 24, padding: "14px 16px", borderRadius: 10, background: "#FAEEDA", border: "0.5px solid #FAC775" }}>
                            <p style={{ fontSize: 12, color: "#854F0B", fontWeight: 600, marginBottom: 4 }}>Note</p>
                            <p style={{ fontSize: 12, color: "#854F0B", lineHeight: 1.6 }}>
                                If you have confirmed bookings on a date, it cannot be blocked. You must cancel those bookings first.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Day Row Component ─────────────────────────────────────────────────────────
function DayRow({ day, onToggle, onAddSlot, onRemoveSlot, onUpdateSlot, onSave, saving }) {
    const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;

    return (
        <div style={{
            background: "#fff", borderRadius: 14, border: "0.5px solid",
            borderColor: day.enabled ? "rgba(0,37,110,0.15)" : "rgba(197,198,211,0.35)",
            overflow: "hidden", transition: "border-color 0.15s",
        }}>
            {/* Day header row */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                background: day.enabled ? "rgba(0,37,110,0.03)" : "transparent",
                borderBottom: day.enabled ? "0.5px solid rgba(197,198,211,0.3)" : "none",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Toggle */}
                    <div onClick={onToggle} style={{
                        width: 40, height: 22, borderRadius: 11, cursor: "pointer",
                        background: day.enabled ? "#00256e" : "#d1d5db",
                        position: "relative", transition: "background 0.2s", flexShrink: 0,
                    }}>
                        <div style={{
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            position: "absolute", top: 2,
                            left: day.enabled ? 20 : 2,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }} />
                    </div>

                    {/* Day name */}
                    <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: day.enabled ? "#00256e" : "#9ca3af" }}>
                            {DAYS[day.dayOfWeek]}
                        </p>
                        {isWeekend && (
                            <p style={{ fontSize: 10, color: "#9ca3af" }}>Weekend</p>
                        )}
                    </div>

                    {/* Slot count badge */}
                    {day.enabled && day.slots.length > 0 && (
                        <span style={{
                            fontSize: 11, fontWeight: 600, padding: "2px 9px", borderRadius: 20,
                            background: day.saved ? "#E1F5EE" : "#E6F1FB",
                            color: day.saved ? "#0F6E56" : "#185FA5",
                        }}>
                            {day.slots.length} slot{day.slots.length > 1 ? "s" : ""}
                            {day.saved ? " · saved" : " · unsaved"}
                        </span>
                    )}
                </div>

                {/* Save this day button */}
                {day.enabled && day.slots.length > 0 && (
                    <button onClick={onSave} disabled={saving} style={{
                        padding: "6px 16px", borderRadius: 8,
                        background: saving ? "#9ca3af" : "#00256e",
                        color: "#fff", border: "none", fontSize: 12,
                        fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                    }}>
                        {saving ? "Saving..." : "Save"}
                    </button>
                )}
            </div>

            {/* Slots */}
            {day.enabled && (
                <div style={{ padding: "14px 18px" }}>
                    {day.slots.length === 0 && (
                        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>No slots added yet</p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                        {day.slots.map((slot, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                {/* Start time — free input */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <label style={{ fontSize: 11, color: "#757682", whiteSpace: "nowrap" }}>From</label>
                                    <input
                                        type="time"
                                        value={slot.startTime}
                                        onChange={(e) => onUpdateSlot(idx, "startTime", e.target.value)}
                                        style={timeSt}
                                    />
                                </div>

                                {/* End time — free input */}
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <label style={{ fontSize: 11, color: "#757682", whiteSpace: "nowrap" }}>To</label>
                                    <input
                                        type="time"
                                        value={slot.endTime}
                                        onChange={(e) => onUpdateSlot(idx, "endTime", e.target.value)}
                                        style={timeSt}
                                    />
                                </div>

                                {/* Duration badge */}
                                {durationLabel(slot.startTime, slot.endTime) && (
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, padding: "3px 9px",
                                        borderRadius: 20, background: "#E1F5EE", color: "#0F6E56",
                                    }}>
                                        {durationLabel(slot.startTime, slot.endTime)}
                                    </span>
                                )}

                                {/* Remove */}
                                <button onClick={() => onRemoveSlot(idx)} style={{
                                    width: 26, height: 26, borderRadius: "50%", border: "0.5px solid #F7C1C1",
                                    background: "transparent", color: "#A32D2D", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add slot button */}
                    <button onClick={onAddSlot} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 8,
                        border: "0.5px dashed rgba(0,37,110,0.25)",
                        background: "transparent", color: "#00256e",
                        fontSize: 12, fontWeight: 500, cursor: "pointer",
                        fontFamily: "inherit",
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
                        Add slot
                    </button>
                </div>
            )}
        </div>
    );
}

const timeSt = {
    padding: "7px 10px", borderRadius: 8, fontSize: 13,
    border: "1.5px solid rgba(197,198,211,0.5)", background: "#fff",
    color: "#191c1e", fontFamily: "inherit", outline: "none", cursor: "pointer",
    width: 108,
};