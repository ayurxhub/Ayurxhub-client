"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORY_COLORS = {
    "Ayurveda Basics": { color: "#00256e", bg: "#e8eeff" },
    "Herbs & Plants": { color: "#166534", bg: "#dcfce7" },
    "Clinical Practice": { color: "#1D9E75", bg: "#E1F5EE" },
    "Research": { color: "#5000C8", bg: "#f0ebff" },
    "Lifestyle": { color: "#8B4513", bg: "#FFF0E0" },
    "Nutrition": { color: "#854d0e", bg: "#fef9c3" },
    "News & Updates": { color: "#dc2626", bg: "#fee2e2" },
    "Other": { color: "#374151", bg: "#f3f4f6" },
};

export default function FeaturedBlogSection() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API}/blogs`, {
                    params: { featured: true, limit: 3 }
                });
                setPosts(res.data.blogs || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Don't render section at all if no featured posts
    if (!loading && posts.length === 0) return null;

    return (
        <section style={{ padding: "0 32px 60px", maxWidth: 1280, margin: "0 auto" }}>

            {/* Section header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#1D9E75", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
                        ✦ From Our Blog
                    </p>
                    <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "#00256e", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Featured Articles
                    </h2>
                </div>
                <Link
                    href="/blog"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "9px 18px", borderRadius: 10,
                        border: "1px solid #e5e7eb", background: "#fff",
                        color: "#00256e", fontSize: 13, fontWeight: 600,
                        textDecoration: "none", transition: "all 0.15s",
                        whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#00256e"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#00256e"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#00256e"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                >
                    View All Articles
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
                </Link>
            </div>

            {/* Cards */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{ height: 300, borderRadius: 20, background: "#e5e7eb", animation: "blogPulse 1.5s infinite" }} />
                    ))}
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }} className="featured-blog-grid">
                    {posts.map((post, i) => (
                        <FeaturedBlogCard key={post._id} post={post} index={i} />
                    ))}
                </div>
            )}

            <style>{`
                @keyframes blogPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
                @media (max-width: 640px) {
                    .featured-blog-grid {
                        grid-template-columns: 1fr !important;
                        gap: 14px !important;
                    }
                }
            `}</style>
        </section>
    );
}

function FeaturedBlogCard({ post, index }) {
    const colors = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["Other"];

    return (
        <Link
            href={`/blog/${post.slug}`}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
            }}
            style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                border: "1px solid rgba(229,231,235,0.8)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                transition: "transform 0.22s ease, box-shadow 0.22s ease",
                animation: `blogFadeUp 0.5s ease ${index * 100}ms both`,
            }}
        >
            {/* Cover image */}
            <div style={{ height: 180, background: colors.bg, position: "relative", overflow: "hidden", flexShrink: 0 }}>
                {post.coverImage ? (
                    <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        style={{ objectFit: "cover" }}
                    />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 44, color: colors.color, opacity: 0.25 }}>article</span>
                    </div>
                )}

                {/* Category badge */}
                <div style={{
                    position: "absolute", top: 12, left: 12,
                    padding: "4px 10px", borderRadius: 20,
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(8px)",
                    fontSize: 10, fontWeight: 700, color: colors.color,
                }}>
                    {post.category}
                </div>

                {/* Featured badge */}
                <div style={{
                    position: "absolute", top: 12, right: 12,
                    padding: "4px 10px", borderRadius: 20,
                    background: "rgba(255,215,0,0.92)",
                    fontSize: 10, fontWeight: 700, color: "#92400e",
                }}>
                    ⭐ Featured
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <h3 style={{
                    fontSize: 15, fontWeight: 800, color: "#111827",
                    margin: 0, lineHeight: 1.35, letterSpacing: "-0.02em",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                    {post.title}
                </h3>

                <p style={{
                    fontSize: 13, color: "#6b7280", lineHeight: 1.6,
                    margin: 0, flex: 1,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                    {post.excerpt}
                </p>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: colors.color }}>person</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: 0 }}>{post.author}</p>
                            <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>
                                {new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {post.readTime} min read
                            </p>
                        </div>
                    </div>
                    <span style={{
                        fontSize: 12, color: colors.color, fontWeight: 700,
                        display: "flex", alignItems: "center", gap: 3,
                    }}>
                        Read
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                    </span>
                </div>
            </div>

            {/* Bottom accent */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${colors.color}, transparent)`, flexShrink: 0 }} />

            <style>{`
                @keyframes blogFadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </Link>
    );
}