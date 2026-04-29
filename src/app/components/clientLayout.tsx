"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { AuthProvider } from "../context/AuthContext";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const noSidebar = [
        "/login",
        "/register",
        "/about",
        "/landing",
        "/contact",
        "/terms",
    ];

    const isAdmin = pathname.startsWith("/admin");
    const isConsultant = pathname.startsWith("/consultant");

    const showSidebar =
        !noSidebar.includes(pathname) && !isAdmin && !isConsultant;

    return (
        <AuthProvider>
            {showSidebar ? (
                <div className="layout-shell">
                    <Sidebar
                        collapsed={collapsed}
                        setCollapsed={setCollapsed}
                        mobileOpen={mobileOpen}
                        setMobileOpen={setMobileOpen}
                    />

                    <main className="layout-main">
                        <Navbar />
                        <div className="content-wrapper">{children}</div>
                    </main>

                    <style jsx>{`
            .layout-shell {
              display: flex;
              min-height: 100vh;
              width: 100%;
              background: #fff;
            }

            .layout-main {
              flex: 1;
              min-width: 0;
              background: #fff;
            }

            .content-wrapper {
              width: 100%;
            }

            @media (max-width: 767px) {
              .layout-shell {
                display: block;
              }
            }
          `}</style>
                </div>
            ) : (
                <main>{children}</main>
            )}
        </AuthProvider>
    );
}