"use client";

import { useEffect, useState } from "react";


const CATEGORIES = ["All", "Anatomy", "Herbology", "Pharmacology", "Clinical", "Research"];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("http://localhost:5000/api/materials")
      .then((res) => res.json())
      .then((data) => {
        setMaterials(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    activeCategory === "All"
      ? materials
      : materials.filter((m) => m.subject === activeCategory);

  return (
    <div>

      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: "#00256e" }}>
              Digital Curriculum
            </h1>
            <p className="text-sm mt-1" style={{ color: "#444651" }}>
              {materials.length} resources available
            </p>
          </div>
          <a
            href="/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #00256e, #1f3c88)",
              boxShadow: "0 4px 12px rgba(0,37,110,0.20)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              upload
            </span>
            Upload Resource
          </a>
        </div>

        {/* Category Chips */}
        <div className="flex gap-2 flex-wrap mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={
                activeCategory === cat
                  ? {
                    background: "#00256e",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,37,110,0.20)",
                  }
                  : {
                    background: "#eceef1",
                    color: "#444651",
                  }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{ background: "#eceef1", height: "180px" }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-16 text-center"
            style={{ background: "#ffffff", boxShadow: "0 1px 8px rgba(0,37,110,0.06)" }}
          >
            <span
              className="material-symbols-outlined block mx-auto mb-4"
              style={{ fontSize: "48px", color: "#c5c6d3" }}
            >
              menu_book
            </span>
            <p className="font-bold text-lg" style={{ color: "#00256e" }}>
              No materials yet
            </p>
            <p className="text-sm mt-1" style={{ color: "#757682" }}>
              Be the first to upload a resource
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="p-6 rounded-2xl cursor-pointer transition-all duration-200"
                style={{
                  background: "#ffffff",
                  boxShadow: "0 1px 8px rgba(0,37,110,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,37,110,0.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,37,110,0.06)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#ffd9e5", color: "#5a0034" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    picture_as_pdf
                  </span>
                </div>

                <h2 className="font-extrabold text-base leading-snug mb-1" style={{ color: "#00256e" }}>
                  {item.title}
                </h2>

                {item.subject && (
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{ background: "#dbe1ff", color: "#00256e" }}
                  >
                    {item.subject}
                  </span>
                )}

                {item.description && (
                  <p className="text-xs mt-1 mb-4 line-clamp-2" style={{ color: "#444651" }}>
                    {item.description}
                  </p>
                )}

                <a
                  href={`http://localhost:5000/${item.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-bold transition-all"
                  style={{ color: "#00256e" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    open_in_new
                  </span>
                  View Resource
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
