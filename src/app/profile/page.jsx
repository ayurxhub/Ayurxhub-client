"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}

function ProfileContent() {
    const { user, authAxios } = useAuth();

    const [stats, setStats] = useState({
        coursesCompleted: 0,
        consultationsBooked: 0,
        downloadsCount: 0,
        certificationProgress: 63,
    });

    const [editing, setEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [avatarFile, setAvatarFile] = useState(null);
    const [newInterest, setNewInterest] = useState("");

    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
        phone: user?.phone || "",
        institution: user?.institution || "",
        yearOfStudy: user?.yearOfStudy || 1,
        prakriti: user?.prakriti || "",
        currentFocus: user?.currentFocus || "",
        interests: user?.interests || [],
        learningGoals: user?.learningGoals || [],
        social: user?.social || { website: "", linkedin: "", twitter: "" },
    });

    const [notifications, setNotifications] = useState({
        consultationReminders: user?.notifications?.consultationReminders ?? true,
        newStudyMaterials: user?.notifications?.newStudyMaterials ?? true,
        testSeriesResults: user?.notifications?.testSeriesResults ?? false,
        expertAvailability: user?.notifications?.expertAvailability ?? false,
    });

    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: "",
    });

    useEffect(() => {
        authAxios
            .get("/profile/me/stats")
            .then((res) => setStats(res.data.stats))
            .catch(() => { });
    }, [authAxios]);

    const initials = user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAvatarPreview(URL.createObjectURL(file));
        setAvatarFile(file);

        try {
            const fd = new FormData();
            fd.append("avatar", file);

            const res = await authAxios.post("/profile/avatar", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setAvatarPreview(res.data.avatar);
            setAvatarFile(null);
            setMsg({ text: "Avatar updated!", type: "success" });
        } catch (err) {
            setMsg({
                text: err.response?.data?.message || "Avatar upload failed",
                type: "error",
            });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg({ text: "", type: "" });

        try {
            if (avatarFile) {
                const fd = new FormData();
                fd.append("avatar", avatarFile);

                await authAxios.post("/profile/avatar", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            await authAxios.put("/profile/me", form);

            setMsg({ text: "Profile saved!", type: "success" });
            setEditing(false);
        } catch (err) {
            setMsg({
                text: err.response?.data?.message || "Save failed",
                type: "error",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (key) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);

        try {
            await authAxios.put("/profile/notifications", updated);
        } catch { }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) {
            return setMsg({ text: "Passwords don't match", type: "error" });
        }

        if (passwords.new.length < 6) {
            return setMsg({ text: "Min 6 characters", type: "error" });
        }

        try {
            await authAxios.put("/profile/change-password", {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });

            setMsg({ text: "Password changed!", type: "success" });
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err) {
            setMsg({
                text: err.response?.data?.message || "Failed",
                type: "error",
            });
        }
    };

    const addInterest = () => {
        const value = newInterest.trim();

        if (value && !form.interests.includes(value)) {
            setForm({ ...form, interests: [...form.interests, value] });
            setNewInterest("");
        }
    };

    const removeInterest = (tag) => {
        setForm({
            ...form,
            interests: form.interests.filter((i) => i !== tag),
        });
    };

    const tabs = ["overview", "academic", "security", "notifications"];

    const goalStatusColor = {
        "on-track": "bg-emerald-500",
        pending: "bg-amber-500",
        "not-started": "bg-neutral-400",
        completed: "bg-blue-500",
    };

    const goalStatusLabel = {
        "on-track": "On track",
        pending: "Pending",
        "not-started": "Not started",
        completed: "Completed",
    };

    const defaultGoals = [
        {
            title: "Complete BAMS Year 3",
            description: "On track — exams in June",
            status: "on-track",
        },
        {
            title: "Master Nadi Pariksha",
            description: "Booked 3 expert sessions",
            status: "on-track",
        },
        {
            title: "Clinical internship",
            description: "Pending placement",
            status: "pending",
        },
        {
            title: "Research paper",
            description: "Not started yet",
            status: "not-started",
        },
    ];

    const goals =
        form.learningGoals.length > 0 ? form.learningGoals : defaultGoals;

    const statsCards = [
        ["Courses", stats.coursesCompleted, "completed"],
        ["Consultations", stats.consultationsBooked, "booked"],
        ["Downloads", stats.downloadsCount, "resources"],
        ["Wellness Score", 87, "/100"],
    ];

    return (
        <main className="min-h-screen bg-[#F6F8F7] px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
                {/* Sidebar */}
                <aside className="space-y-5">
                    <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center gap-4 lg:block lg:text-center">
                            <div className="relative inline-block shrink-0 lg:mb-4">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="avatar"
                                        className="h-20 w-20 rounded-full border-4 border-emerald-100 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-2xl font-bold text-emerald-700">
                                        {initials}
                                    </div>
                                )}

                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-lg transition hover:bg-emerald-700"
                                    type="button"
                                >
                                    ✎
                                </button>

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-xl font-bold text-slate-950">
                                    {user?.name}
                                </h1>

                                <p className="mt-1 text-sm text-slate-500">
                                    BAMS Student · Year {form.yearOfStudy}
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2 lg:justify-center">
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        Active Scholar
                                    </span>

                                    {user?.isVerified && (
                                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="my-5 h-px bg-slate-100" />

                        <p className="text-sm leading-7 text-slate-600">
                            {form.bio || (
                                <span className="text-slate-400">No bio added yet.</span>
                            )}
                        </p>
                    </section>

                    <section className="hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:block">
                        <h2 className="mb-4 text-sm font-bold text-slate-950">
                            Personal Records
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                ["Official ID", user?.officialId || "—"],
                                ["Contact", user?.email || "—"],
                                ["Institution", form.institution || "—"],
                                ["Timezone", "IST"],
                                ["Prakriti", form.prakriti || "—"],
                                [
                                    "Joined",
                                    user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                                            month: "short",
                                            year: "numeric",
                                        })
                                        : "—",
                                ],
                            ].map(([label, value]) => (
                                <div key={label} className="min-w-0">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {label}
                                    </p>
                                    <p
                                        className={`break-words text-xs font-medium ${label === "Contact" ? "text-blue-700" : "text-slate-700"
                                            }`}
                                    >
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="hidden rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:block">
                        <h2 className="mb-4 text-sm font-bold text-slate-950">Actions</h2>

                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setActiveTab("overview");
                                    setEditing(true);
                                }}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                type="button"
                            >
                                Edit Profile
                            </button>

                            <button
                                onClick={() => setActiveTab("security")}
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                type="button"
                            >
                                Security Settings
                            </button>

                            <button
                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                type="button"
                            >
                                Export Data
                            </button>

                            <button
                                className="w-full rounded-2xl border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                type="button"
                            >
                                Deactivate Account
                            </button>
                        </div>
                    </section>
                </aside>

                {/* Main Content */}
                <section className="min-w-0 space-y-5">
                    {/* Header */}
                    <div className="rounded-[32px] bg-gradient-to-br from-[#062E2A] via-[#0B5B48] to-[#1D9E75] p-5 text-white shadow-[0_24px_80px_rgba(13,92,72,0.22)] sm:p-7">
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-100 ring-1 ring-white/15">
                                    Student Dashboard
                                </p>

                                <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                                    Track your learning, tests, and consultations.
                                </h2>

                                <p className="mt-3 max-w-xl text-sm leading-7 text-white/75">
                                    A complete profile for study progress, test performance,
                                    doctor consultations, and academic records.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setActiveTab("academic");
                                    setEditing(true);
                                }}
                                className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-800 shadow-lg transition hover:scale-[1.02]"
                                type="button"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:overflow-visible">
                        {statsCards.map(([label, value, sub]) => (
                            <div
                                key={label}
                                className="min-w-[150px] rounded-[24px] border border-black/5 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.05)]"
                            >
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    {label}
                                </p>
                                <p className="text-3xl font-black tracking-tight text-slate-950">
                                    {value}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 overflow-x-auto rounded-[24px] bg-white p-2 shadow-[0_16px_50px_rgba(15,23,42,0.04)]">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold capitalize transition ${activeTab === tab
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                type="button"
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {msg.text && (
                        <div
                            className={`rounded-2xl px-4 py-3 text-sm font-semibold ${msg.type === "success"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {msg.text}
                        </div>
                    )}

                    {/* Overview */}
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                                <div className="mb-5 flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-950">
                                        Certification Progress
                                    </h3>

                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                        In Progress
                                    </span>
                                </div>

                                <div className="flex items-center gap-5">
                                    <svg
                                        width="92"
                                        height="92"
                                        viewBox="0 0 80 80"
                                        className="shrink-0"
                                    >
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="30"
                                            fill="none"
                                            stroke="#ECFDF5"
                                            strokeWidth="10"
                                        />
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="30"
                                            fill="none"
                                            stroke="#10B981"
                                            strokeWidth="10"
                                            strokeDasharray={`${(stats.certificationProgress / 100) * 188.4
                                                } 188.4`}
                                            strokeDashoffset="47.1"
                                            strokeLinecap="round"
                                            transform="rotate(-90 40 40)"
                                        />
                                        <text
                                            x="40"
                                            y="45"
                                            textAnchor="middle"
                                            fontSize="16"
                                            fontWeight="800"
                                            fill="#0F172A"
                                        >
                                            {stats.certificationProgress}%
                                        </text>
                                    </svg>

                                    <div>
                                        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                            Next Milestone
                                        </p>
                                        <p className="text-lg font-black text-slate-950">
                                            Clinical Theory
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            3 modules remaining
                                        </p>
                                    </div>
                                </div>

                                <button
                                    className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                                    type="button"
                                >
                                    Resume Learning
                                </button>
                            </div>

                            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-950">
                                        Learning Goals
                                    </h3>

                                    {editing && (
                                        <button
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    learningGoals: [
                                                        ...form.learningGoals,
                                                        {
                                                            title: "New goal",
                                                            description: "",
                                                            status: "not-started",
                                                        },
                                                    ],
                                                })
                                            }
                                            className="text-sm font-bold text-emerald-600"
                                            type="button"
                                        >
                                            + Add
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {goals.map((goal, i) => (
                                        <div
                                            key={i}
                                            className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                                        >
                                            <span
                                                className={`mt-1 h-3 w-3 shrink-0 rounded-full ${goalStatusColor[goal.status] || "bg-slate-400"
                                                    }`}
                                            />

                                            <div className="min-w-0 flex-1">
                                                {editing ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            value={goal.title}
                                                            onChange={(e) => {
                                                                const g = [...form.learningGoals];
                                                                g[i].title = e.target.value;
                                                                setForm({ ...form, learningGoals: g });
                                                            }}
                                                            className={inputClass}
                                                        />

                                                        <select
                                                            value={goal.status}
                                                            onChange={(e) => {
                                                                const g = [...form.learningGoals];
                                                                g[i].status = e.target.value;
                                                                setForm({ ...form, learningGoals: g });
                                                            }}
                                                            className={inputClass}
                                                        >
                                                            {Object.keys(goalStatusColor).map((s) => (
                                                                <option key={s} value={s}>
                                                                    {goalStatusLabel[s]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="font-bold text-slate-900">
                                                            {goal.title}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            {goal.description}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:col-span-2">
                                <h3 className="mb-4 text-base font-black text-slate-950">
                                    Recent Activity
                                </h3>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    {[
                                        ["Last Test", "Dravyaguna MCQ", "Score 72%"],
                                        ["Recent Material", "Rachana Sharir Notes", "Opened today"],
                                        ["Consultation", "Doctor session", "2 bookings"],
                                    ].map(([title, desc, meta]) => (
                                        <div
                                            key={title}
                                            className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                                        >
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                                {title}
                                            </p>
                                            <p className="mt-2 font-black text-slate-950">{desc}</p>
                                            <p className="mt-1 text-sm text-slate-500">{meta}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Academic */}
                    {activeTab === "academic" && (
                        <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-base font-black text-slate-950">
                                    Academic Profile
                                </h3>

                                {!editing ? (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                                        type="button"
                                    >
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                            type="button"
                                        >
                                            {saving ? "Saving..." : "Save"}
                                        </button>

                                        <button
                                            onClick={() => setEditing(false)}
                                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                                            type="button"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                {[
                                    ["Full Name", "name", "text"],
                                    ["Phone", "phone", "text"],
                                    ["Institution", "institution", "text"],
                                    ["Prakriti Constitution", "prakriti", "text"],
                                    ["Year Of Study", "yearOfStudy", "number"],
                                ].map(([label, key, type]) => (
                                    <div key={key}>
                                        <p className={labelClass}>{label}</p>

                                        {editing ? (
                                            <input
                                                type={type}
                                                value={form[key]}
                                                onChange={(e) =>
                                                    setForm({ ...form, [key]: e.target.value })
                                                }
                                                className={inputClass}
                                            />
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-800">
                                                {form[key] || "—"}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="my-6 h-px bg-slate-100" />

                            <div>
                                <p className={labelClass}>Bio</p>

                                {editing ? (
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) =>
                                            setForm({ ...form, bio: e.target.value })
                                        }
                                        rows={4}
                                        className={inputClass}
                                    />
                                ) : (
                                    <p className="text-sm leading-7 text-slate-700">
                                        {form.bio || "—"}
                                    </p>
                                )}
                            </div>

                            <div className="my-6 h-px bg-slate-100" />

                            <div>
                                <p className={labelClass}>Current Focus</p>

                                {editing ? (
                                    <input
                                        value={form.currentFocus}
                                        onChange={(e) =>
                                            setForm({ ...form, currentFocus: e.target.value })
                                        }
                                        className={inputClass}
                                    />
                                ) : (
                                    <p className="text-sm font-semibold text-slate-800">
                                        {form.currentFocus || "—"}
                                    </p>
                                )}
                            </div>

                            <div className="my-6 h-px bg-slate-100" />

                            <div>
                                <p className={labelClass}>Academic Interests</p>

                                <div className="mb-3 flex flex-wrap gap-2">
                                    {form.interests.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600"
                                        >
                                            {tag}

                                            {editing && (
                                                <button
                                                    onClick={() => removeInterest(tag)}
                                                    className="text-red-500"
                                                    type="button"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    ))}
                                </div>

                                {editing && (
                                    <div className="flex gap-2">
                                        <input
                                            value={newInterest}
                                            onChange={(e) => setNewInterest(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addInterest()}
                                            placeholder="Add interest..."
                                            className={inputClass}
                                        />

                                        <button
                                            onClick={addInterest}
                                            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
                                            type="button"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                        <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                            <h3 className="mb-5 text-base font-black text-slate-950">
                                Change Password
                            </h3>

                            <div className="max-w-md space-y-4">
                                {[
                                    ["Current Password", "current"],
                                    ["New Password", "new"],
                                    ["Confirm New Password", "confirm"],
                                ].map(([label, key]) => (
                                    <div key={key}>
                                        <p className={labelClass}>{label}</p>

                                        <input
                                            type="password"
                                            value={passwords[key]}
                                            onChange={(e) =>
                                                setPasswords({ ...passwords, [key]: e.target.value })
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                ))}

                                <button
                                    onClick={handlePasswordChange}
                                    className="w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                                    type="button"
                                >
                                    Update Password
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === "notifications" && (
                        <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
                            <h3 className="mb-5 text-base font-black text-slate-950">
                                Notification Preferences
                            </h3>

                            <div className="space-y-4">
                                {[
                                    [
                                        "consultationReminders",
                                        "Consultation Reminders",
                                        "Upcoming session alerts",
                                    ],
                                    [
                                        "newStudyMaterials",
                                        "New Study Materials",
                                        "Weekly content digest",
                                    ],
                                    [
                                        "testSeriesResults",
                                        "Test Series Results",
                                        "Score and rank updates",
                                    ],
                                    [
                                        "expertAvailability",
                                        "Expert Availability",
                                        "Slot opening alerts",
                                    ],
                                ].map(([key, label, sub]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-950">{label}</p>
                                            <p className="mt-1 text-sm text-slate-500">{sub}</p>
                                        </div>

                                        <button
                                            onClick={() => handleNotificationToggle(key)}
                                            className={`relative h-7 w-12 shrink-0 rounded-full transition ${notifications[key] ? "bg-emerald-600" : "bg-slate-300"
                                                }`}
                                            type="button"
                                        >
                                            <span
                                                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${notifications[key] ? "left-6" : "left-1"
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

const inputClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const labelClass =
    "mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400";