"use client";

import { scanMessage } from "../../../../utils/piiFilter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function SessionPage() {
    return <ProtectedRoute><SessionRoom /></ProtectedRoute>;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

function SessionRoom() {
    const { authAxios, user, accessTokenRef } = useAuth();
    const { id: bookingId } = useParams();
    const router = useRouter();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [panel, setPanel] = useState("video");
    const [messages, setMessages] = useState([]);
    const [msgInput, setMsgInput] = useState("");
    const [piiWarning, setPiiWarning] = useState("");
    const [piiBlocked, setPiiBlocked] = useState(false);
    const [socketReady, setSocketReady] = useState(false);
    const [prescription, setPrescription] = useState("");
    const [savingRx, setSavingRx] = useState(false);
    const [rxSaved, setRxSaved] = useState(false);
    const [jitsiReady, setJitsiReady] = useState(false);
    const [rxError, setRxError] = useState("");
    const socketRef = useRef(null);
    const chatEndRef = useRef(null);
    const jitsiApiRef = useRef(null);
    const jitsiContainerRef = useRef(null); // points to a raw DOM div outside React's tree
    const jitsiWrapperRef = useRef(null);    // React div used only for positioning

    const isExpert = user?.role === "expert";

    // ── Load booking ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (bookingId) loadBooking();
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            const res = await authAxios.get(`/bookings/${bookingId}`);
            setBooking(res.data.booking);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // ── Socket.io chat ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!booking || !user) return;

        import("socket.io-client").then(({ io }) => {
            const socket = io(SOCKET_URL, {
                auth: {
                    bookingId,
                    userId: user._id,
                    token: accessTokenRef.current,
                },
                transports: ["websocket"],
            });
            socket.on("connect", () => {
                setSocketReady(true);
                socket.emit("join_room", { bookingId });
            });

            socket.on("chat_history", (msgs) => setMessages(msgs));
            socket.on("new_message", (msg) => setMessages((prev) => [...prev, msg]));
            socket.on("disconnect", () => setSocketReady(false));
            // Server-side PII block (second layer)
            socket.on("message_blocked", ({ reason }) => {
                setPiiWarning("🚫 " + reason);
                setPiiBlocked(true);
            });

            socketRef.current = socket;
        }).catch(() => {
            console.warn("socket.io-client not installed — chat unavailable");
        });

        return () => { socketRef.current?.disconnect(); };
    }, [booking, user]);

    // ── Auto scroll chat ──────────────────────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Show/hide the body-level Jitsi div when switching panels ──────────────
    useEffect(() => {
        const jitsiDiv = document.getElementById("jitsi-outer-container");
        if (!jitsiDiv) return;
        if (panel === "video" && jitsiWrapperRef.current) {
            const rect = jitsiWrapperRef.current.getBoundingClientRect();
            jitsiDiv.style.cssText = `
                position:fixed;
                top:${rect.top}px;
                left:${rect.left}px;
                width:${rect.width}px;
                height:${rect.height}px;
                z-index:10;
                display:block;
                border-radius:14px;
                overflow:hidden;
                background:#1a1f2e;
            `;
        } else {
            jitsiDiv.style.display = "none";
        }
    }, [panel]);

    // ── Jitsi Meet ────────────────────────────────────────────────────────────
    // We mount Jitsi into a raw div that lives OUTSIDE React's DOM tree to avoid
    // the "removeChild: node is not a child" error caused by Jitsi mutating the DOM
    // directly while React's fiber also tries to clean up the same node.
    useEffect(() => {
        if (!booking || panel !== "video") return;
        if (jitsiApiRef.current) return;

        const roomName = `ayurxhubsession${bookingId?.slice(-10)}`;
        const displayName = user?.name || "User";

        // Create a raw div outside React's tree and append to body
        const jitsiDiv = document.createElement("div");
        jitsiDiv.id = "jitsi-outer-container";
        jitsiDiv.style.cssText = "position:fixed;inset:0;z-index:9999;display:none;";
        document.body.appendChild(jitsiDiv);
        jitsiContainerRef.current = jitsiDiv;

        const positionDiv = () => {
            if (!jitsiWrapperRef.current) return;
            const rect = jitsiWrapperRef.current.getBoundingClientRect();
            jitsiDiv.style.cssText = `
                position:fixed;
                top:${rect.top}px;
                left:${rect.left}px;
                width:${rect.width}px;
                height:${rect.height}px;
                z-index:10;
                display:block;
                border-radius:14px;
                overflow:hidden;
                background:#1a1f2e;
            `;
        };

        const initJitsi = () => {
            if (!window.JitsiMeetExternalAPI || !jitsiDiv.isConnected) return;
            positionDiv();

            jitsiApiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
                roomName,
                parentNode: jitsiDiv,
                width: "100%",
                height: "100%",
                userInfo: { displayName, email: "" },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    enableWelcomePage: false,
                    requireDisplayName: false,
                    enableLobbyChat: false,
                    hideLobbyButton: true,
                    lobby: { autoKnock: false, enableChat: false },
                    moderatedRoomServiceUrl: "",
                    p2p: { enabled: true },
                    toolbarButtons: [
                        "microphone", "camera", "fullscreen",
                        "fodeviceselection", "hangup", "raisehand", "tileview",
                    ],
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    TOOLBAR_ALWAYS_VISIBLE: true,
                    DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
                },
            });

            jitsiApiRef.current.addEventListeners({
                videoConferenceJoined: () => setJitsiReady(true),
                readyToClose: () => handleLeave(),
            });

            // Keep position in sync on resize
            window.addEventListener("resize", positionDiv);
        };

        if (window.JitsiMeetExternalAPI) {
            initJitsi();
        } else {
            const script = document.createElement("script");
            script.src = "https://meet.jit.si/external_api.js";
            script.async = true;
            script.onload = initJitsi;
            document.head.appendChild(script);
        }

        return () => {
            window.removeEventListener("resize", positionDiv);
            // Dispose Jitsi first, then safely remove our manually-created div
            try { jitsiApiRef.current?.dispose(); } catch (_) { }
            jitsiApiRef.current = null;
            setJitsiReady(false);
            // Remove the raw div from body — safe because React never owned it
            if (jitsiDiv.isConnected) document.body.removeChild(jitsiDiv);
            jitsiContainerRef.current = null;
        };
    }, [booking, panel, bookingId]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const sendMessage = () => {
        const text = msgInput.trim();
        if (!text || !socketRef.current) return;

        // ── Client-side PII check before sending ──────────────────────────
        const scan = scanMessage(text);
        if (scan.blocked) {
            setPiiWarning(scan.reason);
            setPiiBlocked(true);
            return; // do NOT send
        }
        setPiiWarning("");
        setPiiBlocked(false);

        socketRef.current.emit("send_message", {
            bookingId,
            senderId: user._id,
            senderName: user.name,
            text,
        });
        setMsgInput("");
    };

    // Handle real-time PII detection as user types
    const handleMsgChange = (e) => {
        const val = e.target.value;
        setMsgInput(val);
        if (!val.trim()) { setPiiWarning(""); setPiiBlocked(false); return; }
        const scan = scanMessage(val);
        if (scan.blocked) {
            setPiiWarning(scan.reason);
            setPiiBlocked(true);
        } else if (scan.warned) {
            setPiiWarning("⚠️ This message may contain restricted content.");
            setPiiBlocked(false);
        } else {
            setPiiWarning("");
            setPiiBlocked(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSavePrescription = async () => {
        setSavingRx(true);
        try {
            await authAxios.put(`/bookings/${bookingId}/notes`, { prescription });
            setRxSaved(true);
            setTimeout(() => setRxSaved(false), 2500);
        } catch {
            setRxError("Failed to save prescription");
        } finally {
            setSavingRx(false);
        }
    };

    const handleLeave = () => {
        try { jitsiApiRef.current?.dispose(); } catch (_) { }
        jitsiApiRef.current = null;
        const jitsiDiv = document.getElementById("jitsi-outer-container");
        if (jitsiDiv?.isConnected) document.body.removeChild(jitsiDiv);
        router.push("/consultations/bookings");
    };

    const otherPerson = booking ? (isExpert ? booking.student : booking.expert) : null;
    const initials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    // ── States ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ height: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!booking) return (
        <div style={{ height: "100vh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
            Session not found.&nbsp;
            <button onClick={() => router.push("/bookings")} style={{ color: "#1D9E75", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Go back</button>
        </div>
    );

    return (
        <div style={{ height: "100vh", background: "#0f1117", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ── Top bar ── */}
            <div style={{
                padding: "10px 20px", background: "#161b27", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Live Session</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                        {booking.startTime} – {booking.endTime} · {booking.duration} min
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {otherPerson?.avatar ? (
                        <img src={otherPerson.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                            {initials(otherPerson?.name)}
                        </div>
                    )}
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
                        {isExpert ? "Patient" : "Dr."} {otherPerson?.name}
                    </span>
                </div>

                <button onClick={handleLeave} style={{
                    padding: "7px 18px", borderRadius: 8,
                    background: "#7f1d1d", color: "#fca5a5",
                    border: "1px solid #991b1b", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>call_end</span>
                    Leave
                </button>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                {/* ── Left: video + chat ── */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Panel tabs */}
                    <div style={{ padding: "10px 14px 0", flexShrink: 0 }}>
                        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2 }}>
                            {[
                                { key: "video", icon: "videocam", label: "Video Call" },
                                { key: "chat", icon: "chat", label: "Chat" },
                            ].map(({ key, icon, label }) => (
                                <button key={key} onClick={() => setPanel(key)} style={{
                                    display: "flex", alignItems: "center", gap: 6,
                                    padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: panel === key ? "rgba(255,255,255,0.13)" : "transparent",
                                    color: panel === key ? "#fff" : "rgba(255,255,255,0.35)",
                                    fontSize: 13, fontFamily: "inherit", transition: "all 0.15s",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                                    {label}
                                    {key === "chat" && !socketReady && (
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF9F27" }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Video panel — wrapper only used for layout measurement.
                        The actual Jitsi iframe lives in a body-level div (jitsiContainerRef)
                        to avoid React removeChild conflicts. */}
                    <div style={{
                        flex: 1, padding: "10px 14px 14px",
                        display: panel === "video" ? "flex" : "none",
                        flexDirection: "column", overflow: "hidden",
                    }}>
                        <div
                            ref={jitsiWrapperRef}
                            style={{
                                flex: 1, borderRadius: 14,
                                background: "#1a1f2e", minHeight: 0, position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {/* Spinner shown until Jitsi fires videoConferenceJoined */}
                            {!jitsiReady && (
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", flexDirection: "column",
                                    alignItems: "center", justifyContent: "center",
                                    color: "rgba(255,255,255,0.4)", pointerEvents: "none",
                                    zIndex: 0,
                                }}>
                                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", marginBottom: 12 }} />
                                    <p style={{ fontSize: 13 }}>Connecting to video call…</p>
                                    <p style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>Room: {bookingId?.slice(-8)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat panel */}
                    {panel === "chat" && (
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", margin: "10px 14px 14px", background: "#1a1f2e", borderRadius: 14, overflow: "hidden" }}>

                            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
                                {!socketReady && (
                                    <div style={{ textAlign: "center", padding: "10px 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                                        Connecting to chat…
                                    </div>
                                )}
                                {socketReady && messages.length === 0 && (
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", paddingBottom: 40 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 8 }}>chat_bubble_outline</span>
                                        <p style={{ fontSize: 13 }}>No messages yet</p>
                                    </div>
                                )}
                                {messages.map((msg, i) => {
                                    const isMe = msg.senderId?.toString() === user._id?.toString();
                                    return (
                                        <div key={i} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
                                            {!isMe && (
                                                <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                                    {initials(msg.senderName)}
                                                </div>
                                            )}
                                            <div style={{
                                                maxWidth: "70%", padding: "9px 13px",
                                                borderRadius: isMe ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                                                background: isMe ? "#1D9E75" : "rgba(255,255,255,0.07)",
                                                color: "#fff",
                                            }}>
                                                {!isMe && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>{msg.senderName}</p>}
                                                <p style={{ fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.text}</p>
                                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                                                    {msg.createdAt ? formatTime(msg.createdAt) : "just now"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* PII warning banner */}
                            {piiWarning && (
                                <div style={{
                                    padding: "8px 12px",
                                    background: piiBlocked ? "rgba(153,27,27,0.9)" : "rgba(120,53,15,0.9)",
                                    borderTop: `1px solid ${piiBlocked ? "#dc2626" : "#d97706"}`,
                                    display: "flex", alignItems: "flex-start", gap: 8,
                                }}>
                                    <span style={{ fontSize: 13, flexShrink: 0 }}>{piiBlocked ? "🚫" : "⚠️"}</span>
                                    <p style={{ fontSize: 11, color: piiBlocked ? "#fca5a5" : "#fde68a", margin: 0, lineHeight: 1.5 }}>
                                        {piiWarning}
                                    </p>
                                </div>
                            )}
                            <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, alignItems: "flex-end" }}>
                                <textarea
                                    value={msgInput}
                                    onChange={handleMsgChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={socketReady ? "Type a message…  (Enter to send)" : "Connecting…"}
                                    disabled={!socketReady}
                                    rows={1}
                                    style={{
                                        flex: 1, padding: "9px 13px", borderRadius: 10,
                                        background: piiBlocked ? "rgba(220,38,38,0.1)" : "rgba(255,255,255,0.05)",
                                        border: `1px solid ${piiBlocked ? "rgba(220,38,38,0.6)" : "rgba(255,255,255,0.07)"}`,
                                        color: "#fff", fontSize: 13, fontFamily: "inherit",
                                        outline: "none", resize: "none", maxHeight: 90, lineHeight: 1.5,
                                        transition: "border-color 0.2s, background 0.2s",
                                    }}
                                />
                                <button onClick={sendMessage} disabled={!socketReady || !msgInput.trim() || piiBlocked} style={{
                                    width: 38, height: 38, borderRadius: "50%",
                                    background: (socketReady && msgInput.trim() && !piiBlocked) ? "#1D9E75" : "rgba(255,255,255,0.06)",
                                    border: "none", cursor: (socketReady && msgInput.trim() && !piiBlocked) ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0, transition: "background 0.2s",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#fff" }}>send</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right sidebar ── */}
                <div style={{ width: 268, background: "#161b27", flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.06)", overflowY: "auto", display: "flex", flexDirection: "column" }}>

                    {/* Session info */}
                    <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Session Info</p>
                        {[
                            ["Mode", booking.mode],
                            ["Duration", `${booking.duration} min`],
                            ["Date", new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
                            ["Time", `${booking.startTime} – ${booking.endTime}`],
                        ].map(([label, val]) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{label}</span>
                                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", textTransform: "capitalize" }}>{val}</span>
                            </div>
                        ))}
                    </div>

                    {/* Patient notes */}
                    {booking.notes?.studentNotes && (
                        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Patient Notes</p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, background: "rgba(255,255,255,0.03)", padding: "9px 11px", borderRadius: 8 }}>
                                {booking.notes.studentNotes}
                            </p>
                        </div>
                    )}

                    {/* Expert: prescription */}
                    {isExpert && (
                        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Prescription</p>
                            <textarea
                                value={prescription}
                                onChange={(e) => setPrescription(e.target.value)}
                                placeholder="Medicines, dosage, diet, lifestyle advice..."
                                style={{
                                    flex: 1, minHeight: 180, padding: "10px 12px", borderRadius: 10,
                                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                                    color: "#fff", fontSize: 12, fontFamily: "inherit",
                                    outline: "none", resize: "none", lineHeight: 1.7,
                                }}
                                onFocus={(e) => { e.target.style.borderColor = "rgba(29,158,117,0.4)"; }}
                                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                            />
                            <button onClick={handleSavePrescription} disabled={savingRx || !prescription.trim()} style={{
                                marginTop: 10, padding: "9px", borderRadius: 8,
                                background: rxSaved ? "#1D9E75" : "rgba(255,255,255,0.07)",
                                color: rxSaved ? "#fff" : "rgba(255,255,255,0.6)",
                                border: rxSaved ? "none" : "1px solid rgba(255,255,255,0.09)",
                                fontSize: 13, fontFamily: "inherit", cursor: prescription.trim() && !savingRx ? "pointer" : "not-allowed",
                                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                    {rxSaved ? "check_circle" : "save"}
                                </span>
                                {rxSaved ? "Saved!" : savingRx ? "Saving..." : "Save Prescription"}
                            </button>
                            {rxError && (
                                <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{rxError}</p>
                            )}
                        </div>
                    )}

                    {/* Student: view prescription */}
                    {!isExpert && booking.notes?.prescription && (
                        <div style={{ padding: "14px 16px" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Prescription</p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, background: "rgba(29,158,117,0.1)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(29,158,117,0.2)" }}>
                                {booking.notes.prescription}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
            `}</style>
        </div>
    );
}