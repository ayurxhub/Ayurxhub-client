"use client";

export default function HeroSection() {
  return (
    <section
      className="relative rounded-2xl overflow-hidden flex items-center mb-8"
      style={{ minHeight: "220px" }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(135deg, #00256e 0%, rgba(31,60,136,0.90) 60%, transparent 100%)",
        }}
      />

      {/* Background texture */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #00256e 0%, #1f3c88 40%, #006d35 100%)",
          opacity: 0.9,
        }}
      />

      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl z-0"
        style={{ background: "rgba(130,251,163,0.15)" }}
      />
      <div
        className="absolute bottom-0 right-1/3 w-48 h-48 rounded-full blur-3xl z-0"
        style={{ background: "rgba(255,217,229,0.10)" }}
      />

      {/* Content */}
      <div className="relative z-20 px-12 py-8 max-w-2xl">
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase mb-4"
          style={{
            background: "rgba(130,251,163,0.2)",
            color: "#82fba3",
            border: "1px solid rgba(130,251,163,0.3)",
          }}
        >
          Digital Ayurveda Platform
        </span>

        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
          Wisdom.{" "}
          <span style={{ color: "#82fba3" }}>Precision.</span>
          <br />
          Modern Practice.
        </h2>

        <p className="text-sm mb-6 max-w-md" style={{ color: "rgba(219,225,255,0.8)" }}>
          Join India's premier Ayurveda learning platform — structured
          curriculum, expert consultations, and clinical resources in one place.
        </p>

        <div className="flex gap-3">
          <button
            className="px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all hover:shadow-xl"
            style={{
              background: "#ffffff",
              color: "#00256e",
            }}
          >
            Book Consultation
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              arrow_forward
            </span>
          </button>
          <button
            className="px-6 py-3 rounded-full font-bold text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            Browse Curriculum
          </button>
        </div>
      </div>
    </section>
  );
}
