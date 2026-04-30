"use client";

import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle } from "../../lib/firebase.js";
import GoogleButton from "../components/GoogleButton.jsx";
import GoogleRolePicker from "../components/GoogleRolePicker.jsx";

const shellStyle = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
        "radial-gradient(circle at top right, rgba(32,65,145,0.28), transparent 24%), #11151d",
};

const frameStyle = {
    width: "100%",
    maxWidth: "1440px",
    minHeight: "760px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#0b1735",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
};

const leftHero = {
    position: "relative",
    display: "flex",
    alignItems: "flex-end",
    padding: "48px 36px 40px",
    color: "#ffffff",
    background:
        "linear-gradient(180deg, rgba(15,31,73,0.32), rgba(10,29,89,0.84)), url('https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80') center/cover",
};

const rightPane = {
    background: "#ffffff",
    display: "flex",
    justifyContent: "center",
    padding: "34px 24px",
};

const inputStyle = {
    width: "100%",
    height: "44px",
    borderRadius: "10px",
    border: "1px solid #edf0f5",
    background: "#f1f3f7",
    padding: "0 14px",
    fontSize: "14px",
    color: "#24324d",
    outline: "none",
    transition: "all 0.2s ease",
};

const labelStyle = {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#5f6b85",
    marginBottom: "8px",
};

const logoSquare = {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#f4f6fb",
    display: "grid",
    placeItems: "center",
    color: "#113a89",
    fontSize: "12px",
    fontWeight: 700,
};

function CarouselDots() {
    return (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "22px" }}>
            <span style={{ width: "28px", height: "3px", borderRadius: "999px", background: "#77ffc8" }} />
            <span style={{ width: "10px", height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.45)" }} />
            <span style={{ width: "10px", height: "3px", borderRadius: "999px", background: "rgba(255,255,255,0.25)" }} />
        </div>
    );
}

export default function RegisterPage() {
    const { register, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("student");
    const [agree, setAgree] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googlePending, setGooglePending] = useState(null);

    const hoverInputEvents = useMemo(
        () => ({
            onFocus: (e) => {
                e.target.style.background = "#ffffff";
                e.target.style.borderColor = "#d6ddeb";
                e.target.style.boxShadow = "0 0 0 4px rgba(30, 75, 171, 0.08)";
            },
            onBlur: (e) => {
                e.target.style.background = "#f1f3f7";
                e.target.style.borderColor = "#edf0f5";
                e.target.style.boxShadow = "none";
            },
        }),
        []
    );

    const handleGoogleSignUp = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            const { idToken, displayName, email } = await signInWithGoogle();
            try {
                const user = await loginWithGoogle(idToken);
                if (user.role === "expert") {
                    if (!user.verificationStatus || user.verificationStatus !== "approved") {
                        router.push("/onboarding");
                    } else {
                        router.push("/consultant/dashboard");
                    }
                } else {
                    router.push("/");
                }
            } catch {
                setGooglePending({ idToken, name: displayName, email });
            }
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user") {
                setError("Google sign-up failed. Please try again.");
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
            if (user.role === "expert") {
                router.push("/onboarding");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Account creation failed");
            setGooglePending(null);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirmPassword) return setError("Passwords do not match");
        if (password.length < 8) return setError("Password must be at least 8 characters");
        if (!agree) return setError("Please accept the terms to continue");
        setLoading(true);
        try {
            const user = await register(name, email, password, role);
            if (user.role === "expert") router.push("/onboarding");
            else router.push("/");
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (googlePending) {
        return (
            <div style={shellStyle}>
                <GoogleRolePicker
                    name={googlePending.name}
                    email={googlePending.email}
                    onSelect={handleGoogleRoleSelect}
                    loading={googleLoading}
                />
            </div>
        );
    }

    return (
        <div style={shellStyle}>
            <div style={frameStyle}>
                {/* Left hero panel */}
                <div style={leftHero}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
                            <div style={logoSquare}>A</div>
                            <span style={{ fontSize: "15px", fontWeight: 600, letterSpacing: "-0.01em" }}>AyurXHub</span>
                        </div>
                        <h1 style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1.2, marginBottom: "16px", letterSpacing: "-0.02em" }}>
                            Join the Ayurveda<br />learning platform
                        </h1>
                        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: "340px" }}>
                            Connect with expert practitioners, access study materials, and grow your Ayurvedic practice.
                        </p>
                        <CarouselDots />
                    </div>
                </div>

                {/* Right form panel */}
                <div style={rightPane}>
                    <div style={{ width: "100%", maxWidth: "420px" }}>
                        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                            Create your account
                        </h2>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
                            Already have an account?{" "}
                            <Link href="/login" style={{ color: "#1e4bab", fontWeight: 600, textDecoration: "none" }}>
                                Sign in
                            </Link>
                        </p>

                        {/* Role selector */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                            {["student", "expert"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    style={{
                                        padding: "10px",
                                        borderRadius: "10px",
                                        border: `2px solid ${role === r ? "#1e4bab" : "#edf0f5"}`,
                                        background: role === r ? "#eff4ff" : "#f8fafc",
                                        color: role === r ? "#1e4bab" : "#64748b",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        textTransform: "capitalize",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {r === "student" ? "👨‍🎓 Student" : "👨‍⚕️ Expert"}
                                </button>
                            ))}
                        </div>

                        {/* Google sign up */}
                        <GoogleButton onClick={handleGoogleSignUp} loading={googleLoading} label="Sign up with Google" />

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
                            <div style={{ flex: 1, height: "1px", background: "#edf0f5" }} />
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>or register with email</span>
                            <div style={{ flex: 1, height: "1px", background: "#edf0f5" }} />
                        </div>

                        {error && (
                            <div style={{ padding: "10px 14px", borderRadius: "8px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", fontSize: "13px", marginBottom: "16px" }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={labelStyle}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                    style={inputStyle}
                                    {...hoverInputEvents}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={inputStyle}
                                    {...hoverInputEvents}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 8 characters"
                                        required
                                        style={{ ...inputStyle, paddingRight: "44px" }}
                                        {...hoverInputEvents}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "13px" }}
                                    >
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Confirm Password</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    required
                                    style={inputStyle}
                                    {...hoverInputEvents}
                                />
                            </div>

                            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                    style={{ marginTop: "2px", flexShrink: 0 }}
                                />
                                <span style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                                    I agree to the{" "}
                                    <Link href="/terms" style={{ color: "#1e4bab", textDecoration: "none" }}>Terms of Service</Link>
                                    {" "}and{" "}
                                    <Link href="/terms" style={{ color: "#1e4bab", textDecoration: "none" }}>Privacy Policy</Link>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    height: "46px",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: loading ? "#cbd5e1" : "linear-gradient(135deg, #1e4bab, #113a89)",
                                    color: "#ffffff",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                    marginTop: "4px",
                                }}
                            >
                                {loading ? "Creating account…" : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}