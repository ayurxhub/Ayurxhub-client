"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Keep Render free tier alive — ping every 10 minutes
function useKeepAlive() {
    useEffect(() => {
        const ping = () => fetch(`${API}/health`).catch(() => { });
        ping(); // immediate ping on load
        const interval = setInterval(ping, 10 * 60 * 1000); // every 10 min
        return () => clearInterval(interval);
    }, []);
}
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { AuthProvider } from "../context/AuthContext";
import { ProModalProvider } from "../context/ProModalContext";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    useKeepAlive();

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
            <ProModalProvider>
                {showSidebar ? (
                    <div className="layout-shell">
                        <Sidebar
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            mobileOpen={mobileOpen}
                            setMobileOpen={setMobileOpen}
                        />

                        <main className="layout-main">
                            <Navbar onMenuClick={() => setMobileOpen(true)} />
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
                    <>
                        <div className="mobile-drawer-only">
                            {!isAdmin && <Sidebar
                                collapsed={collapsed}
                                setCollapsed={setCollapsed}
                                mobileOpen={mobileOpen}
                                setMobileOpen={setMobileOpen}
                            />}
                        </div>
                        {!isAdmin && <Navbar onMenuClick={() => setMobileOpen(true)} />}
                        <main>{children}</main>
                        <style jsx>{`
                        .mobile-drawer-only {
                            display: none;
                        }
                        @media (max-width: 767px) {
                            .mobile-drawer-only {
                                display: block;
                            }
                        }
                    `}</style>
                    </>
                )}
            </ProModalProvider>
        </AuthProvider>
    );
}