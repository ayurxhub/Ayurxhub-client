"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

const CATEGORIES = [
    "Ayurveda Basics", "Herbs & Plants", "Clinical Practice",
    "Research", "Lifestyle", "Nutrition", "News & Updates", "Other"
];

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichEditor({ value, onChange }) {
    const editorRef = useRef(null);

    const exec = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        editorRef.current?.focus();
        onChange(editorRef.current?.innerHTML || "");
    };

    const insertLink = () => {
        const url = prompt("Enter URL:");
        if (url) exec("createLink", url);
    };

    const insertImage = () => {
        const url = prompt("Enter image URL:");
        if (url) exec("insertImage", url);
    };

    const tools = [
        { icon: "format_bold", cmd: "bold", title: "Bold" },
        { icon: "format_italic", cmd: "italic", title: "Italic" },
        { icon: "format_underlined", cmd: "underline", title: "Underline" },
        { icon: "format_list_bulleted", cmd: "insertUnorderedList", title: "Bullet List" },
        { icon: "format_list_numbered", cmd: "insertOrderedList", title: "Numbered List" },
        { icon: "format_quote", cmd: "formatBlock", val: "blockquote", title: "Quote" },
        { icon: "link", cmd: "createLink", title: "Link", special: "link" },
    ];

    return (
        <div style={{ border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            {/* Toolbar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "10px 12px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
                {["H1", "H2", "H3"].map(h => (
                    <button key={h} type="button"
                        onClick={() => exec("formatBlock", h.toLowerCase())}
                        style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>
                        {h}
                    </button>
                ))}
                <div style={{ width: 1, background: "#e2e8f0", margin: "2px 4px" }} />
                {tools.map(({ icon, cmd, val, title, special }) => (
                    <button key={cmd} type="button"
                        onClick={() => special === "link" ? insertLink() : exec(cmd, val)}
                        title={title}
                        style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#374151" }}>{icon}</span>
                    </button>
                ))}
                <button type="button" onClick={insertImage} title="Insert Image"
                    style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#374151" }}>image</span>
                </button>
                <div style={{ width: 1, background: "#e2e8f0", margin: "2px 4px" }} />
                <button type="button" onClick={() => exec("removeFormat")} title="Clear formatting"
                    style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#374151" }}>format_clear</span>
                </button>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => onChange(editorRef.current?.innerHTML || "")}
                dangerouslySetInnerHTML={{ __html: value }}
                style={{
                    minHeight: 280, padding: "16px 18px",
                    outline: "none", fontSize: 14, lineHeight: 1.8,
                    color: "#111827", background: "#fff",
                    overflowY: "auto",
                }}
            />

            <style>{`
                [contenteditable] h1 { font-size: 26px; font-weight: 800; margin: 16px 0 8px; color: #00256e; }
                [contenteditable] h2 { font-size: 20px; font-weight: 700; margin: 14px 0 6px; color: #111827; }
                [contenteditable] h3 { font-size: 17px; font-weight: 600; margin: 12px 0 4px; color: #111827; }
                [contenteditable] blockquote { border-left: 3px solid #1D9E75; padding: 8px 16px; margin: 12px 0; color: #6b7280; font-style: italic; background: #f0fdf4; border-radius: 0 8px 8px 0; }
                [contenteditable] ul, [contenteditable] ol { padding-left: 24px; margin: 8px 0; }
                [contenteditable] li { margin-bottom: 4px; }
                [contenteditable] img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
                [contenteditable] a { color: #1D9E75; text-decoration: underline; }
                [contenteditable]:empty:before { content: "Start writing your blog content here..."; color: #9ca3af; }
            `}</style>
        </div>
    );
}

// ─── Blog Form ────────────────────────────────────────────────────────────────
function BlogForm({ initial = null, onSave, onCancel }) {
    const [form, setForm] = useState({
        title: initial?.title || "",
        content: initial?.content || "",
        excerpt: initial?.excerpt || "",
        category: initial?.category || "Ayurveda Basics",
        tags: initial?.tags?.join(", ") || "",
        author: initial?.author || "AyuRxHub Team",
        isFeatured: initial?.isFeatured || false,
    });
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(initial?.coverImage || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCover = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setError("Title and content are required"); return;
        }
        setSaving(true); setError("");
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
            if (coverFile) fd.append("coverImage", coverFile);
            await onSave(fd);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const labelStyle = { fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" };
    const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#111827", background: "#fff", transition: "border-color 0.15s" };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {error && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                    {error}
                </div>
            )}

            {/* Title */}
            <div>
                <label style={labelStyle}>Title *</label>
                <input
                    value={form.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder="Enter blog title..."
                    style={{ ...inputStyle, fontSize: 16, fontWeight: 600 }}
                    onFocus={e => e.target.style.borderColor = "#00256e"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                />
            </div>

            {/* Cover Image */}
            <div>
                <label style={labelStyle}>Cover Image</label>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                    {coverPreview && (
                        <div style={{ position: "relative" }}>
                            <img src={coverPreview} alt="Cover"
                                style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 10, border: "1.5px solid #e5e7eb", display: "block" }} />
                            <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(""); }}
                                style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "#dc2626", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 12, color: "#fff" }}>close</span>
                            </button>
                        </div>
                    )}
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 18px", borderRadius: 10, border: "1.5px dashed #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#9ca3af" }}>upload</span>
                        {coverPreview ? "Change Image" : "Upload Cover"}
                        <input type="file" accept="image/*" onChange={handleCover} style={{ display: "none" }} />
                    </label>
                </div>
            </div>

            {/* Category + Author — responsive grid */}
            <div className="blog-form-grid">
                <div>
                    <label style={labelStyle}>Category</label>
                    <select value={form.category} onChange={e => set("category", e.target.value)}
                        style={{ ...inputStyle, background: "#fff" }}
                        onFocus={e => e.target.style.borderColor = "#00256e"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label style={labelStyle}>Author Name</label>
                    <input value={form.author} onChange={e => set("author", e.target.value)}
                        placeholder="AyuRxHub Team" style={inputStyle}
                        onFocus={e => e.target.style.borderColor = "#00256e"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label style={labelStyle}>
                    Tags <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(comma separated)</span>
                </label>
                <input value={form.tags} onChange={e => set("tags", e.target.value)}
                    placeholder="ayurveda, herbs, wellness, nutrition"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#00256e"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>

            {/* Excerpt */}
            <div>
                <label style={labelStyle}>
                    Excerpt <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(auto-generated if blank)</span>
                </label>
                <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)}
                    placeholder="Short description shown in blog listing and SEO..."
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = "#00256e"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>

            {/* Content */}
            <div>
                <label style={labelStyle}>Content *</label>
                <RichEditor value={form.content} onChange={v => set("content", v)} />
            </div>

            {/* Featured toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: form.isFeatured ? "#e8eeff" : "#f9fafb", border: `1.5px solid ${form.isFeatured ? "#00256e30" : "#e5e7eb"}`, cursor: "pointer", transition: "all 0.2s" }}
                onClick={() => set("isFeatured", !form.isFeatured)}>
                <div style={{ width: 44, height: 24, borderRadius: 12, position: "relative", background: form.isFeatured ? "#00256e" : "#d1d5db", transition: "background 0.2s", flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: form.isFeatured ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>Mark as Featured</p>
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>Shows in Featured Articles on homepage</p>
                </div>
                {form.isFeatured && <span style={{ marginLeft: "auto", fontSize: 18 }}>⭐</span>}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button onClick={onCancel} type="button"
                    style={{ padding: "11px 22px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 14, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                    Cancel
                </button>
                <button onClick={handleSubmit} disabled={saving} type="button"
                    style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1, display: "flex", alignItems: "center", gap: 7 }}>
                    {saving && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />}
                    {saving ? "Saving…" : initial ? "Update Post" : "Save Draft"}
                </button>
            </div>

            <style>{`
                .blog-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                @media (max-width: 540px) { .blog-form-grid { grid-template-columns: 1fr; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// ─── Main Admin Blogs Page ────────────────────────────────────────────────────
export default function AdminBlogs() {
    const { authAxios } = useAuth();
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("list");
    const [editing, setEditing] = useState(null);
    const [actionLoading, setActionLoading] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get("/blogs/admin/all");
            setBlogs(res.data.blogs || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line

    const handleCreate = async (fd) => {
        await authAxios.post("/blogs", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setView("list"); load();
    };

    const handleUpdate = async (fd) => {
        await authAxios.put(`/blogs/${editing._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        setView("list"); setEditing(null); load();
    };

    const handleEditClick = async (blog) => {
        try {
            const res = await authAxios.get(`/blogs/admin/${blog._id}`);
            setEditing(res.data.blog);
            setView("edit");
        } catch (e) { console.error(e); }
    };

    const togglePublish = async (id) => {
        setActionLoading(id + "pub");
        try { await authAxios.put(`/blogs/${id}/publish`); load(); }
        finally { setActionLoading(""); }
    };

    const toggleFeatured = async (id) => {
        setActionLoading(id + "feat");
        try { await authAxios.put(`/blogs/${id}/feature`); load(); }
        finally { setActionLoading(""); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this blog post? This cannot be undone.")) return;
        setActionLoading(id + "del");
        try { await authAxios.delete(`/blogs/${id}`); load(); }
        finally { setActionLoading(""); }
    };

    // ── Create / Edit view ────────────────────────────────────────────────────
    if (view === "create" || view === "edit") {
        return (
            <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "0 0 40px" }}>
                {/* Header */}
                <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, marginBottom: 24, position: "sticky", top: 0, zIndex: 10 }}>
                    <button onClick={() => { setView("list"); setEditing(null); }} type="button"
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#374151" }}>arrow_back</span>
                    </button>
                    <div>
                        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: 0 }}>
                            {view === "create" ? "New Blog Post" : "Edit Blog Post"}
                        </h1>
                        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                            {view === "create" ? "Fill in the details and save as draft" : "Update your blog post"}
                        </p>
                    </div>
                </div>

                {/* Form card */}
                <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px" }}>
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "clamp(16px, 4vw, 32px)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                        <BlogForm
                            initial={view === "edit" ? editing : null}
                            onSave={view === "create" ? handleCreate : handleUpdate}
                            onCancel={() => { setView("list"); setEditing(null); }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ── List view ─────────────────────────────────────────────────────────────
    return (
        <div style={{ background: "#f8fafc", minHeight: "100vh" }}>

            {/* Page header */}
            <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "20px 24px", marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Blog Posts</h1>
                        <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{blogs.length} total posts</p>
                    </div>
                    <button onClick={() => setView("create")} type="button"
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(0,37,110,0.2)" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                        New Post
                    </button>
                </div>
            </div>

            <div style={{ padding: "0 24px 40px" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 52, display: "block", marginBottom: 12, color: "#d1d5db" }}>article</span>
                        <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>No blog posts yet</p>
                        <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 20px" }}>Create your first post to get started</p>
                        <button onClick={() => setView("create")} type="button"
                            style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#00256e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                            Create First Post
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {blogs.map(blog => (
                            <div key={blog._id}
                                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>

                                {/* Thumbnail */}
                                {blog.coverImage ? (
                                    <img src={blog.coverImage} alt={blog.title}
                                        style={{ width: 70, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid #e5e7eb" }} />
                                ) : (
                                    <div style={{ width: 70, height: 48, borderRadius: 8, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#d1d5db" }}>article</span>
                                    </div>
                                )}

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                                            {blog.title}
                                        </p>
                                        {blog.isFeatured && (
                                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#fef9c3", color: "#854d0e", flexShrink: 0, fontWeight: 700 }}>⭐ Featured</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>
                                        {blog.category} · By {blog.author} · {blog.readTime} min read · {blog.views} views
                                    </p>
                                </div>

                                {/* Status */}
                                <span style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, flexShrink: 0, fontWeight: 600, background: blog.isPublished ? "#dcfce7" : "#f3f4f6", color: blog.isPublished ? "#166534" : "#6b7280" }}>
                                    {blog.isPublished ? "Published" : "Draft"}
                                </span>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => togglePublish(blog._id)} type="button"
                                        disabled={actionLoading === blog._id + "pub"}
                                        title={blog.isPublished ? "Unpublish" : "Publish"}
                                        style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: blog.isPublished ? "#f59e0b" : "#1D9E75" }}>
                                            {blog.isPublished ? "visibility_off" : "publish"}
                                        </span>
                                    </button>
                                    <button onClick={() => toggleFeatured(blog._id)} type="button"
                                        title={blog.isFeatured ? "Unfeature" : "Feature"}
                                        style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid #e5e7eb", background: blog.isFeatured ? "#fef9c3" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: blog.isFeatured ? "#f59e0b" : "#9ca3af" }}>star</span>
                                    </button>
                                    <button onClick={() => handleEditClick(blog)} type="button"
                                        style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#374151" }}>edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(blog._id)} type="button"
                                        disabled={actionLoading === blog._id + "del"}
                                        style={{ width: 34, height: 34, borderRadius: 8, border: "1.5px solid #fee2e2", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#dc2626" }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}