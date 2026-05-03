// components/UserMenu.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="relative" ref={ref}>
            {/* Avatar Button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition"
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-green-400"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-[#1a2e4a] text-white flex items-center justify-center text-sm font-bold">
                        {initials}
                    </div>
                )}
                <div className="hidden sm:block text-right">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name}</p>
                    <p className="text-xs text-gray-500 uppercase">{user?.role}</p>
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-800 text-sm">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <div className="py-1">
                        <button
                            onClick={() => { router.push("/profile"); setOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            👤 My Profile
                        </button>
                        <button
                            onClick={() => { router.push("/settings"); setOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                            ⚙️ Settings
                        </button>
                        {user?.role === "expert" && (
                            <button
                                onClick={() => { router.push("/consultations/dashboard"); setOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                🩺 Expert Dashboard
                            </button>
                        )}
                        {user?.role === "admin" && (
                            <button
                                onClick={() => { router.push("/admin"); setOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 font-medium"
                            >
                                🛡️ Admin Panel
                            </button>
                        )}
                    </div>

                    <div className="border-t border-gray-100 py-1">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                        >
                            🚪 Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}