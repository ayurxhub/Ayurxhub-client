"use client";

import { useState, useEffect } from "react";

const INSTITUTE_IMAGES = {
    aiia: "/Institute/aiia-DELHI.jpg",
    bhu: "/Institute/bhu.jpg",
    ccras: "/Institute/ccras.jpg",
    itra: "/Institute/itra.jpg",
    ayush: "/Institute/Ministry-of-ayush.png",
    neia: "/Institute/neia.jpeg",
    neiah: "/Institute/neiah.jpg",
    nia: "/Institute/NIA JAIPUR.jpg",
    nmpb: "/Institute/nmph.jpg",
    rav: "/Institute/rav.jpg",
    default: "/Institute/19C4AB7D391_coverImage.png",
};

const getInstituteImage = (item) => {
    const text = `${item.shortName || ""} ${item.name || ""}`.toLowerCase();

    if (text.includes("aiia")) return INSTITUTE_IMAGES.aiia;
    if (text.includes("bhu")) return INSTITUTE_IMAGES.bhu;
    if (text.includes("ccras")) return INSTITUTE_IMAGES.ccras;
    if (text.includes("itra")) return INSTITUTE_IMAGES.itra;

    if (text.includes("ministry of ayush") || text.includes("government of india")) {
        return INSTITUTE_IMAGES.ayush;
    }

    if (text.includes("neiah")) return INSTITUTE_IMAGES.neiah;
    if (text.includes("neiafmr") || text.includes("folk medicine")) return INSTITUTE_IMAGES.neia;
    if (text.includes("national institute of ayurveda") || text.includes("nia")) return INSTITUTE_IMAGES.nia;
    if (text.includes("nmpb") || text.includes("medicinal plants")) return INSTITUTE_IMAGES.nmpb;
    if (text.includes("rashtriya ayurveda vidyapeetha") || text.includes("rav")) return INSTITUTE_IMAGES.rav;

    // ICMR and unknown institutes use cover image
    return INSTITUTE_IMAGES.default;
};
const JOURNALS = [
    { name: "Journal of Research in Ayurvedic Sciences (JRAS)", publisher: "CCRAS", url: "https://journals.lww.com/jras/pages/aboutthejournal.aspx" },
    { name: "Journal of Drug Research in Ayurvedic Sciences", publisher: "CCRAS", url: "https://journals.lww.com/jdra/pages/default.aspx" },
    { name: "Journal of Indian Medical Heritage", publisher: "CCRAS", url: "https://journals.lww.com/jimh/pages/default.aspx" },
    { name: "Journal of Ayurveda", publisher: "NIA, Jaipur", url: "https://journals.lww.com/joay/pages/default.aspx" },
    { name: "Journal of Ayurveda Case Reports", publisher: "AIIA", url: "https://journals.lww.com/jacr" },
    { name: "International Journal of Ayurveda Research", publisher: "AIIA", url: "https://journals.lww.com/ijar/" },
    { name: "Ayu", publisher: "ITRA, Jamnagar", url: "https://journals.lww.com/AAYU/Pages/default.aspx" },
];

const TYPE_COLORS = {
    "Government Institute": { bg: "#dbe1ff", text: "#00256e" },
    "Research Council": { bg: "#E1F5EE", text: "#0F6E56" },
    "Government Ministry": { bg: "#ffd9e5", text: "#5a0034" },
    University: { bg: "#FFF3CD", text: "#7A4F00" },
    "Research Institute": { bg: "#E1F5EE", text: "#0F6E56" },
    "Government Board": { bg: "#dbe1ff", text: "#00256e" },
    "Autonomous Body": { bg: "#F2E8FF", text: "#4A007A" },
};

const CATEGORY_COLORS = {
    "Classical Text": { bg: "#dbe1ff", text: "#00256e" },
    Pharmacology: { bg: "#E1F5EE", text: "#0F6E56" },
    Diagnosis: { bg: "#ffd9e5", text: "#5a0034" },
    Paediatrics: { bg: "#FFF3CD", text: "#7A4F00" },
};

const PUBLISHER_COLORS = {
    CCRAS: { bg: "#dbe1ff", text: "#00256e" },
    ICMR: { bg: "#E1F5EE", text: "#0F6E56" },
    AIIA: { bg: "#ffd9e5", text: "#5a0034" },
    CSIR: { bg: "#FFF3CD", text: "#7A4F00" },
    "NIA, Jaipur": { bg: "#F2E8FF", text: "#4A007A" },
    "ITRA, Jamnagar": { bg: "#E8F4FF", text: "#0057A8" },
    Independent: { bg: "#f2f4f7", text: "#444651" },
};

const defaultColor = { bg: "#f2f4f7", text: "#444651" };

const onEnter = (e) => {
    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,37,110,0.10)";
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.borderColor = "rgba(0,37,110,0.15)";
};

const onLeave = (e) => {
    e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,37,110,0.05)";
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.borderColor = "rgba(197,198,211,0.35)";
};

function InstitutionCard({ item }) {
    const chip = TYPE_COLORS[item.type] || defaultColor;
    const imageSrc = getInstituteImage(item);

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: "0.5px solid rgba(197,198,211,0.35)",
                borderRadius: 16,
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: "0 1px 8px rgba(0,37,110,0.05)",
                textDecoration: "none",
                color: "inherit",
            }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            <div
                style={{
                    height: 120,
                    background: "#f2f4f7",
                    borderBottom: "0.5px solid rgba(197,198,211,0.35)",
                }}
            >
                <img
                    src={imageSrc}
                    alt={item.shortName || item.name}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", lineHeight: 1.4, marginBottom: 4 }}>
                        {item.name}
                    </p>

                    <p style={{ fontSize: 11, color: "#757682", display: "flex", alignItems: "center", gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                            location_on
                        </span>
                        {item.location}
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                    <span
                        style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: chip.bg,
                            color: chip.text,
                        }}
                    >
                        {item.type}
                    </span>

                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#00256e", fontWeight: 500 }}>
                        Visit
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            open_in_new
                        </span>
                    </span>
                </div>
            </div>
        </a>
    );
}

function EbookCard({ item }) {
    const chip = CATEGORY_COLORS[item.category] || defaultColor;

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: "0.5px solid rgba(197,198,211,0.35)",
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: "0 1px 8px rgba(0,37,110,0.05)",
                textDecoration: "none",
                color: "inherit",
            }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: chip.bg,
                        color: chip.text,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        menu_book
                    </span>
                </div>

                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: chip.bg, color: chip.text }}>
                    {item.category}
                </span>
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", marginBottom: 6 }}>{item.name}</p>
            <p style={{ fontSize: 12, color: "#757682", lineHeight: 1.6, flex: 1 }}>{item.description}</p>
        </a>
    );
}

function JournalCard({ item }) {
    const chip = PUBLISHER_COLORS[item.publisher] || defaultColor;

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: "0.5px solid rgba(197,198,211,0.35)",
                borderRadius: 16,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: "0 1px 8px rgba(0,37,110,0.05)",
                textDecoration: "none",
                color: "inherit",
            }}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#191c1e", marginBottom: 8 }}>{item.name}</p>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: chip.bg, color: chip.text, width: "fit-content" }}>
                {item.publisher}
            </span>
        </a>
    );
}

export default function ReferencesPage() {
    const [tab, setTab] = useState("institutions");
    const [institutions, setInstitutions] = useState([]);
    const [ebooks, setEbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("All");

    useEffect(() => {
        const fetchReferences = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/references");
                const data = await res.json();
                setInstitutions(data.institutions || []);
                setEbooks(data.ebooks || []);
            } catch (err) {
                console.error("Failed to load references:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchReferences();
    }, []);

    const instTypes = ["All", ...new Set(institutions.map((i) => i.type))];
    const ebookCats = ["All", ...new Set(ebooks.map((e) => e.category))];
    const journalPubs = ["All", ...new Set(JOURNALS.map((j) => j.publisher))];

    const filterOptions = tab === "institutions" ? instTypes : tab === "ebooks" ? ebookCats : journalPubs;

    const filteredInstitutions = institutions.filter((i) => {
        const q = search.toLowerCase();
        const match =
            i.name?.toLowerCase().includes(q) ||
            i.shortName?.toLowerCase().includes(q) ||
            i.location?.toLowerCase().includes(q);

        return match && (filterType === "All" || i.type === filterType);
    });

    const filteredEbooks = ebooks.filter((e) => {
        const q = search.toLowerCase();
        const match = e.name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);

        return match && (filterType === "All" || e.category === filterType);
    });

    const filteredJournals = JOURNALS.filter((j) => {
        const q = search.toLowerCase();
        const match = j.name.toLowerCase().includes(q) || j.publisher.toLowerCase().includes(q);

        return match && (filterType === "All" || j.publisher === filterType);
    });

    const activeData = tab === "institutions" ? filteredInstitutions : tab === "ebooks" ? filteredEbooks : filteredJournals;

    const TABS = [
        { key: "institutions", icon: "account_balance", label: "Institutions", count: institutions.length },
        { key: "ebooks", icon: "menu_book", label: "E-Books", count: ebooks.length },
        { key: "journals", icon: "article", label: "Journals", count: JOURNALS.length },
    ];

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setSearch("");
        setFilterType("All");
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f7f9fc" }}>

            <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
                <div style={{ marginBottom: 28 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#00256e", marginBottom: 4 }}>
                        References & Resources
                    </h1>
                    <p style={{ fontSize: 14, color: "#757682" }}>
                        Official Ayurvedic institutions, classical texts, and peer-reviewed journals
                    </p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", background: "#ffffff", border: "0.5px solid rgba(197,198,211,0.4)", borderRadius: 12, padding: 4, gap: 2 }}>
                        {TABS.map(({ key, icon, label, count }) => (
                            <button
                                key={key}
                                onClick={() => handleTabChange(key)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 7,
                                    padding: "8px 16px",
                                    borderRadius: 9,
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    background: tab === key ? "#00256e" : "transparent",
                                    color: tab === key ? "#ffffff" : "#757682",
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                    {icon}
                                </span>
                                {label}
                                <span
                                    style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "1px 6px",
                                        borderRadius: 20,
                                        background: tab === key ? "rgba(255,255,255,0.2)" : "#f2f4f7",
                                        color: tab === key ? "#ffffff" : "#757682",
                                    }}
                                >
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={tab === "journals" ? "Search journals…" : tab === "institutions" ? "Search institutions…" : "Search texts…"}
                        style={{
                            padding: "9px 14px",
                            borderRadius: 10,
                            border: "0.5px solid rgba(197,198,211,0.5)",
                            background: "#ffffff",
                            color: "#191c1e",
                            fontSize: 13,
                            outline: "none",
                            width: 220,
                        }}
                    />
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
                    {filterOptions.map((opt) => {
                        const isActive = filterType === opt;
                        const chipColor =
                            tab === "institutions"
                                ? TYPE_COLORS[opt] || defaultColor
                                : tab === "ebooks"
                                    ? CATEGORY_COLORS[opt] || defaultColor
                                    : PUBLISHER_COLORS[opt] || defaultColor;

                        return (
                            <button
                                key={opt}
                                onClick={() => setFilterType(opt)}
                                style={{
                                    padding: "5px 14px",
                                    borderRadius: 20,
                                    border: "0.5px solid",
                                    fontSize: 12,
                                    cursor: "pointer",
                                    fontWeight: isActive ? 600 : 400,
                                    background: isActive ? (opt === "All" ? "#00256e" : chipColor.bg) : "#ffffff",
                                    color: isActive ? (opt === "All" ? "#ffffff" : chipColor.text) : "#757682",
                                    borderColor: isActive ? (opt === "All" ? "#00256e" : chipColor.bg) : "rgba(197,198,211,0.5)",
                                }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>

                {loading && tab !== "journals" ? (
                    <div style={{ textAlign: "center", padding: 80, color: "#757682" }}>Loading...</div>
                ) : activeData.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 80, color: "#757682" }}>
                        No results found
                    </div>
                ) : (
                    <>
                        <p style={{ fontSize: 12, color: "#757682", marginBottom: 16 }}>
                            Showing {activeData.length} {tab === "journals" ? "journal" : tab === "institutions" ? "institution" : "text"}
                            {activeData.length !== 1 ? "s" : ""}
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                            {tab === "institutions"
                                ? activeData.map((item) => <InstitutionCard key={item.url} item={item} />)
                                : tab === "ebooks"
                                    ? activeData.map((item) => <EbookCard key={item.url} item={item} />)
                                    : activeData.map((item) => <JournalCard key={item.url} item={item} />)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}