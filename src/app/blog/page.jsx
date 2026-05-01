"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
    "All", "Ayurveda Basics", "Herbs & Plants", "Clinical Practice",
    "Research", "Lifestyle", "Nutrition", "News & Updates", "Other"
];

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

export default function BlogPage() {
    const [blogs, setBlogs] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 9 };
            if (category !== "All") params.category = category;
            if (search) params.search = search;
            const res = await axios.get(`${API}/blogs`, { params });
            setBlogs(res.data.blogs || []);
            setTotalPages(res.data.pages || 1);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadFeatured = async () => {
        try {
            const res = await axios.get(`${API}/blogs`, { params: { featured: true, limit: 3 } });
            setFeatured(res.data.blogs || []);
        } catch (e) { }
    };

    useEffect(() => { loadFeatured(); }, []);
    useEffect(() => { loadBlogs(); }, [category, search, page]); // eslint-disable-line

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleCategory = (cat) => {
        setCategory(cat);
        setPage(1);
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* ── Hero ── */}
            <section style={{ background: "linear-gradient(135deg, #00256e 0%, #0e4f3b 100%)", padding: "56px 32px 48px" }}>
                <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: "#6EE7C7", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                        ✦ AyuRxHub Blog
                    </p>
                    <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                        Insights from the<br /><span style={{ color: "#6EE7C7" }}>Ayurveda World</span>
                    </h1>
                    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", margin: "0 0 28px", lineHeight: 1.7 }}>
                        Articles, research, and practical guides for Ayurveda learners and practitioners.
                    </p>
                    <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 480, margin: "0 auto" }}>
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Search articles..."
                            style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "none", fontSize: 14, fontFamily: "inherit", outline: "none" }}
                        />
                        <button type="submit" style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            Search
                        </button>
                    </form>
                </div>
            </section>

            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>

                {/* ── Featured posts ── */}
                {featured.length > 0 && category === "All" && !search && page === 1 && (
                    <div style={{ marginBottom: 48 }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#1D9E75", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>⭐ Featured</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                            {featured.map(blog => <FeaturedCard key={blog._id} blog={blog} />)}
                        </div>
                    </div>
                )}

                {/* ── Category filters ── */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => handleCategory(cat)}
                            style={{
                                padding: "7px 16px", borderRadius: 20, border: "1px solid",
                                borderColor: category === cat ? "#00256e" : "#e5e7eb",
                                background: category === cat ? "#00256e" : "#fff",
                                color: category === cat ? "#fff" : "#6b7280",
                                fontSize: 13, fontWeight: 500, cursor: "pointer",
                                fontFamily: "inherit", transition: "all 0.15s",
                            }}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* ── Blog grid ── */}
                {loading ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} style={{ height: 320, borderRadius: 16, background: "#e5e7eb", animation: "pulse 1.5s infinite" }} />
                        ))}
                    </div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                        <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>📝</span>
                        <p style={{ fontSize: 16, color: "#6b7280" }}>No articles found.</p>
                        {(search || category !== "All") && (
                            <button
                                onClick={() => { setSearch(""); setSearchInput(""); setCategory("All"); }}
                                style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                        {blogs.map(blog => <BlogCard key={blog._id} blog={blog} />)}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1, fontSize: 13, fontFamily: "inherit" }}>
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button key={p} onClick={() => setPage(p)}
                                style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid", borderColor: page === p ? "#00256e" : "#e5e7eb", background: page === p ? "#00256e" : "#fff", color: page === p ? "#fff" : "#374151", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                                {p}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1, fontSize: 13, fontFamily: "inherit" }}>
                            Next →
                        </button>
                    </div>
                )}
            </div>

            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
        </div>
    );
}

// ── Blog Card ─────────────────────────────────────────────────────────────────
function BlogCard({ blog }) {
    const colors = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS["Other"];
    return (
        <Link
            href={`/blog/${blog.slug}`}
            onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
            }}
            style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(229,231,235,0.8)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                transition: "transform 0.2s, box-shadow 0.2s",
            }}
        >
            {/* Cover */}
            <div style={{ height: 180, background: colors.bg, position: "relative", overflow: "hidden" }}>
                {blog.coverImage ? (
                    <Image src={blog.coverImage} alt={blog.title} fill style={{ objectFit: "cover" }} />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: colors.color, opacity: 0.3 }}>article</span>
                    </div>
                )}
                <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.92)", fontSize: 10, fontWeight: 700, color: colors.color }}>
                    {blog.category}
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: "0 0 8px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
                    {blog.title}
                </h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 16px", flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {blog.excerpt}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: 0 }}>{blog.author}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                            {new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {blog.readTime} min read
                        </p>
                    </div>
                    <span style={{ fontSize: 12, color: colors.color, fontWeight: 600 }}>Read →</span>
                </div>
            </div>

            {/* Accent bar */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${colors.color}, transparent)` }} />
        </Link>
    );
}

// ── Featured Card ─────────────────────────────────────────────────────────────
function FeaturedCard({ blog }) {
    const colors = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS["Other"];
    return (
        <Link
            href={`/blog/${blog.slug}`}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                borderRadius: 20,
                overflow: "hidden",
                border: `2px solid ${colors.color}20`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
                transition: "transform 0.2s",
            }}
        >
            <div style={{ height: 200, background: colors.bg, position: "relative" }}>
                {blog.coverImage ? (
                    <Image src={blog.coverImage} alt={blog.title} fill style={{ objectFit: "cover" }} />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 56, color: colors.color, opacity: 0.2 }}>article</span>
                    </div>
                )}
                <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 12px", borderRadius: 20, background: "rgba(255,255,255,0.92)", fontSize: 10, fontWeight: 800, color: colors.color }}>
                    ⭐ Featured
                </div>
            </div>
            <div style={{ padding: "18px 20px 20px" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: colors.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{blog.category}</span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: "6px 0 8px", lineHeight: 1.35, letterSpacing: "-0.02em" }}>{blog.title}</h3>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: "0 0 14px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{blog.excerpt}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{blog.author} · {blog.readTime} min read</p>
                    <span style={{ fontSize: 12, color: colors.color, fontWeight: 700 }}>Read →</span>
                </div>
            </div>
        </Link>
    );
}