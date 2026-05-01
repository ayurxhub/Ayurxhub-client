"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";

import ProtectedRoute from "../../../components/ProtectedRoute";

export default function BookingPage() {
    return <ProtectedRoute><BookingForm /></ProtectedRoute>;
}

function BookingForm() {
    const { authAxios } = useAuth();
    const router = useRouter();
    const { id } = useParams();
    const searchParams = useSearchParams();

    const [expert, setExpert] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loadingInit, setLoadingInit] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Pre-fill from query params if coming from availability tab
    const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || "");
    const [selectedSlot, setSelectedSlot] = useState(
        searchParams.get("start") ? { startTime: searchParams.get("start"), endTime: searchParams.get("end") } : null
    );
    const [mode, setMode] = useState("video");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoadingInit(true);
        try {
            const [expRes, avRes] = await Promise.all([
                authAxios.get(`/profile/experts/${id}`),
                authAxios.get(`/availability/${id}`),
            ]);
            setExpert(expRes.data.expert);
            setAvailability(avRes.data.availableSlots || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingInit(false);
        }
    };

    const slotsForDate = availability.find((d) => d.date === selectedDate)?.slots || [];

    const handleSubmit = async () => {
        if (!selectedDate || !selectedSlot) {
            setError("Please select a date and time slot.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            const res = await authAxios.post("/bookings", {
                expertId: id,
                date: selectedDate,
                startTime: selectedSlot.startTime,
                endTime: selectedSlot.endTime,
                mode,
                studentNotes: notes,
            });
            router.push(`/consultations/bookings?success=1`);
        } catch (err) {
            setError(err.response?.data?.message || "Booking failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDay = (dateStr) => {
        const d = new Date(dateStr);
        return {
            weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
            day: d.getDate(),
            month: d.toLocaleDateString("en-IN", { month: "short" }),
        };
    };

    const initials = (name) =>
        name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    if (loadingInit) return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            <Navbar title="Book Consultation" />

            <div style={{ padding: "28px 32px", maxWidth: 720 }}>
                {/* Back */}
                <button onClick={() => router.back()} style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 24,
                    background: "none", border: "none", color: "#757682", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                    Back to profile
                </button>

                {/* Expert summary card */}
                {expert && (
                    <div style={{
                        background: "#fff", borderRadius: 16, padding: 20, marginBottom: 24,
                        border: "0.5px solid rgba(197,198,211,0.35)", display: "flex", gap: 16, alignItems: "center",
                    }}>
                        {expert.avatar ? (
                            <img src={expert.avatar} alt={expert.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid #9FE1CB" }} />
                        ) : (
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E1F5EE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#0F6E56", border: "2px solid #9FE1CB" }}>
                                {initials(expert.name)}
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 16, fontWeight: 600, color: "#191c1e" }}>{expert.name}</p>
                            <p style={{ fontSize: 12, color: "#757682", marginTop: 2 }}>
                                {expert.specializations?.slice(0, 2).join(" · ")}
                            </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: 11, color: "#757682" }}>Consultation Fee</p>
                            <p style={{ fontSize: 20, fontWeight: 700, color: "#00256e" }}>
                                {expert.consultationFee > 0 ? `₹${expert.consultationFee}` : "Free"}
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 1: Date */}
                <StepCard number="1" title="Select a Date">
                    {availability.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 30, color: "#757682" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 32, display: "block", marginBottom: 8, color: "#c5c6d3" }}>calendar_today</span>
                            <p style={{ fontSize: 13 }}>No available dates in the next 14 days</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {availability.map((day) => {
                                const { weekday, dayNum, month } = (() => {
                                    const f = formatDay(day.date);
                                    return { weekday: f.weekday, dayNum: f.day, month: f.month };
                                })();
                                const isSelected = selectedDate === day.date;
                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => { setSelectedDate(day.date); setSelectedSlot(null); }}
                                        style={{
                                            padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                                            border: isSelected ? "2px solid #00256e" : "0.5px solid rgba(197,198,211,0.5)",
                                            background: isSelected ? "#00256e" : "#fff",
                                            color: isSelected ? "#fff" : "#191c1e",
                                            textAlign: "center", minWidth: 70, fontFamily: "inherit",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <p style={{ fontSize: 10, opacity: 0.8, marginBottom: 2 }}>{weekday}</p>
                                        <p style={{ fontSize: 18, fontWeight: 700 }}>{dayNum}</p>
                                        <p style={{ fontSize: 10, opacity: 0.8 }}>{month}</p>
                                        <p style={{ fontSize: 10, marginTop: 4, opacity: 0.7 }}>{day.slots.length} slots</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </StepCard>

                {/* Step 2: Time Slot */}
                {selectedDate && (
                    <StepCard number="2" title="Select a Time Slot">
                        {slotsForDate.length === 0 ? (
                            <p style={{ fontSize: 13, color: "#757682" }}>No slots available for this date</p>
                        ) : (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {slotsForDate.map((slot) => {
                                    const isSelected = selectedSlot?.startTime === slot.startTime;
                                    return (
                                        <button
                                            key={slot.startTime}
                                            onClick={() => setSelectedSlot(slot)}
                                            style={{
                                                padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                                                border: isSelected ? "2px solid #1D9E75" : "0.5px solid rgba(197,198,211,0.5)",
                                                background: isSelected ? "#E1F5EE" : "#fff",
                                                color: isSelected ? "#0F6E56" : "#444651",
                                                fontSize: 13, fontFamily: "inherit", fontWeight: isSelected ? 600 : 400,
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {slot.startTime} – {slot.endTime}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </StepCard>
                )}

                {/* Step 3: Mode */}
                {selectedSlot && (
                    <StepCard number="3" title="Session Mode">
                        <div style={{ display: "flex", gap: 10 }}>
                            {[
                                { val: "video", icon: "videocam", label: "Video Call" },
                                { val: "chat", icon: "chat", label: "Chat" },
                                { val: "phone", icon: "call", label: "Phone" },
                            ].map(({ val, icon, label }) => {
                                const isSelected = mode === val;
                                return (
                                    <button
                                        key={val}
                                        onClick={() => setMode(val)}
                                        style={{
                                            flex: 1, padding: "14px 10px", borderRadius: 12, cursor: "pointer",
                                            border: isSelected ? "2px solid #00256e" : "0.5px solid rgba(197,198,211,0.5)",
                                            background: isSelected ? "#dbe1ff" : "#fff",
                                            textAlign: "center", fontFamily: "inherit", transition: "all 0.15s",
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: isSelected ? "#00256e" : "#9ca3af", display: "block", marginBottom: 6 }}>{icon}</span>
                                        <p style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? "#00256e" : "#444651" }}>{label}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </StepCard>
                )}

                {/* Step 4: Notes */}
                {selectedSlot && (
                    <StepCard number="4" title="Notes for Expert (optional)">
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe your symptoms or concerns so the expert can prepare..."
                            rows={4}
                            style={{
                                width: "100%", padding: "12px 14px", borderRadius: 10,
                                border: "0.5px solid rgba(197,198,211,0.5)", background: "#f7f9fc",
                                color: "#191c1e", fontSize: 13, fontFamily: "inherit",
                                outline: "none", resize: "vertical", boxSizing: "border-box",
                            }}
                            onFocus={(e) => { e.target.style.boxShadow = "0 0 0 2px rgba(0,37,110,0.12)"; e.target.style.background = "#fff"; }}
                            onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.background = "#f7f9fc"; }}
                        />
                    </StepCard>
                )}

                {/* Summary + Confirm */}
                {selectedDate && selectedSlot && (
                    <div style={{
                        background: "#fff", borderRadius: 16, padding: 22,
                        border: "0.5px solid rgba(197,198,211,0.35)", marginTop: 8,
                    }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#00256e", marginBottom: 16 }}>Booking Summary</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                            {[
                                ["Expert", expert?.name],
                                ["Date", new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })],
                                ["Time", `${selectedSlot.startTime} – ${selectedSlot.endTime}`],
                                ["Mode", mode.charAt(0).toUpperCase() + mode.slice(1)],
                                ["Fee", expert?.consultationFee > 0 ? `₹${expert.consultationFee}` : "Free"],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <p style={{ fontSize: 11, color: "#757682", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: "#191c1e" }}>{val}</p>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FCEBEB", color: "#A32D2D", fontSize: 13, marginBottom: 14 }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                width: "100%", padding: "13px", borderRadius: 12,
                                background: submitting ? "#9ca3af" : "linear-gradient(135deg, #00256e, #1f3c88)",
                                color: "#fff", border: "none", fontSize: 15,
                                fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            {submitting ? "Booking..." : "Confirm Booking"}
                        </button>

                        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 10 }}>
                            Booking is confirmed once the expert accepts your request
                        </p>
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function StepCard({ number, title, children }) {
    return (
        <div style={{
            background: "#fff", borderRadius: 16, padding: 22, marginBottom: 16,
            border: "0.5px solid rgba(197,198,211,0.35)",
            boxShadow: "0 1px 8px rgba(0,37,110,0.04)",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "#00256e", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>{number}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#191c1e" }}>{title}</h3>
            </div>
            {children}
        </div>
    );
}