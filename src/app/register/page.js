"use client";

import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithGoogle } from "../../lib/firebase.js";
import GoogleButton from "../components/GoogleButton.jsx";
import GoogleRolePicker from "../components/GoogleRolePicker.jsx";

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
    boxSizing: "border-box",
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

function CarouselDots() {
    return (
        <div className="carousel-dots">
            <span />
            <span />
            <span />
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

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (!agree) {
            setError("Please accept the terms to continue");
            return;
        }

        setLoading(true);

        try {
            const user = await register(name, email, password, role);

            if (user.role === "expert") {
                router.push("/onboarding");
            } else {
                router.push("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (googlePending) {
        return (
            <div className="register-shell">
                <GoogleRolePicker
                    name={googlePending.name}
                    email={googlePending.email}
                    onSelect={handleGoogleRoleSelect}
                    loading={googleLoading}
                />
                <ResponsiveStyles />
            </div>
        );
    }

    return (
        <div className="register-shell">
            <div className="register-frame">
                <div className="register-hero">
                    <div className="hero-content">

                        <div className="back-row">
                            <button onClick={() => router.back()}>
                                ← Back
                            </button>
                        </div>
                        <div className="brand-row">
                            <img
                                src="/Ayurxhub logo.png"
                                alt="AyurXHub Logo"
                                className="logo-img"
                            />
                            <span>AyurXHub</span>
                        </div>



                        <h1>
                            Join the Ayurveda
                            <br />
                            learning platform
                        </h1>

                        <p>
                            Connect with expert practitioners, access study materials,
                            and grow your Ayurvedic practice.
                        </p>

                        <CarouselDots />
                    </div>
                </div>

                <div className="register-pane">
                    <div className="register-card">
                        <h2>Create your account</h2>

                        <p className="signin-text">
                            Already have an account?{" "}
                            <Link href="/login">Sign in</Link>
                        </p>

                        <div className="role-grid">
                            {["student", "expert"].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={role === r ? "active" : ""}
                                >
                                    <span>{r === "student" ? "👨‍🎓" : "👨‍⚕️"}</span>
                                    {r === "student" ? "Student" : "Expert"}
                                </button>
                            ))}
                        </div>

                        <GoogleButton
                            onClick={handleGoogleSignUp}
                            loading={googleLoading}
                            label="Sign up with Google"
                        />

                        <div className="divider">
                            <span />
                            <p>or register with email</p>
                            <span />
                        </div>

                        {error && (
                            <div className="error-box">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="field">
                                <label style={labelStyle}>Full name</label>
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

                            <div className="field">
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

                            <div className="field">
                                <label style={labelStyle}>Password</label>
                                <div className="password-wrap">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        required
                                        style={{
                                            ...inputStyle,
                                            paddingRight: "44px",
                                        }}
                                        {...hoverInputEvents}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="eye-btn"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? "🙈" : "👁"}
                                    </button>
                                </div>
                            </div>

                            <div className="field">
                                <label style={labelStyle}>Confirm password</label>
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

                            <label className="terms-row">
                                <input
                                    type="checkbox"
                                    checked={agree}
                                    onChange={(e) => setAgree(e.target.checked)}
                                />

                                <span>
                                    I agree to the{" "}
                                    <Link href="/terms">Terms of Service</Link>{" "}
                                    and{" "}
                                    <Link href="/privacy">Privacy Policy</Link>
                                </span>
                            </label>

                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <ResponsiveStyles />
        </div>
    );
}

function ResponsiveStyles() {
    return (
        <style>{`
            * {
                box-sizing: border-box;
            }

            html,
            body {
                margin: 0;
                padding: 0;
                width: 100%;
                overflow-x: hidden;
            }

            .register-shell {
                min-height: 100vh;
                width: 100%;
                max-width: 100vw;
                overflow-x: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                background:
                    radial-gradient(circle at top right, rgba(32,65,145,0.28), transparent 24%),
                    #11151d;
            }
                    .back-row {
    margin-bottom: 14px;
}

.back-row button {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.75);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
}

.back-row button:hover {
    color: #ffffff;
}

            .register-frame {
                width: 100%;
                max-width: 1440px;
                min-height: 760px;
                display: grid;
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.08);
                background: #0b1735;
                box-shadow: 0 30px 80px rgba(0,0,0,0.45);
            }

            .register-hero {
                position: relative;
                display: flex;
                align-items: flex-end;
                padding: 48px 36px 40px;
                color: #ffffff;
                min-width: 0;
                background:
                    linear-gradient(180deg, rgba(15,31,73,0.32), rgba(10,29,89,0.84)),
                    url("https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80") center/cover;
            }

            .hero-content {
                width: 100%;
                max-width: 380px;
            }

            .brand-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 32px;
            }

            .brand-row span {
                font-size: 15px;
                font-weight: 600;
                letter-spacing: -0.01em;
            }

           .logo-img {
    width: 32px;
    height: 32px;
    object-fit: contain;
    flex-shrink: 0;
}

            .register-hero h1 {
                font-size: 32px;
                font-weight: 700;
                line-height: 1.2;
                margin: 0 0 16px;
                letter-spacing: -0.02em;
            }

            .register-hero p {
                font-size: 15px;
                color: rgba(255,255,255,0.65);
                line-height: 1.6;
                max-width: 340px;
                margin: 0;
            }

            .carousel-dots {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-top: 22px;
            }

            .carousel-dots span {
                height: 3px;
                border-radius: 999px;
            }

            .carousel-dots span:nth-child(1) {
                width: 28px;
                background: #77ffc8;
            }

            .carousel-dots span:nth-child(2) {
                width: 10px;
                background: rgba(255,255,255,0.45);
            }

            .carousel-dots span:nth-child(3) {
                width: 10px;
                background: rgba(255,255,255,0.25);
            }

            .register-pane {
                background: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 34px 24px;
                min-width: 0;
                overflow: hidden;
            }

            .register-card {
                width: 100%;
                max-width: 420px;
                min-width: 0;
            }

            .register-card h2 {
                font-size: 22px;
                font-weight: 700;
                color: #0f172a;
                margin: 0 0 6px;
            }

            .signin-text {
                font-size: 14px;
                color: #64748b;
                margin: 0 0 24px;
            }

            .signin-text a {
                color: #1e4bab;
                font-weight: 600;
                text-decoration: none;
                white-space: nowrap;
            }

            .role-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 20px;
            }

            .role-grid button {
                min-width: 0;
                padding: 10px;
                border-radius: 10px;
                border: 2px solid #edf0f5;
                background: #f8fafc;
                color: #64748b;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                text-transform: capitalize;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .role-grid button.active {
                border-color: #1e4bab;
                background: #eff4ff;
                color: #1e4bab;
            }

            .divider {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 18px 0;
            }

            .divider span {
                flex: 1;
                height: 1px;
                background: #edf0f5;
            }

            .divider p {
                margin: 0;
                font-size: 12px;
                color: #94a3b8;
                white-space: nowrap;
            }

            .error-box {
                margin-bottom: 16px;
                padding: 11px 14px;
                border-radius: 10px;
                background: #fef2f2;
                border: 1px solid #fecaca;
                color: #dc2626;
                font-size: 13px;
            }

            .field {
                margin-bottom: 16px;
                min-width: 0;
            }

            .password-wrap {
                position: relative;
                width: 100%;
                min-width: 0;
            }

            .eye-btn {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                border: none;
                background: transparent;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                font-size: 15px;
            }

            .terms-row {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                margin: 4px 0 20px;
                font-size: 12px;
                color: #64748b;
                line-height: 1.5;
            }

            .terms-row input {
                width: 16px;
                height: 16px;
                margin-top: 2px;
                flex-shrink: 0;
            }

            .terms-row a {
                color: #1e4bab;
                text-decoration: none;
                font-weight: 600;
            }

            .submit-btn {
                width: 100%;
                height: 48px;
                border: none;
                border-radius: 11px;
                background: linear-gradient(135deg, #123a87, #245bd8);
                color: #ffffff;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 12px 28px rgba(30,75,171,0.28);
            }

            .submit-btn:disabled {
                background: #94a3b8;
                cursor: not-allowed;
                box-shadow: none;
            }

            input,
            button {
                max-width: 100%;
            }

            @media (max-width: 900px) {
                .register-shell {
                    padding: 0;
                    align-items: stretch;
                }

                .register-frame {
                    min-height: 100dvh;
                    border-radius: 0;
                    grid-template-columns: 1fr;
                    grid-template-rows: auto 1fr;
                    border: none;
                }

                .register-hero {
                    min-height: 320px;
                    padding: 36px 28px 32px;
                    align-items: flex-end;
                }

                .register-pane {
                    align-items: flex-start;
                    padding: 34px 24px 44px;
                }

                .register-card {
                    max-width: 560px;
                    margin: 0 auto;
                }

                .register-hero h1 {
                    font-size: clamp(28px, 6vw, 40px);
                }
            }

            @media (max-width: 560px) {
                .register-hero {
                    min-height: 300px;
                    padding: 30px 22px 28px;
                }

                .brand-row {
                    margin-bottom: 24px;
                }

                .register-hero h1 {
                    font-size: 31px;
                }

                .register-hero p {
                    font-size: 14px;
                    max-width: 290px;
                }

                .register-pane {
                    padding: 30px 18px 36px;
                }

                .register-card {
                    max-width: 100%;
                }

                .register-card h2 {
                    font-size: 24px;
                    line-height: 1.2;
                }

                .signin-text {
                    font-size: 13px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }

                .role-grid {
                    gap: 8px;
                }

                .role-grid button {
                    padding: 10px 8px;
                    font-size: 12px;
                    flex-direction: column;
                }

                .divider {
                    gap: 8px;
                }

                .divider p {
                    font-size: 11px;
                }

                .terms-row {
                    font-size: 11.5px;
                }

                .submit-btn {
                    height: 46px;
                    font-size: 13px;
                }
            }

            @media (max-width: 380px) {
                .register-hero {
                    min-height: 280px;
                    padding: 26px 16px 24px;
                }

                .register-pane {
                    padding-left: 14px;
                    padding-right: 14px;
                }

                .register-hero h1 {
                    font-size: 28px;
                }

                .register-hero p {
                    font-size: 13px;
                }

                .role-grid button {
                    font-size: 11px;
                }

                .divider p {
                    white-space: normal;
                    text-align: center;
                }
            }
        `}</style>
    );
}