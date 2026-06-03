"use client";

import { useState, useEffect } from "react";
import { useToast } from "./Toast";
import { useConfirm } from "./ConfirmModal";

/**
 * SubjectManagerModal
 * A single place to create, edit, and delete subjects — with structured
 * (row-based) term and chapter editing instead of fragile textarea parsing.
 *
 * Props:
 *   authAxios  – axios instance from useAuth()
 *   onClose()  – close the modal
 *   onSaved()  – called after any successful create / update / delete
 *
 * Backend contract:
 *   GET    /subjects           -> { subjects: [{ _id, name, icon?, terms:[string], chapters:[{term,name}] }] }
 *   POST   /subjects           { name, icon, terms, chapters }
 *   PUT    /subjects/:id        { name, icon, terms, chapters }
 *   DELETE /subjects/:id        (NEW — must be added server-side)
 */
export default function SubjectManagerModal({ authAxios, onClose, onSaved }) {
    const { showToast, ToastElement } = useToast();
    const { confirm, ConfirmElement } = useConfirm();

    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null); // null = nothing | "new" = creating | <id> = editing
    const [draft, setDraft] = useState(null);            // { name, icon, terms:[], chapters:[{_uid,term,name}] }
    const [saving, setSaving] = useState(false);
    const [newTerm, setNewTerm] = useState("");

    const uid = () => Math.random().toString(36).slice(2, 9);

    useEffect(() => { loadSubjects(); }, []);

    const loadSubjects = async () => {
        setLoading(true);
        try {
            const r = await authAxios.get("/subjects");
            setSubjects(r.data.subjects || []);
        } catch {
            showToast("Couldn't load subjects", "error");
        } finally {
            setLoading(false);
        }
    };

    // ── Selection ────────────────────────────────────────────────────────────
    const editSubject = (s) => {
        setSelectedId(s._id);
        setDraft({
            name: s.name || "",
            icon: s.icon || "📘",
            terms: [...(s.terms || [])],
            chapters: (s.chapters || []).map((c) => ({ _uid: uid(), term: c.term || "", name: c.name || "" })),
        });
        setNewTerm("");
    };

    const startNew = () => {
        setSelectedId("new");
        setDraft({ name: "", icon: "📘", terms: ["Term 1", "Term 2"], chapters: [] });
        setNewTerm("");
    };

    // ── Term ops ─────────────────────────────────────────────────────────────
    const addTerm = () => {
        const t = newTerm.trim();
        if (!t) return;
        if (draft.terms.includes(t)) return showToast("That term already exists", "info");
        setDraft((d) => ({ ...d, terms: [...d.terms, t] }));
        setNewTerm("");
    };

    const removeTerm = async (term) => {
        const usedBy = draft.chapters.filter((c) => c.term === term).length;
        const msg = usedBy > 0
            ? `Remove "${term}"? ${usedBy} chapter${usedBy > 1 ? "s" : ""} will become unassigned (you can reassign them before saving).`
            : `Remove the term "${term}"?`;
        if (!(await confirm(msg))) return;
        setDraft((d) => ({
            ...d,
            terms: d.terms.filter((t) => t !== term),
            chapters: d.chapters.map((c) => (c.term === term ? { ...c, term: "" } : c)),
        }));
    };

    // ── Chapter ops ──────────────────────────────────────────────────────────
    const addChapter = () =>
        setDraft((d) => ({
            ...d,
            chapters: [...d.chapters, { _uid: uid(), term: d.terms[0] || "", name: "" }],
        }));

    const patchChapter = (uidKey, patch) =>
        setDraft((d) => ({
            ...d,
            chapters: d.chapters.map((c) => (c._uid === uidKey ? { ...c, ...patch } : c)),
        }));

    const removeChapter = (uidKey) =>
        setDraft((d) => ({ ...d, chapters: d.chapters.filter((c) => c._uid !== uidKey) }));

    // ── Persist ──────────────────────────────────────────────────────────────
    const save = async () => {
        if (!draft.name.trim()) return showToast("Subject name is required", "error");
        const cleanedChapters = draft.chapters
            .map((c) => ({ term: c.term, name: c.name.trim() }))
            .filter((c) => c.name);
        const dupe = cleanedChapters.find((c, i) =>
            cleanedChapters.findIndex((x) => x.name === c.name && x.term === c.term) !== i
        );
        if (dupe) return showToast(`Duplicate chapter: "${dupe.name}"`, "error");

        const payload = { name: draft.name.trim(), icon: draft.icon, terms: draft.terms, chapters: cleanedChapters };
        setSaving(true);
        try {
            if (selectedId === "new") {
                await authAxios.post("/subjects", payload);
                showToast("Subject created", "success");
            } else {
                await authAxios.put(`/subjects/${selectedId}`, payload);
                showToast("Subject updated", "success");
            }
            await loadSubjects();
            onSaved?.();
            setSelectedId(null);
            setDraft(null);
        } catch (e) {
            showToast(e.response?.data?.message || "Save failed", "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteSubject = async () => {
        const ok = await confirm(
            `Remove "${draft.name}"? It will be hidden from all dropdowns but existing tests and questions that reference it will not be affected.`
        );
        if (!ok) return;
        setSaving(true);
        try {
            await authAxios.delete(`/subjects/${selectedId}`);
            showToast("Subject removed", "success");
            await loadSubjects();
            onSaved?.();
            setSelectedId(null);
            setDraft(null);
        } catch (e) {
            showToast(e.response?.data?.message || "Remove failed", "error");
        } finally {
            setSaving(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={overlay}>
            <div style={shell}>
                {/* Header */}
                <div style={header}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>Manage Subjects</h2>
                    <button onClick={onClose} style={closeBtn}>×</button>
                </div>

                <div style={body}>
                    {/* Sidebar list */}
                    <div style={sidebar}>
                        <button onClick={startNew} style={{ ...primaryBtn, width: "100%", marginBottom: 10 }}>
                            + New Subject
                        </button>
                        {loading ? (
                            <p style={muted}>Loading…</p>
                        ) : subjects.length === 0 ? (
                            <p style={muted}>No subjects yet.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {subjects.map((s) => (
                                    <button
                                        key={s._id}
                                        onClick={() => editSubject(s)}
                                        style={{
                                            ...listItem,
                                            background: selectedId === s._id ? "rgba(29,158,117,0.1)" : "transparent",
                                            border: `1px solid ${selectedId === s._id ? "#1D9E75" : "transparent"}`,
                                        }}
                                    >
                                        <span style={{ fontSize: 16 }}>{s.icon || "📘"}</span>
                                        <span style={{ flex: 1, minWidth: 0 }}>
                                            <span style={listName}>{s.name}</span>
                                            <span style={listMeta}>
                                                {(s.chapters?.length || 0)} ch · {(s.terms?.length || 0)} terms
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Editor */}
                    <div style={editor}>
                        {!draft ? (
                            <div style={emptyState}>
                                <p style={{ fontSize: 30, margin: "0 0 8px" }}>📚</p>
                                <p style={{ fontSize: 13, color: "#9ca3af" }}>
                                    Select a subject to edit, or create a new one.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Name + icon */}
                                <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                                    <div style={{ width: 60 }}>
                                        <label style={lbl}>Icon</label>
                                        <input
                                            value={draft.icon}
                                            onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
                                            style={{ ...inp, textAlign: "center", fontSize: 18 }}
                                            maxLength={2}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={lbl}>Subject Name</label>
                                        <input
                                            value={draft.name}
                                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                                            style={inp}
                                            placeholder="e.g. Rog Nidana"
                                        />
                                    </div>
                                </div>

                                {/* Terms */}
                                <label style={lbl}>Terms</label>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                                    {draft.terms.length === 0 && <span style={muted}>No terms yet.</span>}
                                    {draft.terms.map((t) => (
                                        <span key={t} style={chip}>
                                            {t}
                                            <button onClick={() => removeTerm(t)} style={chipX} title="Remove term">×</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
                                    <input
                                        value={newTerm}
                                        onChange={(e) => setNewTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTerm())}
                                        style={{ ...inp, flex: 1, margin: 0 }}
                                        placeholder="Add a term (e.g. Term 3)"
                                    />
                                    <button onClick={addTerm} style={secondaryBtn}>Add</button>
                                </div>

                                {/* Chapters */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <label style={{ ...lbl, marginBottom: 0 }}>Chapters ({draft.chapters.length})</label>
                                    <button onClick={addChapter} style={miniBtn}>+ Add chapter</button>
                                </div>
                                <div style={chapterScroll}>
                                    {draft.chapters.length === 0 ? (
                                        <p style={{ ...muted, padding: "12px 0" }}>No chapters. Click “+ Add chapter”.</p>
                                    ) : (
                                        draft.chapters.map((c) => (
                                            <div key={c._uid} style={chapterRow}>
                                                <select
                                                    value={c.term}
                                                    onChange={(e) => patchChapter(c._uid, { term: e.target.value })}
                                                    style={{ ...inp, width: 120, margin: 0, flexShrink: 0 }}
                                                >
                                                    <option value="">— No term —</option>
                                                    {draft.terms.map((t) => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                                <input
                                                    value={c.name}
                                                    onChange={(e) => patchChapter(c._uid, { name: e.target.value })}
                                                    style={{ ...inp, flex: 1, margin: 0 }}
                                                    placeholder="Chapter name"
                                                />
                                                <button onClick={() => removeChapter(c._uid)} style={rowX} title="Delete chapter">×</button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Footer actions */}
                                <div style={footer}>
                                    {selectedId !== "new" && (
                                        <button onClick={deleteSubject} disabled={saving} style={dangerBtn}>
                                            Remove Subject
                                        </button>
                                    )}
                                    <div style={{ flex: 1 }} />
                                    <button onClick={() => { setSelectedId(null); setDraft(null); }} style={cancelBtn}>
                                        Cancel
                                    </button>
                                    <button onClick={save} disabled={saving} style={primaryBtn}>
                                        {saving ? "Saving…" : selectedId === "new" ? "Create Subject" : "Save Changes"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {ConfirmElement}
            {ToastElement}
        </div>
    );
}

// ── Styles (matched to the existing admin aesthetic) ─────────────────────────
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 };
const shell = { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column", border: "0.5px solid rgba(0,0,0,0.1)", overflow: "hidden" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" };
const closeBtn = { background: "transparent", border: "none", color: "#9ca3af", fontSize: 22, cursor: "pointer", lineHeight: 1 };
const body = { display: "flex", flex: 1, minHeight: 0 };
const sidebar = { width: 240, flexShrink: 0, borderRight: "1px solid #f3f4f6", padding: 16, overflowY: "auto" };
const editor = { flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column" };
const emptyState = { margin: "auto", textAlign: "center" };
const listItem = { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, cursor: "pointer", textAlign: "left", fontFamily: "inherit" };
const listName = { display: "block", fontSize: 13, fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const listMeta = { display: "block", fontSize: 10, color: "#9ca3af" };
const chapterScroll = { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "2px", marginBottom: 16, maxHeight: 280 };
const chapterRow = { display: "flex", alignItems: "center", gap: 8 };
const chip = { display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 6px 5px 12px", borderRadius: 20, background: "rgba(29,158,117,0.12)", color: "#0F6E56", fontSize: 12, fontWeight: 500 };
const chipX = { background: "rgba(0,0,0,0.06)", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", color: "#6b7280", fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" };
const rowX = { background: "transparent", border: "0.5px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, width: 34, height: 38, cursor: "pointer", fontSize: 18, flexShrink: 0, fontFamily: "inherit" };
const footer = { display: "flex", gap: 10, alignItems: "center", marginTop: "auto", paddingTop: 16, borderTop: "1px solid #f3f4f6" };
const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#f8fafc", color: "#111827", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const muted = { fontSize: 12, color: "#9ca3af", margin: 0 };
const primaryBtn = { padding: "9px 20px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const secondaryBtn = { padding: "9px 18px", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const cancelBtn = { padding: "9px 18px", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#6b7280", cursor: "pointer", fontFamily: "inherit", fontSize: 13 };
const dangerBtn = { padding: "9px 18px", borderRadius: 10, border: "0.5px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const miniBtn = { padding: "5px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#1D9E75", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };