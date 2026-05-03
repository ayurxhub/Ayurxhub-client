"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useProModal } from "../context/ProModalContext";
import { useEffect } from "react";
import Image from "next/image";

const commonLinks = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/materials", icon: "auto_stories", label: "Curriculum" },
  { href: "/lectures", icon: "play_circle", label: "Lectures" },
  { href: "/consultations", icon: "medical_services", label: "Consultations" },
  { href: "/consultations/bookings", icon: "calendar_month", label: "My Bookings" },
  { href: "/references", icon: "library_books", label: "References" },
  { href: "/tests", icon: "quiz", label: "Test Series" },
  { href: "/marketplace", icon: "storefront", label: "Marketplace" },
  { href: "/blog", icon: "article", label: "Blog" },
  { href: "/about", icon: "info", label: "About Us" },
];

const expertLinks = [
  { href: "/consultations/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/consultations", icon: "medical_services", label: "Consultations" },
  { href: "/consultations/bookings", icon: "calendar_month", label: "My Bookings" },
  { href: "/availability", icon: "event_available", label: "My Availability" },
  { href: "/materials", icon: "auto_stories", label: "Curriculum" },
  { href: "/references", icon: "library_books", label: "References" },
  { href: "/marketplace", icon: "storefront", label: "Marketplace" },
  { href: "/blog", icon: "article", label: "Blog" },
  { href: "/about", icon: "info", label: "About Us" },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const path = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { openProModal } = useProModal();

  const isExpert = user?.role === "expert";
  const navLinks = isExpert ? expertLinks : commonLinks;
  const sidebarWidth = collapsed ? 68 : 220;

  useEffect(() => {
    setMobileOpen(false);
  }, [path, setMobileOpen]);

  const SidebarInner = ({ forceExpanded = false }) => {
    const isCollapsed = forceExpanded ? false : collapsed;

    return (
      <aside
        style={{
          width: "100%",
          height: "100vh",
          background: "#ffffff",
          borderRight: "1px solid rgba(229,231,235,0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            height: 64,
            padding: isCollapsed ? "0" : "0 16px 0 20px",
            borderBottom: "1px solid rgba(229,231,235,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              title="Expand sidebar"
              style={{
                width: 36, height: 36, borderRadius: 10,
                border: "none", background: "transparent",
                cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", padding: 0,
              }}
            >
              <Image
                src="/Ayurxhub logo.png"
                alt="AyuRxHub"
                width={32} height={32}
                style={{ objectFit: "contain" }}
                priority
              />
            </button>
          ) : (
            <>
              {/* Logo + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Image
                  src="/Ayurxhub logo.png"
                  alt="AyuRxHub"
                  width={32} height={32}
                  style={{ objectFit: "contain" }}
                  priority
                />
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  <span style={{ color: "#2d8a3e" }}>Ayu</span>
                  <span style={{ color: "#00256e" }}>RxHub</span>
                </div>
              </div>

              {/* Back + Collapse buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* ← Back button — shows on BOTH mobile and desktop */}
                <button
                  type="button"
                  onClick={() => router.back()}
                  title="Go back"
                  style={{
                    width: 28, height: 28, borderRadius: 8,
                    border: "1px solid rgba(229,231,235,0.8)",
                    background: "#f9fafb", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f6ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b7280" }}>
                    arrow_back
                  </span>
                </button>

                {/* Collapse button — desktop only */}
                {!forceExpanded && (
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    title="Collapse sidebar"
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      border: "1px solid rgba(229,231,235,0.8)",
                      background: "#f9fafb", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f3f6ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b7280" }}>
                      chevron_left
                    </span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Nav section label ── */}
        {!isCollapsed && (
          <div style={{
            padding: "16px 20px 6px",
            fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af",
          }}>
            Navigation
          </div>
        )}

        {/* ── Nav links ── */}
        <nav
          style={{
            flex: 1,
            padding: isCollapsed ? "10px 8px" : "4px 10px",
            overflowY: "auto", overflowX: "hidden",
            display: "flex", flexDirection: "column", gap: 2,
            boxSizing: "border-box",
          }}
        >
          {navLinks.map(({ href, icon, label }) => {
            const isActive = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : ""}
                style={{
                  width: "100%", minHeight: 40,
                  display: "flex", alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap: isCollapsed ? 0 : 10,
                  padding: isCollapsed ? "8px 0" : "8px 12px",
                  borderRadius: 10, textDecoration: "none",
                  boxSizing: "border-box",
                  background: isActive ? "#00256e" : "transparent",
                  color: isActive ? "#fff" : "#4b5563",
                  fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                  whiteSpace: "nowrap",
                  transition: "background 0.15s, color 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "#f3f6ff";
                    e.currentTarget.style.color = "#00256e";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#4b5563";
                  }
                }}
              >
                {isActive && !isCollapsed && (
                  <span style={{
                    position: "absolute", left: 0, top: "20%",
                    height: "60%", width: 3,
                    borderRadius: "0 3px 3px 0", background: "#6EE7C7",
                  }} />
                )}
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 19, lineHeight: 1, flexShrink: 0, color: "inherit",
                    fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  {icon}
                </span>
                {!isCollapsed && (
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom CTA ── */}
        <div style={{
          padding: isCollapsed ? "10px 8px" : "10px",
          flexShrink: 0, borderTop: "1px solid rgba(229,231,235,0.8)",
        }}>
          {isExpert ? (
            <Link
              href="/availability"
              title={isCollapsed ? "Set My Availability" : ""}
              style={{
                width: "100%", minHeight: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: isCollapsed ? 0 : 7,
                padding: isCollapsed ? "10px 0" : "10px 14px",
                borderRadius: 10, textDecoration: "none",
                color: "#fff", fontWeight: 600, fontSize: 13,
                boxSizing: "border-box",
                background: "linear-gradient(135deg,#0F6E56,#1D9E75)",
                transition: "opacity 0.15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>event_available</span>
              {!isCollapsed && "Set My Availability"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openProModal}
              title={isCollapsed ? "Upgrade to Practitioner" : ""}
              style={{
                width: "100%", minHeight: 40,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: isCollapsed ? 0 : 7,
                padding: isCollapsed ? "10px 0" : "10px 14px",
                borderRadius: 10, border: "none",
                color: "#fff", fontWeight: 600, fontSize: 13,
                cursor: "pointer",
                background: "linear-gradient(135deg,#00256e,#1f3c88)",
                boxShadow: "0 4px 12px rgba(0,37,110,0.18)",
                transition: "opacity 0.15s, transform 0.1s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>star</span>
              {!isCollapsed && "Upgrade to Pro"}
            </button>
          )}
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="desktop-sidebar"
        style={{ width: sidebarWidth, flexShrink: 0, transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)" }}
      >
        <div style={{
          position: "fixed", top: 0, left: 0,
          width: sidebarWidth, height: "100vh", zIndex: 100,
          transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        }}>
          <SidebarInner />
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className="mobile-sidebar-wrap">
        {mobileOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 98,
              border: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            }}
          />
        )}
        <div style={{
          position: "fixed", top: 0, left: 0,
          width: 260, height: "100vh", zIndex: 99,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.24s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: mobileOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
        }}>
          <SidebarInner forceExpanded={true} />
        </div>
      </div>

      <style jsx>{`
        .desktop-sidebar { display: block; }
        .mobile-sidebar-wrap { display: none; }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; width: 0 !important; }
          .mobile-sidebar-wrap { display: block; }
        }
      `}</style>
    </>
  );
}