"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const adminLinks = [
    { href: "/admin", icon: "dashboard", label: "Overview", superOnly: false },
    { href: "/admin/users", icon: "group", label: "Users", superOnly: false },
    { href: "/admin/experts", icon: "verified_user", label: "Experts", superOnly: false },
    { href: "/admin/materials", icon: "menu_book", label: "Materials", superOnly: false },
    { href: "/admin/tests", icon: "quiz", label: "Test Series", superOnly: false },
    { href: "/admin/blogs", icon: "article", label: "Blog Posts", superOnly: false }, // ← ADD THIS
    { href: "/admin/admins", icon: "admin_panel_settings", label: "Admins", superOnly: true },
];

export default function AdminLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const path = usePathname();

    useEffect(() => {
        if (!loading && (!user || user.role !== "admin")) {
            router.push("/login");
        }
    }, [user, loading]);

    if (loading || !user || user.role !== "admin") return null;

    const isSuperAdmin = user.adminRole === "super_admin";

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#0f1117" }}>

            {/* Sidebar */}
            <aside style={{ width: 220, background: "#161b27", borderRight: "0.5px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 0", position: "fixed", height: "100vh" }}>
                <div style={{ padding: "0 20px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "#ffffff", marginBottom: 2 }}>AyurXHub</p>
                    <p style={{ fontSize: 11, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {isSuperAdmin ? "Super Admin" : "Moderator"}
                    </p>
                </div>

                <nav style={{ flex: 1, padding: "16px 12px" }}>
                    {adminLinks
                        .filter((l) => !l.superOnly || isSuperAdmin)
                        .map(({ href, icon, label }) => {
                            const isActive = href === "/admin" ? path === "/admin" : path.startsWith(href);
                            return (
                                <Link key={href} href={href}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: isActive ? 500 : 400, color: isActive ? "#ffffff" : "#6b7280", background: isActive ? "rgba(29,158,117,0.15)" : "transparent", borderLeft: isActive ? "2px solid #1D9E75" : "2px solid transparent", textDecoration: "none", transition: "all 0.15s" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                                    {label}
                                </Link>
                            );
                        })}
                </nav>

                <div style={{ padding: "16px 20px", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                    <Link href="/" style={{ fontSize: 12, color: "#4a5568", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                        Back to app
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main style={{ marginLeft: 220, flex: 1, padding: "28px", overflowY: "auto" }}>
                {children}
            </main>
        </div>
    );
}