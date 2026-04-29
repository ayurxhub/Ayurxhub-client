"use client";

export default function GoogleRolePicker({ name, email, onSelect, loading }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
            <div style={{
                background: "#fff", borderRadius: 24, padding: "40px 36px",
                maxWidth: 480, width: "100%",
                boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
                animation: "popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
                    <h2 style={{
                        fontSize: 22, fontWeight: 800, color: "#111827",
                        letterSpacing: "-0.04em", margin: "0 0 8px",
                    }}>
                        Welcome to AyuRxHub
                    </h2>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
                        Signing in as <strong style={{ color: "#111827" }}>{name || email}</strong>
                    </p>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0" }}>
                        How will you use AyuRxHub?
                    </p>
                </div>

                {/* Role cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                    {/* Student card */}
                    <button
                        onClick={() => onSelect("student")}
                        disabled={loading}
                        style={{
                            padding: "24px 16px", borderRadius: 16, cursor: "pointer",
                            border: "2px solid #e5e7eb", background: "#f9fafb",
                            textAlign: "center", transition: "all 0.18s", fontFamily: "inherit",
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = "#0a1f44";
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,31,68,0.15)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#f9fafb";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🎓</div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0a1f44", margin: "0 0 6px" }}>
                            Student
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                            Book consultations, access study materials & test series
                        </p>
                    </button>

                    {/* Consultant card */}
                    <button
                        onClick={() => onSelect("expert")}
                        disabled={loading}
                        style={{
                            padding: "24px 16px", borderRadius: 16, cursor: "pointer",
                            border: "2px solid #e5e7eb", background: "#f9fafb",
                            textAlign: "center", transition: "all 0.18s", fontFamily: "inherit",
                            opacity: loading ? 0.6 : 1,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = "#0e4f3b";
                            e.currentTarget.style.background = "#f0fdf4";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(14,79,59,0.15)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#f9fafb";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🩺</div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#0e4f3b", margin: "0 0 6px" }}>
                            Consultant
                        </p>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>
                            List your practice, manage sessions & consult patients
                        </p>
                    </button>
                </div>

                {loading && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "12px 0" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid #0e4f3b", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                        <span style={{ fontSize: 13, color: "#6b7280" }}>Setting up your account…</span>
                    </div>
                )}

                <p style={{ fontSize: 11, color: "#d1d5db", textAlign: "center", margin: 0 }}>
                    You can update your role later from profile settings
                </p>
            </div>

            <style>{`
                @keyframes popIn {
                    from { opacity: 0; transform: scale(0.92) translateY(12px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0);    }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}