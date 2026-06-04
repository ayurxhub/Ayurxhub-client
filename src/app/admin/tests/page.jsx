"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import SubjectManagerModal from "../../components/SubjectManagerModal"; // ← NEW

// ─── Keep these for QuestionFormModal (it still uses hardcoded lists) ─────────
const SUBJECTS = [
    "Dravyaguna", "Kayachikitsa", "Panchakarma", "Shalya Tantra",
    "Rasayana", "Anatomy", "Pharmacology", "Diagnosis",
    "Prasuti Tantra", "Kaumarabhritya", "General Ayurveda",
    "Swasthavritta evam Yoga",
];
const DIFFICULTIES = ["easy", "medium", "hard"];
const TERMS = ["Term 1", "Term 2"];
const SWASTHA_CHAPTERS = [
    "Chapter 1 - Swastha and Swasthya", "Chapter 2 - Healthy Life Style - Dinacharya",
    "Chapter 3 - Ratricharya", "Chapter 4 - Ritucharya", "Chapter 5 - Roganutpadaniya",
    "Chapter 6 - Sadvritta", "Chapter 7 - Ahara", "Chapter 8 - Rasayana for Swastha",
    "Chapter 11 - Janapadodhwamsa / Maraka Vyadhi", "Chapter 12 - Environmental Health",
    "Chapter 13 - Disaster Management", "Chapter 14 - Occupational Health",
    "Chapter 15 - School Health Services", "Chapter 16 - Disinfection",
    "Chapter 17 - Primary Health Care", "Chapter 18 - Mother and Child Health Care",
    "Chapter 19 - Family Welfare Programme", "Chapter 20 - Preventive Geriatrics",
    "Chapter 21 - WHO and International Health Agencies", "Chapter 22 - Vital Statistics",
    "Chapter 23 - Health Administration", "Chapter 24 - National Health Programmes",
    "Chapter 25 - National Health Policy",
];

export default function AdminTestsPage() {
    const { authAxios } = useAuth();
    const [tab, setTab] = useState("tests");
    const [tests, setTests] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTestForm, setShowTestForm] = useState(false);
    const [showQForm, setShowQForm] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showSubjects, setShowSubjects] = useState(false); // ← RENAMED (was showSubjectForm)
    const [editingTest, setEditingTest] = useState(null);
    const [editingQ, setEditingQ] = useState(null);
    const [qFilter, setQFilter] = useState({ subject: "", term: "", chapter: "", approved: "" });
    const [filterSubjects, setFilterSubjects] = useState([]); // dynamic subjects for question filter

    useEffect(() => { loadAll(); }, [tab]);

    useEffect(() => {
        authAxios.get("/subjects").then(r => setFilterSubjects(r.data.subjects || [])).catch(() => { });
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            if (tab === "tests") {
                const res = await authAxios.get("/tests/admin");
                setTests(res.data.tests || []);
            } else {
                const params = new URLSearchParams();
                if (qFilter.subject) params.append("subject", qFilter.subject);
                if (qFilter.term) params.append("term", qFilter.term);
                if (qFilter.chapter) params.append("chapter", qFilter.chapter);
                if (qFilter.approved !== "") params.append("approved", qFilter.approved);
                params.append("limit", "100");
                const res = await authAxios.get(`/tests/questions?${params.toString()}`);
                setQuestions(res.data.questions || []);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const togglePublish = async (id) => { await authAxios.put(`/tests/${id}/publish`); loadAll(); };
    const deleteTest = async (id) => { if (!window.confirm("Delete this test?")) return; await authAxios.delete(`/tests/${id}`); loadAll(); };
    const approveQ = async (id) => { await authAxios.put(`/tests/questions/${id}/approve`); loadAll(); };
    const deleteQ = async (id) => { if (!window.confirm("Delete this question?")) return; await authAxios.delete(`/tests/questions/${id}`); loadAll(); };
    const openQuestionForm = () => { setEditingQ(null); setShowQForm(true); };
    const openTestForm = () => { setEditingTest(null); setShowTestForm(true); };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 500, color: "#111827", margin: "0 0 4px" }}>Test Series</h1>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Manage tests and question bank</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    {/* ↓ CHANGED: was "tab === questions" only; now always visible, label changed */}
                    <button onClick={() => setShowSubjects(true)} style={secondaryBtn}>📚 Subjects</button>
                    {tab === "questions" && (
                        <button onClick={() => setShowBulkUpload(true)} style={secondaryBtn}>📄 Bulk Upload</button>
                    )}
                    <button onClick={tab === "tests" ? openTestForm : openQuestionForm} style={primaryBtn}>
                        + {tab === "tests" ? "New Test" : "Add Question"}
                    </button>
                </div>
            </div>

            <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 10, padding: 4, width: "fit-content", marginBottom: 20 }}>
                {["tests", "questions"].map(t => (
                    <button key={t} onClick={() => setTab(t)} style={{
                        padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontFamily: "inherit", fontSize: 12, fontWeight: 500, textTransform: "capitalize",
                        background: tab === t ? "#1D9E75" : "transparent",
                        color: tab === t ? "#fff" : "#6b7280", transition: "all 0.15s",
                    }}>
                        {t === "tests" ? "📋 Tests" : "❓ Questions"}
                    </button>
                ))}
            </div>

            {tab === "questions" && (
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    {/* Subject — dynamic from DB */}
                    <select value={qFilter.subject} onChange={e => setQFilter(f => ({ ...f, subject: e.target.value, term: "", chapter: "" }))} style={smallSelect}>
                        <option value="">All Subjects</option>
                        {filterSubjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                    </select>
                    {/* Term — dynamic from selected subject */}
                    <select value={qFilter.term} onChange={e => setQFilter(f => ({ ...f, term: e.target.value, chapter: "" }))} style={smallSelect}>
                        <option value="">All Terms</option>
                        {(filterSubjects.find(s => s.name === qFilter.subject)?.terms || []).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    {/* Chapter — dynamic from selected subject + term */}
                    <select value={qFilter.chapter} onChange={e => setQFilter(f => ({ ...f, chapter: e.target.value }))} style={smallSelect}>
                        <option value="">All Chapters</option>
                        {(filterSubjects.find(s => s.name === qFilter.subject)?.chapters || [])
                            .filter(c => !qFilter.term || c.term === qFilter.term)
                            .map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                        }
                    </select>
                    <select value={qFilter.approved} onChange={e => setQFilter(f => ({ ...f, approved: e.target.value }))} style={smallSelect}>
                        <option value="">All Status</option>
                        <option value="true">Approved</option>
                        <option value="false">Pending</option>
                    </select>
                    <button onClick={loadAll} style={filterBtn}>Apply</button>
                </div>
            )}

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #1D9E75", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                </div>
            ) : tab === "tests" ? (
                <TestsList tests={tests} togglePublish={togglePublish} deleteTest={deleteTest}
                    editTest={(test) => { setEditingTest(test); setShowTestForm(true); }} />
            ) : (
                <QuestionsList questions={questions} approveQ={approveQ} deleteQ={deleteQ}
                    editQ={(q) => { setEditingQ(q); setShowQForm(true); }} />
            )}

            {showTestForm && <TestFormModal authAxios={authAxios} editing={editingTest} onClose={() => setShowTestForm(false)} onSaved={loadAll} />}
            {showQForm && <QuestionFormModal authAxios={authAxios} editing={editingQ} onClose={() => setShowQForm(false)} onSaved={loadAll} />}
            {showBulkUpload && <BulkUploadModal authAxios={authAxios} onClose={() => setShowBulkUpload(false)} onSaved={loadAll} />}

            {/* ↓ CHANGED: was SubjectFormModal (old inline function) → now SubjectManagerModal from separate file */}
            {showSubjects && (
                <SubjectManagerModal
                    authAxios={authAxios}
                    onClose={() => setShowSubjects(false)}
                    onSaved={loadAll}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ─── No changes below this line — everything kept exactly as before ────────────

function TestsList({ tests, togglePublish, deleteTest, editTest }) {
    if (tests.length === 0) return <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>No tests yet. Create one above.</p>;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tests.map(test => (
                <div key={test._id} style={cardRow}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: test.type === "free" ? "rgba(29,158,117,0.15)" : "rgba(59,130,246,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {test.type === "free" ? "🆓" : "⭐"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{test.title}</p>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <span style={mutedText}>{test.subject}</span>
                            {test.term && <span style={mutedText}>· {test.term}</span>}
                            {test.chapter && <span style={mutedText}>· {test.chapter}</span>}
                            <span style={mutedText}>· {test.totalQuestions} Qs</span>
                            <span style={mutedText}>· {test.duration} min</span>
                            <span style={mutedText}>· {test.attempts || 0} attempts</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: test.isPublished ? "rgba(29,158,117,0.2)" : "rgba(74,85,104,0.3)", color: test.isPublished ? "#1D9E75" : "#718096" }}>
                            {test.isPublished ? "Published" : "Draft"}
                        </span>
                        <button onClick={() => togglePublish(test._id)} style={miniBtn}>{test.isPublished ? "Unpublish" : "Publish"}</button>
                        <button onClick={() => editTest(test)} style={miniBtn}>Edit</button>
                        <button onClick={() => deleteTest(test._id)} style={dangerMiniBtn}>Delete</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function QuestionsList({ questions, approveQ, deleteQ, editQ }) {
    if (questions.length === 0) return <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>No questions found.</p>;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {questions.map((q, i) => (
                <div key={q._id} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, color: "#111827", margin: "0 0 6px", lineHeight: 1.5 }}>{i + 1}. {q.text}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                                {(q.options || []).map((opt, idx) => (
                                    <div key={idx} style={{ fontSize: 11, color: q.correctIndex === idx ? "#1D9E75" : "#9ca3af", background: q.correctIndex === idx ? "rgba(29,158,117,0.12)" : "rgba(255,255,255,0.03)", padding: "5px 8px", borderRadius: 7 }}>
                                        {["A", "B", "C", "D"][idx]}. {opt}
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <span style={pillGreen}>{q.subject}</span>
                                {q.term && <span style={pillDark}>{q.term}</span>}
                                {q.chapter && <span style={pillDark}>{q.chapter}</span>}
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: q.difficulty === "hard" ? "rgba(239,68,68,0.15)" : q.difficulty === "easy" ? "rgba(29,158,117,0.15)" : "rgba(234,179,8,0.15)", color: q.difficulty === "hard" ? "#ef4444" : q.difficulty === "easy" ? "#1D9E75" : "#ca8a04" }}>{q.difficulty}</span>
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: q.isApproved ? "rgba(29,158,117,0.15)" : "rgba(234,179,8,0.15)", color: q.isApproved ? "#1D9E75" : "#ca8a04" }}>{q.isApproved ? "✓ Approved" : "⏳ Pending"}</span>
                                <span style={{ fontSize: 10, color: "#6b7280" }}>by {q.createdBy?.name || "Admin"}</span>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            {!q.isApproved && <button onClick={() => approveQ(q._id)} style={{ ...miniBtn, background: "#1D9E75", color: "#111827", border: "none" }}>Approve</button>}
                            <button onClick={() => editQ(q)} style={miniBtn}>Edit</button>
                            <button onClick={() => deleteQ(q._id)} style={dangerMiniBtn}>Del</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function BulkUploadModal({ authAxios, onClose, onSaved }) {
    const [file, setFile] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [meta, setMeta] = useState({ subject: "", term: "", chapter: "" });
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        authAxios.get("/subjects").then(r => {
            const list = r.data.subjects || [];
            setSubjects(list);
            if (list.length > 0) {
                setMeta({ subject: list[0].name, term: list[0].terms?.[0] || "", chapter: list[0].chapters?.[0]?.name || "" });
            }
        }).catch(console.error);
    }, []);

    const selectedSubject = subjects.find(s => s.name === meta.subject);
    const availableTerms = selectedSubject?.terms || [];
    const availableChapters = selectedSubject?.chapters?.filter(c => !meta.term || c.term === meta.term) || [];

    const handleSubjectChange = (subjectName) => {
        const subject = subjects.find(s => s.name === subjectName);
        const firstTerm = subject?.terms?.[0] || "";
        const firstChapter = subject?.chapters?.find(c => !firstTerm || c.term === firstTerm)?.name || subject?.chapters?.[0]?.name || "";
        setMeta({ subject: subjectName, term: firstTerm, chapter: firstChapter });
        setQuestions([]);
    };

    const handleTermChange = (term) => {
        const firstChapter = selectedSubject?.chapters?.find(c => c.term === term)?.name || selectedSubject?.chapters?.[0]?.name || "";
        setMeta(m => ({ ...m, term, chapter: firstChapter }));
        setQuestions([]);
    };

    const previewUpload = async () => {
        if (!file) return setError("Select a DOCX file first");
        if (!meta.subject || !meta.chapter) return setError("Select subject and chapter first");
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("subject", meta.subject);
            fd.append("term", meta.term);
            fd.append("chapter", meta.chapter);
            const res = await authAxios.post("/tests/questions/preview-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setQuestions(res.data.questions || []);
        } catch (e) {
            setError(e.response?.data?.message || "Preview failed");
        } finally { setLoading(false); }
    };

    const saveQuestions = async () => {
        if (questions.length === 0) return setError("No questions to save");
        setLoading(true);
        try {
            await authAxios.post("/tests/questions/bulk-save", { questions });
            onSaved(); onClose();
        } catch (e) {
            setError(e.response?.data?.message || "Save failed");
        } finally { setLoading(false); }
    };

    const updateQuestion = (index, patch) => setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...patch } : q));
    const updateOption = (qIndex, optIndex, value) => setQuestions(prev => prev.map((q, i) => { if (i !== qIndex) return q; const options = [...q.options]; options[optIndex] = value; return { ...q, options }; }));
    const removeQuestion = (index) => setQuestions(prev => prev.filter((_, i) => i !== index));

    return (
        <ModalShell title="Bulk Upload Questions" onClose={onClose} maxWidth={950}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                    <label style={lbl}>Subject</label>
                    <select value={meta.subject} onChange={e => handleSubjectChange(e.target.value)} style={inp}>
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label style={lbl}>Term</label>
                    <select value={meta.term} onChange={e => handleTermChange(e.target.value)} style={inp}>
                        <option value="">Select Term</option>
                        {availableTerms.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label style={lbl}>Chapter</label>
                    <select value={meta.chapter} onChange={e => { setMeta(m => ({ ...m, chapter: e.target.value })); setQuestions([]); }} style={inp}>
                        <option value="">Select Chapter</option>
                        {availableChapters.map((ch, i) => <option key={`${ch.name}-${i}`} value={ch.name}>{ch.name}</option>)}
                    </select>
                </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <input type="file" accept=".docx" onChange={e => { setFile(e.target.files?.[0] || null); setQuestions([]); }} style={{ ...inp, flex: 1 }} />
                <button onClick={previewUpload} disabled={loading} style={primaryBtn}>{loading ? "Processing…" : "Preview"}</button>
            </div>
            {subjects.length === 0 && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>No subjects found. Add subjects first.</p>}
            {questions.length > 0 && (
                <>
                    <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>✅ {questions.length} questions detected. Review/edit before saving.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {questions.map((q, qi) => (
                            <div key={qi} style={{ background: "#f8fafc", borderRadius: 12, padding: 14, border: "0.5px solid rgba(0,0,0,0.08)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                                    <label style={lbl}>Question {qi + 1}</label>
                                    <button onClick={() => removeQuestion(qi)} style={dangerMiniBtn}>Remove</button>
                                </div>
                                <textarea value={q.text} onChange={e => updateQuestion(qi, { text: e.target.value })} rows={2} style={{ ...inp, resize: "vertical", marginBottom: 10 }} />
                                {q.options.map((opt, oi) => (
                                    <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                        <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuestion(qi, { correctIndex: oi })} />
                                        <span style={{ color: "#9ca3af", width: 18 }}>{["A", "B", "C", "D"][oi]}</span>
                                        <input value={opt} onChange={e => updateOption(qi, oi, e.target.value)} style={{ ...inp, flex: 1 }} />
                                    </div>
                                ))}
                                <label style={lbl}>Explanation Optional</label>
                                <textarea value={q.explanation || ""} onChange={e => updateQuestion(qi, { explanation: e.target.value })} rows={2} style={{ ...inp, resize: "vertical" }} />
                            </div>
                        ))}
                    </div>
                </>
            )}
            {error && <p style={{ fontSize: 13, color: "#E24B4A", marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={saveQuestions} disabled={loading || questions.length === 0} style={{ ...primaryBtn, flex: 2 }}>Save All Questions</button>
            </div>
        </ModalShell>
    );
}

function TestFormModal({ authAxios, editing, onClose, onSaved }) {
    const [form, setForm] = useState({
        title: editing?.title || "", description: editing?.description || "",
        subject: editing?.subject || "", term: editing?.term || "",
        chapter: editing?.chapter || "", type: editing?.type || "free",
        price: editing?.price || 0, duration: editing?.duration || 30,
        passingScore: editing?.passingScore || 60, shuffleQuestions: editing?.shuffleQuestions || false,
        batch: editing?.batch || "",
        batchOrder: editing?.batchOrder || 0,
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [batches, setBatches] = useState([]);
    const [questionSource, setQuestionSource] = useState("bank");
    const [questionCount, setQuestionCount] = useState(5);
    const [file, setFile] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        authAxios.get("/subjects").then(r => {
            const list = r.data.subjects || [];
            setSubjects(list);
            if (!editing && list.length > 0) {
                const firstSubject = list[0];
                const firstTerm = firstSubject.terms?.[0] || "";
                const firstChapter = firstSubject.chapters?.find(c => !firstTerm || c.term === firstTerm)?.name || "";
                setForm(f => ({ ...f, subject: firstSubject.name, term: firstTerm, chapter: firstChapter }));
            }
        }).catch(console.error);
        // Load batches for the batch assignment dropdown
        authAxios.get("/batches/admin/all")
            .then(r => setBatches(r.data.batches || []))
            .catch(() => { }); // non-fatal — batch dropdown just stays empty
    }, []);

    const selectedSubject = subjects.find(s => s.name === form.subject);
    const availableTerms = selectedSubject?.terms || [];
    const availableChapters = selectedSubject?.chapters?.filter(c => !form.term || c.term === form.term) || [];

    const previewDocx = async () => {
        if (!file) return setError("Upload DOCX first");
        if (!form.subject || !form.chapter) return setError("Select subject and chapter first");
        setPreviewLoading(true);
        try {
            const fd = new FormData();
            fd.append("file", file); fd.append("subject", form.subject);
            fd.append("term", form.term); fd.append("chapter", form.chapter);
            const res = await authAxios.post("/tests/questions/preview-upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setPreviewQuestions(res.data.questions || []);
        } catch (e) { setError(e.response?.data?.message || "Preview failed"); }
        finally { setPreviewLoading(false); }
    };

    const handleSave = async () => {
        if (!form.title.trim()) return setError("Title is required");
        if (!form.subject) return setError("Subject is required");
        if (!form.chapter) return setError("Chapter is required");
        setSaving(true);
        try {
            if (questionSource === "upload" && !editing) {
                if (previewQuestions.length === 0) return setError("Preview questions before creating test");
                const fd = new FormData();
                Object.entries(form).forEach(([k, v]) => fd.append(k, v));
                fd.append("questions", JSON.stringify(previewQuestions));
                await authAxios.post("/tests/upload-test", fd);
            } else {
                const payload = { ...form, questionSource: "bank", questionCount };
                if (editing) { await authAxios.put(`/tests/${editing._id}`, payload); }
                else { await authAxios.post("/tests", payload); }
            }
            onSaved(); onClose();
        } catch (e) { setError(e.response?.data?.message || "Save failed"); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title={editing ? "Edit Test" : "Create Test"} onClose={onClose} maxWidth={620}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Title"><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} /></Field>
                <Field label="Description"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Subject">
                        <select value={form.subject} onChange={e => {
                            const subject = subjects.find(s => s.name === e.target.value);
                            const firstTerm = subject?.terms?.[0] || "";
                            const firstChapter = subject?.chapters?.find(c => !firstTerm || c.term === firstTerm)?.name || "";
                            setForm(f => ({ ...f, subject: e.target.value, term: firstTerm, chapter: firstChapter }));
                        }} style={inp}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s._id || s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Type">
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inp}>
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                        </select>
                    </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Term">
                        <select value={form.term} onChange={e => {
                            const firstChapter = selectedSubject?.chapters?.find(c => c.term === e.target.value)?.name || "";
                            setForm(f => ({ ...f, term: e.target.value, chapter: firstChapter }));
                        }} style={inp}>
                            <option value="">Select Term</option>
                            {availableTerms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>
                    <Field label="Chapter">
                        <select value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} style={inp}>
                            <option value="">Select Chapter</option>
                            {availableChapters.map((ch, i) => <option key={`${ch.name}-${i}`} value={ch.name}>{ch.name}</option>)}
                        </select>
                    </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <Field label="Duration"><input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} style={inp} /></Field>
                    <Field label="Passing %"><input type="number" value={form.passingScore} onChange={e => setForm(f => ({ ...f, passingScore: Number(e.target.value) }))} style={inp} /></Field>
                    <Field label="Price ₹"><input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} style={inp} /></Field>
                </div>
                {!editing && (
                    <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)" }}>
                        <label style={lbl}>Question Source</label>
                        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                            <label style={{ color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
                                <input type="radio" checked={questionSource === "bank"} onChange={() => setQuestionSource("bank")} style={{ marginRight: 6 }} />
                                Use Question Bank
                            </label>
                            <label style={{ color: "#9ca3af", fontSize: 13, cursor: "pointer" }}>
                                <input type="radio" checked={questionSource === "upload"} onChange={() => setQuestionSource("upload")} style={{ marginRight: 6 }} />
                                Upload DOCX Now
                            </label>
                        </div>
                        {questionSource === "bank" && (
                            <Field label="Auto-pick Question Count">
                                <input type="number" min={1} value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} style={inp} />
                                <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>Backend will pick approved questions from selected subject/chapter.</p>
                            </Field>
                        )}
                        {questionSource === "upload" && (
                            <div>
                                <Field label="Upload DOCX">
                                    <input type="file" accept=".docx" onChange={e => { setFile(e.target.files?.[0] || null); setPreviewQuestions([]); }} style={inp} />
                                </Field>
                                <button type="button" onClick={previewDocx} disabled={previewLoading} style={{ ...secondaryBtn, marginTop: 10 }}>
                                    {previewLoading ? "Previewing..." : "Preview Questions"}
                                </button>
                                {previewQuestions.length > 0 && <p style={{ color: "#1D9E75", fontSize: 12, marginTop: 10 }}>✅ {previewQuestions.length} questions detected.</p>}
                            </div>
                        )}
                        {questionSource === "upload" && previewQuestions.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                                {previewQuestions.map((q, qi) => (
                                    <div key={qi} style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "0.5px solid rgba(0,0,0,0.08)" }}>
                                        <label style={lbl}>Question {qi + 1}</label>
                                        <textarea value={q.text} onChange={e => { const copy = [...previewQuestions]; copy[qi].text = e.target.value; setPreviewQuestions(copy); }} rows={2} style={{ ...inp, resize: "vertical", marginBottom: 8 }} />
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 7 }}>
                                                <input type="radio" name={`preview-correct-${qi}`} checked={q.correctIndex === oi} onChange={() => { const copy = [...previewQuestions]; copy[qi].correctIndex = oi; setPreviewQuestions(copy); }} />
                                                <span style={{ color: "#9ca3af", width: 18 }}>{["A", "B", "C", "D"][oi]}</span>
                                                <input value={opt} onChange={e => { const copy = [...previewQuestions]; copy[qi].options[oi] = e.target.value; setPreviewQuestions(copy); }} style={{ ...inp, flex: 1 }} />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {/* ── Batch assignment ─────────────────────────────────────────── */}
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, border: "0.5px solid rgba(29,158,117,0.2)" }}>
                    <label style={lbl}>📦 Assign to Batch / Crash Course <span style={{ color: "#9ca3af", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "end" }}>
                        <div>
                            <label style={{ ...lbl, marginBottom: 4 }}>Batch</label>
                            <select value={form.batch} onChange={e => setForm(f => ({ ...f, batch: e.target.value }))} style={inp}>
                                <option value="">— No batch —</option>
                                {batches.map(b => (
                                    <option key={b._id} value={b.slug}>{b.icon || "📚"} {b.title}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ width: 90 }}>
                            <label style={{ ...lbl, marginBottom: 4 }}>Order #</label>
                            <input
                                type="number" min={0}
                                value={form.batchOrder}
                                onChange={e => setForm(f => ({ ...f, batchOrder: Number(e.target.value) }))}
                                style={inp}
                                placeholder="1"
                                disabled={!form.batch}
                            />
                        </div>
                    </div>
                    {form.batch && (
                        <p style={{ fontSize: 11, color: "#1D9E75", margin: "6px 0 0" }}>
                            ✓ Test will appear at position #{form.batchOrder || "?"} in <strong>{batches.find(b => b.slug === form.batch)?.title || form.batch}</strong>
                        </p>
                    )}
                    {batches.length === 0 && (
                        <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0" }}>No batches found — create one in Admin → Courses first.</p>
                    )}
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm(f => ({ ...f, shuffleQuestions: e.target.checked }))} />
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>Shuffle question order</span>
                </label>
            </div>
            {error && <p style={{ fontSize: 13, color: "#E24B4A", marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, flex: 2 }}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Test"}</button>
            </div>
        </ModalShell>
    );
}

function QuestionFormModal({ authAxios, editing, onClose, onSaved }) {
    const [form, setForm] = useState({
        text: editing?.text || "", options: editing?.options || ["", "", "", ""],
        correctIndex: editing?.correctIndex ?? 0, explanation: editing?.explanation || "",
        subject: editing?.subject || "Swasthavritta evam Yoga", term: editing?.term || "Term 1",
        chapter: editing?.chapter || "Chapter 1 - Swastha and Swasthya",
        difficulty: editing?.difficulty || "medium", tags: editing?.tags?.join(", ") || "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async (addNext = false) => {
        if (!form.text || form.options.some(o => !o.trim())) return setError("Fill question and all 4 options");
        setSaving(true);
        try {
            const payload = { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) };
            if (editing) { await authAxios.put(`/tests/questions/${editing._id}`, payload); }
            else { await authAxios.post("/tests/questions", payload); }
            onSaved();
            if (addNext && !editing) {
                setForm(f => ({ ...f, text: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", tags: "" }));
            } else { onClose(); }
        } catch (e) { setError(e.response?.data?.message || "Save failed"); }
        finally { setSaving(false); }
    };

    return (
        <ModalShell title={editing ? "Edit Question" : "Add Question"} onClose={onClose} maxWidth={620}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Subject">
                        <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} style={inp}>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                    <Field label="Difficulty">
                        <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={inp}>
                            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Field label="Term">
                        <select value={form.term} onChange={e => setForm(f => ({ ...f, term: e.target.value }))} style={inp}>
                            {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </Field>
                    <Field label="Chapter">
                        <select value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} style={inp}>
                            {SWASTHA_CHAPTERS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                        </select>
                    </Field>
                </div>
                <Field label="Question Text">
                    <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={3} style={{ ...inp, resize: "vertical" }} placeholder="Enter the question…" />
                </Field>
                <div>
                    <label style={lbl}>Options</label>
                    {form.options.map((opt, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                            <input type="radio" name="correct" checked={form.correctIndex === i} onChange={() => setForm(f => ({ ...f, correctIndex: i }))} />
                            <span style={{ fontSize: 12, color: "#9ca3af", width: 16 }}>{["A", "B", "C", "D"][i]}</span>
                            <input value={opt} onChange={e => { const options = [...form.options]; options[i] = e.target.value; setForm(f => ({ ...f, options })); }} style={{ ...inp, flex: 1, margin: 0 }} placeholder={`Option ${["A", "B", "C", "D"][i]}`} />
                            {form.correctIndex === i && <span style={{ fontSize: 11, color: "#1D9E75", fontWeight: 700 }}>✓ Correct</span>}
                        </div>
                    ))}
                </div>
                <Field label="Explanation Optional">
                    <textarea value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="Why is the answer correct?" />
                </Field>
                <Field label="Tags Optional">
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inp} placeholder="vata, herbs, classic…" />
                </Field>
            </div>
            {error && <p style={{ fontSize: 13, color: "#E24B4A", marginBottom: 8 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button onClick={onClose} style={cancelBtn}>Cancel</button>
                {!editing && <button onClick={() => handleSave(true)} disabled={saving} style={{ ...secondaryBtn, flex: 1 }}>Save & Add Next</button>}
                <button onClick={() => handleSave(false)} disabled={saving} style={{ ...primaryBtn, flex: 1.5 }}>{saving ? "Saving…" : editing ? "Save Changes" : "Save"}</button>
            </div>
        </ModalShell>
    );
}

function ModalShell({ title, children, onClose, maxWidth = 560 }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth, border: "0.5px solid rgba(0,0,0,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 20 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111827", margin: 0 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: 20, cursor: "pointer" }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label style={lbl}>{label}</label>
            {children}
        </div>
    );
}

const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" };
const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#f8fafc", color: "#111827", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" };
const primaryBtn = { padding: "9px 20px", borderRadius: 10, border: "none", background: "#1D9E75", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const secondaryBtn = { padding: "9px 20px", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#111827", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
const cancelBtn = { flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#9ca3af", cursor: "pointer", fontFamily: "inherit" };
const miniBtn = { padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(0,0,0,0.1)", background: "transparent", color: "#9ca3af", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const dangerMiniBtn = { padding: "5px 10px", borderRadius: 6, border: "0.5px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" };
const smallSelect = { padding: "7px 12px", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.1)", background: "#fff", color: "#111827", fontSize: 12, fontFamily: "inherit", cursor: "pointer" };
const filterBtn = { padding: "7px 14px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#111827", fontSize: 12, cursor: "pointer", fontFamily: "inherit" };
const cardRow = { background: "#fff", border: "0.5px solid rgba(0,0,0,0.06)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 };
const mutedText = { fontSize: 11, color: "#6b7280" };
const pillGreen = { fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(29,158,117,0.15)", color: "#1D9E75" };
const pillDark = { fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(0,0,0,0.06)", color: "#9ca3af" };