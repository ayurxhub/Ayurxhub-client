"use client";

import { useState } from "react";

export function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 99998,
            background: "rgba(0,0,0,0.4)", display: "flex",
            alignItems: "center", justifyContent: "center",
        }}>
            <div style={{
                background: "#fff", borderRadius: 16, padding: 28,
                maxWidth: 400, width: "90%", boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}>
                <p style={{ fontSize: 15, color: "#111827", marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={onCancel} style={{
                        padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: "#fff", color: "#374151", fontSize: 14, cursor: "pointer",
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: "9px 20px", borderRadius: 8, border: "none",
                        background: "#dc2626", color: "#fff", fontSize: 14,
                        fontWeight: 600, cursor: "pointer",
                    }}>Confirm</button>
                </div>
            </div>
        </div>
    );
}

export function useConfirm() {
    const [state, setState] = useState(null);

    const confirm = (message) => new Promise((resolve) => {
        setState({ message, resolve });
    });

    const handleConfirm = () => { state.resolve(true); setState(null); };
    const handleCancel = () => { state.resolve(false); setState(null); };

    const ConfirmElement = state
        ? <ConfirmModal message={state.message} onConfirm={handleConfirm} onCancel={handleCancel} />
        : null;

    return { confirm, ConfirmElement };
}