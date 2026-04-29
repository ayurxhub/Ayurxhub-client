"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle } from "../../lib/firebase.js";
import GoogleButton from "../components/GoogleButton.jsx";
import GoogleRolePicker from "../components/GoogleRolePicker.jsx";

export default function LoginPage() {
    const { login, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [role, setRole] = useState("student");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googlePending, setGooglePending] = useState(null); // { idToken, name, email } waiting for role

    const isConsultant = role === "consultant";

    const handleGoogleSignIn = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            const { idToken, displayName, email } = await signInWithGoogle();
            // Try signing in — backend will find existing user or flag as new
            try {
                const user = await loginWithGoogle(idToken);
                redirect(user);
            } catch (err) {
                // 404-style: new user needs role selection
                if (err.response?.status === 201 || !err.response) {
                    setGooglePending({ idToken, name: displayName, email });
                } else {
                    setError(err.response?.data?.message || "Google sign-in failed");
                }
            }
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-in was cancelled or failed. Please try again.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleRoleSelect = async (selectedRole) => {
        if (!googlePending) return;
        setGoogleLoading(true);
        try {
            const user = await loginWithGoogle(googlePending.idToken, selectedRole);
            setGooglePending(null);
            redirect(user);
        } catch (err) {
            setError(err.response?.data?.message || "Account creation failed");
            setGooglePending(null);
        } finally {
            setGoogleLoading(false);
        }
    };

    const redirect = (user) => {
        if (user.role === "admin") router.push("/admin");
        else if (user.role === "expert") router.push("/consultation/dashboard");
        else router.push("/");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const user = await login(email, password);
            redirect(user);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const accent = isConsultant ? "#1D9E75" : "#2563eb";
    const accentDark = isConsultant ? "#0e4f3b" : "#0a1f44";
    const accentLight = isConsultant ? "#f0faf6" : "#eff6ff";
    const accentBorder = isConsultant ? "#a7f3d0" : "#bfdbfe";
    const accentText = isConsultant ? "#065f46" : "#1e40af";

    return (
        <div style={{ minHeight: "100vh", display: "flex", fontFamily: "system-ui, -apple-system, sans-serif" }}>

            {/* Left panel */}
            <div style={{
                flex: "0 0 44%", position: "relative", overflow: "hidden",
                background: isConsultant
                    ? "linear-gradient(145deg, #0a2540 0%, #0e4f3b 100%)"
                    : "linear-gradient(145deg, #0a1f44 0%, #1a3a6b 100%)",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                padding: "52px 48px", transition: "background 0.5s ease",
            }}>
                {/* Decorative blobs */}
                <div style={{
                    position: "absolute", top: -140, right: -140, width: 420, height: 420,
                    borderRadius: "50%",
                    background: isConsultant ? "rgba(29,158,117,0.1)" : "rgba(59,130,246,0.1)",
                    transition: "background 0.5s",
                }} />
                <div style={{
                    position: "absolute", bottom: -80, left: -60, width: 300, height: 300,
                    borderRadius: "50%",
                    background: isConsultant ? "rgba(29,158,117,0.07)" : "rgba(59,130,246,0.07)",
                    transition: "background 0.5s",
                }} />

                {/* Logo */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 10,
                        background: "rgba(255,255,255,0.09)", border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: 12, padding: "8px 16px",
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: accent, display: "grid", placeItems: "center",
                            fontSize: 12, fontWeight: 800, color: "#fff", transition: "background 0.5s",
                        }}>A</div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                            AyuRxHub
                        </span>
                    </div>
                </div>

                {/* Hero copy */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
                        background: isConsultant ? "rgba(29,158,117,0.18)" : "rgba(59,130,246,0.18)",
                        border: `1px solid ${isConsultant ? "rgba(29,158,117,0.4)" : "rgba(59,130,246,0.4)"}`,
                        borderRadius: 20, padding: "5px 13px",
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: isConsultant ? "#6EE7C7" : "#93c5fd",
                            display: "inline-block",
                        }} />
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: isConsultant ? "#6EE7C7" : "#93c5fd",
                        }}>
                            {isConsultant ? "Practitioner Portal" : "Student Portal"}
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: 42, fontWeight: 800, color: "#fff",
                        lineHeight: 1.1, letterSpacing: "-0.04em", margin: "0 0 16px",
                    }}>
                        {isConsultant ? (
                            <>Manage your<br /><span style={{ color: "#6EE7C7" }}>practice,</span><br /><span style={{ color: "#6EE7C7" }}>your way.</span></>
                        ) : (
                            <>Ancient wisdom.<br /><span style={{ color: "#93c5fd" }}>Modern</span><br /><span style={{ color: "#93c5fd" }}>learning.</span></>
                        )}
                    </h1>
                    <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.75, maxWidth: 340, margin: "0 0 28px" }}>
                        {isConsultant
                            ? "Set your availability, view scheduled sessions, and provide consultations — all from one dashboard."
                            : "Book consultations with certified Ayurveda practitioners and access university-grade study resources."}
                    </p>

                    {/* Feature list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(isConsultant ? [
                            { icon: "📅", text: "View & manage upcoming sessions" },
                            { icon: "✅", text: "Mark yourself available in seconds" },
                            { icon: "💬", text: "Live video & chat with patients" },
                        ] : [
                            { icon: "🩺", text: "Book sessions with verified experts" },
                            { icon: "📚", text: "Access curated Ayurveda materials" },
                            { icon: "🌿", text: "Track your wellness progress" },
                        ]).map(({ icon, text }) => (
                            <div key={text} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                                borderRadius: 10, padding: "10px 14px",
                            }}>
                                <span style={{ fontSize: 15 }}>{icon}</span>
                                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p style={{ position: "relative", zIndex: 1, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    © 2025 AyuRxHub Clinical Sanctuary
                </p>
            </div>

            {/* Right panel */}
            <div style={{
                flex: 1, display: "flex", alignItems: "center",
                justifyContent: "center", padding: "40px 32px", background: "#ffffff",
            }}>
                <div style={{ width: "100%", maxWidth: 400 }}>

                    {/* Role switcher */}
                    <div style={{
                        display: "flex", gap: 0, background: "#f3f4f6",
                        borderRadius: 14, padding: 4, marginBottom: 36,
                        border: "1px solid #e5e7eb",
                    }}>
                        {[
                            { key: "student", label: "Student", icon: "🎓" },
                            { key: "consultant", label: "Consultant", icon: "🩺" },
                        ].map(({ key, label, icon }) => (
                            <button key={key}
                                onClick={() => { setRole(key); setError(""); setEmail(""); setPassword(""); }}
                                style={{
                                    flex: 1, padding: "11px", borderRadius: 11, border: "none",
                                    cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                    background: role === key
                                        ? (key === "consultant" ? "#0e4f3b" : "#0a1f44")
                                        : "transparent",
                                    color: role === key ? "#fff" : "#9ca3af",
                                    boxShadow: role === key ? "0 2px 8px rgba(0,0,0,0.18)" : "none",
                                    transition: "all 0.22s",
                                }}
                            >
                                <span style={{ fontSize: 16 }}>{icon}</span>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Google sign-in */}
                    <GoogleButton
                        onClick={handleGoogleSignIn}
                        loading={googleLoading}
                        label="Continue with Google"
                    />

                    {/* Divider */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                        <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
                        <span style={{ fontSize: 11, color: "#d1d5db", fontWeight: 600, letterSpacing: "0.06em" }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: "#f3f4f6" }} />
                    </div>

                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{
                            fontSize: 26, fontWeight: 800, letterSpacing: "-0.04em",
                            color: accentDark, margin: "0 0 6px", transition: "color 0.3s",
                        }}>
                            {isConsultant ? "Welcome, Doctor" : "Welcome back"}
                        </h2>
                        <p style={{ fontSize: 14, color: "#9ca3af", margin: 0 }}>
                            {isConsultant
                                ? "Sign in to your practitioner account"
                                : "Sign in to continue your learning journey"}
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            marginBottom: 18, padding: "11px 14px",
                            background: "#fef2f2", border: "1px solid #fecaca",
                            borderRadius: 10, fontSize: 13, color: "#dc2626",
                            display: "flex", alignItems: "center", gap: 8,
                        }}>
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                                {isConsultant ? "Practitioner email" : "Email address"}
                            </label>
                            <input
                                type="email" value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={isConsultant ? "dr.sharma@clinic.com" : "you@university.edu"}
                                required
                                style={{
                                    width: "100%", height: 46, borderRadius: 10,
                                    border: "1.5px solid #e5e7eb", background: "#fafafa",
                                    padding: "0 14px", fontSize: 14, color: "#111827",
                                    outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                                    transition: "all 0.2s",
                                }}
                                onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accentLight}`; }}
                                onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Password</label>
                                <Link href="#" style={{ fontSize: 12, color: accent, fontWeight: 600, textDecoration: "none" }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    style={{
                                        width: "100%", height: 46, borderRadius: 10,
                                        border: "1.5px solid #e5e7eb", background: "#fafafa",
                                        padding: "0 44px 0 14px", fontSize: 14, color: "#111827",
                                        outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                                        transition: "all 0.2s",
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = accent; e.target.style.boxShadow = `0 0 0 3px ${accentLight}`; }}
                                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; }}
                                />
                                <button type="button" onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                                        background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af",
                                    }}>
                                    {showPassword ? "🙈" : "👁"}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: "100%", height: 50, border: "none", borderRadius: 12,
                                background: loading ? "#9ca3af" : `linear-gradient(135deg, ${accentDark}, ${accent})`,
                                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                                letterSpacing: "-0.01em", fontFamily: "inherit",
                                boxShadow: loading ? "none" : `0 4px 16px ${isConsultant ? "rgba(29,158,117,0.35)" : "rgba(10,31,68,0.35)"}`,
                                transition: "all 0.22s",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            }}>
                            {loading ? (
                                <>
                                    <div style={{
                                        width: 16, height: 16, borderRadius: "50%",
                                        border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "#fff",
                                        animation: "spin 0.7s linear infinite",
                                    }} />
                                    Signing in…
                                </>
                            ) : `Sign in as ${isConsultant ? "Consultant" : "Student"} →`}
                        </button>
                    </form>

                    <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", margin: "24px 0 0" }}>
                        {isConsultant ? "New practitioner?" : "New to AyuRxHub?"}{" "}
                        <Link href="/register"
                            style={{ color: accent, fontWeight: 700, textDecoration: "none" }}>
                            {isConsultant ? "Request access" : "Create account"}
                        </Link>
                    </p>
                    <p style={{ textAlign: "center", fontSize: 11, color: "#d1d5db", margin: "14px 0 0" }}>
                        By signing in you agree to our{" "}
                        <Link href={isConsultant ? "/terms?role=consultant" : "/terms"}
                            style={{ color: "#9ca3af", textDecoration: "underline" }}>
                            Terms & Conditions
                        </Link>
                    </p>

                    <div style={{
                        marginTop: 28, padding: "12px 16px",
                        background: accentLight, border: `1px solid ${accentBorder}`,
                        borderRadius: 10, fontSize: 12, color: accentText,
                        display: "flex", alignItems: "flex-start", gap: 8, transition: "all 0.3s",
                    }}>
                        <span style={{ flexShrink: 0 }}>{isConsultant ? "🩺" : "🎓"}</span>
                        <span>
                            {isConsultant
                                ? "After signing in, you'll see your upcoming sessions, set your weekly availability, and mark yourself free for new bookings."
                                : "After signing in, browse verified consultants, book a session, and download Ayurveda study materials."}
                        </span>
                    </div>
                </div>
            </div>

            {/* Google role picker modal */}
            {googlePending && (
                <GoogleRolePicker
                    name={googlePending.name}
                    email={googlePending.email}
                    onSelect={handleGoogleRoleSelect}
                    loading={googleLoading}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}