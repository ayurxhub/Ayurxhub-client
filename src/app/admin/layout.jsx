"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ── Links visible to ALL admins ───────────────────────────────────────────────
const adminLinks = [
    { href: "/admin", icon: "dashboard", label: "Overview" },
    { href: "/admin/users", icon: "group", label: "Users" },
    { href: "/admin/experts", icon: "verified_user", label: "Experts" },
    { href: "/admin/materials", icon: "menu_book", label: "Materials" },
    { href: "/admin/tests", icon: "quiz", label: "Test Series" },
    { href: "/admin/courses", icon: "school", label: "Exam Prep" },
    { href: "/admin/blogs", icon: "article", label: "Blog Posts" },
    { href: "/admin/announcements", icon: "campaign", label: "Announcements" },
    { href: "/admin/lectures", icon: "play_circle", label: "Lectures" },
    { href: "/admin/references", icon: "library_books", label: "References" },
];

// ── Links visible to SUPER ADMIN only ────────────────────────────────────────
const superAdminLinks = [
    { href: "/admin/team", icon: "admin_panel_settings", label: "Admin Team" },
    { href: "/admin/settings", icon: "tune", label: "Settings" },
];

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const path = usePathname();
    const [open, setOpen] = useState(false);

    const isSuperAdmin = user?.role === "superAdmin" ||
        (user?.role === "admin" && user?.adminRole === "super_admin");

    useEffect(() => {
        if (!loading && (!user || (user.role !== "admin" && user.role !== "superAdmin"))) {
            router.push("/login");
        }
    }, [user, loading]);

    useEffect(() => { setOpen(false); }, [path]);

    if (loading || !user || (user.role !== "admin" && user.role !== "superAdmin")) return null;

    const NavLinks = () => (
        <>
            {/* Header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <img src="/Ayurxhub logo.png" alt="AyurXHub" style={{ width: 32, height: 32, objectFit: "contain" }} />
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>AyurXHub</p>
                        <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin Panel</p>
                    </div>
                </div>
                {/* Role badge */}
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 18 }}>
                        {isSuperAdmin ? "👑" : "🛡️"}
                    </span>
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: isSuperAdmin ? "#00256e" : "#1D9E75", margin: 0 }}>
                            {isSuperAdmin ? "Super Admin" : "Admin"}
                        </p>
                        <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{user.name}</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>

                {/* Common links */}
                {adminLinks.map(({ href, icon, label }) => {
                    const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
                    return (
                        <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#00256e" : "#6b7280", background: active ? "#eff6ff" : "transparent", textDecoration: "none", transition: "all 0.15s" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: active ? "#00256e" : "#9ca3af" }}>{icon}</span>
                            {label}
                        </Link>
                    );
                })}

                {/* Super admin only section */}
                {isSuperAdmin && (
                    <>
                        <div style={{ margin: "10px 12px 6px", fontSize: 10, fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Super Admin
                        </div>
                        {superAdminLinks.map(({ href, icon, label }) => {
                            const active = path.startsWith(href);
                            return (
                                <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#92400e" : "#6b7280", background: active ? "#fef3c7" : "transparent", textDecoration: "none", transition: "all 0.15s" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: active ? "#d97706" : "#9ca3af" }}>{icon}</span>
                                    {label}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9" }}>
                <Link href="/" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_back</span>
                    Back to app
                </Link>
            </div>
        </>
    );

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>

            {/* Desktop sidebar */}
            <aside className="adm-sidebar">
                <NavLinks />
            </aside>

            {/* Mobile top bar */}
            <div className="adm-topbar">
                <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#111827" }}>menu</span>
                </button>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Admin Panel</p>
                <Link href="/" style={{ display: "flex", alignItems: "center", padding: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#9ca3af" }}>home</span>
                </Link>
            </div>

            {/* Mobile drawer */}
            {open && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
                    <div onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
                    <aside style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 240, background: "#fff", display: "flex", flexDirection: "column", zIndex: 201, boxShadow: "4px 0 24px rgba(0,0,0,0.1)" }}>
                        <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#9ca3af" }}>close</span>
                        </button>
                        <NavLinks />
                    </aside>
                </div>
            )}

            <main className="adm-main">{children}</main>

            <style>{`
                .adm-sidebar {
                    width: 220px; background: #fff;
                    border-right: 1px solid #e5e7eb;
                    display: flex; flex-direction: column;
                    position: fixed; height: 100vh; z-index: 50;
                }
                .adm-topbar { display: none; }
                .adm-main {
                    margin-left: 220px; flex: 1;
                    padding: 28px; min-width: 0;
                }
                @media (max-width: 768px) {
                    .adm-sidebar { display: none; }
                    .adm-topbar {
                        display: flex; align-items: center;
                        justify-content: space-between;
                        position: fixed; top: 0; left: 0; right: 0;
                        height: 52px; background: #fff;
                        border-bottom: 1px solid #e5e7eb;
                        padding: 0 12px; z-index: 50;
                    }
                    .adm-main {
                        margin-left: 0; padding: 16px;
                        padding-top: 68px;
                    }
                }
            `}</style>
        </div>
    );
}