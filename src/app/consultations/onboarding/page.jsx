"use client";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

const DOC_TYPES = [
    { key: "degree", label: "Degree Certificate", desc: "BAMS / MD Ayurveda degree certificate" },
    { key: "ccim", label: "CCIM Registration", desc: "Central Council of Indian Medicine registration" },
    { key: "id_proof", label: "Government ID", desc: "Aadhaar / PAN / Passport" },
];

const SUB_SPECIALIZATIONS = [
    "Chronic disease", "Detox therapy", "Women's health",
    "Pediatric care", "Skin disorders", "Digestive disorders",
    "Joint & musculoskeletal", "Mental wellness", "Lifestyle disorders",
];

export default function ExpertOnboarding() {
    const { authAxios, user } = useAuth();
    const router = useRouter();
    const [files, setFiles] = useState({ degree: null, ccim: null, id_proof: null });
    const [previews, setPreviews] = useState({});
    const [subSpecs, setSubSpecs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    if (user?.verificationStatus === "pending") {
        return (
            <div style={containerSt}>
                <div style={cardSt}>
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                        <h2 style={{ color: "#00256e", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                            Verification in Progress
                        </h2>
                        <p style={{ color: "#757682", fontSize: 14 }}>
                            Your documents are under review. This usually takes 1–2 business days.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleFile = (key, file) => {
        if (!file) return;
        setFiles(f => ({ ...f, [key]: file }));
        if (file.type.startsWith("image/")) {
            setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
        } else {
            setPreviews(p => ({ ...p, [key]: "pdf" }));
        }
    };

    const toggleSubSpec = (s) => {
        setSubSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    };

    const handleSubmit = async () => {
        if (!files.degree || !files.ccim || !files.id_proof) {
            setError("Please upload all 3 documents");
            return;
        }
        setUploading(true);
        setError("");
        try {
            const fd = new FormData();
            Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });
            await authAxios.post("/profile/documents", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            if (subSpecs.length > 0) {
                await authAxios.put("/profile/me", { subSpecializations: subSpecs });
            }
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    if (done) return (
        <div style={containerSt}>
            <div style={cardSt}>
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                    <h2 style={{ color: "#00256e", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                        Documents Submitted!
                    </h2>
                    <p style={{ color: "#757682", fontSize: 14, marginBottom: 24 }}>
                        Your profile is under review. We'll notify you once verified (usually 1–2 business days).
                    </p>
                    <button onClick={() => router.push("/dashboard")} style={btnSt}>
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );

    const isRejected = user?.verificationStatus === "rejected";

    return (
        <div style={containerSt}>
            <div style={{ ...cardSt, ...(isRejected ? { borderTop: "3px solid #dc2626" } : {}) }}>

                {isRejected && (
                    <div style={{ marginBottom: 20, padding: "12px 14px", background: "#fef2f2", borderRadius: 10 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#dc2626", marginBottom: 4 }}>
                            Verification Rejected
                        </p>
                        {user?.rejectionReason && (
                            <p style={{ fontSize: 12, color: "#991b1b" }}>
                                Reason: {user.rejectionReason}
                            </p>
                        )}
                        <p style={{ fontSize: 12, color: "#757682", marginTop: 6 }}>
                            Please resubmit corrected documents below.
                        </p>
                    </div>
                )}

                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", marginBottom: 6 }}>
                        {isRejected ? "Resubmit Verification" : "Complete Expert Verification"}
                    </h1>
                    <p style={{ fontSize: 13, color: "#757682" }}>
                        Upload your credentials to get verified and start accepting consultations.
                    </p>
                </div>

                {/* Document uploads */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
                    {DOC_TYPES.map(({ key, label, desc }) => (
                        <div key={key} style={{
                            border: `1.5px dashed ${files[key] ? "#1D9E75" : "rgba(197,198,211,0.6)"}`,
                            borderRadius: 12, padding: 16,
                            background: files[key] ? "#f0faf6" : "#fafafa",
                            transition: "all 0.2s",
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", marginBottom: 3 }}>{label}</p>
                                    <p style={{ fontSize: 11, color: "#757682" }}>{desc}</p>
                                </div>
                                {files[key] && (
                                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#E1F5EE", color: "#0F6E56", fontWeight: 600 }}>
                                        ✓ Uploaded
                                    </span>
                                )}
                            </div>
                            {previews[key] && previews[key] !== "pdf" && (
                                <img src={previews[key]} alt={label} style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 6, marginTop: 10 }} />
                            )}
                            {previews[key] === "pdf" && (
                                <div style={{ marginTop: 10, fontSize: 11, color: "#185FA5", background: "#E6F1FB", padding: "4px 10px", borderRadius: 6, display: "inline-block" }}>
                                    📄 PDF ready
                                </div>
                            )}
                            <label style={{
                                display: "inline-block", marginTop: 12, padding: "7px 16px",
                                borderRadius: 8, background: "#00256e", color: "#fff",
                                fontSize: 12, fontWeight: 600, cursor: "pointer",
                            }}>
                                {files[key] ? "Replace" : "Upload"} File
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    style={{ display: "none" }}
                                    onChange={(e) => handleFile(key, e.target.files[0])}
                                />
                            </label>
                        </div>
                    ))}
                </div>

                {/* Sub-specializations */}
                <div style={{ marginBottom: 24 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", marginBottom: 4 }}>
                        Sub-specializations
                    </p>
                    <p style={{ fontSize: 11, color: "#757682", marginBottom: 10 }}>
                        Select all that apply to your practice
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {SUB_SPECIALIZATIONS.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSubSpec(s)}
                                style={{
                                    padding: "5px 12px", borderRadius: 999, fontSize: 12,
                                    cursor: "pointer", border: "0.5px solid",
                                    background: subSpecs.includes(s) ? "#00256e" : "#fff",
                                    color: subSpecs.includes(s) ? "#fff" : "#757682",
                                    borderColor: subSpecs.includes(s) ? "#00256e" : "rgba(197,198,211,0.6)",
                                    transition: "all 0.15s",
                                }}
                            >{s}</button>
                        ))}
                    </div>
                </div>

                {error && (
                    <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 16, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>
                        {error}
                    </p>
                )}

                <button onClick={handleSubmit} disabled={uploading} style={{ ...btnSt, opacity: uploading ? 0.7 : 1 }}>
                    {uploading ? "Uploading..." : "Submit for Verification"}
                </button>
            </div>
        </div>
    );
}

const containerSt = { minHeight: "100vh", background: "#f7f9fc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 };
const cardSt = { background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 520, boxShadow: "0 4px 24px rgba(0,37,110,0.08)" };
const btnSt = { width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" };