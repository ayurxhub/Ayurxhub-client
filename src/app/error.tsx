"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
                <p style={{ fontSize: 48, margin: "0 0 16px" }}>⚠️</p>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Something went wrong</h2>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>An unexpected error occurred. Please try again.</p>
                <button onClick={reset} style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: "#00256e", color: "#fff", fontSize: 14,
                    fontWeight: 600, cursor: "pointer",
                }}>Try again</button>
            </div>
        </div>
    );
}