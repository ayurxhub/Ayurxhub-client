"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function TestAttemptPage() {
    return <ProtectedRoute><TestAttempt /></ProtectedRoute>;
}

// ─── Watermark helpers ────────────────────────────────────────────────────────
const ZWC = ["\u200b", "\u200c", "\u200d", "\uFEFF"];
function encodeWatermark(str) {
    return str.split("").map((c, i) => ZWC[i % 4]).join("");
}
function watermarkText(text, userId) {
    if (!userId || !text) return text;
    const mark = encodeWatermark(userId.slice(0, 8));
    let result = "";
    let count = 0;
    for (const ch of text) {
        result += ch;
        count++;
        if (count % 10 === 0) result += mark[Math.floor(count / 10) % mark.length] || "";
    }
    return result;
}

// ─── Shuffle options per attempt ──────────────────────────────────────────────
function getOptionOrder(qId, attemptId) {
    const seed = (qId + attemptId).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const order = [0, 1, 2, 3];
    let s = seed;
    for (let i = 3; i > 0; i--) {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        const j = Math.abs(s) % (i + 1);
        [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
}

// ─── Main component ───────────────────────────────────────────────────────────
function TestAttempt() {
    const { authAxios, user } = useAuth();
    const { id } = useParams();
    const router = useRouter();

    const [phase, setPhase] = useState("loading");
    const [testMeta, setTestMeta] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [optOrders, setOptOrders] = useState({});
    const [currentQ, setCurrentQ] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [attemptId, setAttemptId] = useState(null);
    const [result, setResult] = useState(null);
    const [review, setReview] = useState([]);
    const [reviewMode, setReviewMode] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [testError, setTestError] = useState(null);
    const [showPalette, setShowPalette] = useState(false); // mobile palette toggle

    // Anti-cheat state
    const [tabViolations, setTabViolations] = useState(0);
    const [showViolationBanner, setShowViolationBanner] = useState(false);
    const [violationMsg, setViolationMsg] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenWarning, setFullscreenWarning] = useState(false);
    const [webcamActive, setWebcamActive] = useState(false);
    const [webcamFlags, setWebcamFlags] = useState([]);
    const webcamRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(null);
    const faceTimerRef = useRef(null);
    const timerRef = useRef(null);
    const submitRef = useRef(null); // stable ref for submit in timer

    const MAX_VIOLATIONS = 3;
    const isPaid = testMeta?.type === "paid";

    // ── Load test metadata ───────────────────────────────────────────────────
    useEffect(() => {
        const loadMeta = async () => {
            try {
                const res = await authAxios.get("/tests");
                const all = res.data.tests || [];
                const test = all.find(t => t._id === id);
                if (test) { setTestMeta(test); setPhase("intro"); }
                else setPhase("error");
            } catch { setPhase("error"); }
        };
        loadMeta();
    }, [id]); // eslint-disable-line

    // ── Timer — uses ref to avoid stale closure ──────────────────────────────
    useEffect(() => {
        if (phase !== "taking") return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    // Use ref so we always call the latest submit
                    if (submitRef.current) submitRef.current(true, "time_up");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // ── Tab / visibility detection ───────────────────────────────────────────
    useEffect(() => {
        if (phase !== "taking") return;
        const handleVisibility = () => {
            if (document.hidden) {
                setTabViolations(prev => {
                    const next = prev + 1;
                    if (next >= MAX_VIOLATIONS) {
                        triggerViolation(`Auto-submitting: tab switched ${MAX_VIOLATIONS} times.`, true);
                    } else {
                        triggerViolation(`⚠️ Tab switch! Warning ${next}/${MAX_VIOLATIONS}.`, false);
                    }
                    return next;
                });
            }
        };
        const handleBlur = () => {
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile) return; // exit before setState entirely — cleanest approach

            setTabViolations(prev => {
                const next = prev + 1;
                if (next >= MAX_VIOLATIONS) {
                    triggerViolation(`Auto-submitting: window focus lost ${MAX_VIOLATIONS} times.`, true);
                } else {
                    triggerViolation(`⚠️ Window focus lost! Warning ${next}/${MAX_VIOLATIONS}.`, false);
                }
                return next;
            });
        };
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
        };
    }, [phase]);

    const triggerViolation = (msg, autoSubmit) => {
        setViolationMsg(msg);
        setShowViolationBanner(true);
        setTimeout(() => setShowViolationBanner(false), 5000);
        if (autoSubmit && submitRef.current) {
            setTimeout(() => submitRef.current(true, "tab_violation"), 1500);
        }
    };

    // ── Fullscreen ───────────────────────────────────────────────────────────
    const enterFullscreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
            setFullscreenWarning(false);
        } catch (e) {
            console.warn("Fullscreen not available:", e);
        }
    };

    const exitFullscreenHandler = useCallback(() => {
        const inFS = !!document.fullscreenElement;
        setIsFullscreen(inFS);
        if (!inFS && phase === "taking") {
            setFullscreenWarning(true);
            setTabViolations(prev => {
                const next = prev + 1;
                if (next >= MAX_VIOLATIONS) {
                    triggerViolation("Auto-submitting: exited fullscreen too many times.", true);
                }
                return next;
            });
        }
    }, [phase]);

    useEffect(() => {
        document.addEventListener("fullscreenchange", exitFullscreenHandler);
        return () => document.removeEventListener("fullscreenchange", exitFullscreenHandler);
    }, [exitFullscreenHandler]);

    // ── Disable right-click + DevTools shortcuts ─────────────────────────────
    useEffect(() => {
        if (phase !== "taking") return;
        const blockContext = (e) => e.preventDefault();
        const blockKeys = (e) => {
            const blocked = [
                e.key === "F12",
                e.ctrlKey && e.shiftKey && ["I", "J", "C", "K"].includes(e.key),
                e.ctrlKey && e.key === "U",
                e.ctrlKey && e.key === "S",
                e.ctrlKey && e.key === "P",
                e.ctrlKey && e.key === "c" && phase === "taking",
            ];
            if (blocked.some(Boolean)) {
                e.preventDefault();
                e.stopPropagation();
                triggerViolation("⚠️ Developer tools are not allowed during the test.", false);
                return false;
            }
        };

        // FIX: Only run DevTools detection on desktop (avoid false positives on mobile)
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        let devToolsDetect = null;
        if (!isMobile) {
            devToolsDetect = setInterval(() => {
                const threshold = 160;
                if (window.outerWidth - window.innerWidth > threshold ||
                    window.outerHeight - window.innerHeight > threshold) {
                    triggerViolation("⚠️ Please close Developer Tools during the test.", false);
                }
            }, 2000);
        }

        document.addEventListener("contextmenu", blockContext);
        document.addEventListener("keydown", blockKeys);
        return () => {
            document.removeEventListener("contextmenu", blockContext);
            document.removeEventListener("keydown", blockKeys);
            if (devToolsDetect) clearInterval(devToolsDetect);
        };
    }, [phase]);

    // ── Webcam ───────────────────────────────────────────────────────────────
    const startWebcam = async () => {
        if (!isPaid) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (webcamRef.current) webcamRef.current.srcObject = stream;
            setWebcamActive(true);
            faceTimerRef.current = setInterval(checkFacePresence, 20000);
        } catch (e) {
            console.warn("Webcam not available:", e);
            setWebcamFlags(prev => [...prev, { type: "webcam_denied", time: new Date().toISOString() }]);
        }
    };

    const checkFacePresence = () => {
        if (!webcamRef.current || !canvasRef.current) return;
        const video = webcamRef.current;
        const canvas = canvasRef.current;
        if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return;

        const ctx = canvas.getContext("2d");
        canvas.width = webcamRef.current.videoWidth;
        canvas.height = webcamRef.current.videoHeight;
        ctx.drawImage(webcamRef.current, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let totalBrightness = 0;
        const sampleStep = 40;
        let samples = 0;
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
            samples++;
        }
        const avgBrightness = totalBrightness / samples;
        let variance = 0;
        for (let i = 0; i < data.length; i += 4 * sampleStep) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            variance += Math.pow(brightness - avgBrightness, 2);
        }
        variance /= samples;
        const suspicious = avgBrightness < 8 && variance < 10;
        if (suspicious) {
            setWebcamFlags(prev => [...prev, { type: "face_absent", time: new Date().toISOString(), brightness: Math.round(avgBrightness) }]);
            setViolationMsg("📷 Face not detected — please stay in front of the camera.");
            setShowViolationBanner(true);
            setTimeout(() => setShowViolationBanner(false), 4000);
        }
    };

    const stopWebcam = () => {
        clearInterval(faceTimerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setWebcamActive(false);
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = useCallback(async (autoSubmit = false, reason = "") => {
        if (submitting || !attemptId) return;
        if (!autoSubmit) {
            const unanswered = questions.length - Object.keys(answers).length;
            if (unanswered > 0) {
                const ok = window.confirm(`You have ${unanswered} unanswered question${unanswered > 1 ? "s" : ""}. Submit anyway?`);
                if (!ok) return;
            }
        }
        clearInterval(timerRef.current);
        stopWebcam();
        if (document.fullscreenElement) {
            try { await document.exitFullscreen(); } catch (_) { }
        }
        setSubmitting(true);
        try {
            const answersArr = questions.map(q => ({
                questionId: q._id,
                selectedIndex: answers[q._id] ?? -1,
            }));
            const res = await authAxios.post(`/tests/${id}/submit`, {
                attemptId,
                answers: answersArr,
                proctoring: {
                    tabViolations,
                    webcamFlags,
                    autoSubmitReason: reason || null,
                    fullscreenExits: tabViolations,
                },
            });
            setResult(res.data.result);
            setReview(res.data.review);
            setPhase("result");
        } catch (e) {
            setTestError(e.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    }, [submitting, attemptId, questions, answers, id, authAxios, tabViolations, webcamFlags]);

    // Keep submitRef in sync so timer can always call latest version
    useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

    // ── Stop camera stream on unmount (user navigates away mid-test) ─────────
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, []);

    // ── Start test — FIX: fullscreen in separate try-catch ───────────────────
    const handleStart = async () => {
        setPhase("loading");
        try {
            const res = await authAxios.post(`/tests/${id}/start`);
            const { attempt, questions: qs, timeRemaining } = res.data;

            const orders = {};
            qs.forEach(q => { orders[q._id] = getOptionOrder(q._id, attempt._id); });
            setOptOrders(orders);
            setQuestions(qs);
            setAttemptId(attempt._id);
            setTimeLeft(timeRemaining); // FIX: use timeRemaining from API (handles resume)
            setAnswers({});
            setCurrentQ(0);
            setTabViolations(0);

            // FIX: Set phase BEFORE fullscreen so test starts even if fullscreen fails
            setPhase("taking");

            // FIX: Fullscreen in its own try-catch — failure won't block test
            try { await enterFullscreen(); } catch (e) { console.warn("Fullscreen failed:", e); }

            // FIX: Webcam in its own try-catch
            if (isPaid || testMeta?.type === "paid") {
                try { await startWebcam(); } catch (e) { console.warn("Webcam failed:", e); }
            }

        } catch (e) {
            const data = e.response?.data;
            if (data?.requiresEnrollment && data?.batchSlug) {
                // Redirect to the batch/course page so they can enroll
                router.push(`/courses/${data.batchSlug}`);
                return;
            }
            if (data?.requiresPro) {
                // Redirect to tests page which has the Upgrade to Pro button
                router.push("/tests");
                return;
            }
            alert(data?.message || "Failed to start test");
            setPhase("intro");
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    const timerColor = timeLeft < 60 ? "#dc2626" : timeLeft < 300 ? "#d97706" : "#166534";
    const timerBg = timeLeft < 60 ? "#fee2e2" : timeLeft < 300 ? "#fef3c7" : "#dcfce7";
    const answered = Object.keys(answers).length;

    // ════════════════════════════════════════════════════════════════════════
    // RENDERS
    // ════════════════════════════════════════════════════════════════════════

    if (phase === "loading") return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f9fc" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (phase === "error") return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 20 }}>
            <p style={{ fontSize: 16, color: "#dc2626" }}>Test not found</p>
            <button onClick={() => router.push("/tests")} style={{ padding: "8px 20px", borderRadius: 8, background: "#00256e", color: "#fff", border: "none", cursor: "pointer" }}>← Back to Tests</button>
        </div>
    );

    // ── INTRO ─────────────────────────────────────────────────────────────────
    if (phase === "intro") return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "32px 24px", maxWidth: 520, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <p style={{ fontSize: 40, margin: "0 0 12px" }}>{testMeta?.type === "free" ? "🆓" : "⭐"}</p>
                    <h1 style={{ fontSize: "clamp(16px, 4vw, 20px)", fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>{testMeta?.title}</h1>
                    <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>{testMeta?.subject}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                    {[
                        { icon: "📝", label: "Questions", value: testMeta?.totalQuestions },
                        { icon: "⏱", label: "Duration", value: `${testMeta?.duration} min` },
                        { icon: "🎯", label: "Passing Score", value: `${testMeta?.passingScore}%` },
                        { icon: testMeta?.type === "free" ? "🆓" : "⭐", label: "Type", value: testMeta?.type === "free" ? "Free" : "Premium" },
                    ].map(({ icon, label, value }) => (
                        <div key={label} style={{ padding: "10px 14px", borderRadius: 10, background: "#f9fafb", border: "0.5px solid #f3f4f6" }}>
                            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 3px" }}>{icon} {label}</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{value}</p>
                        </div>
                    ))}
                </div>

                <div style={{ padding: "12px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#dc2626", margin: "0 0 6px" }}>🛡️ Proctored Test</p>
                    <ul style={{ fontSize: 12, color: "#7f1d1d", margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                        <li>Test runs in <strong>fullscreen mode</strong> — exiting will be flagged</li>
                        <li>Tab switching is detected — <strong>3 violations = auto-submit</strong></li>
                        <li>Right-click and DevTools are disabled</li>
                        {testMeta?.type === "paid" && <li>📷 Webcam monitoring is active for this premium test</li>}
                        <li>Questions are uniquely watermarked to your account</li>
                    </ul>
                </div>

                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                        ⚠️ Once you start, the timer begins and proctoring activates. The test auto-submits when time runs out.
                    </p>
                </div>

                {testError && (
                    <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", fontSize: 13, marginBottom: 12 }}>
                        {testError}
                    </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => router.push("/tests")} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "transparent", color: "#374151", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
                        ← Back
                    </button>
                    <button onClick={handleStart} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        I Agree — Start Test →
                    </button>
                </div>
            </div>
        </div>
    );

    // ── TAKING ────────────────────────────────────────────────────────────────
    if (phase === "taking") {
        const q = questions[currentQ];
        if (!q) return null;
        const order = optOrders[q._id] || [0, 1, 2, 3];
        const displayText = watermarkText(q.text, user?._id);

        return (
            <div style={{ minHeight: "100vh", background: "#f7f9fc", display: "flex", flexDirection: "column", userSelect: "none" }}>

                {/* Violation banner */}
                {showViolationBanner && (
                    <div style={{
                        position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
                        background: tabViolations >= MAX_VIOLATIONS ? "#dc2626" : "#d97706",
                        color: "#fff", padding: "12px 20px", textAlign: "center",
                        fontSize: 13, fontWeight: 600, animation: "slideDown 0.3s ease",
                    }}>
                        {violationMsg}
                    </div>
                )}

                {/* Fullscreen warning overlay */}
                {fullscreenWarning && (
                    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
                        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", maxWidth: 420, width: "100%", textAlign: "center" }}>
                            <p style={{ fontSize: 40, margin: "0 0 12px" }}>⛔</p>
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", margin: "0 0 8px" }}>Fullscreen Exited</h2>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.6 }}>
                                You must stay in fullscreen mode during the test.<br />
                                This exit has been flagged ({tabViolations}/{MAX_VIOLATIONS} violations).
                            </p>
                            <button onClick={() => { enterFullscreen(); setFullscreenWarning(false); }}
                                style={{ padding: "11px 28px", borderRadius: 10, border: "none", background: "#00256e", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%" }}>
                                Re-enter Fullscreen
                            </button>
                        </div>
                    </div>
                )}

                {/* Top bar */}
                <div style={{
                    background: "#fff", borderBottom: "1px solid #f3f4f6",
                    padding: "10px 16px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", position: "sticky", top: 0, zIndex: 40,
                    gap: 8, flexWrap: "wrap",
                }}>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "clamp(11px, 3vw, 13px)", fontWeight: 600, color: "#111827", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "30vw" }}>{testMeta?.title}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>Q {currentQ + 1}/{questions.length} · {answered} answered</p>
                    </div>

                    {/* Violations */}
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {[...Array(MAX_VIOLATIONS)].map((_, i) => (
                            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < tabViolations ? "#dc2626" : "#e5e7eb", transition: "background 0.3s" }} />
                        ))}
                    </div>

                    {/* Timer */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: timerBg, border: `1px solid ${timerColor}30`, flexShrink: 0 }}>
                        <span style={{ fontSize: 12 }}>⏱</span>
                        <span style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 800, color: timerColor, fontVariantNumeric: "tabular-nums" }}>{formatTime(timeLeft)}</span>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Mobile palette toggle */}
                        <button
                            onClick={() => setShowPalette(p => !p)}
                            style={{ display: "none", padding: "7px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                            className="mobile-palette-btn"
                        >
                            📋 {answered}/{questions.length}
                        </button>
                        <button onClick={() => handleSubmit(false)} disabled={submitting}
                            style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#00256e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                            {submitting ? "…" : "Submit"}
                        </button>
                    </div>
                </div>

                <div style={{ display: "flex", flex: 1, position: "relative" }}>
                    {/* Question panel */}
                    <div style={{ flex: 1, padding: "20px clamp(16px, 4vw, 40px)", maxWidth: 720, width: "100%" }}>

                        {/* Progress bar */}
                        <div style={{ height: 4, borderRadius: 2, background: "#f3f4f6", marginBottom: 20, overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "linear-gradient(90deg, #00256e, #1D9E75)", width: `${((currentQ + 1) / questions.length) * 100}%`, transition: "width 0.3s", borderRadius: 2 }} />
                        </div>

                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, marginBottom: 12, display: "inline-block", background: q.difficulty === "easy" ? "#dcfce7" : q.difficulty === "hard" ? "#fee2e2" : "#fef9c3", color: q.difficulty === "easy" ? "#166534" : q.difficulty === "hard" ? "#dc2626" : "#854d0e" }}>
                            {q.difficulty}
                        </span>

                        <p style={{ fontSize: "clamp(14px, 3.5vw, 17px)", fontWeight: 600, color: "#111827", lineHeight: 1.65, marginBottom: 20, marginTop: 8 }}>
                            {currentQ + 1}. {displayText}
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {order.map((realIdx, displayPos) => {
                                const optText = q.options[realIdx];
                                const isSelected = answers[q._id] === realIdx;
                                const displayLabel = ["A", "B", "C", "D"][displayPos];
                                return (
                                    <button key={displayPos}
                                        onClick={() => setAnswers(prev => ({ ...prev, [q._id]: realIdx }))}
                                        style={{
                                            padding: "13px 16px", borderRadius: 12,
                                            border: `2px solid ${isSelected ? "#00256e" : "#e5e7eb"}`,
                                            background: isSelected ? "#dbe1ff" : "#fff",
                                            color: isSelected ? "#00256e" : "#374151",
                                            fontSize: "clamp(13px, 3vw, 14px)", cursor: "pointer", textAlign: "left",
                                            fontFamily: "inherit", transition: "all 0.15s",
                                            display: "flex", alignItems: "center", gap: 10,
                                            userSelect: "none", width: "100%",
                                        }}>
                                        <span style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: isSelected ? "#00256e" : "#f3f4f6", color: isSelected ? "#fff" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                                            {displayLabel}
                                        </span>
                                        {optText}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Navigation */}
                        {/* Navigation */}
                        {(() => {
                            const isLast = currentQ === questions.length - 1;
                            return (
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 10, flexWrap: "wrap" }}>
                                    <button onClick={() => setCurrentQ(p => Math.max(0, p - 1))} disabled={currentQ === 0}
                                        style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, cursor: currentQ === 0 ? "not-allowed" : "pointer", opacity: currentQ === 0 ? 0.4 : 1, fontFamily: "inherit" }}>
                                        ← Prev
                                    </button>

                                    <div style={{ display: "flex", gap: 10 }}>
                                        {/* Always available, regardless of which question you're on */}
                                        <button onClick={() => handleSubmit(false)} disabled={submitting}
                                            style={{
                                                padding: "10px 18px", borderRadius: 10,
                                                border: isLast ? "none" : "1.5px solid #1D9E75",
                                                background: isLast ? "#1D9E75" : "#fff",
                                                color: isLast ? "#fff" : "#1D9E75",
                                                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                            }}>
                                            {submitting ? "Submitting…" : isLast ? "Submit Test ✓" : "Submit Test"}
                                        </button>

                                        {!isLast && (
                                            <button onClick={() => setCurrentQ(p => p + 1)}
                                                style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "#00256e", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                                Next →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                        {testError && (
                            <p style={{ fontSize: 12, color: "#dc2626", marginTop: 8, textAlign: "center" }}>{testError}</p>
                        )}
                    </div>

                    {/* Sidebar — hidden on mobile, shown via overlay */}
                    <div style={{
                        width: 200, padding: "16px 12px", background: "#fff", borderLeft: "1px solid #f3f4f6",
                        flexShrink: 0, display: "flex", flexDirection: "column", gap: 14,
                        // Mobile: fixed overlay when palette toggled
                    }} className="test-sidebar">

                        {isPaid && (
                            <div>
                                <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Webcam</p>
                                <div style={{ borderRadius: 10, overflow: "hidden", background: "#111", position: "relative", aspectRatio: "4/3" }}>
                                    <video ref={webcamRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
                                    <canvas ref={canvasRef} style={{ display: "none" }} />
                                    {!webcamActive && (
                                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#fff", fontSize: 11 }}>
                                            <span style={{ fontSize: 20 }}>📷</span><span>Camera off</span>
                                        </div>
                                    )}
                                </div>
                                {webcamFlags.length > 0 && <p style={{ fontSize: 10, color: "#dc2626", marginTop: 4 }}>⚠ {webcamFlags.length} flag{webcamFlags.length > 1 ? "s" : ""}</p>}
                            </div>
                        )}

                        {/* Question palette */}
                        <div>
                            <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Questions</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
                                {questions.map((q, i) => {
                                    const isAnswered = answers[q._id] !== undefined;
                                    const isCurrent = i === currentQ;
                                    return (
                                        <button key={i} onClick={() => { setCurrentQ(i); setShowPalette(false); }}
                                            style={{ width: 32, height: 32, borderRadius: 7, border: isCurrent ? "2px solid #00256e" : "1px solid #e5e7eb", background: isCurrent ? "#00256e" : isAnswered ? "#dcfce7" : "#fff", color: isCurrent ? "#fff" : isAnswered ? "#166534" : "#6b7280", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                            {i + 1}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                                {[
                                    { color: "#dcfce7", label: `Answered (${answered})` },
                                    { color: "#fff", label: `Skipped (${questions.length - answered})`, border: "1px solid #e5e7eb" },
                                ].map(({ color, label, border }) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: color, border: border || "none", flexShrink: 0 }} />
                                        <span style={{ fontSize: 10, color: "#6b7280" }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security status */}
                        <div style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>🛡️ Security</p>
                            {[
                                { label: "Fullscreen", active: isFullscreen },
                                { label: "Proctoring", active: !isPaid || webcamActive },
                                { label: "No violations", active: tabViolations === 0 },
                            ].map(({ label, active }) => (
                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                    <span style={{ fontSize: 10 }}>{active ? "✅" : "⚠️"}</span>
                                    <span style={{ fontSize: 10, color: active ? "#166534" : "#dc2626" }}>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mobile palette overlay */}
                    {showPalette && (
                        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }} onClick={() => setShowPalette(false)}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "60vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                                <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>Question Palette</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                                    {questions.map((q, i) => {
                                        const isAnswered = answers[q._id] !== undefined;
                                        const isCurrent = i === currentQ;
                                        return (
                                            <button key={i} onClick={() => { setCurrentQ(i); setShowPalette(false); }}
                                                style={{ aspectRatio: "1", borderRadius: 8, border: isCurrent ? "2px solid #00256e" : "1px solid #e5e7eb", background: isCurrent ? "#00256e" : isAnswered ? "#dcfce7" : "#fff", color: isCurrent ? "#fff" : isAnswered ? "#166534" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                                                {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
                    @keyframes slideDown { from { transform:translateY(-100%); } to { transform:translateY(0); } }
                    @media (max-width: 640px) {
                        .test-sidebar { display: none !important; }
                        .mobile-palette-btn { display: flex !important; }
                    }
                `}</style>
            </div>
        );
    }

    // ── RESULT ────────────────────────────────────────────────────────────────
    if (phase === "result") return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px" }}>

                {(tabViolations > 0 || webcamFlags.length > 0) && (
                    <div style={{ padding: "12px 16px", borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", marginBottom: 16 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: "0 0 6px" }}>⚠️ Proctoring Report</p>
                        <p style={{ fontSize: 12, color: "#7f1d1d", margin: 0, lineHeight: 1.8, whiteSpace: "pre-line" }}>
                            {tabViolations > 0 && `• Tab / window switches: ${tabViolations}\n`}
                            {webcamFlags.length > 0 && `• Face absent events: ${webcamFlags.length}`}
                        </p>
                        <p style={{ fontSize: 11, color: "#991b1b", margin: "6px 0 0" }}>This report has been logged.</p>
                    </div>
                )}

                <div style={{ background: "#fff", borderRadius: 20, padding: "28px 20px", marginBottom: 20, border: `2px solid ${result.passed ? "#86efac" : "#fca5a5"}`, boxShadow: `0 4px 24px ${result.passed ? "rgba(134,239,172,0.2)" : "rgba(252,165,165,0.2)"}`, textAlign: "center" }}>
                    <p style={{ fontSize: "clamp(40px, 10vw, 56px)", margin: "0 0 12px" }}>{result.passed ? "🏆" : "📖"}</p>
                    <h2 style={{ fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, color: result.passed ? "#166534" : "#dc2626", margin: "0 0 6px" }}>
                        {result.passed ? "Congratulations! You Passed" : "Keep Practising"}
                    </h2>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
                        {result.timedOut ? "⏰ Auto-submitted — time ran out" : "Test submitted successfully"}
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexDirection: "column", width: 110, height: 110, borderRadius: "50%", background: result.passed ? "#dcfce7" : "#fee2e2", border: `4px solid ${result.passed ? "#86efac" : "#fca5a5"}`, margin: "0 0 20px" }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: result.passed ? "#166534" : "#dc2626" }}>{result.percentage}%</span>
                        <span style={{ fontSize: 11, color: result.passed ? "#166534" : "#dc2626" }}>score</span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                        {[
                            { label: "Correct", value: result.score, color: "#166534", bg: "#dcfce7" },
                            { label: "Wrong", value: result.totalQuestions - result.score, color: "#dc2626", bg: "#fee2e2" },
                            { label: "Total", value: result.totalQuestions, color: "#1e40af", bg: "#dbeafe" },
                            { label: "Time Taken", value: `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s`, color: "#854d0e", bg: "#fef9c3" },
                        ].map(({ label, value, color, bg }) => (
                            <div key={label} style={{ padding: 12, borderRadius: 10, background: bg }}>
                                <p style={{ fontSize: 11, color, opacity: 0.7, margin: "0 0 3px", fontWeight: 600 }}>{label}</p>
                                <p style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 700, color, margin: 0 }}>{value}</p>
                            </div>
                        ))}
                    </div>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10 }}>Passing score: {result.passingScore}%</p>
                </div>

                <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
                    <button onClick={() => setReviewMode(r => !r)}
                        style={{ flex: 1, minWidth: 140, padding: "12px", borderRadius: 12, border: "1px solid #e5e7eb", background: reviewMode ? "#00256e" : "#fff", color: reviewMode ? "#fff" : "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {reviewMode ? "Hide Review" : "📋 Review Answers"}
                    </button>
                    <button onClick={() => router.push("/tests")}
                        style={{ flex: 1, minWidth: 140, padding: "12px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #00256e, #1f3c88)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        ← Back to Tests
                    </button>
                </div>

                {reviewMode && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {review.map((item, i) => {
                            if (!item.question) return null;
                            const { question: q, selectedIndex, isCorrect } = item;
                            return (
                                <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 16px", border: `1.5px solid ${isCorrect ? "#86efac" : selectedIndex === -1 ? "#e5e7eb" : "#fca5a5"}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                                        <p style={{ fontSize: "clamp(13px, 3vw, 14px)", fontWeight: 600, color: "#111827", flex: 1, lineHeight: 1.6, margin: 0 }}>Q{i + 1}. {q.text}</p>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, background: isCorrect ? "#dcfce7" : selectedIndex === -1 ? "#f3f4f6" : "#fee2e2", color: isCorrect ? "#166534" : selectedIndex === -1 ? "#6b7280" : "#dc2626" }}>
                                            {isCorrect ? "✓ Correct" : selectedIndex === -1 ? "— Skipped" : "✗ Wrong"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                                        {q.options.map((opt, idx) => {
                                            const isCorrectOpt = idx === q.correctIndex;
                                            const isSelectedOpt = idx === selectedIndex;
                                            let bg = "#f9fafb", border = "#f3f4f6", color = "#374151";
                                            if (isCorrectOpt) { bg = "#dcfce7"; border = "#86efac"; color = "#166534"; }
                                            else if (isSelectedOpt && !isCorrect) { bg = "#fee2e2"; border = "#fca5a5"; color = "#dc2626"; }
                                            return (
                                                <div key={idx} style={{ padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${border}`, background: bg, display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: isCorrectOpt ? "#166534" : isSelectedOpt ? "#dc2626" : "#e5e7eb", color: (isCorrectOpt || isSelectedOpt) ? "#fff" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                                        {["A", "B", "C", "D"][idx]}
                                                    </span>
                                                    <span style={{ fontSize: 13, color, flex: 1 }}>{opt}</span>
                                                    {isCorrectOpt && <span style={{ fontSize: 11, color: "#166534", flexShrink: 0 }}>✓</span>}
                                                    {isSelectedOpt && !isCorrect && <span style={{ fontSize: 11, color: "#dc2626", flexShrink: 0 }}>✗</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {q.explanation && (
                                        <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a" }}>
                                            <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", margin: "0 0 3px" }}>💡 Explanation</p>
                                            <p style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
                @keyframes slideDown { from { transform:translateY(-100%); } to { transform:translateY(0); } }
            `}</style>
        </div>
    );
}