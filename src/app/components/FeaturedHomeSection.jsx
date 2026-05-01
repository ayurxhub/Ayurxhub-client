"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const COLORS = {
    "Ayurveda Basics": "#00256e",
    "Herbs & Plants": "#166534",
    "Clinical Practice": "#1D9E75",
    "Research": "#5000C8",
    "Lifestyle": "#8B4513",
    "Nutrition": "#854d0e",
    "News & Updates": "#dc2626",
    "Classical Texts": "#00256e",
    "Pharmacology": "#166534",
    "Anatomy": "#1D9E75",
    "Diagnosis": "#5000C8",
    "Panchakarma": "#8B4513",
    "Clinical": "#0e7490",
    "Other": "#374151",
};

function stripHtml(html = "") {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
        .replace(/&[a-z]+;/g, " ")
        .replace(/\s+/g, " ").trim();
}

export default function FeaturedHomeSection() {
    const [blogs, setBlogs] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("all");

    useEffect(() => {
        Promise.allSettled([
            axios.get(`${API}/blogs`, { params: { featured: "true", limit: 6 } }),
            axios.get(`${API}/materials`, { params: { featured: "true", limit: 6 } }),
        ]).then(([b, m]) => {
            if (b.status === "fulfilled") setBlogs(b.value.data.blogs || []);
            if (m.status === "fulfilled") setMaterials(m.value.data.materials || []);
        }).finally(() => setLoading(false));
    }, []);

    const allItems = [
        ...blogs.map(b => ({ ...b, _type: "blog" })),
        ...materials.map(m => ({ ...m, _type: "material" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const displayed =
        tab === "blogs" ? allItems.filter(i => i._type === "blog") :
            tab === "courses" ? allItems.filter(i => i._type === "material") :
                allItems;

    if (!loading && allItems.length === 0) return null;

    const tabs = [
        { key: "all", label: "All", count: allItems.length },
        { key: "blogs", label: "Articles", count: blogs.length },
        { key: "courses", label: "Courses & Books", count: materials.length },
    ].filter(t => t.key === "all" || t.count > 0);

    return (
        <section style={{ padding: "0 32px 56px", maxWidth: 1280, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <p style={{
                    fontSize: 11, fontWeight: 800, color: "#1D9E75",
                    letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px",
                }}>✦ Editor&apos;s Picks</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                    <h2 style={{
                        fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 900,
                        color: "#00256e", margin: 0, letterSpacing: "-0.03em",
                    }}>Featured on Home</h2>

                    <div style={{ display: "flex", gap: 6 }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)} style={{
                                padding: "6px 14px", borderRadius: 20,
                                border: "1.5px solid",
                                borderColor: tab === t.key ? "#00256e" : "#e5e7eb",
                                background: tab === t.key ? "#00256e" : "#fff",
                                color: tab === t.key ? "#fff" : "#6b7280",
                                fontSize: 12, fontWeight: 700, cursor: "pointer",
                                fontFamily: "inherit", transition: "all 0.15s",
                                display: "flex", alignItems: "center", gap: 5,
                            }}>
                                {t.label}
                                <span style={{
                                    fontSize: 10, fontWeight: 800,
                                    background: tab === t.key ? "rgba(255,255,255,0.22)" : "#f3f4f6",
                                    color: tab === t.key ? "#fff" : "#9ca3af",
                                    padding: "1px 5px", borderRadius: 8,
                                }}>{t.count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="fhs-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            height: 260, borderRadius: 16, background: "#e9ecef",
                            animation: `fhsPulse 1.6s ease ${i * 150}ms infinite`,
                        }} />
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "36px",
                    background: "#f9fafb", borderRadius: 16,
                    border: "1.5px dashed #e5e7eb",
                }}>
                    <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                        No featured {tab === "blogs" ? "articles" : tab === "courses" ? "courses" : "content"} yet.
                    </p>
                </div>
            ) : (
                <div className="fhs-grid">
                    {displayed.slice(0, 6).map((item, i) => (
                        <Card key={item._id} item={item} index={i} />
                    ))}
                </div>
            )}

            <style>{`
                .fhs-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 20px;
                }
                @media (max-width: 900px) {
                    .fhs-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 560px) {
                    .fhs-grid { grid-template-columns: 1fr; gap: 14px; }
                }
                @keyframes fhsPulse {
                    0%,100% { opacity:1; } 50% { opacity:.45; }
                }
                @keyframes fhsUp {
                    from { opacity:0; transform:translateY(14px); }
                    to   { opacity:1; transform:translateY(0); }
                }
            `}</style>
        </section>
    );
}

function Card({ item, index }) {
    const isBlog = item._type === "blog";
    const color = COLORS[item.category] || COLORS["Other"];
    const href = isBlog ? `/blog/${item.slug}` : `/materials/${item._id}`;
    const cover = isBlog ? item.coverImage : item.thumbnail;
    const excerpt = stripHtml(isBlog
        ? (item.excerpt || item.content || "")
        : (item.description || "")).slice(0, 90);

    const dateStr = new Date(item.createdAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
    });

    return (
        <Link href={href} style={{ textDecoration: "none" }}
            onMouseEnter={e => {
                const card = e.currentTarget.querySelector(".fhs-card");
                if (card) { card.style.transform = "translateY(-3px)"; card.style.boxShadow = "0 12px 32px rgba(0,0,0,0.1)"; }
            }}
            onMouseLeave={e => {
                const card = e.currentTarget.querySelector(".fhs-card");
                if (card) { card.style.transform = "translateY(0)"; card.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }
            }}
        >
            <div className="fhs-card" style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                animation: `fhsUp 0.45s ease ${index * 70}ms both`,
            }}>
                {/* Image */}
                <div style={{
                    height: 160, position: "relative", overflow: "hidden",
                    background: `${color}12`,
                }}>
                    {cover ? (
                        <Image src={cover} alt={item.title} fill style={{ objectFit: "cover" }} />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                            <span className="material-symbols-outlined" style={{
                                fontSize: 42, color, opacity: 0.2, fontVariationSettings: "'FILL' 1",
                            }}>
                                {isBlog ? "article" : "menu_book"}
                            </span>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: "14px 16px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{dateStr}</span>
                        <span style={{
                            fontSize: 10, fontWeight: 700, color,
                            background: `${color}14`, padding: "2px 8px", borderRadius: 20,
                        }}>
                            {isBlog ? "Article" : "Book"}
                        </span>
                    </div>

                    <h3 style={{
                        fontSize: 14, fontWeight: 800, color: "#111827",
                        margin: "0 0 6px", lineHeight: 1.35, letterSpacing: "-0.01em",
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                        {item.title}
                    </h3>

                    {excerpt && (
                        <p style={{
                            fontSize: 12, color: "#6b7280", lineHeight: 1.6,
                            margin: "0 0 12px",
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                            {excerpt}
                        </p>
                    )}

                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        paddingTop: 10, borderTop: "1px solid #f3f4f6",
                    }}>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
                            {item.author || "AyuRxHub Team"}
                            {isBlog && item.readTime ? ` · ${item.readTime}m` : ""}
                        </span>
                        <span style={{
                            fontSize: 11, color, fontWeight: 700,
                            display: "flex", alignItems: "center", gap: 2,
                        }}>
                            {isBlog ? "Read" : "View"}
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}