"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import FeaturedHomeSection from "./components/FeaturedHomeSection";
import AnnouncementTicker from "./components/AnnouncementTicker";
import NoticeBoard from "./components/NoticeBoard";
// ─── Stats hook ───────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

const FEATURES = [
  {
    icon: "auto_stories",
    label: "Integrative Learning",
    desc: "Access classical texts, herb monographs, and pharmacology through our Ayurvedic curriculum.",
    color: "#00256e",
    bg: "#e8eeff",
    href: "/materials",
  },
  {
    icon: "medical_services",
    label: "Consultations",
    desc: "Practice live case discussions with verified Ayurvedic practitioners.",
    color: "#1D9E75",
    bg: "#E1F5EE",
    href: "/consultations",
    cta: "Schedule Now",
  },
  {
    icon: "storefront",
    label: "Marketplace",
    desc: "Source authentic Ayurvedic formulations, tools and study resources.",
    color: "#8B4513",
    bg: "#FFF0E0",
    href: "/marketplace",
  },
  {
    icon: "quiz",
    label: "Test Series",
    desc: "Subject-wise MCQ tests with free and premium tracks across all Ayurvedic disciplines.",
    color: "#5000C8",
    bg: "#f0ebff",
    href: "/tests",
  },
];

const SUBJECTS = [
  { name: "Herbal Plus", color: "#00256e" },
  { name: "Veda Research", color: "#1D9E75" },
  { name: "Institute-Ayu", color: "#8B4513" },
  { name: "Global Path", color: "#5000C8" },
];

const COMMUNITY_CARDS = [
  {
    icon: "spa",
    title: "Our Mission",
    desc: "To simplify Ayurveda education and clinical workflows through reliable, organized, and easy-to-use digital tools.",
    color: "#1D9E75",
    bg: "#E1F5EE",
  },
  {
    icon: "visibility",
    title: "Our Vision",
    desc: "To become a trusted digital ecosystem where students, doctors, and practitioners can learn, practice, and grow together.",
    color: "#00256e",
    bg: "#e8eeff",
  },
  {
    icon: "hub",
    title: "What’s Inside",
    desc: "Curriculum library, test preparation, herb monographs, practitioner discovery, bookings, and clinical resources.",
    color: "#8B4513",
    bg: "#FFF0E0",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const firstName = (user as any)?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ background: "#f7f9fc", minHeight: "100vh", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Hero ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #00256e 0%, #0a3d8f 45%, #0e4f3b 100%)",
          padding: "0 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          className="hero-grid"
          style={{
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1.05fr",
            gap: 48,
            alignItems: "center",
            padding: "56px 0",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left content */}
          <div className="hero-content">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 20,
                padding: "5px 14px",
                marginBottom: 22,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#6EE7C7",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#6EE7C7",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {user ? `${greeting}, ${firstName}` : "Ayurveda Medical EdTech"}
              </span>
            </div>

            <AnnouncementTicker />

            <h1
              style={{
                fontSize: "clamp(34px, 4.5vw, 56px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.04,
                letterSpacing: "-0.04em",
                margin: "0 0 18px",
              }}
            >
              Ancient Wisdom.<br />
              <span style={{ color: "#6EE7C7" }}>Clinical Precision.</span>
            </h1>

            <p
              style={{
                fontSize: "clamp(14px, 1.5vw, 16px)",
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.75,
                margin: "0 0 32px",
                maxWidth: 480,
              }}
            >
              Learn Ayurveda with modern medical education tools, clinical references,
              test preparation, and practical guidance.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/consultations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 26px",
                  borderRadius: 12,
                  background: "#fff",
                  color: "#00256e",
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  medical_services
                </span>
                Book Consultation
              </Link>

              <Link
                href="/materials"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 26px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.25)",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Explore Curriculum →
              </Link>
            </div>
          </div>

          {/* Right image */}
          <div className="hero-image-wrap">
            <Image
              src="/hero.png"
              alt="Medical student learning Ayurveda online"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </div>
        </div>

        <style>{`
    .hero-image-wrap {
      position: relative;
      width: 100%;
      min-height: 430px;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 24px 70px rgba(0,0,0,0.28);
      border: 1px solid rgba(255,255,255,0.18);
    }

    @media (max-width: 900px) {
      .hero-grid {
        grid-template-columns: 1fr !important;
        gap: 32px !important;
        padding: 42px 0 !important;
      }

      .hero-content {
        text-align: left;
      }

      .hero-image-wrap {
        min-height: 280px;
        border-radius: 22px;
      }
    }

    @media (max-width: 520px) {
      section {
        padding-left: 18px !important;
        padding-right: 18px !important;
      }

      .hero-image-wrap {
        min-height: 230px;
      }
    }
  `}</style>
      </section>


      <NoticeBoard />
      {/* ── Featured content (blogs + courses marked as featured) ── */}
      <div style={{ paddingTop: 56 }}>
        <FeaturedHomeSection />
      </div>

      <section className="offer-section">
        <div className="offer-top">
          <p>WHAT WE OFFER</p>
          <h2>Integrative Care</h2>
        </div>

        <div className="offer-grid">
          {[
            {
              tag: "Learning",
              time: "24/7",
              title: "Integrative Learning",
              desc: "Interactive learning with chapter-wise notes and video courses designed for clear understanding and structured learning.",
              img: "/offer-learning.png",
              href: "/materials",
            },
            {
              tag: "Live",
              time: "1:1",
              title: "Consult Certified Ayurvedic Doctors",
              desc: "Consult experienced Ayurvedic doctors online. Get diagnosis, guidance, and personalized treatment plans.",
              img: "/offer-consultation.png",
              href: "/consultations",
            },
            {
              tag: "Shop",
              time: "Verified",
              title: "Library",
              desc: "All your study material in one place — notes, PDFs, PYQs, and concise resources, structured for clarity and efficient learning.",
              img: "/offer-marketplace.png",
              href: "/materials",
            },
            {
              tag: "Tests",
              time: "MCQ",
              title: "Test Series",
              desc: "Practice with MCQs and mock tests to assess and improve performance.",
              img: "/offer-test.png",
              href: "/tests",
            },
          ].map((item) => (
            <Link href={item.href} className="offer-card" key={item.title}>
              <div className="offer-meta">
                <span>{item.time}</span>
                <span>{item.tag}</span>
                <span className="offer-dot" />
              </div>

              <h3>{item.title}</h3>
              <p>{item.desc}</p>

              <div className="offer-img-wrap">
                <img src={item.img} alt={item.title} />
                <div className="offer-read">
                  Explore
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Test Series CTA — two-column on desktop ── */}
      <section style={{ padding: "0 32px 60px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{
          borderRadius: 20,
          overflow: "hidden",
          background: "linear-gradient(135deg, #00256e 0%, #0e4f3b 100%)",
          padding: "36px 32px",
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "center",
        }} className="test-series-grid">
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, position: "relative" }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 14,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: "#6EE7C7", fontVariationSettings: "'FILL' 1" }}>quiz</span>
            </div>
            <div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Assessment Center</p>
              <h3 style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                Practitioner Test Series
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
                Subject-wise MCQ tests covering Dravyaguna, Kayachikitsa, Panchakarma and more. Free tests available — premium tests with 50–100 questions.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", position: "relative" }}>
            <Link
              href="/tests"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "12px 22px",
                borderRadius: 10,
                background: "#fff",
                color: "#00256e",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
              Start Free Test
            </Link>
            <div style={{ display: "flex", gap: 8 }}>
              {["Free Test", "Premium", "Ranked"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 12,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <style>{`
            @media (max-width: 768px) {
              .test-series-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </div>
      </section>



      {/* ── Community Intro ── */}
      <section className="community-wrapper" style={{ padding: "0 32px 60px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="community-section fade-slide"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 34,
            alignItems: "center",
            background: "#fff",
            borderRadius: 24,
            padding: "34px",
            border: "1px solid rgba(197,198,211,0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(29,158,117,0.08)",
              pointerEvents: "none",
            }}
          />

          {/* Community Image */}
          <div
            className="community-image"
            style={{
              minHeight: 320,
              borderRadius: 22,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Image
              src="/Bfd.png"
              alt="AyuRxHub illustration"
              fill
              sizes="(max-width: 900px) 50vw, 40vw"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          <div className="community-content" style={{ position: "relative", zIndex: 1 }}>
            <div className="community-intro">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#1D9E75",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Built for Ayurveda Community
              </span>

              <h2
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 900,
                  color: "#00256e",
                  letterSpacing: "-0.04em",
                  margin: "8px 0 12px",
                  lineHeight: 1.1,
                }}
              >
                Built for Ayurveda Learners, Doctors & Clinics
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  lineHeight: 1.75,
                  margin: "0 0 24px",
                  maxWidth: 620,
                }}
              >
                AyuRxHub brings together structured learning, clinical references,
                consultation support, and practice management tools — designed for the
                modern Ayurveda community.
              </p>
            </div>

            <div
              className="community-card-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              {COMMUNITY_CARDS.map((card, index) => (
                <div
                  key={card.title}
                  tabIndex={0}
                  className="fade-slide-card community-info-card"
                  style={{
                    animationDelay: `${index * 120}ms`,
                    background: "#f9fafb",
                    border: "1px solid rgba(197,198,211,0.32)",
                    borderRadius: 16,
                    padding: "18px 16px",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: card.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 22, color: card.color }}
                    >
                      {card.icon}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#111827",
                      margin: "0 0 7px",
                    }}
                  >
                    {card.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Join banner (non-logged in) ── */}
      {!user && (
        <section style={{ padding: "0 32px 60px", maxWidth: 1280, margin: "0 auto" }}>
          <div style={{
            borderRadius: 20,
            padding: "40px 36px",
            background: "linear-gradient(135deg, #00256e 0%, #1D9E75 100%)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 32,
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
          }} className="join-grid">
            <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
                Join the Sanctuary
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", margin: "0 0 16px", lineHeight: 1.65 }}>
                Our platform bridges the gap between classical Ayurvedic knowledge and evidence-based practice.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["✓ Personalised curriculum", "✓ Real-time feedback", "✓ Verified practitioners"].map((t) => (
                  <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.12)", padding: "6px 12px", borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            </div>
            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "14px 28px",
                borderRadius: 12,
                background: "#fff",
                color: "#00256e",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            >
              Join Free
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>
            </Link>
            <style>{`
              @media (max-width: 600px) {
                .join-grid {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        </section>
      )}

      <footer
        style={{
          background: "#020B2A",
          color: "#cbd5e1",
          padding: "50px 32px 20px",
          marginTop: 60,
        }}
      >
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gap: 40,
          }}
        >
          {/* Left */}
          <div>
            <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", margin: "0 0 2px" }}>AyuRxHub</p>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {["public", "group"].map((icon) => (
                <div
                  key={icon}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: "#fff" }}
                  >
                    {icon}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ color: "#fff", fontSize: 14, marginBottom: 14 }}>
              Platform
            </h4>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Curriculum Library",
                "Practitioner Registry",
                "Clinical Research",
                "Ethical Sourcing",
              ].map((item) => (
                <li key={item} style={{ marginBottom: 10 }}>
                  <a
                    href="#"
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: "#fff", fontSize: 14, marginBottom: 14 }}>
              Support
            </h4>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {[
                "Help Center",
                "Privacy Policy",
                "Certifications",
                "Contact Expert",
              ].map((item) => (
                <li key={item} style={{ marginBottom: 10 }}>
                  <a
                    href="#"
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: 13,
                    }}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.08)",
            margin: "30px 0 16px",
          }}
        />

        {/* Bottom Row */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#64748b",
          }}
          className="footer-bottom"
        >
          <span>© 2026 AyuRxHub Clinical Sanctuary. All rights reserved.</span>

          <span style={{ opacity: 0.7 }}>
            Designed for Ayurveda Professionals
          </span>
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-slide {
          animation: fadeSlideUp 0.7s ease both;
        }

        .fade-slide-card {
          opacity: 0;
          animation: fadeSlideUp 0.65s ease both;
        }

        .community-info-card {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            border-color 0.25s ease;
        }

        .community-info-card::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(
            circle at center,
            rgba(29, 158, 117, 0.22),
            rgba(29, 158, 117, 0.08) 35%,
            transparent 65%
          );
          opacity: 0;
          transform: scale(0.7);
          transition:
            opacity 0.28s ease,
            transform 0.28s ease;
          pointer-events: none;
        }

        .community-info-card:hover {
          transform: translateY(-4px);
          border-color: rgba(29, 158, 117, 0.35) !important;
          box-shadow: 0 14px 36px rgba(29, 158, 117, 0.16);
        }

        .community-info-card:hover::before {
          opacity: 1;
          transform: scale(1);
        }

        .community-info-card > * {
          position: relative;
          z-index: 1;
        }

        footer a:hover {
          color: #1D9E75 !important;
        }

        @media (max-width: 900px) {
          .hero-grid,
          .test-series-grid,
          .join-grid {
            grid-template-columns: 1fr !important;
          }

          .community-section {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 14px !important;
            padding: 20px !important;
            align-items: start !important;
          }

          .community-content {
            display: contents !important;
          }

          .community-intro {
            grid-column: 1 / -1 !important;
          }

          .community-image {
            grid-column: 1 / 2 !important;
            grid-row: 2 !important;
            min-height: 150px !important;
            border-radius: 16px !important;
          }

          .community-card-grid {
            display: contents !important;
          }

          .community-card-grid .community-info-card {
            padding: 14px !important;
            border-radius: 14px !important;
            min-width: 0 !important;
          }

          .community-card-grid .community-info-card:nth-child(1) {
            grid-column: 2 / 3 !important;
            grid-row: 2 !important;
          }

          .community-card-grid .community-info-card:nth-child(2) {
            grid-column: 2 / 3 !important;
            grid-row: 3 !important;
          }

          .community-card-grid .community-info-card:nth-child(3) {
            grid-column: 1 / 2 !important;
            grid-row: 3 !important;
          }

          .community-card-grid .community-info-card h3 {
            font-size: 12px !important;
            line-height: 1.25 !important;
          }

          .community-card-grid .community-info-card p {
            font-size: 10px !important;
            line-height: 1.45 !important;
          }

          .footer-bottom {
            flex-direction: column;
            gap: 10px;
            text-align: center;
          }
        }

        /* Desktop */
.footer-grid {
  grid-template-columns: 1.5fr 1fr 1fr;
}

/* Tablet (MD) */
@media (min-width: 768px) and (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    max-width: 700px;
    margin: 0 auto;
    padding: 24px;
    border-radius: 16px;
  }

  .footer-bottom {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }
}

/* Mobile */
@media (max-width: 767px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

        @media (max-width: 767px) {
          section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .community-wrapper {
            padding: 0 14px 44px !important;
          }

          .community-section h2 {
            font-size: 22px !important;
            line-height: 1.08 !important;
          }

          .community-section p {
            font-size: 11px !important;
            line-height: 1.55 !important;
          }
        }

        @media (max-width: 480px) {
          .community-section {
            border-radius: 20px !important;
            gap: 12px !important;
            padding: 18px !important;
          }

          .community-image {
            min-height: 135px !important;
          }

          .community-card-grid .community-info-card {
            padding: 12px !important;
          }
        }

        @media (max-width: 768px) {
          .community-info-card:active,
          .community-info-card:focus-visible {
            transform: translateY(-3px);
            border-color: rgba(29, 158, 117, 0.4) !important;
            box-shadow: 0 12px 30px rgba(29, 158, 117, 0.18);
          }

          .community-info-card:active::before,
          .community-info-card:focus-visible::before {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 900px) {
  .community-image img {
    object-position: 25% center;
  }
}


/* Desktop */
.footer-grid {
  grid-template-columns: 1.5fr 1fr 1fr;
}

/* Tablet (MD) — rectangular */
@media (min-width: 768px) and (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr !important;
    max-width: 700px;
    margin: 0 auto;
    padding: 24px;
    border-radius: 16px;
  }

  .footer-bottom {
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }
}
.offer-section {
  background: #f5f7fb;
  padding: 90px 56px;
  overflow: hidden;
}

.offer-top {
  text-align: center;
  margin-bottom: 52px;
}

.offer-top p {
  color: #0aa072;
  font-weight: 800;
  letter-spacing: 0.12em;
  font-size: 13px;
  margin-bottom: 18px;
}

.offer-top h2 {
  color: #002b78;
  font-size: clamp(36px, 4vw, 56px);
  line-height: 1;
  font-weight: 900;
  margin: 0;
}

.offer-grid {
  max-width: 1500px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.offer-card {
  background: #fff7ee;
  min-height: 430px;
  border-radius: 24px;
  padding: 24px;
  text-decoration: none;
  color: #111;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;
}

.offer-card:nth-child(1) {
  background: #dffcf1;
}

.offer-card:nth-child(2) {
  background: #fff2e3;
}

.offer-card:nth-child(3) {
  background: #eef2ff;
}

.offer-card:nth-child(4) {
  background: #f2e9ff;
}

.offer-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.13);
}

.offer-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
}

.offer-meta span {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
}

.offer-meta .offer-dot {
  width: 11px;
  height: 11px;
  padding: 0;
  margin-left: auto;
  background: #0aa072;
}

.offer-card h3 {
  font-size: 25px;
  line-height: 1.05;
  font-weight: 900;
  margin: 0 0 12px;
  color: #101010;
}

.offer-card p {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin: 0 0 22px;
}

.offer-img-wrap {
  position: relative;
  width: 100%;
  height: 210px;
  border-radius: 18px;
  overflow: hidden;
  margin-top: auto;
}

.offer-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.offer-read {
  position: absolute;
  left: 14px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
}

.offer-read span {
  background: #fff;
  color: #111;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1100px) {
  .offer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .offer-section {
    padding: 64px 18px;
  }

  .offer-top {
    text-align: left;
    margin-bottom: 32px;
  }

  .offer-grid {
    display: flex;
    overflow-x: auto;
    gap: 16px;
    scroll-snap-type: x mandatory;
    padding-bottom: 14px;
  }

  .offer-card {
    min-width: 82%;
    min-height: 405px;
    scroll-snap-align: start;
    padding: 20px;
    border-radius: 22px;
  }

  .offer-img-wrap {
    height: 190px;
  }

  .offer-card h3 {
    font-size: 23px;
  }
}
  
        `}</style>
    </div>
  );
}