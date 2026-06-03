"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const publicApi = axios.create({ baseURL: API }); // token-less client for public browsing

const FALLBACK_SUBJECTS = [
  { name: "Dravyaguna", icon: "🌿", color: { bg: "#E1F5EE", text: "#0F6E56", border: "#9FE1CB" } },
  { name: "Kayachikitsa", icon: "🩺", color: { bg: "#dbe1ff", text: "#00256e", border: "#A8B4FF" } },
  { name: "Panchakarma", icon: "💧", color: { bg: "#E8F4FF", text: "#0057A8", border: "#93C5FD" } },
  { name: "Shalya Tantra", icon: "⚕️", color: { bg: "#ffd9e5", text: "#5a0034", border: "#FFB3CA" } },
  { name: "Rasayana", icon: "✨", color: { bg: "#FFF3CD", text: "#7A4F00", border: "#FFD970" } },
  { name: "Anatomy", icon: "🦴", color: { bg: "#F2E8FF", text: "#4A007A", border: "#D4AAFF" } },
  { name: "Pharmacology", icon: "💊", color: { bg: "#FFF0E0", text: "#8B4513", border: "#FFD0A0" } },
  { name: "Diagnosis", icon: "🔬", color: { bg: "#E8F8F0", text: "#1A6B3C", border: "#86EFB0" } },
  { name: "Prasuti Tantra", icon: "🌸", color: { bg: "#FFE4F0", text: "#9B1060", border: "#FFB0D8" } },
  { name: "Kaumarabhritya", icon: "👶", color: { bg: "#E4F0FF", text: "#1060A0", border: "#B0D0FF" } },
  { name: "General Ayurveda", icon: "📖", color: { bg: "#F5F0FF", text: "#5000C8", border: "#C8A8FF" } },
];

const DEFAULT_COLOR = {
  bg: "#E8F4FF",
  text: "#0057A8",
  border: "#93C5FD",
};

export default function TestsPage() {
  return <TestListing />;
}

function ChapterwiseBanner({ onNavigate }) {
  return (
    <div
      className="chapter-banner"
      onClick={onNavigate}
      style={{
        background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 55%, #0e4f3b 100%)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 24,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        boxShadow: "0 4px 20px rgba(0,37,110,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 36 }}>🌿</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 3px" }}>
            Swasthavritta evam Yoga
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Chapter-wise tests · Term 1 &amp; Term 2
          </p>
        </div>
      </div>

      <div
        className="chapter-banner-btn"
        style={{
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 10,
          padding: "8px 18px",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        View Chapters →
      </div>
    </div>
  );
}

function TestListing() {
  const { user, authAxios } = useAuth();
  const router = useRouter();

  const [bySubject, setBySubject] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubject, setActiveSubject] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Tests + subjects are public; attempts are per-user (only fetch when logged in).
        const requests = [
          publicApi.get("/tests"),
          publicApi.get("/subjects"),
        ];
        const attemptsReq = user ? authAxios.get("/tests/my-attempts") : null;

        const [testsRes, subjectsRes] = await Promise.all(requests);
        setBySubject(testsRes.data.bySubject || {});
        setSubjects(subjectsRes.data.subjects || []);

        if (attemptsReq) {
          const attemptsRes = await attemptsReq;
          setAttempts(attemptsRes.data.attempts || []);
        } else {
          setAttempts([]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // Start a test: free → straight in; paid while logged out → signup.
  const startTest = (test) => {
    if (test.type !== "free" && !user) {
      router.push(`/signup?next=/tests/${test._id}`);
      return;
    }
    router.push(`/tests/${test._id}`);
  };

  const subjectMetaList =
    subjects.length > 0
      ? subjects.map((s, index) => {
        const fallback =
          FALLBACK_SUBJECTS.find((f) => f.name === s.name) ||
          FALLBACK_SUBJECTS[index % FALLBACK_SUBJECTS.length];

        return {
          name: s.name,
          icon: s.icon || fallback?.icon || "📘",
          color: s.color || fallback?.color || DEFAULT_COLOR,
        };
      })
      : FALLBACK_SUBJECTS;

  const attemptMap = {};
  attempts.forEach((a) => {
    const tid = a.test?._id;
    if (!tid) return;
    if (!attemptMap[tid] || a.percentage > attemptMap[tid].percentage) {
      attemptMap[tid] = a;
    }
  });

  const filteredSubjects = subjectMetaList.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeData = activeSubject
    ? bySubject[activeSubject] || { free: [], paid: [] }
    : null;

  const activeMeta = subjectMetaList.find((s) => s.name === activeSubject);

  return (
    <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>
      <div className="tests-page-wrap" style={{ padding: "28px 32px", maxWidth: 1100 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", margin: "0 0 4px" }}>
            Test Series
          </h1>
          <p style={{ fontSize: 14, color: "#757682", margin: 0 }}>
            Subject-wise MCQ tests
          </p>
        </div>

        <div className="stats-row" style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Attempted", value: attempts.length, icon: "📝" },
            {
              label: "Avg Score",
              value: attempts.length
                ? `${Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)}%`
                : "—",
              icon: "📊",
            },
            { label: "Passed", value: attempts.filter((a) => a.passed).length, icon: "✅" },
          ].map(({ label, value, icon }) => (
            <div
              className="stats-card"
              key={label}
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: "14px 20px",
                border: "0.5px solid rgba(197,198,211,0.35)",
                flex: 1,
              }}
            >
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 4px" }}>
                {icon} {label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#00256e", margin: 0 }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="desktop-banner-slot">
          <ChapterwiseBanner onNavigate={() => router.push("/tests/chapterwise")} />
        </div>

        <div className="tests-main-layout" style={{ display: "flex", gap: 24 }}>
          <div className="subject-sidebar" style={{ width: 220, flexShrink: 0 }}>
            <input
              placeholder="Search subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                marginBottom: 10,
                border: "0.5px solid rgba(197,198,211,0.5)",
                background: "#fff",
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />

            <div
              className="subject-list"
              style={{ display: "flex", flexDirection: "column", gap: 3 }}
            >
              {filteredSubjects.map((s) => {
                const data = bySubject[s.name] || { free: [], paid: [] };
                const total = data.free.length + data.paid.length;
                const isActive = activeSubject === s.name;

                return (
                  <button
                    key={s.name}
                    onClick={() => setActiveSubject(isActive ? null : s.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                      background: isActive ? s.color.bg : "#fff",
                      borderLeft: `3px solid ${isActive ? s.color.text : "transparent"}`,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{s.icon}</span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isActive ? s.color.text : "#374151",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.name}
                      </p>

                      {total > 0 && (
                        <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>
                          {data.free.length} free · {data.paid.length} paid
                        </p>
                      )}
                    </div>

                    {total > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 20,
                          background: isActive ? s.color.text : "#f3f4f6",
                          color: isActive ? "#fff" : "#6b7280",
                        }}
                      >
                        {total}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mobile-banner-slot">
            <ChapterwiseBanner onNavigate={() => router.push("/tests/chapterwise")} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "3px solid #00256e",
                    borderTopColor: "transparent",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            ) : !activeSubject ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredSubjects.map((s) => {
                  const data = bySubject[s.name] || { free: [], paid: [] };
                  const total = data.free.length + data.paid.length;

                  return (
                    <button
                      key={s.name}
                      onClick={() => setActiveSubject(s.name)}
                      className="subject-strip"
                      style={{
                        background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 55%, #0e4f3b 100%)",
                        borderRadius: 16,
                        padding: "20px 24px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        border: "none",
                        width: "100%",
                        boxShadow: "0 4px 20px rgba(0,37,110,0.18)",
                        fontFamily: "inherit",
                        textAlign: "left",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ fontSize: 32, lineHeight: 1 }}>{s.icon}</div>
                        <div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
                            {s.name}
                          </p>
                          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                            {total > 0
                              ? `${data.free.length} free · ${data.paid.length} paid tests`
                              : "Coming soon"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="subject-strip-btn"
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 10,
                          padding: "8px 18px",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        View Tests →
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <button
                    onClick={() => setActiveSubject(null)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 18,
                      color: "#6b7280",
                      padding: "4px 8px",
                    }}
                  >
                    ←
                  </button>

                  <span style={{ fontSize: 20 }}>{activeMeta?.icon || "📘"}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
                    {activeSubject}
                  </h2>
                </div>

                {activeData.free.length === 0 && activeData.paid.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 60,
                      background: "#fff",
                      borderRadius: 14,
                      border: "0.5px solid rgba(197,198,211,0.35)",
                    }}
                  >
                    <p style={{ fontSize: 32, margin: "0 0 8px" }}>📭</p>
                    <p style={{ fontSize: 14, color: "#6b7280" }}>
                      No tests published yet for this subject
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {activeData.free.length > 0 && (
                      <TestSection
                        title="🆓 Free Tests"
                        count={activeData.free.length}
                        color="#166534"
                        bg="#dcfce7"
                        tests={activeData.free}
                        attemptMap={attemptMap}
                        onStart={startTest}
                        user={user}
                      />
                    )}

                    {activeData.paid.length > 0 && (
                      <TestSection
                        title="⭐ Premium Tests"
                        count={activeData.paid.length}
                        color="#1e40af"
                        bg="#dbeafe"
                        tests={activeData.paid}
                        attemptMap={attemptMap}
                        onStart={startTest}
                        user={user}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .mobile-banner-slot {
          display: none;
        }

        @media (max-width: 768px) {
          .tests-page-wrap {
            padding: 28px 18px !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .stats-row {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 10px !important;
            margin-bottom: 24px !important;
          }

          .stats-card {
            padding: 14px 10px !important;
            min-height: 58px !important;
            border-radius: 12px !important;
            min-width: 0 !important;
          }

          .stats-card p:first-child {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .stats-card p:last-child {
            font-size: 21px !important;
          }

          .desktop-banner-slot {
            display: none !important;
          }

          .mobile-banner-slot {
            display: block !important;
            width: 100% !important;
          }

          .tests-main-layout {
            flex-direction: column !important;
            gap: 0 !important;
          }

          .subject-sidebar {
            width: 100% !important;
          }

          .subject-sidebar input {
            height: 40px !important;
            margin-bottom: 10px !important;
          }

          .subject-list {
            flex-direction: row !important;
            overflow-x: auto !important;
            gap: 8px !important;
            padding-bottom: 0 !important;
            scrollbar-width: none !important;
          }

          .subject-list::-webkit-scrollbar {
            display: none !important;
          }

          .subject-list button {
            min-width: 164px !important;
            justify-content: flex-start !important;
            border-left: none !important;
            border-bottom: 3px solid transparent !important;
            background: #fff !important;
          }

          .chapter-banner {
            margin-top: 26px !important;
            margin-bottom: 26px !important;
            padding: 20px 22px !important;
            border-radius: 15px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 18px !important;
          }

          .chapter-banner > div:first-child {
            justify-content: flex-start !important;
            align-items: center !important;
          }

          .chapter-banner-btn {
            width: 100% !important;
            text-align: center !important;
            box-sizing: border-box !important;
            padding: 11px 18px !important;
          }

          .subject-strip {
            padding: 16px 18px !important;
            border-radius: 13px !important;
          }

          .subject-strip-btn {
            padding: 7px 14px !important;
            font-size: 12px !important;
          }

          .subject-grid {
            grid-template-columns: 1fr !important;
          }

          .test-card {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .test-card-action {
            width: 100% !important;
            align-items: stretch !important;
          }

          .test-card-action button {
            width: 100% !important;
          }
        }

        @media (max-width: 380px) {
          .tests-page-wrap {
            padding: 24px 14px !important;
          }

          .stats-row {
            gap: 8px !important;
          }

          .stats-card {
            padding: 12px 8px !important;
          }

          .stats-card p:first-child {
            font-size: 9px !important;
          }

          .stats-card p:last-child {
            font-size: 19px !important;
          }

          .subject-list button {
            min-width: 150px !important;
          }
        }
      `}</style>
    </div>
  );
}

function TestSection({ title, count, color, bg, tests, attemptMap, onStart, user }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{title}</span>
        <span
          style={{
            fontSize: 11,
            padding: "2px 8px",
            borderRadius: 20,
            background: bg,
            color,
          }}
        >
          {count} tests
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tests.map((test) => (
          <TestCard
            key={test._id}
            test={test}
            attempt={attemptMap[test._id]}
            locked={test.type !== "free" && !user}
            onStart={() => onStart(test)}
          />
        ))}
      </div>
    </div>
  );
}

function TestCard({ test, attempt, onStart, locked }) {
  const isFree = test.type === "free";

  return (
    <div
      className="test-card"
      style={{
        background: "#fff",
        borderRadius: 14,
        padding: "18px 20px",
        border: `1px solid ${isFree ? "rgba(134,239,172,0.4)" : "rgba(147,197,253,0.4)"}`,
        boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          flexShrink: 0,
          background: isFree ? "#dcfce7" : "#dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {isFree ? "🆓" : "⭐"}
      </div>

      <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 5px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {test.title}
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#6b7280" }}>⏱ {test.duration} min</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>📝 {test.totalQuestions} questions</span>
          <span style={{ fontSize: 11, color: "#6b7280" }}>🎯 Pass: {test.passingScore}%</span>

          {attempt && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "1px 8px",
                borderRadius: 20,
                background: attempt.passed ? "#dcfce7" : "#fee2e2",
                color: attempt.passed ? "#166534" : "#dc2626",
              }}
            >
              Best: {attempt.percentage}% {attempt.passed ? "✓" : "✗"}
            </span>
          )}
        </div>

        {test.description && (
          <p
            style={{
              fontSize: 11,
              color: "#9ca3af",
              margin: "4px 0 0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {test.description}
          </p>
        )}
      </div>

      <div
        className="test-card-action"
        style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}
      >
        {!isFree && test.price > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e40af" }}>
            ₹{test.price}
          </span>
        )}

        <button
          onClick={onStart}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            background: isFree
              ? "linear-gradient(135deg, #0e4f3b, #1D9E75)"
              : "linear-gradient(135deg, #1e40af, #3b82f6)",
            color: "#fff",
            whiteSpace: "nowrap",
          }}
        >
          {locked ? "🔒 Sign up" : attempt ? "Retake" : "Start"} →
        </button>
      </div>
    </div>
  );
}