"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export default function ProfilePage() {
    return <ProtectedRoute><ProfileContent /></ProtectedRoute>;
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400";

function ProfileContent() {
    const { user, authAxios } = useAuth();

    const [stats, setStats] = useState({ consultationsBooked: 0, downloadsCount: 0 });
    const [activeTab, setActiveTab] = useState("profile");
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
    const [newInterest, setNewInterest] = useState("");
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: user?.name || "",
        bio: user?.bio || "",
        phone: user?.phone || "",
        institution: user?.institution || "",
        yearOfStudy: user?.yearOfStudy || 1,
        interests: user?.interests || [],
    });

    const [notifications, setNotifications] = useState({
        consultationReminders: user?.notifications?.consultationReminders ?? true,
        newStudyMaterials: user?.notifications?.newStudyMaterials ?? true,
        testSeriesResults: user?.notifications?.testSeriesResults ?? false,
        expertAvailability: user?.notifications?.expertAvailability ?? false,
    });

    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });

    useEffect(() => {
        authAxios.get("/profile/me/stats")
            .then((res) => setStats(res.data.stats))
            .catch(() => { });
    }, [authAxios]);

    const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

    const showMsg = (text, type) => {
        setMsg({ text, type });
        setTimeout(() => setMsg({ text: "", type: "" }), 3000);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarPreview(URL.createObjectURL(file));
        try {
            const fd = new FormData();
            fd.append("avatar", file);
            const res = await authAxios.post("/profile/avatar", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setAvatarPreview(res.data.avatar);
            showMsg("Avatar updated!", "success");
        } catch (err) {
            showMsg(err.response?.data?.message || "Upload failed", "error");
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await authAxios.put("/profile/me", form);
            showMsg("Profile saved!", "success");
            setEditing(false);
        } catch (err) {
            showMsg(err.response?.data?.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (key) => {
        const updated = { ...notifications, [key]: !notifications[key] };
        setNotifications(updated);
        try { await authAxios.put("/profile/notifications", updated); } catch { }
    };

    const handlePasswordChange = async () => {
        if (passwords.new !== passwords.confirm) return showMsg("Passwords don't match", "error");
        if (passwords.new.length < 6) return showMsg("Min 6 characters", "error");
        try {
            await authAxios.put("/profile/change-password", {
                currentPassword: passwords.current,
                newPassword: passwords.new,
            });
            showMsg("Password updated!", "success");
            setPasswords({ current: "", new: "", confirm: "" });
        } catch (err) {
            showMsg(err.response?.data?.message || "Failed", "error");
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
        setForm({ ...form, interests: form.interests.filter((i) => i !== tag) });
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* ── Profile card ── */}
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">

                        {/* Avatar */}
                        <div className="relative shrink-0 self-start sm:self-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="avatar"
                                    className="h-20 w-20 rounded-full border-4 border-emerald-100 object-cover" />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-2xl font-bold text-emerald-700">
                                    {initials}
                                </div>
                            )}
                            <button onClick={() => fileRef.current?.click()}
                                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow transition hover:bg-emerald-700"
                                type="button">
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                                {user?.isVerified && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Verified</span>
                                )}
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 capitalize">{user?.role}</span>
                            </div>
                            <p className="text-sm text-slate-500">{user?.email}</p>
                            {user?.officialId && (
                                <p className="mt-1 text-xs text-slate-400 font-mono">{user.officialId}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 sm:gap-6 shrink-0">
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">{stats.consultationsBooked}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Sessions</p>
                            </div>
                            <div className="w-px bg-slate-100" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">{stats.downloadsCount}</p>
                                <p className="text-xs text-slate-400 mt-0.5">Downloads</p>
                            </div>
                            <div className="w-px bg-slate-100" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Joined</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-1 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5 overflow-x-auto">
                    {["profile", "security", "notifications"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-max rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${activeTab === tab ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
                            type="button">
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Message ── */}
                {msg.text && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {msg.text}
                    </div>
                )}

                {/* ── Profile tab ── */}
                {activeTab === "profile" && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                            {!editing ? (
                                <button onClick={() => setEditing(true)}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                    type="button">
                                    Edit
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleSave} disabled={saving}
                                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                                        type="button">
                                        {saving ? "Saving…" : "Save"}
                                    </button>
                                    <button onClick={() => setEditing(false)}
                                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                                        type="button">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            {[
                                ["Full Name", "name", "text"],
                                ["Phone", "phone", "text"],
                                ["Institution", "institution", "text"],
                                ["Year of Study", "yearOfStudy", "number"],
                            ].map(([label, key, type]) => (
                                <div key={key}>
                                    <label className={labelClass}>{label}</label>
                                    {editing ? (
                                        <input type={type} value={form[key]}
                                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                            className={inputClass} />
                                    ) : (
                                        <p className="text-sm font-medium text-slate-800">{form[key] || <span className="text-slate-400">—</span>}</p>
                                    )}
                                </div>
                            ))}

                            {/* Bio — full width */}
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Bio</label>
                                {editing ? (
                                    <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                        rows={3} className={inputClass} placeholder="Tell us about yourself…" />
                                ) : (
                                    <p className="text-sm text-slate-700 leading-relaxed">{form.bio || <span className="text-slate-400">—</span>}</p>
                                )}
                            </div>

                            {/* Interests — full width */}
                            <div className="sm:col-span-2">
                                <label className={labelClass}>Academic Interests</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {form.interests.length === 0 && !editing && (
                                        <span className="text-sm text-slate-400">—</span>
                                    )}
                                    {form.interests.map((tag) => (
                                        <span key={tag}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-600">
                                            {tag}
                                            {editing && (
                                                <button onClick={() => removeInterest(tag)}
                                                    className="text-slate-400 hover:text-red-500 transition"
                                                    type="button">×</button>
                                            )}
                                        </span>
                                    ))}
                                </div>
                                {editing && (
                                    <div className="flex gap-2">
                                        <input value={newInterest} onChange={(e) => setNewInterest(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addInterest()}
                                            placeholder="Add interest…" className={inputClass} />
                                        <button onClick={addInterest}
                                            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                                            type="button">Add</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Security tab ── */}
                {activeTab === "security" && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                        <h2 className="mb-6 text-base font-bold text-slate-900">Change Password</h2>
                        <div className="max-w-sm space-y-4">
                            {[
                                ["Current Password", "current"],
                                ["New Password", "new"],
                                ["Confirm New Password", "confirm"],
                            ].map(([label, key]) => (
                                <div key={key}>
                                    <label className={labelClass}>{label}</label>
                                    <input type="password" value={passwords[key]}
                                        onChange={(e) => setPasswords({ ...passwords, [key]: e.target.value })}
                                        className={inputClass} />
                                </div>
                            ))}
                            <button onClick={handlePasswordChange}
                                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                type="button">
                                Update Password
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Notifications tab ── */}
                {activeTab === "notifications" && (
                    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                        <h2 className="mb-6 text-base font-bold text-slate-900">Notification Preferences</h2>
                        <div className="divide-y divide-slate-100">
                            {[
                                ["consultationReminders", "Consultation Reminders", "Alerts before upcoming sessions"],
                                ["newStudyMaterials", "New Study Materials", "Weekly content digest"],
                                ["testSeriesResults", "Test Results", "Score and rank updates"],
                                ["expertAvailability", "Expert Availability", "Slot opening alerts"],
                            ].map(([key, label, sub]) => (
                                <div key={key} className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                                    </div>
                                    <button onClick={() => handleNotificationToggle(key)}
                                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notifications[key] ? "bg-emerald-600" : "bg-slate-200"}`}
                                        type="button">
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${notifications[key] ? "left-5" : "left-0.5"}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}