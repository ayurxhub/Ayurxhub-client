"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const publicApi = axios.create({ baseURL: API });
import { useParams, useRouter } from "next/navigation";

const TYPE_LABELS = {
    crash_course: { label: "Crash Course", emoji: "🚀" },
    mock_series: { label: "Mock Series", emoji: "📝" },
    subject_sprint: { label: "Sprint", emoji: "⚡" },
};

export default function CoursePage() {
    const { authAxios, user, loading: authLoading } = useAuth();
    const { slug } = useParams();
    const router = useRouter();

    const [batch, setBatch] = useState(null);
    const [tests, setTests] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            // Use publicApi so guests can view the course page
            // If user is logged in, pass token for enrollment status
            const api = user ? authAxios : publicApi;
            const res = await api.get(`/batches/${slug}`);
            setBatch(res.data.batch);
            setTests(res.data.tests || []);
            setIsEnrolled(res.data.isEnrolled || false);
        } catch (e) {
            setError("Course not found");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return; // wait for auth to resolve first
        load();
    }, [slug, authLoading]);

    // Load Razorpay checkout script
    const loadRazorpay = () => new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const handleEnroll = async () => {
        if (!user) { router.push(`/login?next=/courses/${slug}`); return; }

        // Free batch — direct enroll
        if (batch?.price === 0) {
            setEnrolling(true);
            setError("");
            try {
                const res = await authAxios.post(`/batches/${slug}/enroll`);
                if (res.data.success) {
                    setIsEnrolled(true);
                    setSuccessMsg("You're enrolled! All tests are now unlocked.");
                    setTimeout(() => setSuccessMsg(""), 4000);
                    load();
                }
            } catch (e) {
                setError(e.response?.data?.message || "Enrollment failed");
            } finally {
                setEnrolling(false);
            }
            return;
        }

        // Paid batch — Razorpay flow
        setEnrolling(true);
        setError("");
        try {
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

            const { data } = await authAxios.post(`/batches/${slug}/create-order`);
            if (!data.success) throw new Error(data.message);
            if (data.alreadyEnrolled) { setIsEnrolled(true); return; }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.order.amount,
                currency: "INR",
                name: "AyurXHub",
                description: data.batchTitle,
                order_id: data.order.id,
                prefill: { name: user?.name || "", email: user?.email || "" },
                theme: { color: "#00256e" },
                handler: async (response) => {
                    try {
                        const verify = await authAxios.post(`/batches/${slug}/verify-payment`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (verify.data.success) {
                            setIsEnrolled(true);
                            setSuccessMsg("Payment successful! All tests are now unlocked. 🎉");
                            setTimeout(() => setSuccessMsg(""), 5000);
                            load();
                        }
                    } catch {
                        setError("Payment received but enrollment failed. Contact support.");
                    } finally {
                        setEnrolling(false);
                    }
                },
                modal: { ondismiss: () => setEnrolling(false) },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (e) {
            setError(e.message || "Payment failed. Please try again.");
            setEnrolling(false);
        }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null;
    const isFree = batch?.price === 0;
    const typeInfo = TYPE_LABELS[batch?.type] || { label: batch?.type, emoji: "📚" };

    if (loading) return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fc" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error && !batch) return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 20 }}>
            <p style={{ fontSize: 36 }}>📭</p>
            <p style={{ fontSize: 16, color: "#6b7280" }}>{error}</p>
            <button onClick={() => router.push("/courses")} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#00256e", color: "#fff", cursor: "pointer", fontSize: 14 }}>← Back to Courses</button>
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>

            {/* Hero */}
            <div style={{ background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 55%, #0e4f3b 100%)", padding: "36px 32px 32px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
                    <button onClick={() => router.push("/courses")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "rgba(255,255,255,0.7)", fontSize: 13, padding: "5px 14px", borderRadius: 20, cursor: "pointer", marginBottom: 20, fontFamily: "inherit" }}>
                        ← Courses
                    </button>

                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <span style={{ fontSize: 38 }}>{batch?.icon || "📚"}</span>
                                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 600 }}>
                                    {typeInfo.emoji} {typeInfo.label}
                                </span>
                                {isEnrolled && (
                                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(29,158,117,0.4)", color: "#fff", fontWeight: 700 }}>
                                        ✓ Enrolled
                                    </span>
                                )}
                            </div>
                            <h1 style={{ fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>{batch?.title}</h1>
                            {batch?.description && (
                                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", margin: "0 0 16px", maxWidth: 540, lineHeight: 1.6 }}>{batch.description}</p>
                            )}

                            {/* Meta pills */}
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {[
                                    { icon: "📅", label: `${batch?.durationDays} days` },
                                    { icon: "📋", label: `${tests.length} tests` },
                                    batch?.startDate && { icon: "🗓", label: `Starts ${fmt(batch.startDate)}` },
                                    batch?.endDate && { icon: "🏁", label: `Ends ${fmt(batch.endDate)}` },
                                    { icon: "👥", label: `${batch?.enrolledCount || 0} enrolled` },
                                ].filter(Boolean).map(({ icon, label }) => (
                                    <span key={label} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.15)" }}>
                                        {icon} {label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Enroll card */}
                        <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", minWidth: 220, flexShrink: 0, boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                            <p style={{ fontSize: 28, fontWeight: 800, color: isFree ? "#1D9E75" : "#00256e", margin: "0 0 4px" }}>
                                {isFree ? "FREE" : `₹${batch?.price}`}
                            </p>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 16px" }}>
                                {isFree ? "No payment needed" : "One-time access"}
                            </p>

                            {successMsg && (
                                <div style={{ padding: "8px 12px", borderRadius: 8, background: "#dcfce7", color: "#166534", fontSize: 12, marginBottom: 10, fontWeight: 600 }}>
                                    {successMsg}
                                </div>
                            )}
                            {error && (
                                <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                                    {error}
                                </div>
                            )}

                            {isEnrolled ? (
                                <div>
                                    <div style={{ padding: "10px", borderRadius: 10, background: "#dcfce7", color: "#166534", fontSize: 13, fontWeight: 700, textAlign: "center", marginBottom: 8 }}>
                                        ✓ You're enrolled
                                    </div>
                                    <p style={{ fontSize: 11, color: "#6b7280", textAlign: "center", margin: 0 }}>
                                        Scroll down to access all tests
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                                >
                                    {enrolling ? "Enrolling…" : isFree ? "Enroll for Free →" : "Get Access →"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tests list */}
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>
                    📋 Tests in this {typeInfo.label} ({tests.length})
                </h2>

                {tests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 14, border: "0.5px solid rgba(197,198,211,0.35)" }}>
                        <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
                        <p style={{ fontSize: 14, color: "#6b7280" }}>No tests added yet — check back soon.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {tests.map((test, i) => {
                            const locked = !isEnrolled;
                            return (
                                <div key={test._id} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: `1px solid ${locked ? "rgba(197,198,211,0.35)" : test.type === "free" ? "rgba(134,239,172,0.4)" : "rgba(147,197,253,0.4)"}`, display: "flex", alignItems: "center", gap: 16, opacity: locked ? 0.75 : 1 }}>
                                    {/* Number badge */}
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: locked ? "#f3f4f6" : test.type === "free" ? "#dcfce7" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: locked ? "#9ca3af" : test.type === "free" ? "#166534" : "#1e40af", flexShrink: 0 }}>
                                        {locked ? "🔒" : i + 1}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {test.title}
                                        </p>
                                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 11, color: "#6b7280" }}>⏱ {test.duration} min</span>
                                            <span style={{ fontSize: 11, color: "#6b7280" }}>📝 {test.totalQuestions} questions</span>
                                            <span style={{ fontSize: 11, color: "#6b7280" }}>🎯 Pass: {test.passingScore}%</span>
                                            {test.subject && <span style={{ fontSize: 11, color: "#6b7280" }}>{test.subject}</span>}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            if (locked) { handleEnroll(); return; }
                                            router.push(`/tests/${test._id}`);
                                        }}
                                        style={{ padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: locked ? "#f3f4f6" : test.type === "free" ? "linear-gradient(135deg, #0e4f3b, #1D9E75)" : "linear-gradient(135deg, #1e40af, #3b82f6)", color: locked ? "#9ca3af" : "#fff" }}
                                    >
                                        {locked ? "Enroll to Unlock" : "Start →"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tags */}
                {batch?.tags?.length > 0 && (
                    <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {batch.tags.map(t => (
                            <span key={t} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, background: "rgba(0,37,110,0.08)", color: "#00256e", fontWeight: 600 }}>#{t}</span>
                        ))}
                    </div>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}