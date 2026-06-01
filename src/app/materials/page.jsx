"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const publicApi = axios.create({ baseURL: API }); // token-less client for public browsing

const CATEGORIES = [
    "All", "Classical Texts", "Pharmacology", "Anatomy", "Diagnosis",
    "Panchakarma", "Nutrition", "Research", "Clinical", "Other"
];

// A material is "paid" if explicitly marked isPaid, or isFree === false.
const isPaidItem = (m) => m?.isPaid === true || m?.isFree === false;

export default function MaterialsPage() {
    return <MaterialsList />;
}

function MaterialsList() {
    const { user, authAxios } = useAuth();
    const router = useRouter();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [downloading, setDownloading] = useState(null);
    const [viewing, setViewing] = useState(null);

    useEffect(() => { fetchMaterials(); }, [category]);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (category !== "All") params.append("category", category);
            const res = await publicApi.get(`/materials?${params}`);
            setMaterials(res.data.materials);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Logged-in users get the authed client (carries token); guests get the public one.
    const client = () => (user ? authAxios : publicApi);

    const handleDownload = async (m) => {
        if (isPaidItem(m) && !user) {
            router.push(`/signup?next=/materials`);
            return;
        }
        setDownloading(m._id);
        try {
            const res = await client().get(`/materials/${m._id}/download?t=${Date.now()}`, {
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${m.title || "material"}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
        } finally {
            setDownloading(null);
        }
    };

    const handleView = async (m) => {
        if (isPaidItem(m) && !user) {
            router.push(`/signup?next=/materials`);
            return;
        }
        setViewing(m._id);
        try {
            const res = await client().get(`/materials/${m._id}/download?inline=true&t=${Date.now()}`, {
                responseType: "blob",
            });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error("View failed:", err);
        } finally {
            setViewing(null);
        }
    };

    const formatSize = (bytes) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    const filtered = materials.filter((m) =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.author?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: "24px", background: "var(--color-background-tertiary)", minHeight: "100vh" }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 }}>
                    Study Materials
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                    Download Ayurveda books, notes, and research papers
                </p>
            </div>

            {/* Search */}
            <input placeholder="Search by title or author..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", maxWidth: 400, padding: "9px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13, outline: "none", marginBottom: 16, fontFamily: "var(--font-sans)" }} />

            {/* Category Tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
                {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)}
                        style={{ padding: "6px 14px", borderRadius: 20, border: "0.5px solid", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: category === cat ? 500 : 400, background: category === cat ? "#1D9E75" : "var(--color-background-primary)", color: category === cat ? "white" : "var(--color-text-secondary)", borderColor: category === cat ? "#1D9E75" : "var(--color-border-secondary)" }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--color-text-secondary)" }}>
                    <p>No materials found</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                    {filtered.map((m) => {
                        const paid = isPaidItem(m);
                        const locked = paid && !user;
                        return (
                            <div key={m._id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: 20, display: "flex", flexDirection: "column" }}>

                                {/* PDF Icon */}
                                <div style={{ width: 48, height: 48, borderRadius: "var(--border-radius-md)", background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 22 }}>
                                    📄
                                </div>

                                <p style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4, lineHeight: 1.4 }}>{m.title}</p>
                                {m.author && <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 8 }}>by {m.author}</p>}

                                {m.description && (
                                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {m.description}
                                    </p>
                                )}

                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#E6F1FB", color: "#185FA5" }}>{m.category}</span>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)" }}>{m.language}</span>
                                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: paid ? "#fef3c7" : "#E1F5EE", color: paid ? "#92400e" : "#0F6E56" }}>
                                        {paid ? "PRO" : "Free"}
                                    </span>
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                                    <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                                        {formatSize(m.fileSize)} · {m.downloads} downloads
                                    </p>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        <button onClick={() => handleView(m)}
                                            disabled={viewing === m._id}
                                            style={{ padding: "7px 12px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: viewing === m._id ? 0.6 : 1 }}>
                                            {viewing === m._id ? "..." : (locked ? "🔒 View" : "View")}
                                        </button>
                                        <button onClick={() => handleDownload(m)}
                                            disabled={downloading === m._id}
                                            style={{ padding: "7px 16px", borderRadius: "var(--border-radius-md)", background: "#1D9E75", color: "white", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", opacity: downloading === m._id ? 0.6 : 1 }}>
                                            {downloading === m._id ? "..." : (locked ? "🔒 Unlock" : "Download")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}