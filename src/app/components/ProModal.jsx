"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const PLAN_META = {
    monthly: { period: "month", save: null, badge: null, icon: "🌱" },
    quarterly: { period: "3 months", save: "17%", badge: "MOST POPULAR", icon: "🌿" },
    yearly: { period: "year", save: "58%", badge: "BEST VALUE", icon: "🌳" },
};

function loadRazorpay() {
    return new Promise(resolve => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function ProModal({ onClose }) {
    const { authAxios, user, setUser } = useAuth();
    const [plans, setPlans] = useState({
        monthly: { price: 199, label: "Monthly" },
        quarterly: { price: 499, label: "Quarterly" },
        yearly: { price: 999, label: "Yearly" },
    });
    const [selected, setSelected] = useState("quarterly");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // If user is already Pro, show status instead of plans
    const isProActive = user?.isPro && user?.proExpiry && new Date(user.proExpiry) > new Date();

    useEffect(() => {
        axios.get(`${API}/settings`).then(res => {
            if (res.data.settings?.proPlans) setPlans(res.data.settings.proPlans);
        }).catch(() => { });
    }, []);

    const handleSubscribe = async () => {
        setLoading(true);
        setError("");
        try {
            // Load Razorpay script
            const loaded = await loadRazorpay();
            if (!loaded) throw new Error("Failed to load payment gateway. Please try again.");

            // Create order on server
            const { data } = await authAxios.post("/auth/create-order", { plan: selected });
            if (!data.success) throw new Error(data.message);

            // Open Razorpay checkout
            const options = {
                key: RAZORPAY_KEY,
                amount: data.order.amount,
                currency: "INR",
                name: "AyurXHub Pro",
                description: `${plans[selected].label} Subscription`,
                order_id: data.order.id,
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: { color: "#00256e" },
                handler: async (response) => {
                    try {
                        // Verify payment on server
                        const verify = await authAxios.post("/auth/verify-payment", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: selected,
                        });
                        if (verify.data.success) {
                            // Update user context with Pro status
                            if (setUser) setUser(prev => ({
                                ...prev,
                                isPro: true,
                                proPlan: selected,
                                proExpiry: verify.data.user.proExpiry,
                            }));
                            setSuccess(true);
                        }
                    } catch (err) {
                        setError("Payment verified but activation failed. Contact support.");
                    }
                },
                modal: {
                    ondismiss: () => setLoading(false),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", (response) => {
                setError(`Payment failed: ${response.error.description}`);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const p = plans[selected];
    const meta = PLAN_META[selected];

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
        }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{
                background: "#fff", borderRadius: 24,
                width: "100%", maxWidth: 480,
                boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
                overflow: "hidden",
                animation: "proModalIn 0.25s ease",
            }}>
                {/* Header */}
                <div style={{
                    background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 50%, #1D9E75 100%)",
                    padding: "28px 28px 24px", position: "relative",
                }}>
                    <button onClick={onClose} style={{
                        position: "absolute", top: 14, right: 14,
                        background: "rgba(255,255,255,0.15)", border: "none",
                        color: "#fff", width: 30, height: 30, borderRadius: "50%",
                        cursor: "pointer", fontSize: 16, display: "flex",
                        alignItems: "center", justifyContent: "center",
                    }}>×</button>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
                        <div>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>AyurXHub</p>
                            <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
                                {isProActive ? "You're Pro! 🎉" : "Go Pro"}
                            </p>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                        {isProActive
                            ? `Your ${user.proPlan} plan is active until ${new Date(user.proExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
                            : "Unlock full chapter tests, detailed analytics, and unlimited access to the complete test series."}
                    </p>
                </div>

                <div style={{ padding: "24px 24px 28px" }}>
                    {/* Already Pro state */}
                    {isProActive ? (
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <p style={{ fontSize: 48, margin: "0 0 12px" }}>✅</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>All tests unlocked!</p>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
                                You have full access to all {user.proPlan} tests on the platform.
                            </p>
                            <button onClick={onClose} style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Start Learning →
                            </button>
                        </div>
                    ) : success ? (
                        /* Success state */
                        <div style={{ textAlign: "center", padding: "20px 0" }}>
                            <p style={{ fontSize: 48, margin: "0 0 12px" }}>🎉</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Welcome to Pro!</p>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
                                All full tests are now unlocked. Start learning!
                            </p>
                            <button onClick={onClose} style={{ padding: "12px 32px", borderRadius: 12, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Start Learning →
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "#fee2e2", color: "#991b1b", fontSize: 12 }}>
                                    {error}
                                </div>
                            )}

                            {/* Plan cards */}
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Choose your plan</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                                {Object.entries(plans).map(([key, plan]) => {
                                    const m = PLAN_META[key];
                                    const isSelected = selected === key;
                                    return (
                                        <div key={key} onClick={() => setSelected(key)} style={{
                                            border: `2px solid ${isSelected ? "#00256e" : "#e5e7eb"}`,
                                            borderRadius: 14, padding: "14px 16px",
                                            cursor: "pointer", position: "relative",
                                            background: isSelected ? "#eff6ff" : "#fafafa",
                                            transition: "all 0.15s",
                                            display: "flex", alignItems: "center", justifyContent: "space-between",
                                        }}>
                                            {m.badge && (
                                                <span style={{
                                                    position: "absolute", top: -10, right: 14,
                                                    background: isSelected ? "#00256e" : "#1D9E75",
                                                    color: "#fff", fontSize: 9, fontWeight: 800,
                                                    padding: "3px 10px", borderRadius: 20, letterSpacing: "0.06em",
                                                }}>{m.badge}</span>
                                            )}
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <span style={{ fontSize: 22 }}>{m.icon}</span>
                                                <div>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{plan.label}</p>
                                                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>per {m.period}{m.save ? ` · Save ${m.save}` : ""}</p>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: 20, fontWeight: 800, color: isSelected ? "#00256e" : "#111827", margin: 0 }}>₹{plan.price}</p>
                                                {key !== "monthly" && (
                                                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>
                                                        ₹{Math.round(plan.price / (key === "quarterly" ? 3 : 12))}/mo
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <div style={{ position: "absolute", top: 12, left: -1, width: 4, height: "calc(100% - 24px)", background: "#00256e", borderRadius: "0 4px 4px 0" }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* What's included */}
                            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
                                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>What's included</p>
                                {[
                                    "All full chapter tests (30 questions each)",
                                    "Detailed performance analytics & score history",
                                    "Question-level explanations for every answer",
                                    "Unlimited test retakes",
                                    "Priority access to new test content",
                                ].map(item => (
                                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <span style={{ color: "#1D9E75", fontSize: 14, flexShrink: 0 }}>✓</span>
                                        <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>{item}</p>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <button onClick={handleSubscribe} disabled={loading} style={{
                                width: "100%", padding: "14px",
                                borderRadius: 12, border: "none",
                                background: loading ? "#9ca3af" : "linear-gradient(135deg, #00256e, #1D9E75)",
                                color: "#fff", fontSize: 15, fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "inherit", transition: "opacity 0.15s",
                            }}>
                                {loading ? "Opening payment..." : `Subscribe for ₹${p.price} / ${meta.period}`}
                            </button>
                            <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", margin: "10px 0 0" }}>
                                Cancel anytime · Secure payment via Razorpay
                            </p>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes proModalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}