"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function BlogPostPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [blog, setBlog] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${API}/blogs/${slug}`);
                setBlog(res.data.blog);

                // Load related posts (same category)
                const rel = await axios.get(`${API}/blogs`, {
                    params: { category: res.data.blog.category, limit: 3 }
                });
                setRelated(rel.data.blogs.filter(b => b._id !== res.data.blog._id).slice(0, 2));
            } catch (e) {
                if (e.response?.status === 404) setNotFound(true);
                else console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (slug) load();
    }, [slug]);

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fc" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (notFound) return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#f7f9fc", padding: 20 }}>
            <span style={{ fontSize: 56 }}>📄</span>
            <h2 style={{ fontSize: 22, color: "#111827", margin: 0 }}>Article not found</h2>
            <Link href="/blog" style={{ padding: "10px 24px", borderRadius: 10, background: "#00256e", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                ← Back to Blog
            </Link>
        </div>
    );

    if (!blog) return null;
    const colors = CATEGORY_COLORS[blog.category] || CATEGORY_COLORS["Other"];

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* ── Cover ── */}
            {blog.coverImage && (
                <div style={{ width: "100%", height: "clamp(240px, 40vh, 420px)", position: "relative", background: colors.bg }}>
                    <Image src={blog.coverImage} alt={blog.title} fill style={{ objectFit: "cover" }} priority />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))" }} />
                </div>
            )}

            <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px 60px" }}>

                {/* ── Back + breadcrumb ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "20px 0 24px" }}>
                    <button onClick={() => router.back()} type="button"
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
                        Blog
                    </button>
                    <span style={{ color: "#d1d5db" }}>·</span>
                    <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: colors.bg, color: colors.color, fontWeight: 600 }}>
                        {blog.category}
                    </span>
                </div>

                {/* ── Title ── */}
                <h1 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
                    {blog.title}
                </h1>

                {/* ── Meta ── */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: colors.color }}>person</span>
                        </div>
                        <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{blog.author}</p>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                                {new Date(blog.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginLeft: "auto" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9ca3af" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                            {blog.readTime} min read
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9ca3af" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
                            {blog.views} views
                        </span>
                    </div>
                </div>

                {/* ── Tags ── */}
                {blog.tags?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32 }}>
                        {blog.tags.map(tag => (
                            <span key={tag} style={{ padding: "4px 12px", borderRadius: 20, background: "#f3f4f6", color: "#6b7280", fontSize: 12, fontWeight: 500 }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* ── Content ── */}
                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                    style={{ fontSize: 16, lineHeight: 1.85, color: "#374151" }}
                />

                {/* ── Related posts ── */}
                {related.length > 0 && (
                    <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #e5e7eb" }}>
                        <p style={{ fontSize: 11, fontWeight: 800, color: "#1D9E75", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Related Articles</p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                            {related.map(post => {
                                const c = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["Other"];
                                return (
                                    <Link key={post._id} href={`/blog/${post.slug}`}
                                        style={{ display: "flex", gap: 12, padding: "14px", borderRadius: 14, background: "#fff", border: "1px solid #e5e7eb", textDecoration: "none", transition: "box-shadow 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                                        {post.coverImage ? (
                                            <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative" }}>
                                                <Image src={post.coverImage} alt={post.title} fill style={{ objectFit: "cover" }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: 60, height: 60, borderRadius: 8, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 24, color: c.color }}>article</span>
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 4px", lineHeight: 1.4 }}>{post.title}</p>
                                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{post.readTime} min read</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Back to blog ── */}
                <div style={{ textAlign: "center", marginTop: 40 }}>
                    <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "11px 24px", borderRadius: 12, background: "#00256e", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                        Back to Blog
                    </Link>
                </div>
            </div>

            {/* ── Blog content styles ── */}
            <style>{`
                .blog-content h1 { font-size: 30px; font-weight: 900; color: #00256e; margin: 28px 0 12px; letter-spacing: -0.03em; line-height: 1.15; }
                .blog-content h2 { font-size: 24px; font-weight: 800; color: #111827; margin: 24px 0 10px; letter-spacing: -0.02em; }
                .blog-content h3 { font-size: 19px; font-weight: 700; color: #111827; margin: 20px 0 8px; }
                .blog-content p { margin: 0 0 18px; }
                .blog-content ul, .blog-content ol { padding-left: 24px; margin: 0 0 18px; }
                .blog-content li { margin-bottom: 6px; }
                .blog-content blockquote { border-left: 3px solid #1D9E75; padding: 12px 20px; margin: 20px 0; color: #6b7280; font-style: italic; background: #f0fdf4; border-radius: 0 10px 10px 0; }
                .blog-content img { max-width: 100%; border-radius: 12px; margin: 16px 0; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .blog-content a { color: #1D9E75; text-decoration: underline; }
                .blog-content a:hover { color: #0F6E56; }
                .blog-content strong { color: #111827; }
                .blog-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: monospace; }
                .blog-content pre { background: #1e293b; color: #e2e8f0; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 16px 0; font-family: monospace; font-size: 13px; line-height: 1.7; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}