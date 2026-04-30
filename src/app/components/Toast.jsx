"use client";
import { useState, useEffect } from "react";

export function Toast({ message, type = "error", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = {
        error: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
        success: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
        info: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
    };
    const c = colors[type] ?? colors.error;

    return (
        <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 99999,
            background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            borderRadius: 12, padding: "12px 18px", fontSize: 14, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxWidth: 360,
            animation: "slideUp 0.2s ease",
        }}>
            <span>{message}</span>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: c.color, fontSize: 16, lineHeight: 1 }}>×</button>
            <style>{`@keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
    );
}

export function useToast() {
    const [toast, setToast] = useState(null);
    const showToast = (message, type = "error") => setToast({ message, type });
    const hideToast = () => setToast(null);
    const ToastElement = toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null;
    return { showToast, ToastElement };
}