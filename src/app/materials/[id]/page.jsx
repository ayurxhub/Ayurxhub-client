"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const publicApi = axios.create({ baseURL: API });

const isPaidItem = (m) => m?.isPaid === true || m?.isFree === false;

export default function MaterialDetailPage({ params }) {
    return <MaterialDetail id={params.id} />;
}

function MaterialDetail({ id }) {
    const { user, authAxios } = useAuth();
    const router = useRouter();
    const [material, setMaterial] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [viewing, setViewing] = useState(false);
    const [dlError, setDlError] = useState("");

    useEffect(() => { fetchMaterial(); }, [id]);

    const fetchMaterial = async () => {
        setLoading(true);
        try {
            const res = await publicApi.get(`/materials/${id}`);
            setMaterial(res.data.material);
        } catch (err) {
            if (err.response?.status === 404) setNotFound(true);
            else console.error(err);
        } finally { setLoading(false); }
    };

    const client = () => (user ? authAxios : publicApi);

    // Backend always returns { url } as JSON — no blobs, no redirects
    const handleView = async () => {
        if (isPaidItem(material) && !user) { router.push(`/register?next=/materials/${id}`); return; }
        setViewing(true);
        setDlError("");
        try {
            const res = await client().get(`/materials/${id}/download?inline=true`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            window.open(url, "_blank");
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (e) {
            if (e.response?.data?.requiresPro) setDlError("⭐ Pro subscription required. Upgrade to access this material.");
            else setDlError("Could not open PDF. Please try again.");
        }
        finally { setViewing(false); }
    };

    const handleDownload = async () => {
        if (isPaidItem(material) && !user) { router.push(`/register?next=/materials/${id}`); return; }
        setDownloading(true);
        setDlError("");
        try {
            const res = await client().get(`/materials/${id}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `${material?.title || "material"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            if (e.response?.data?.requiresPro) setDlError("⭐ Pro subscription required. Upgrade to access this material.");
            else setDlError("Download failed. Please try again.");
        }
        finally { setDownloading(false); }
    };

    const formatSize = (bytes) => {
        if (!bytes) return "—";
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (notFound) return (
        <div style={{ padding: 24, minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <div style={{ fontSize: 40 }}>📄</div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>Material not found</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>It may have been removed or is no longer available.</p>
            <button onClick={() => router.push("/materials")}
                style={{ marginTop: 8, padding: "8px 20px", borderRadius: "var(--border-radius-md)", background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Back to Materials
            </button>
        </div>
    );

    if (!material) return null;

    const m = material;
    const paid = isPaidItem(m);
    const locked = paid && !user;

    return (
        <div style={{ padding: "24px", background: "var(--color-background-tertiary)", minHeight: "100vh" }}>

            <button onClick={() => router.push("/materials")}
                style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13, padding: 0, fontFamily: "var(--font-sans)" }}>
                ← Back to Materials
            </button>

            <div style={{ maxWidth: 720, margin: "0 auto" }}>
                <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "clamp(20px,4vw,32px)", marginBottom: 16 }}>

                    <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: "var(--border-radius-md)", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                            📄
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", margin: "0 0 4px", lineHeight: 1.4 }}>{m.title}</h1>
                            {m.author && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>by {m.author}</p>}
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#E6F1FB", color: "#185FA5", fontWeight: 500 }}>{m.category}</span>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)" }}>{m.language}</span>
                        <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: paid ? "#fef3c7" : "#E1F5EE", color: paid ? "#92400e" : "#0F6E56", fontWeight: 500 }}>
                            {paid ? "PRO" : "Free"}
                        </span>
                        {m.isFeatured && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fef9c3", color: "#92400e", fontWeight: 500 }}>⭐ Featured</span>}
                    </div>

                    {m.description && (
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>{m.description}</p>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, padding: "16px 0", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: 20 }}>
                        {[
                            ["File Size", formatSize(m.fileSize)],
                            ["Downloads", m.downloads ?? 0],
                            ["Subject", m.subject || "—"],
                            ["Pages", m.pages || "—"],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{label}</p>
                                <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: 0, fontWeight: 500 }}>{value}</p>
                            </div>
                        ))}
                    </div>

                    {m.tags?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                            {m.tags.map(tag => (
                                <span key={tag} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)" }}>{tag}</span>
                            ))}
                        </div>
                    )}

                    {locked && (
                        <p style={{ fontSize: 12, color: "#92400e", background: "#fef3c7", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                            🔒 This is premium content. Sign up free to view or download it.
                        </p>
                    )}

                    {dlError && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 10 }}>{dlError}</p>}

                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={handleView} disabled={viewing}
                            style={{ flex: 1, padding: "11px 0", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: 14, fontWeight: 600, cursor: viewing ? "not-allowed" : "pointer", opacity: viewing ? 0.7 : 1, fontFamily: "var(--font-sans)", transition: "opacity 0.15s" }}>
                            {viewing ? "Opening..." : locked ? "🔒 View PDF" : "👁 View PDF"}
                        </button>
                        <button onClick={handleDownload} disabled={downloading}
                            style={{ flex: 1, padding: "11px 0", borderRadius: "var(--border-radius-md)", background: "#1D9E75", color: "#fff", border: "none", fontSize: 14, fontWeight: 600, cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.7 : 1, fontFamily: "var(--font-sans)", transition: "opacity 0.15s" }}>
                            {downloading ? "Preparing..." : locked ? "🔒 Sign up to Download" : "⬇ Download PDF"}
                        </button>
                    </div>
                </div>

                {m.uploadedBy?.name && (
                    <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center" }}>
                        Uploaded by {m.uploadedBy.name}
                    </p>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}