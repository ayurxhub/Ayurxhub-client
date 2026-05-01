"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ChapterwisePage() {
    return <ProtectedRoute><ChapterwiseTests /></ProtectedRoute>;
}

const TERM1_CHAPTERS = [
    { no: 1, name: "Swastha and Swasthya", icon: "🏛️", color: "#0E6655" },
    { no: 2, name: "Healthy Life Style - Dinacharya", icon: "🌅", color: "#1A5276" },
    { no: 3, name: "Ratricharya", icon: "🌙", color: "#512E5F" },
    { no: 4, name: "Ritucharya", icon: "🍃", color: "#145A32" },
    { no: 5, name: "Roganutpadaniya", icon: "🛡️", color: "#784212" },
    { no: 6, name: "Sadvritta", icon: "🧘", color: "#1B4F72" },
    { no: 7, name: "Ahara", icon: "🌾", color: "#7D6608" },
    { no: 8, name: "Rasayana for Swastha", icon: "✨", color: "#4A235A" },
];

const TERM2_CHAPTERS = [
    { no: 11, name: "Janapadodhwamsa / Maraka Vyadhi", icon: "🦠", color: "#7B241C" },
    { no: 12, name: "Environmental Health", icon: "🌍", color: "#1A5276" },
    { no: 13, name: "Disaster Management", icon: "🚨", color: "#6E2F1A" },
    { no: 14, name: "Occupational Health", icon: "🏭", color: "#1B4332" },
    { no: 15, name: "School Health Services", icon: "🏫", color: "#154360" },
    { no: 16, name: "Disinfection", icon: "🧪", color: "#4A235A" },
    { no: 17, name: "Primary Health Care", icon: "🏥", color: "#0E6655" },
    { no: 18, name: "Mother and Child Health Care", icon: "🌸", color: "#7D3C98" },
    { no: 19, name: "Family Welfare Programme", icon: "👨‍👩‍👧", color: "#145A32" },
    { no: 20, name: "Preventive Geriatrics", icon: "🧓", color: "#784212" },
    { no: 21, name: "WHO and International Health Agencies", icon: "🌐", color: "#1A5276" },
    { no: 22, name: "Vital Statistics", icon: "📊", color: "#7B241C" },
    { no: 23, name: "Health Administration", icon: "🏛", color: "#1B2631" },
    { no: 24, name: "National Health Programmes", icon: "💉", color: "#0B5345" },
    { no: 25, name: "National Health Policy", icon: "📜", color: "#4D2600" },
];

const TERMS = [
    { id: "term1", label: "Term 1", subtitle: "Chapters 1–10", chapters: TERM1_CHAPTERS },
    { id: "term2", label: "Term 2", subtitle: "Chapters 11–25", chapters: TERM2_CHAPTERS },
];

function ChapterwiseTests() {
    const { authAxios } = useAuth();
    const router = useRouter();
    const [activeTerm, setActiveTerm] = useState("term1");
    const [testsByChapter, setTestsByChapter] = useState({});
    const [attempts, setAttempts] = useState({});
    const [loading, setLoading] = useState(true);
    const [expandedChapter, setExpandedChapter] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [testsRes, attemptsRes] = await Promise.all([
                    authAxios.get("/tests"),
                    authAxios.get("/tests/my-attempts"),
                ]);

                const allTests = [
                    ...(testsRes.data.bySubject?.["Swasthavritta evam Yoga"]?.free || []),
                    ...(testsRes.data.bySubject?.["Swasthavritta evam Yoga"]?.paid || []),
                ];

                const grouped = {};
                allTests.forEach(t => {
                    const key = t.chapter || "Uncategorized";
                    if (!grouped[key]) grouped[key] = { free: [], paid: [] };
                    grouped[key][t.type === "free" ? "free" : "paid"].push(t);
                });
                setTestsByChapter(grouped);

                const attMap = {};
                (attemptsRes.data.attempts || []).forEach(a => {
                    const tid = a.test?._id;
                    if (!tid) return;
                    if (!attMap[tid] || a.percentage > attMap[tid].percentage) attMap[tid] = a;
                });
                setAttempts(attMap);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeTerm_data = TERMS.find(t => t.id === activeTerm);
    const allAttempts = Object.values(attempts);
    const passed = allAttempts.filter(a => a.passed).length;
    const avgScore = allAttempts.length
        ? Math.round(allAttempts.reduce((s, a) => s + a.percentage, 0) / allAttempts.length)
        : 0;

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc", fontFamily: "'Segoe UI', sans-serif" }}>

            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 60%, #0e4f3b 100%)", padding: "32px 32px 0", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                <div style={{ position: "absolute", bottom: -20, left: 120, width: 120, height: 120, borderRadius: "50%", background: "rgba(29,158,117,0.15)" }} />

                <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <button onClick={() => router.push("/tests")} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#93c5fd", fontSize: 12, padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit" }}>← Tests</button>
                        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>/</span>
                        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Swasthavritta evam Yoga</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <span style={{ fontSize: 28 }}>🌿</span>
                                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>Swasthavritta evam Yoga</h1>
                            </div>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>Chapter-wise MCQ tests · Term 1 & Term 2</p>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            {[
                                { label: "Attempted", value: allAttempts.length, icon: "📝" },
                                { label: "Passed", value: passed, icon: "✅" },
                                { label: "Avg Score", value: allAttempts.length ? `${avgScore}%` : "—", icon: "📊" },
                            ].map(({ label, value, icon }) => (
                                <div key={label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 16px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", minWidth: 70 }}>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>{value}</p>
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0 }}>{icon} {label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Term tabs */}
                    <div style={{ display: "flex", gap: 2 }}>
                        {TERMS.map(t => (
                            <button key={t.id} onClick={() => { setActiveTerm(t.id); setExpandedChapter(null); }}
                                style={{ padding: "10px 24px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, borderRadius: "10px 10px 0 0", background: activeTerm === t.id ? "#f7f9fc" : "rgba(255,255,255,0.08)", color: activeTerm === t.id ? "#00256e" : "rgba(255,255,255,0.6)", transition: "all 0.2s" }}>
                                {t.label}
                                <span style={{ display: "block", fontSize: 10, fontWeight: 400, color: activeTerm === t.id ? "#6b7280" : "rgba(255,255,255,0.4)" }}>{t.subtitle}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 32px" }}>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #00256e", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {activeTerm_data.chapters.map((ch, idx) => {
                            const chapterKey = Object.keys(testsByChapter).find(k => k.includes(`Chapter ${ch.no} -`) || k.includes(`Chapter ${ch.no}-`));
                            const chData = chapterKey ? testsByChapter[chapterKey] : { free: [], paid: [] };
                            const freeTest = chData.free[0] || null;
                            const paidTest = chData.paid[0] || null;
                            const freeAtt = freeTest ? attempts[freeTest._id] : null;
                            const paidAtt = paidTest ? attempts[paidTest._id] : null;
                            const isExpanded = expandedChapter === ch.no;
                            const hasTests = freeTest || paidTest;

                            return (
                                <div key={ch.no} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0f0f0", overflow: "hidden", boxShadow: isExpanded ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 4px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s", animation: `fadeUp 0.3s ease both`, animationDelay: `${idx * 0.04}s` }}>

                                    <button onClick={() => setExpandedChapter(isExpanded ? null : ch.no)}
                                        style={{ width: "100%", padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>

                                        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${ch.color}15`, border: `1.5px solid ${ch.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <span style={{ fontSize: 18, lineHeight: 1 }}>{ch.icon}</span>
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: ch.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ch {ch.no}</span>
                                                {(freeAtt || paidAtt) && <span style={{ fontSize: 10, padding: "1px 8px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontWeight: 600 }}>✓ Attempted</span>}
                                            </div>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.name}</p>
                                        </div>

                                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                            {freeTest && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "#dcfce7", color: "#166534", fontWeight: 600 }}>🆓 Free</span>}
                                            {paidTest && <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "#dbeafe", color: "#1e40af", fontWeight: 600 }}>⭐ Full</span>}
                                            {!hasTests && <span style={{ fontSize: 10, color: "#9ca3af" }}>No tests yet</span>}
                                            <span style={{ fontSize: 16, color: "#9ca3af", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>⌄</span>
                                        </div>
                                    </button>

                                    {isExpanded && hasTests && (
                                        <div style={{ borderTop: "1px solid #f3f4f6", padding: "16px 22px", background: "#fafafa", display: "flex", flexDirection: "column", gap: 10 }}>
                                            {freeTest && <TestRow test={freeTest} attempt={freeAtt} onStart={() => router.push(`/tests/${freeTest._id}`)} />}
                                            {paidTest && <TestRow test={paidTest} attempt={paidAtt} onStart={() => router.push(`/tests/${paidTest._id}`)} />}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
    );
}

function TestRow({ test, attempt, onStart }) {
    const isFree = test.price === 0;
    return (
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: `1px solid ${isFree ? "rgba(134,239,172,0.4)" : "rgba(147,197,253,0.4)"}`, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: isFree ? "#dcfce7" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{isFree ? "🆓" : "⭐"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.title}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>⏱ {test.duration} min</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>📝 {test.totalQuestions} questions</span>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>🎯 Pass: {test.passingScore}%</span>
                    {attempt && <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 8px", borderRadius: 20, background: attempt.passed ? "#dcfce7" : "#fee2e2", color: attempt.passed ? "#166534" : "#dc2626" }}>Best: {attempt.percentage}% {attempt.passed ? "✓" : "✗"}</span>}
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                {/* ₹{test.price} — temporarily hidden, all tests free */}
                <button onClick={onStart} style={{ padding: "8px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: isFree ? "linear-gradient(135deg, #0e4f3b, #1D9E75)" : "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff", whiteSpace: "nowrap" }}>
                    {attempt ? "Retake →" : "Start →"}
                </button>
            </div>
        </div>
    );
}