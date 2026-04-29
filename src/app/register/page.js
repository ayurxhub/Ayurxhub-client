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
            <span
                style={{
                    width: "28px",
                    height: "3px",
                    borderRadius: "999px",
                    background: "#77ffc8",
                }}
            />
            <span
                style={{
                    width: "10px",
                    height: "3px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.45)",
                }}
            />
            <span
                style={{
                    width: "10px",
                    height: "3px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.25)",
                }}
            />
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
    const [role, setRole] = useState("expert");
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
                // Existing user — check verification status
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
                // New user — show role picker
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
}