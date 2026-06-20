"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SuspendedAccount() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <div style={containerSt}>
            <div style={{ ...cardSt, borderTop: "3px solid #dc2626" }}>
                <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>⏸</div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", marginBottom: 8 }}>
                        Account Suspended
                    </h1>
                    <p style={{ color: "#757682", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
                        Your expert account, {user?.name || "this account"}, has been suspended and is
                        temporarily unable to accept or manage consultations.
                    </p>
                    {user?.rejectionReason && (
                        <div style={{
                            marginTop: 16, marginBottom: 8, padding: "12px 14px",
                            background: "#fef2f2", borderRadius: 10, textAlign: "left",
                        }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
                                Note from admin
                            </p>
                            <p style={{ fontSize: 12, color: "#991b1b" }}>{user.rejectionReason}</p>
                        </div>
                    )}
                    <p style={{ color: "#757682", fontSize: 13, marginTop: 16 }}>
                        If you believe this is a mistake, please contact platform support for details.
                    </p>
                </div>

                <button
                    onClick={async () => { await logout(); router.push("/login"); }}
                    style={btnSt}
                >
                    Sign out
                </button>
            </div>
        </div>
    );
}

const containerSt = { minHeight: "100vh", background: "#f7f9fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 };
const cardSt = { background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 4px 24px rgba(0,37,110,0.08)" };
const btnSt = { width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 };