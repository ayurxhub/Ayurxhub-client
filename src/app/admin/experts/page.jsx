"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const STATUS_FILTERS = ["pending", "approved", "rejected", "suspended", "all"];

const statusStyle = {
    pending: { bg: "rgba(133,79,11,0.2)", color: "#EF9F27" },
    approved: { bg: "rgba(29,158,117,0.2)", color: "#1D9E75" },
    rejected: { bg: "rgba(220,38,38,0.15)", color: "#f87171" },
    suspended: { bg: "rgba(100,100,100,0.2)", color: "#9ca3af" },
    none: { bg: "rgba(100,100,100,0.1)", color: "#6b7280" },
};

export default function AdminExperts() {
    const { authAxios } = useAuth();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [notes, setNotes] = useState("");
    const [notesSaved, setNotesSaved] = useState(false);

    useEffect(() => { fetchExperts(); }, [filter]);
    useEffect(() => {
        if (selected) {
            setNotes(selected.adminNotes || "");
            setShowRejectInput(false);
            setRejectReason("");
        }
    }, [selected]);

    const fetchExperts = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get(`/admin/users?role=expert&verificationStatus=${filter}`);
            setExperts(res.data.users);
            setSelected(null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status, reason = "") => {
        try {
            await authAxios.put(`/admin/users/${id}/status`, { status, rejectionReason: reason });
            setShowRejectInput(false);
            setRejectReason("");
            fetchExperts();
        } catch (err) {
            alert(err.response?.data?.message || "Failed");
        }
    };

    const saveNotes = async () => {
        try {
            await authAxios.put(`/admin/users/${selected._id}/notes`, { notes });
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
        } catch (err) {
            alert("Failed to save notes");
        }
    };

    const initials = (name) =>
        name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    const docViewUrl = (url) =>
        url.includes("/raw/upload/")
            ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
            : url;

    return (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "340px 1fr" : "1fr", gap: 16, alignItems: "start" }}>

            {/* ── Left: expert list ── */}
            <div>
                <div style={{ marginBottom: 20 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Expert Verification</h1>
                    <p style={{ fontSize: 13, color: "#4a5568" }}>Review credentials and manage expert status</p>
                </div>

                <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                    {STATUS_FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: "8px 14px", fontSize: 12, background: "none", border: "none",
                            borderBottom: filter === f ? "2px solid #1D9E75" : "2px solid transparent",
                            color: filter === f ? "#1D9E75" : "#4a5568",
                            cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit",
                        }}>{f}</button>
                    ))}
                </div>

                {loading ? <p style={{ color: "#4a5568", fontSize: 13 }}>Loading...</p> :
                    experts.length === 0 ? <p style={{ color: "#4a5568", fontSize: 13 }}>No experts found</p> :
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {experts.map(expert => {
                                const st = statusStyle[expert.verificationStatus] || statusStyle.none;
                                const isActive = selected?._id === expert._id;
                                return (
                                    <div key={expert._id}
                                        onClick={() => setSelected(isActive ? null : expert)}
                                        style={{
                                            background: isActive ? "#1a2035" : "#161b27",
                                            border: `0.5px solid ${isActive ? "rgba(29,158,117,0.4)" : "rgba(255,255,255,0.06)"}`,
                                            borderRadius: 10, padding: "14px 16px", cursor: "pointer",
                                            display: "flex", alignItems: "center", gap: 12,
                                        }}
                                    >
                                        <div style={{
                                            width: 38, height: 38, borderRadius: "50%", background: "#1D9E75",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: 13, fontWeight: 500, color: "#fff", flexShrink: 0,
                                        }}>{initials(expert.name)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{expert.name}</p>
                                            <p style={{ fontSize: 11, color: "#4a5568", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{expert.email}</p>
                                        </div>
                                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, flexShrink: 0, textTransform: "capitalize" }}>
                                            {expert.verificationStatus || "none"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                }
            </div>

            {/* ── Right: detail panel ── */}
            {selected && (() => {
                const st = statusStyle[selected.verificationStatus] || statusStyle.none;
                return (
                    <div style={{ background: "#161b27", border: "0.5px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 24 }}>

                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: "50%", background: "#1D9E75",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 16, fontWeight: 500, color: "#fff", flexShrink: 0,
                                }}>{initials(selected.name)}</div>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                        <p style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>{selected.name}</p>
                                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 600, textTransform: "capitalize" }}>
                                            {selected.verificationStatus || "none"}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 12, color: "#4a5568" }}>{selected.email} · {selected.officialId}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#4a5568", fontSize: 20, cursor: "pointer" }}>×</button>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                            {[
                                ["Experience", `${selected.experience || 0} yrs`],
                                ["Fee", `₹${selected.consultationFee || 0}`],
                                ["Languages", selected.languages?.join(", ") || "—"],
                                ["Submitted", new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })],
                            ].map(([label, val]) => (
                                <div key={label} style={{ background: "#0d1117", borderRadius: 8, padding: "10px 12px" }}>
                                    <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 4 }}>{label}</p>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Qualifications + Specializations */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>

                            <div style={{ background: "#0d1117", borderRadius: 10, padding: 14 }}>
                                <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Qualifications</p>
                                {selected.qualifications?.length > 0 ? selected.qualifications.map((q, i) => (
                                    <div key={i} style={{ borderLeft: "2px solid #185FA5", paddingLeft: 10, marginBottom: 8 }}>
                                        <p style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{q.degree}</p>
                                        <p style={{ fontSize: 11, color: "#4a5568" }}>{q.institution}{q.year ? ` · ${q.year}` : ""}</p>
                                    </div>
                                )) : <p style={{ fontSize: 12, color: "#4a5568" }}>Not provided</p>}
                            </div>

                            <div style={{ background: "#0d1117", borderRadius: 10, padding: 14 }}>
                                <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Specializations</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                                    {selected.specializations?.map(s => (
                                        <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(24,95,165,0.2)", color: "#5BA3E8" }}>{s}</span>
                                    ))}
                                </div>
                                {selected.subSpecializations?.length > 0 && (<>
                                    <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sub-specialties</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                        {selected.subSpecializations.map(s => (
                                            <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(100,100,100,0.15)", color: "#9ca3af" }}>{s}</span>
                                        ))}
                                    </div>
                                </>)}
                            </div>
                        </div>

                        {/* Bio */}
                        {selected.bio && (
                            <div style={{ background: "#0d1117", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Bio</p>
                                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>{selected.bio}</p>
                            </div>
                        )}

                        {/* Documents */}
                        {selected.verificationDocuments?.length > 0 && (
                            <div style={{ background: "#0d1117", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Verification documents</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {selected.verificationDocuments.map(doc => (
                                        <div key={doc.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#161b27", borderRadius: 8 }}>
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 500, color: "#fff", textTransform: "capitalize", marginBottom: 2 }}>
                                                    {doc.type.replace("_", " ")}
                                                </p>
                                                <p style={{ fontSize: 10, color: "#4a5568" }}>
                                                    {new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </p>
                                            </div>
                                            <a href={docViewUrl(doc.url)} target="_blank" rel="noreferrer"
                                                style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, background: "rgba(24,95,165,0.2)", color: "#5BA3E8", textDecoration: "none", fontWeight: 600 }}>
                                                View →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Rejection reason display */}
                        {selected.rejectionReason && (
                            <div style={{ padding: "10px 14px", background: "rgba(220,38,38,0.08)", borderRadius: 8, marginBottom: 16 }}>
                                <p style={{ fontSize: 11, color: "#f87171" }}>Rejection reason: {selected.rejectionReason}</p>
                            </div>
                        )}

                        {/* Admin notes */}
                        <div style={{ background: "#0d1117", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                            <p style={{ fontSize: 10, color: "#4a5568", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin notes (internal)</p>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Add internal notes — not visible to the expert..."
                                rows={3}
                                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#161b27", border: "0.5px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                <button onClick={saveNotes} style={{
                                    padding: "6px 16px", borderRadius: 8, fontSize: 12,
                                    background: notesSaved ? "#1D9E75" : "rgba(255,255,255,0.08)",
                                    color: notesSaved ? "#fff" : "#9ca3af",
                                    border: "none", cursor: "pointer",
                                }}>
                                    {notesSaved ? "Saved ✓" : "Save note"}
                                </button>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {selected.verificationStatus === "pending" && (<>
                                <button onClick={() => updateStatus(selected._id, "approved")}
                                    style={{ padding: "11px", borderRadius: 10, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    ✓ Approve Expert
                                </button>
                                {!showRejectInput ? (
                                    <button onClick={() => setShowRejectInput(true)}
                                        style={{ padding: "11px", borderRadius: 10, background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                        ✕ Reject
                                    </button>
                                ) : (
                                    <div>
                                        <textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection (shown to expert)..."
                                            rows={3}
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#0d1117", border: "0.5px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }}
                                        />
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button onClick={() => setShowRejectInput(false)}
                                                style={{ flex: 1, padding: "9px", borderRadius: 8, background: "rgba(255,255,255,0.05)", color: "#9ca3af", border: "none", fontSize: 12, cursor: "pointer" }}>
                                                Cancel
                                            </button>
                                            <button onClick={() => updateStatus(selected._id, "rejected", rejectReason)}
                                                style={{ flex: 1, padding: "9px", borderRadius: 8, background: "rgba(220,38,38,0.8)", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                                                Confirm Reject
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>)}
                            {selected.verificationStatus === "approved" && (
                                <button onClick={() => updateStatus(selected._id, "suspended")}
                                    style={{ padding: "11px", borderRadius: 10, background: "rgba(100,100,100,0.2)", color: "#9ca3af", border: "1px solid rgba(100,100,100,0.3)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    Suspend Expert
                                </button>
                            )}
                            {(selected.verificationStatus === "rejected" || selected.verificationStatus === "suspended") && (
                                <button onClick={() => updateStatus(selected._id, "approved")}
                                    style={{ padding: "11px", borderRadius: 10, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                                    Re-approve Expert
                                </button>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}