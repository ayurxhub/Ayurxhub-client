"use client";

import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "./UserMenu";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="rx-navbar">
      <div className="nav-left">
        <button className="hamburger-btn mobile-only" type="button" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      <Link href="/" className="logo-wrap">
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#2d8a3e" }}>Ayu</span>
          <span style={{ color: "#00256e" }}>RxHub</span>
        </span>
      </Link>

      <div className="nav-right">
        <button className="nav-icon-btn desktop-only" type="button" title="Messages">
          <span className="material-symbols-outlined">chat_bubble</span>
        </button>

        <button className="nav-icon-btn notification desktop-only" type="button" title="Notifications">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notif-dot" />
        </button>

        {user ? (
          <UserMenu />
        ) : (
          <Link href="/login" className="signin-btn">
            Sign In
          </Link>
        )}
      </div>

      <style jsx>{`
     .rx-navbar {
  position: sticky;
  top: 0;
  z-index: 200;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.8);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.nav-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.logo-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  white-space: nowrap;
}

.logo-wrap img {
  flex-shrink: 0;
}

.logo-wrap span {
  display: inline-flex;
  align-items: center;
  line-height: 1;
  white-space: nowrap;
}

.nav-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.mobile-only {
  display: none; /* hide by default (desktop) */
}

.desktop-only {
  display: flex;
}

/* 👇 show ONLY on mobile */
@media (max-width: 767px) {
  .mobile-only {
    display: flex;
  }

  .desktop-only {
    display: none;
  }
}
      `}</style>
    </header>
  );
}