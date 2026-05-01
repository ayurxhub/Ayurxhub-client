"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

const STATUS_FILTERS = ["pending", "approved", "rejected", "suspended", "all"];

const STATUS = {
    pending: { bg: "#fef3c7", color: "#92400e" },
    approved: { bg: "#d1fae5", color: "#065f46" },
    rejected: { bg: "#fee2e2", color: "#991b1b" },
    suspended: { bg: "#f3f4f6", color: "#374151" },
    none: { bg: "#f3f4f6", color: "#6b7280" },
};

export default function AdminExperts() {
    const { authAxios } = useAuth();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [selected, setSelected] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showReject, setShowReject] = useState(false);
    const [notes, setNotes] = useState("");
    const [notesSaved, setNotesSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { fetchExperts(); }, [filter]);
    useEffect(() => { if (selected) { setNotes(selected.adminNotes || ""); setShowReject(false); setRejectReason(""); } }, [selected]);

    const fetchExperts = async () => {
        setLoading(true);
        try {
            const res = await authAxios.get(`/admin/users?role=expert&verificationStatus=${filter}`);
            setExperts(res.data.users); setSelected(null);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id, status, reason = "") => {
        try { await authAxios.put(`/admin/users/${id}/status`, { status, rejectionReason: reason }); setShowReject(false); setRejectReason(""); fetchExperts(); }
        catch (err) { setError(err.response?.data?.message || "Failed"); }
    };

    const saveNotes = async () => {
        try { await authAxios.put(`/admin/users/${selected._id}/notes`, { notes }); setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); }
        catch { setError("Failed to save notes"); }
    };

    const initials = name => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div>
            <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>Expert Verification</h1>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Review credentials and manage expert status</p>
            </div>

            {error && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, background: "#fee2e2", color: "#991b1b", fontSize: 13 }}>{error}</div>}

            <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "1px solid #e5e7eb", flexWrap: "wrap" }}>
                {STATUS_FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 14px", fontSize: 12, background: "none", border: "none", borderBottom: filter === f ? "2px solid #1D9E75" : "2px solid transparent", color: filter === f ? "#1D9E75" : "#6b7280", cursor: "pointer", textTransform: "capitalize", fontFamily: "inherit", fontWeight: filter === f ? 700 : 400 }}>{f}</button>
                ))}
            </div>

            <div className="exp-layout">
                {/* Expert list */}
                <div className="exp-list">
                    {loading ? <p style={{ color: "#6b7280", fontSize: 13 }}>Loading...</p>
                        : experts.length === 0 ? <p style={{ color: "#9ca3af", fontSize: 13 }}>No experts found</p>
                            : experts.map(e => {
                                const st = STATUS[e.verificationStatus] || STATUS.none;
                                const isActive = selected?._id === e._id;
                                return (
                                    <div key={e._id} onClick={() => setSelected(isActive ? null : e)}
                                        style={{ background: isActive ? "#eff6ff" : "#fff", border: `1px solid ${isActive ? "#93c5fd" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, transition: "all 0.15s" }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(e.name)}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}</p>
                                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.email}</p>
                                        </div>
                                        <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 700, flexShrink: 0, textTransform: "capitalize" }}>{e.verificationStatus || "none"}</span>
                                    </div>
                                );
                            })}
                </div>

                {/* Detail panel */}
                {selected && (() => {
                    const st = STATUS[selected.verificationStatus] || STATUS.none;
                    return (
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "clamp(16px,4vw,24px)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{initials(selected.name)}</div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                                            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>{selected.name}</p>
                                            <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 700, textTransform: "capitalize" }}>{selected.verificationStatus || "none"}</span>
                                        </div>
                                        <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>{selected.email} · {selected.officialId}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af", flexShrink: 0 }}>×</button>
                            </div>

                            {/* Stats */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 8, marginBottom: 20 }}>
                                {[["Experience", `${selected.experience || 0} yrs`], ["Fee", `₹${selected.consultationFee || 0}`], ["Languages", selected.languages?.join(", ") || "—"], ["Submitted", new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })]].map(([l, v]) => (
                                    <div key={l} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 12px" }}>
                                        <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{l}</p>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{v}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Qualifications */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Qualifications</p>
                                    {selected.qualifications?.length > 0 ? selected.qualifications.map((q, i) => (
                                        <div key={i} style={{ borderLeft: "2px solid #3b82f6", paddingLeft: 10, marginBottom: 8 }}>
                                            <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: 0 }}>{q.degree}</p>
                                            <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{q.institution}{q.year ? ` · ${q.year}` : ""}</p>
                                        </div>
                                    )) : <p style={{ fontSize: 12, color: "#9ca3af" }}>Not provided</p>}
                                </div>
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Specializations</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                                        {selected.specializations?.map(s => (
                                            <span key={s} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#dbeafe", color: "#1d4ed8" }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            {selected.verificationDocuments?.length > 0 && (
                                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                    <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Verification Documents</p>
                                    {selected.verificationDocuments.map(doc => (
                                        <div key={doc.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#fff", borderRadius: 8, marginBottom: 6, border: "1px solid #e5e7eb" }}>
                                            <div>
                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", margin: 0, textTransform: "capitalize" }}>{doc.type.replace("_", " ")}</p>
                                                <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                            </div>
                                            <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, padding: "5px 12px", borderRadius: 6, background: "#dbeafe", color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}>View →</a>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selected.rejectionReason && (
                                <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, marginBottom: 16 }}>
                                    <p style={{ fontSize: 11, color: "#991b1b", margin: 0 }}>Rejection reason: {selected.rejectionReason}</p>
                                </div>
                            )}

                            {/* Admin notes */}
                            <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                                <p style={{ fontSize: 10, color: "#9ca3af", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Admin Notes (internal)</p>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes, not visible to expert..." rows={3}
                                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#111827", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                    <button onClick={saveNotes} style={{ padding: "6px 16px", borderRadius: 8, fontSize: 12, background: notesSaved ? "#1D9E75" : "#f3f4f6", color: notesSaved ? "#fff" : "#374151", border: "none", cursor: "pointer", fontWeight: 600 }}>
                                        {notesSaved ? "Saved ✓" : "Save note"}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {selected.verificationStatus === "pending" && (<>
                                    <button onClick={() => updateStatus(selected._id, "approved")} style={{ padding: 11, borderRadius: 10, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✓ Approve Expert</button>
                                    {!showReject ? (
                                        <button onClick={() => setShowReject(true)} style={{ padding: 11, borderRadius: 10, background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>✕ Reject</button>
                                    ) : (
                                        <div>
                                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." rows={3}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#fff", border: "1px solid #e5e7eb", color: "#111827", fontSize: 12, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", marginBottom: 8 }} />
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <button onClick={() => setShowReject(false)} style={{ flex: 1, padding: 9, borderRadius: 8, background: "#f3f4f6", color: "#374151", border: "none", fontSize: 12, cursor: "pointer" }}>Cancel</button>
                                                <button onClick={() => updateStatus(selected._id, "rejected", rejectReason)} style={{ flex: 1, padding: 9, borderRadius: 8, background: "#dc2626", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Confirm Reject</button>
                                            </div>
                                        </div>
                                    )}
                                </>)}
                                {selected.verificationStatus === "approved" && (
                                    <button onClick={() => updateStatus(selected._id, "suspended")} style={{ padding: 11, borderRadius: 10, background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Suspend Expert</button>
                                )}
                                {(selected.verificationStatus === "rejected" || selected.verificationStatus === "suspended") && (
                                    <button onClick={() => updateStatus(selected._id, "approved")} style={{ padding: 11, borderRadius: 10, background: "#1D9E75", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Re-approve Expert</button>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            <style>{`
                .exp-layout { display: grid; grid-template-columns: 340px 1fr; gap: 16px; align-items: start; }
                .exp-list { min-width: 0; }
                @media (max-width: 768px) { .exp-layout { grid-template-columns: 1fr; } }
            `}</style>
        </div>
    );
}