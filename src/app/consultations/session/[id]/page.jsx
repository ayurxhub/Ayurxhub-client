"use client";

import { scanMessage } from "../../../../utils/piiFilter";
import { useState, useEffect, useRef, useCallback } from "react";
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
    const [rxError, setRxError] = useState("");
    const [showSidebar, setShowSidebar] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const [showReviewPrompt, setShowReviewPrompt] = useState(false);

    // Agora states
    const [agoraJoined, setAgoraJoined] = useState(false);
    const [agoraError, setAgoraError] = useState("");
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [remoteUsers, setRemoteUsers] = useState([]);

    const socketRef = useRef(null);
    const chatEndRef = useRef(null);
    const agoraClientRef = useRef(null);
    const localMicTrackRef = useRef(null);
    const localCamTrackRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const isExpert = user?.role === "expert";

    // ── Load booking ──────────────────────────────────────────────────────────
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

    // ── Agora video ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!booking || panel !== "video") return;
        if (agoraJoined) return;

        let destroyed = false;

        const initAgora = async () => {
            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;

                let tokenRes;
                try {
                    tokenRes = await authAxios.get(`/bookings/${bookingId}/agora-token`);
                } catch (err) {
                    const msg = err.response?.data?.message || "Failed to join session";
                    if (!destroyed) {
                        setAgoraError(msg);
                        if (err.response?.status === 403) setSessionError(msg);
                    }
                    return;
                }

                const { token, channelName, appId } = tokenRes.data;
                if (destroyed) return;

                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                agoraClientRef.current = client;

                client.on("user-published", async (remoteUser, mediaType) => {
                    await client.subscribe(remoteUser, mediaType);
                    if (mediaType === "video") {
                        setRemoteUsers((prev) => {
                            const exists = prev.find((u) => u.uid === remoteUser.uid);
                            if (!exists) return [...prev, remoteUser];
                            return prev;
                        });
                        setTimeout(() => {
                            if (remoteVideoRef.current) {
                                remoteUser.videoTrack?.play(remoteVideoRef.current);
                            }
                        }, 100);
                    }
                    if (mediaType === "audio") remoteUser.audioTrack?.play();
                });

                client.on("user-unpublished", (remoteUser, mediaType) => {
                    if (mediaType === "video") {
                        setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
                    }
                });

                client.on("user-left", (remoteUser) => {
                    setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
                });

                await client.join(appId, channelName, token, null);
                if (destroyed) { await client.leave(); return; }

                const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
                localMicTrackRef.current = micTrack;
                localCamTrackRef.current = camTrack;

                if (localVideoRef.current) camTrack.play(localVideoRef.current);
                await client.publish([micTrack, camTrack]);

                if (!destroyed) setAgoraJoined(true);
            } catch (err) {
                console.error("Agora init error:", err);
                if (!destroyed) setAgoraError(err.message || "Failed to connect video");
            }
        };

        initAgora();
        return () => { destroyed = true; cleanupAgora(); };
    }, [booking, panel, bookingId]);

    const cleanupAgora = useCallback(async () => {
        try {
            localMicTrackRef.current?.close();
            localCamTrackRef.current?.close();
            localMicTrackRef.current = null;
            localCamTrackRef.current = null;
            if (agoraClientRef.current) {
                await agoraClientRef.current.leave();
                agoraClientRef.current = null;
            }
            setAgoraJoined(false);
            setRemoteUsers([]);
        } catch (err) {
            console.error("Agora cleanup error:", err);
        }
    }, []);

    const toggleMic = async () => {
        if (!localMicTrackRef.current) return;
        await localMicTrackRef.current.setEnabled(!micOn);
        setMicOn((prev) => !prev);
    };

    const toggleCam = async () => {
        if (!localCamTrackRef.current) return;
        await localCamTrackRef.current.setEnabled(!camOn);
        setCamOn((prev) => !prev);
    };

    // ── Socket.io chat ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!booking || !user) return;

        import("socket.io-client").then(({ io }) => {
            const socket = io(SOCKET_URL, {
                auth: { bookingId, userId: user._id, token: accessTokenRef.current },
                transports: ["websocket"],
            });
            socket.on("connect", () => {
                setSocketReady(true);
                socket.emit("join_room", { bookingId });
            });
            socket.on("chat_history", (msgs) => setMessages(msgs));
            socket.on("new_message", (msg) => setMessages((prev) => [...prev, msg]));
            socket.on("disconnect", () => setSocketReady(false));
            socket.on("message_blocked", ({ reason }) => {
                setPiiWarning("🚫 " + reason);
                setPiiBlocked(true);
            });
            socketRef.current = socket;
        }).catch(() => console.warn("socket.io-client not installed"));

        return () => { socketRef.current?.disconnect(); };
    }, [booking, user]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const sendMessage = () => {
        const text = msgInput.trim();
        if (!text || !socketRef.current) return;
        const scan = scanMessage(text);
        if (scan.blocked) { setPiiWarning(scan.reason); setPiiBlocked(true); return; }
        setPiiWarning(""); setPiiBlocked(false);
        socketRef.current.emit("send_message", {
            bookingId, senderId: user._id, senderName: user.name, text,
        });
        setMsgInput("");
    };

    const handleMsgChange = (e) => {
        const val = e.target.value;
        setMsgInput(val);
        if (!val.trim()) { setPiiWarning(""); setPiiBlocked(false); return; }
        const scan = scanMessage(val);
        if (scan.blocked) { setPiiWarning(scan.reason); setPiiBlocked(true); }
        else if (scan.warned) { setPiiWarning("⚠️ This message may contain restricted content."); setPiiBlocked(false); }
        else { setPiiWarning(""); setPiiBlocked(false); }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleSavePrescription = async () => {
        setSavingRx(true);
        try {
            await authAxios.put(`/bookings/${bookingId}/notes`, { prescription });
            setRxSaved(true);
            setTimeout(() => setRxSaved(false), 2500);
        } catch { setRxError("Failed to save prescription"); }
        finally { setSavingRx(false); }
    };

    const handleLeave = async () => {
        await cleanupAgora();
        if (!isExpert && booking?.status === "completed" && !booking?.reviewLeft) {
            setShowReviewPrompt(true);
        } else {
            router.push("/consultations/bookings");
        }
    };

    const otherPerson = booking ? (isExpert ? booking.student : booking.expert) : null;
    const initials = (name) => name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    // ── States ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ height: "100dvh", background: "#0f1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!booking) return (
        <div style={{ height: "100dvh", background: "#0f1117", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
            <span style={{ fontSize: 48 }}>🔍</span>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Session not found</p>
            <button onClick={() => router.push("/consultations/bookings")} style={{ padding: "9px 20px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}>
                Back to Bookings
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (sessionError) return (
        <div style={{ height: "100dvh", background: "#0f1117", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 52, color: "#EF9F27" }}>schedule</span>
            <p style={{ color: "#fff", fontSize: 16, fontWeight: 600, textAlign: "center", maxWidth: 320 }}>{sessionError}</p>
            <button onClick={() => router.push("/consultations/bookings")}
                style={{ padding: "10px 24px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", cursor: "pointer", fontSize: 14 }}>
                Back to Bookings
            </button>
        </div>
    );

    return (
        <>
            <style>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                @keyframes spin  { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
                @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

                .s-root {
                    height: 100dvh;
                    background: #0f1117;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                    color: #fff;
                }

                /* TOP BAR */
                .s-topbar {
                    padding: 0 16px;
                    height: 52px;
                    background: #161b27;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255,255,255,0.07);
                    gap: 8px;
                }
                .s-topbar-left { display:flex; align-items:center; gap:8px; flex:1; min-width:0; overflow:hidden; }
                .s-live-dot { width:8px; height:8px; border-radius:50%; background:#1D9E75; animation:pulse 1.5s infinite; flex-shrink:0; }
                .s-topbar-title { font-size:14px; font-weight:600; white-space:nowrap; }
                .s-topbar-sub { font-size:11px; color:rgba(255,255,255,.35); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
                .s-topbar-person { display:flex; align-items:center; gap:6px; flex-shrink:0; }
                .s-topbar-person-name { font-size:12px; color:rgba(255,255,255,.6); white-space:nowrap; }
                .s-avatar { width:26px; height:26px; border-radius:50%; object-fit:cover; }
                .s-avatar-placeholder { width:26px; height:26px; border-radius:50%; background:#1D9E75; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; flex-shrink:0; }
                .s-leave-btn {
                    padding: 6px 12px; border-radius:8px; background:#7f1d1d; color:#fca5a5;
                    border:1px solid #991b1b; font-size:12px; font-weight:600;
                    cursor:pointer; display:flex; align-items:center; gap:4px;
                    font-family:inherit; white-space:nowrap; flex-shrink:0;
                    transition: background .2s;
                }
                .s-leave-btn:hover { background: #991b1b; }

                @media(max-width:480px) {
                    .s-topbar-sub { display:none; }
                    .s-topbar-person-name { display:none; }
                }

                /* BODY */
                .s-body { flex:1; display:flex; overflow:hidden; position:relative; }

                /* MAIN */
                .s-main { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }

                /* TABS */
                .s-tabs { padding:10px 12px 0; flex-shrink:0; display:flex; align-items:center; gap:8px; }
                .s-tabs-inner {
                    flex:1; display:inline-flex; background:rgba(255,255,255,.05);
                    border-radius:10px; padding:3px; gap:2px;
                }
                .s-tab {
                    flex:1; display:flex; align-items:center; justify-content:center; gap:5px;
                    padding:7px 12px; border-radius:8px; border:none; cursor:pointer;
                    font-size:13px; font-family:inherit; transition:all .15s;
                }
                .s-tab-active { background:rgba(255,255,255,.13); color:#fff; }
                .s-tab-inactive { background:transparent; color:rgba(255,255,255,.35); }
                .s-tab-inactive:hover { color:rgba(255,255,255,.6); }
                .s-info-toggle {
                    width:36px; height:36px; border-radius:8px;
                    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07);
                    color:rgba(255,255,255,.5); cursor:pointer;
                    display:none; align-items:center; justify-content:center; flex-shrink:0;
                    transition: background .15s;
                }
                .s-info-toggle:hover { background:rgba(255,255,255,.09); }
                @media(max-width:768px) { .s-info-toggle { display:flex; } }

                /* VIDEO PANEL */
                .s-video-panel { flex:1; padding:10px 12px 12px; display:flex; flex-direction:column; gap:10px; overflow:hidden; }
                .s-video-area { flex:1; position:relative; border-radius:12px; background:#1a1f2e; min-height:0; overflow:hidden; }
                .s-remote-video { width:100%; height:100%; background:#1a1f2e; }
                .s-remote-placeholder { width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; color:rgba(255,255,255,.3); gap:8px; }
                .s-local-pip {
                    position:absolute; bottom:12px; right:12px;
                    width:120px; height:90px; border-radius:8px; overflow:hidden;
                    background:#0f1117; border:2px solid rgba(255,255,255,.12);
                    box-shadow:0 4px 16px rgba(0,0,0,.5);
                }
                @media(max-width:480px) { .s-local-pip { width:88px; height:66px; bottom:8px; right:8px; } }
                .s-controls { display:flex; justify-content:center; gap:10px; flex-shrink:0; }
                .s-ctrl {
                    width:46px; height:46px; border-radius:50%; border:none; cursor:pointer;
                    display:flex; align-items:center; justify-content:center;
                    transition:background .2s, transform .1s;
                }
                .s-ctrl:active { transform:scale(.92); }

                /* CHAT PANEL */
                .s-chat { flex:1; display:flex; flex-direction:column; margin:10px 12px 12px; background:#1a1f2e; border-radius:12px; overflow:hidden; animation:fadeUp .2s ease; }
                .s-chat-msgs { flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; }
                .s-chat-msgs::-webkit-scrollbar { width:3px; }
                .s-chat-msgs::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:2px; }
                .s-bubble-me { max-width:75%; padding:9px 12px; border-radius:14px 14px 3px 14px; background:#1D9E75; }
                .s-bubble-other { max-width:75%; padding:9px 12px; border-radius:14px 14px 14px 3px; background:rgba(255,255,255,.07); }
                .s-chat-input-row { padding:10px; border-top:1px solid rgba(255,255,255,.05); display:flex; gap:8px; align-items:flex-end; }
                .s-chat-ta {
                    flex:1; padding:9px 12px; border-radius:10px;
                    font-size:13px; font-family:inherit; outline:none; resize:none;
                    max-height:90px; line-height:1.5; color:#fff;
                    transition:border-color .2s, background .2s;
                }
                .s-send-btn {
                    width:38px; height:38px; border-radius:50%; border:none;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0; transition:background .2s;
                }

                /* SIDEBAR */
                .s-sidebar {
                    width:252px; background:#161b27; flex-shrink:0;
                    border-left:1px solid rgba(255,255,255,.06);
                    overflow-y:auto; display:flex; flex-direction:column;
                }
                .s-sidebar::-webkit-scrollbar { width:3px; }
                .s-sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); }
                @media(max-width:768px) {
                    .s-sidebar {
                        position:absolute; right:0; top:0; bottom:0; z-index:50;
                        transform:translateX(100%); transition:transform .25s ease;
                        box-shadow:-8px 0 32px rgba(0,0,0,.5);
                    }
                    .s-sidebar.s-open { transform:translateX(0); }
                }
                .s-overlay {
                    display:none; position:absolute; inset:0;
                    background:rgba(0,0,0,.55); z-index:49;
                }
                @media(max-width:768px) { .s-overlay.s-open { display:block; } }

                .s-section { padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.06); }
                .s-section-label { font-size:10px; color:rgba(255,255,255,.3); text-transform:uppercase; letter-spacing:.07em; margin-bottom:10px; }
                .s-info-row { display:flex; justify-content:space-between; margin-bottom:7px; }
                .s-info-k { font-size:12px; color:rgba(255,255,255,.3); }
                .s-info-v { font-size:12px; color:rgba(255,255,255,.75); text-transform:capitalize; }

                /* PII BANNER */
                .s-pii { padding:8px 12px; display:flex; align-items:flex-start; gap:8px; }

                /* REVIEW MODAL */
                .s-modal-bg {
                    position:fixed; inset:0; background:rgba(0,0,0,.75);
                    display:flex; align-items:center; justify-content:center;
                    z-index:200; padding:20px; animation:fadeUp .2s ease;
                }
                .s-modal {
                    background:#161b27; border-radius:16px; padding:28px 22px;
                    max-width:370px; width:100%; text-align:center;
                    border:1px solid rgba(255,255,255,.08);
                }
                .s-modal-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:20px; }
                .s-modal-primary { padding:10px 22px; border-radius:8px; background:#1D9E75; color:#fff; border:none; cursor:pointer; font-size:14px; font-family:inherit; font-weight:600; }
                .s-modal-secondary { padding:10px 22px; border-radius:8px; background:rgba(255,255,255,.06); color:rgba(255,255,255,.5); border:1px solid rgba(255,255,255,.09); cursor:pointer; font-size:14px; font-family:inherit; }
            `}</style>

            <div className="s-root">

                {/* ── TOP BAR ── */}
                <div className="s-topbar">
                    <div className="s-topbar-left">
                        <div className="s-live-dot" />
                        <span className="s-topbar-title">Live Session</span>
                        <span className="s-topbar-sub">{booking.startTime} – {booking.endTime} · {booking.duration} min</span>
                    </div>

                    <div className="s-topbar-person">
                        {otherPerson?.avatar
                            ? <img src={otherPerson.avatar} alt="" className="s-avatar" />
                            : <div className="s-avatar-placeholder">{initials(otherPerson?.name)}</div>
                        }
                        <span className="s-topbar-person-name">{isExpert ? "Patient" : "Dr."} {otherPerson?.name}</span>
                    </div>

                    <button className="s-leave-btn" onClick={handleLeave}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>call_end</span>
                        Leave
                    </button>
                </div>

                {/* ── BODY ── */}
                <div className="s-body">

                    {/* Mobile overlay */}
                    <div className={`s-overlay ${showSidebar ? "s-open" : ""}`} onClick={() => setShowSidebar(false)} />

                    {/* MAIN */}
                    <div className="s-main">

                        {/* Tabs */}
                        <div className="s-tabs">
                            <div className="s-tabs-inner">
                                {[
                                    { key: "video", icon: "videocam", label: "Video" },
                                    { key: "chat", icon: "chat", label: "Chat" },
                                ].map(({ key, icon, label }) => (
                                    <button key={key} onClick={() => setPanel(key)}
                                        className={`s-tab ${panel === key ? "s-tab-active" : "s-tab-inactive"}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
                                        {label}
                                        {key === "chat" && !socketReady && (
                                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF9F27", flexShrink: 0 }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button className="s-info-toggle" onClick={() => setShowSidebar(true)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
                            </button>
                        </div>

                        {/* VIDEO PANEL */}
                        {panel === "video" && (
                            <div className="s-video-panel">
                                <div className="s-video-area">

                                    {remoteUsers.length > 0
                                        ? <div ref={remoteVideoRef} className="s-remote-video" />
                                        : (
                                            <div ref={remoteVideoRef} className="s-remote-placeholder">
                                                {agoraJoined ? (
                                                    <>
                                                        <span style={{ fontSize: 36 }}>👤</span>
                                                        <p style={{ fontSize: 13 }}>Waiting for {isExpert ? "patient" : "doctor"} to join…</p>
                                                    </>
                                                ) : agoraError ? (
                                                    <div style={{ textAlign: "center", color: "#fca5a5", padding: 20 }}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: 36, display: "block", marginBottom: 8 }}>videocam_off</span>
                                                        <p style={{ fontSize: 13, marginBottom: 12 }}>{agoraError}</p>
                                                        <button onClick={() => { setAgoraError(""); setAgoraJoined(false); }}
                                                            style={{ padding: "8px 16px", borderRadius: 8, background: "#1D9E75", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                                                            Retry
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ width: 26, height: 26, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin .8s linear infinite" }} />
                                                        <p style={{ fontSize: 13 }}>Connecting to video…</p>
                                                        <p style={{ fontSize: 11, opacity: .5 }}>Room: {bookingId?.slice(-8)}</p>
                                                    </>
                                                )}
                                            </div>
                                        )
                                    }

                                    {/* Local PIP */}
                                    {agoraJoined && (
                                        <div ref={localVideoRef} className="s-local-pip">
                                            {!camOn && (
                                                <div style={{ position: "absolute", inset: 0, background: "#1a1f2e", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: "rgba(255,255,255,.3)" }}>videocam_off</span>
                                                </div>
                                            )}
                                            <div style={{ position: "absolute", bottom: 4, left: 5, fontSize: 9, color: "rgba(255,255,255,.6)", background: "rgba(0,0,0,.5)", padding: "1px 4px", borderRadius: 3, zIndex: 3 }}>You</div>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                {agoraJoined && (
                                    <div className="s-controls">
                                        <button className="s-ctrl" onClick={toggleMic} title={micOn ? "Mute" : "Unmute"}
                                            style={{ background: micOn ? "rgba(255,255,255,.08)" : "#dc2626" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>{micOn ? "mic" : "mic_off"}</span>
                                        </button>
                                        <button className="s-ctrl" onClick={toggleCam} title={camOn ? "Camera off" : "Camera on"}
                                            style={{ background: camOn ? "rgba(255,255,255,.08)" : "#dc2626" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>{camOn ? "videocam" : "videocam_off"}</span>
                                        </button>
                                        <button className="s-ctrl" onClick={handleLeave} title="Leave"
                                            style={{ background: "#7f1d1d", border: "1px solid #991b1b" }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fca5a5" }}>call_end</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CHAT PANEL */}
                        {panel === "chat" && (
                            <div className="s-chat">
                                <div className="s-chat-msgs">
                                    {!socketReady && (
                                        <div style={{ textAlign: "center", padding: "10px 0", fontSize: 12, color: "rgba(255,255,255,.3)" }}>
                                            Connecting to chat…
                                        </div>
                                    )}
                                    {socketReady && messages.length === 0 && (
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.2)", paddingBottom: 40, gap: 8 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>chat_bubble_outline</span>
                                            <p style={{ fontSize: 13 }}>No messages yet</p>
                                        </div>
                                    )}
                                    {messages.map((msg, i) => {
                                        const isMe = msg.senderId?.toString() === user._id?.toString();
                                        return (
                                            <div key={i} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 7, alignItems: "flex-end" }}>
                                                {!isMe && (
                                                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                                                        {initials(msg.senderName)}
                                                    </div>
                                                )}
                                                <div className={isMe ? "s-bubble-me" : "s-bubble-other"}>
                                                    {!isMe && <p style={{ fontSize: 10, color: "rgba(255,255,255,.4)", marginBottom: 3 }}>{msg.senderName}</p>}
                                                    <p style={{ fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>{msg.text}</p>
                                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 3, textAlign: isMe ? "right" : "left" }}>
                                                        {msg.createdAt ? formatTime(msg.createdAt) : "just now"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {piiWarning && (
                                    <div className="s-pii" style={{
                                        background: piiBlocked ? "rgba(153,27,27,.9)" : "rgba(120,53,15,.9)",
                                        borderTop: `1px solid ${piiBlocked ? "#dc2626" : "#d97706"}`,
                                    }}>
                                        <span style={{ fontSize: 13, flexShrink: 0 }}>{piiBlocked ? "🚫" : "⚠️"}</span>
                                        <p style={{ fontSize: 11, color: piiBlocked ? "#fca5a5" : "#fde68a", lineHeight: 1.5 }}>{piiWarning}</p>
                                    </div>
                                )}

                                <div className="s-chat-input-row">
                                    <textarea
                                        value={msgInput}
                                        onChange={handleMsgChange}
                                        onKeyDown={handleKeyDown}
                                        placeholder={socketReady ? "Type a message… (Enter to send)" : "Connecting…"}
                                        disabled={!socketReady}
                                        rows={1}
                                        className="s-chat-ta"
                                        style={{
                                            background: piiBlocked ? "rgba(220,38,38,.1)" : "rgba(255,255,255,.05)",
                                            border: `1px solid ${piiBlocked ? "rgba(220,38,38,.6)" : "rgba(255,255,255,.07)"}`,
                                        }}
                                    />
                                    <button onClick={sendMessage}
                                        disabled={!socketReady || !msgInput.trim() || piiBlocked}
                                        className="s-send-btn"
                                        style={{
                                            background: (socketReady && msgInput.trim() && !piiBlocked) ? "#1D9E75" : "rgba(255,255,255,.06)",
                                            cursor: (socketReady && msgInput.trim() && !piiBlocked) ? "pointer" : "not-allowed",
                                        }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 17, color: "#fff" }}>send</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── SIDEBAR ── */}
                    <div className={`s-sidebar ${showSidebar ? "s-open" : ""}`}>

                        {/* Mobile close */}
                        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 12px 4px" }}>
                            <button onClick={() => setShowSidebar(false)}
                                style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", padding: 4, display: "flex" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
                            </button>
                        </div>

                        {/* Session info */}
                        <div className="s-section">
                            <p className="s-section-label">Session Info</p>
                            {[
                                ["Mode", booking.mode],
                                ["Duration", `${booking.duration} min`],
                                ["Date", new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })],
                                ["Time", `${booking.startTime} – ${booking.endTime}`],
                            ].map(([label, val]) => (
                                <div key={label} className="s-info-row">
                                    <span className="s-info-k">{label}</span>
                                    <span className="s-info-v">{val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Patient notes */}
                        {booking.notes?.studentNotes && (
                            <div className="s-section">
                                <p className="s-section-label">Patient Notes</p>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,.6)", lineHeight: 1.7, background: "rgba(255,255,255,.03)", padding: "9px 11px", borderRadius: 8 }}>
                                    {booking.notes.studentNotes}
                                </p>
                            </div>
                        )}

                        {/* Expert: prescription */}
                        {isExpert && (
                            <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                                <p className="s-section-label">Prescription</p>
                                <textarea
                                    value={prescription}
                                    onChange={(e) => setPrescription(e.target.value)}
                                    placeholder="Medicines, dosage, diet, lifestyle advice..."
                                    style={{
                                        flex: 1, minHeight: 160, padding: "10px 12px", borderRadius: 10,
                                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                                        color: "#fff", fontSize: 12, fontFamily: "inherit",
                                        outline: "none", resize: "none", lineHeight: 1.7,
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = "rgba(29,158,117,.4)"; }}
                                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,.07)"; }}
                                />
                                <button onClick={handleSavePrescription} disabled={savingRx || !prescription.trim()} style={{
                                    marginTop: 10, padding: "9px", borderRadius: 8,
                                    background: rxSaved ? "#1D9E75" : "rgba(255,255,255,.07)",
                                    color: rxSaved ? "#fff" : "rgba(255,255,255,.6)",
                                    border: rxSaved ? "none" : "1px solid rgba(255,255,255,.09)",
                                    fontSize: 13, fontFamily: "inherit",
                                    cursor: prescription.trim() && !savingRx ? "pointer" : "not-allowed",
                                    transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                                        {rxSaved ? "check_circle" : "save"}
                                    </span>
                                    {rxSaved ? "Saved!" : savingRx ? "Saving..." : "Save Prescription"}
                                </button>
                                {rxError && <p style={{ fontSize: 12, color: "#fca5a5", marginTop: 6 }}>{rxError}</p>}
                            </div>
                        )}

                        {/* Student: view prescription */}
                        {!isExpert && booking.notes?.prescription && (
                            <div className="s-section" style={{ borderBottom: "none" }}>
                                <p className="s-section-label">Prescription</p>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,.8)", lineHeight: 1.7, background: "rgba(29,158,117,.1)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(29,158,117,.2)" }}>
                                    {booking.notes.prescription}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── REVIEW PROMPT ── */}
                {showReviewPrompt && (
                    <div className="s-modal-bg">
                        <div className="s-modal">
                            <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#1D9E75", display: "block", marginBottom: 12 }}>rate_review</span>
                            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>How was your session?</h3>
                            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 13, lineHeight: 1.6 }}>
                                Your feedback helps other students find the right expert and helps Dr. {booking?.expert?.name} improve.
                            </p>
                            <div className="s-modal-actions">
                                <button className="s-modal-primary" onClick={() => router.push(`/consultations/${bookingId}/review`)}>
                                    Leave a Review
                                </button>
                                <button className="s-modal-secondary" onClick={() => router.push("/consultations/bookings")}>
                                    Skip
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}