"use client";

const stats = [
  {
    icon: "history_edu",
    label: "Courses",
    value: "12",
    sub: "Completed",
    iconBg: "#dbe1ff",
    iconColor: "#00256e",
    bar: { color: "#00256e", width: "75%" },
  },
  {
    icon: "calendar_month",
    label: "Consultations",
    value: "24",
    sub: "Booked",
    iconBg: "#82fba3",
    iconColor: "#006d35",
    dots: true,
  },
  {
    icon: "cloud_download",
    label: "Downloads",
    value: "156",
    sub: "Resources",
    iconBg: "#ffd9e5",
    iconColor: "#5a0034",
    note: "Recent: Clinical Protocols v2.4",
  },
  {
    icon: "spa",
    label: "Wellness Score",
    value: "87",
    sub: "/100",
    iconBg: "#82fba3",
    iconColor: "#006d35",
    trend: "+4.2% this week",
  },
];

const features = [
  {
    icon: "auto_stories",
    title: "Structured Curriculum",
    desc: "BAMS-aligned Ayurveda courses with expert instructors and progressive learning paths.",
    tag: "LEARNING",
    tagColor: "#dbe1ff",
    tagText: "#00256e",
  },
  {
    icon: "medical_services",
    title: "Expert Consultations",
    desc: "Book 1-on-1 sessions with verified Ayurveda practitioners and clinical specialists.",
    tag: "CONSULTATION",
    tagColor: "#82fba3",
    tagText: "#006d35",
  },
  {
    icon: "storefront",
    title: "Digital Marketplace",
    desc: "Purchase clinical notes, research papers, and herbal product guides.",
    tag: "MARKETPLACE",
    tagColor: "#ffd9e5",
    tagText: "#5a0034",
  },
];

export default function FeatureCards() {
  return (
    <>
      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-6 rounded-2xl"
            style={{
              background: "#ffffff",
              boxShadow: "0 1px 8px rgba(0,37,110,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.iconBg, color: s.iconColor }}
              >
                <span className="material-symbols-outlined">{s.icon}</span>
              </div>
              <div>
                <p
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#757682" }}
                >
                  {s.label}
                </p>
                <p className="text-xl font-extrabold" style={{ color: "#191c1e" }}>
                  {s.value}{" "}
                  <span className="text-xs font-normal" style={{ color: "#757682" }}>
                    {s.sub}
                  </span>
                </p>
              </div>
            </div>

            {s.bar && (
              <div
                className="w-full h-1.5 rounded-full overflow-hidden"
                style={{ background: "#eceef1" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: s.bar.width, background: s.bar.color }}
                />
              </div>
            )}
            {s.dots && (
              <div className="flex gap-1">
                {[1, 1, 0, 0].map((active, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: active ? "#006d35" : "#eceef1" }}
                  />
                ))}
              </div>
            )}
            {s.note && (
              <p className="text-[11px]" style={{ color: "#757682" }}>
                {s.note}
              </p>
            )}
            {s.trend && (
              <p
                className="text-[11px] font-bold flex items-center gap-1"
                style={{ color: "#006d35" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                  trending_up
                </span>
                {s.trend}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Feature Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-2xl cursor-pointer transition-all duration-200 group"
            style={{
              background: "#ffffff",
              boxShadow: "0 1px 8px rgba(0,37,110,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 8px 32px rgba(0,37,110,0.12)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                "0 1px 8px rgba(0,37,110,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span
              className="inline-block px-2.5 py-1 rounded-full text-[9px] font-extrabold tracking-widest uppercase mb-4"
              style={{ background: f.tagColor, color: f.tagText }}
            >
              {f.tag}
            </span>

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: f.tagColor, color: f.tagText }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: "'FILL' 0, 'wght' 500",
                  fontSize: "22px",
                }}
              >
                {f.icon}
              </span>
            </div>

            <h3
              className="text-base font-extrabold mb-2"
              style={{ color: "#00256e" }}
            >
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: "#444651" }}>
              {f.desc}
            </p>

            <div className="mt-4 flex items-center gap-1 font-bold text-sm" style={{ color: f.tagText }}>
              <span>Explore</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
