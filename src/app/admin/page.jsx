"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminOverview() {
  const { authAxios } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testsAreFree, setTestsAreFree] = useState(true);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await authAxios.put("/settings", { testsAreFree: !testsAreFree });
      setTestsAreFree(res.data.settings.testsAreFree);
    } catch (err) { console.error(err); }
    finally { setToggling(false); }
  };

  useEffect(() => {
    authAxios.get("/settings").then(r => setTestsAreFree(r.data.settings?.testsAreFree ?? true)).catch(() => { });
    authAxios
      .get("/admin/stats")
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const statCards = [
    { label: "Total Students", value: stats.totalStudents, color: "#059669" },
    { label: "Total Experts", value: stats.totalExperts, color: "#2563eb" },
    { label: "Total Bookings", value: stats.totalBookings, color: "#d97706" },
    { label: "Completed", value: stats.completedBookings, color: "#059669" },
    { label: "Cancelled", value: stats.cancelledBookings, color: "#dc2626" },
    { label: "Pending Verification", value: stats.pendingVerification, color: "#d97706" },
    { label: "Total Reviews", value: stats.totalReviews, color: "#2563eb" },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue?.toLocaleString()}`,
      color: "#059669",
    },
  ];

  return (
    <div className="overview-page">
      <div className="page-header">
        <h1>Overview</h1>
        <p>Platform statistics and recent activity</p>
      </div>

      {/* Pro Access Toggle */}
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
        padding: "16px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: testsAreFree ? "#d1fae5" : "#fef3c7",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>
            {testsAreFree ? "🆓" : "🔒"}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>
              Full Test Access
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
              {testsAreFree
                ? "Currently FREE — all full tests accessible to everyone"
                : "Currently PAID — full tests require Pro subscription"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: testsAreFree ? "#059669" : "#d97706" }}>
            {testsAreFree ? "Free Mode" : "Pro Mode"}
          </span>
          <button onClick={handleToggle} disabled={toggling} style={{
            width: 52, height: 28, borderRadius: 14, border: "none",
            background: testsAreFree ? "#1D9E75" : "#e5e7eb",
            cursor: toggling ? "not-allowed" : "pointer",
            position: "relative", transition: "background 0.2s",
          }}>
            <span style={{
              position: "absolute", top: 3,
              left: testsAreFree ? 26 : 4,
              width: 22, height: 22, borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              transition: "left 0.2s",
            }} />
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(({ label, value, color }) => (
          <div className="stat-card" key={label}>
            <p className="stat-label">{label}</p>
            <p className="stat-value" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <Panel title="Recent users" onViewAll={() => router.push("/admin/users")}>
          {stats.recentUsers?.map((u) => (
            <div className="list-row" key={u._id}>
              <div className="avatar">
                {u.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>

              <div className="row-main">
                <p className="row-title">{u.name}</p>
                <p className="row-subtitle">{u.email}</p>
              </div>

              <span className={`badge ${u.role === "expert" ? "expert" : "student"}`}>
                {u.role}
              </span>
            </div>
          ))}
        </Panel>

        <Panel title="Recent bookings" onViewAll={() => router.push("/admin/bookings")}>
          {stats.recentBookings?.map((b) => (
            <div className="list-row booking-row" key={b._id}>
              <div className="row-main">
                <p className="row-title">
                  {b.student?.name} → {b.expert?.name}
                </p>
                <p className="row-subtitle">
                  {new Date(b.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {b.startTime}
                </p>
              </div>

              <span className="badge student">{b.status}</span>
            </div>
          ))}
        </Panel>
      </div>

      <style jsx>{`
        .overview-page {
          width: 100%;
          max-width: 100%;
          min-height: 100vh;
          overflow-x: hidden;
          background: #f7f9fc;
          color: #111827;
        }

        .page-header {
          margin-bottom: 28px;
        }

        .page-header h1 {
          font-size: 22px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
        }

        .page-header p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }

        .stat-card,
        .panel {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .stat-card {
          padding: 18px 20px;
          min-width: 0;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 8px;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 600;
          margin: 0;
          word-break: break-word;
        }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .panel {
          padding: 20px;
          min-width: 0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .panel-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .view-btn {
          font-size: 12px;
          color: #059669;
          background: none;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .list-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 0;
          border-bottom: 1px solid #f1f5f9;
          min-width: 0;
        }

        .list-row:last-child {
          border-bottom: none;
        }

        .booking-row {
          justify-content: space-between;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #10b981;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .row-main {
          flex: 1;
          min-width: 0;
        }

        .row-title,
        .row-subtitle {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .row-title {
          font-size: 13px;
          color: #111827;
          margin: 0 0 2px;
        }

        .row-subtitle {
          font-size: 11px;
          color: #6b7280;
          margin: 0;
        }

        .badge {
          font-size: 10px;
          padding: 4px 9px;
          border-radius: 999px;
          text-transform: capitalize;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .badge.student {
          background: #d1fae5;
          color: #047857;
        }

        .badge.expert {
          background: #dbeafe;
          color: #1d4ed8;
        }

        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .page-header h1 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .stat-card,
          .panel {
            padding: 16px;
          }

          .stat-value {
            font-size: 24px;
          }

          .badge {
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
    </div>
  );
}

function Panel({ title, onViewAll, children }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <p className="panel-title">{title}</p>
        <button onClick={onViewAll} className="view-btn">
          View all
        </button>
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />

      <style jsx>{`
        .spinner-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 60vh;
          background: #f7f9fc;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid #10b981;
          border-top-color: transparent;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}