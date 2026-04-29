"use client";
import { useState, useEffect, useRef } from "react";

const LAST_UPDATED = "April 26, 2026";
const COMPANY = "AyurXHub Clinical Sanctuary";
const EMAIL = "legal@ayurxhub.com";
const WEBSITE = "www.ayurxhub.com";

// ─── Content ──────────────────────────────────────────────────────────────────

const USER_SECTIONS = [
    {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        content: `By accessing or using AyurXHub ("Platform", "we", "us", or "our"), you ("User", "Patient", "Student") confirm that you have read, understood, and agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree with any part of these terms, you must immediately discontinue use of the Platform.

These terms constitute a legally binding agreement between you and ${COMPANY}. We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the revised terms. We will notify registered users of material changes via email or in-app notification.`,
    },
    {
        id: "nature",
        title: "2. Nature of the Platform",
        content: `AyurXHub is a digital platform that facilitates connections between individuals seeking Ayurvedic wellness guidance and verified Ayurvedic practitioners ("Consultants" or "Experts"). The Platform provides:

• Online consultation booking and management
• Live video, audio, and text-based consultations
• Access to Ayurvedic study materials, journals, and references
• Subject-wise MCQ test series for academic purposes
• A digital marketplace for Ayurvedic products

Important: AyurXHub is an intermediary platform. We do not provide medical services directly. All consultations are conducted by independent practitioners. Nothing on this Platform constitutes medical advice, diagnosis, or treatment under the purview of modern allopathic medicine.`,
    },
    {
        id: "eligibility",
        title: "3. Eligibility",
        content: `To use the Platform you must:

• Be at least 18 years of age. Users under 18 may use the Platform only with verified parental or guardian consent
• Provide accurate, complete, and current registration information
• Have the legal capacity to enter into binding contracts in your jurisdiction
• Not be prohibited from using the Platform under applicable law

By registering, you warrant that all information provided is truthful and accurate. False registration information may result in immediate account termination.`,
    },
    {
        id: "consultations",
        title: "4. Consultations & Bookings",
        content: `4.1 Booking Process: Users may book consultations with listed Consultants based on displayed availability. A booking is confirmed only after the Consultant explicitly accepts the request.

4.2 Cancellation Policy: Users may cancel a confirmed booking at any time before the session begins. Cancellations made less than 2 hours before a scheduled session may be subject to a cancellation fee as displayed at the time of booking.

4.3 No-Show Policy: Users who fail to attend a confirmed session without prior cancellation ("No-Show") forfeit any session fees paid. Repeated no-shows (3 or more) may result in temporary suspension of booking privileges.

4.4 Session Conduct: During consultations you agree to:
• Maintain respectful and professional conduct at all times
• Not record sessions without explicit written consent from the Consultant
• Not share session content, prescriptions, or advice externally without consent
• Use the Platform's built-in communication tools exclusively — sharing contact information outside the Platform is prohibited

4.5 Consultation Quality: While we verify Consultant credentials, AyurXHub does not guarantee specific outcomes from any consultation. Results of Ayurvedic treatment vary by individual constitution (Prakriti), lifestyle, and compliance.`,
    },
    {
        id: "health",
        title: "5. Health & Medical Disclaimer",
        content: `5.1 Not Emergency Care: AyurXHub is NOT suitable for medical emergencies. If you are experiencing a life-threatening condition, call emergency services (112 in India) immediately.

5.2 Complementary Nature: Ayurvedic guidance provided through this Platform is complementary and should not be used as a substitute for professional medical diagnosis or treatment by a licensed modern medicine practitioner.

5.3 Full Disclosure: You must disclose all relevant health information, current medications, allergies, and ongoing treatments to your Consultant before sessions. Withholding material health information may result in inappropriate advice and you assume full responsibility for such omission.

5.4 Herbal Interactions: Ayurvedic herbs and formulations may interact with pharmaceutical medications. Always consult your primary care physician before beginning any Ayurvedic regimen suggested on this Platform.

5.5 Pregnancy & Special Conditions: If you are pregnant, breastfeeding, have a chronic illness, or are on immunosuppressants, you must inform your Consultant before proceeding. Certain Ayurvedic treatments are contraindicated in these conditions.`,
    },
    {
        id: "privacy",
        title: "6. Data Privacy & Confidentiality",
        content: `6.1 Data Collection: We collect personal information including name, contact details, health information shared during consultations, and usage data. Full details are in our Privacy Policy.

6.2 Health Data: Health-related information shared during consultations is treated as sensitive personal data under applicable Indian data protection laws. This information is shared only with your Consultant and is not disclosed to third parties without your explicit consent, except as required by law.

6.3 Session Recordings: Video sessions are not recorded or stored by AyurXHub. Any recording by either party without mutual consent is a violation of these Terms and applicable privacy laws.

6.4 Communication Security: Our chat system uses end-to-end encryption for messages. Do not share financial information, government ID numbers, or passwords through the chat.`,
    },
    {
        id: "payments",
        title: "7. Payments & Refunds",
        content: `7.1 Fee Transparency: All consultation fees are displayed clearly before booking confirmation. Fees may vary by Consultant and session duration.

7.2 Payment Security: All payments are processed through secure, PCI-DSS compliant payment gateways. AyurXHub does not store your complete payment card information.

7.3 Refund Policy: Refunds are applicable in the following cases:
• Consultant cancels or fails to attend a confirmed session — full refund within 5-7 business days
• Technical failure on our Platform preventing the session — full refund
• User cancellation per the Cancellation Policy — partial or full refund per displayed policy

7.4 Test Series Fees: Paid test series fees are non-refundable once the test has been started.

7.5 Disputes: Payment disputes must be raised within 7 days of the transaction through the Platform's support system.`,
    },
    {
        id: "prohibited",
        title: "8. Prohibited Conduct",
        content: `Users are strictly prohibited from:

• Sharing personal contact information (phone numbers, email addresses, social media handles) with Consultants via Platform chat, bypassing our secure communication system
• Attempting to conduct consultations outside the Platform with Consultants met through AyurXHub
• Posting false, misleading, or defamatory reviews
• Using the Platform for any unlawful purpose
• Impersonating another person or entity
• Attempting to reverse-engineer, scrape, or compromise Platform security
• Using automated tools, bots, or scripts to access the Platform
• Sharing Platform content, test questions, or proprietary materials externally
• Harassing, abusing, or threatening Consultants or Platform staff`,
    },
    {
        id: "reviews",
        title: "9. Reviews & Feedback",
        content: `Reviews submitted must be honest, based on your personal experience, and must not contain:
• Defamatory statements or personal attacks
• Confidential information from sessions
• Content unrelated to the consultation experience
• Fake or incentivised reviews

AyurXHub reserves the right to remove reviews that violate these guidelines. Users submitting false reviews may face account suspension.`,
    },
    {
        id: "ip",
        title: "10. Intellectual Property",
        content: `All content on AyurXHub — including study materials, test questions, interface design, and branding — is the intellectual property of ${COMPANY} or its licensed contributors.

Users are granted a limited, non-exclusive, non-transferable licence to access Platform content for personal, non-commercial use only. You may not reproduce, distribute, modify, or create derivative works without prior written permission.

Content submitted by Users (reviews, notes) remains your property but you grant AyurXHub a perpetual, royalty-free licence to use, display, and moderate such content on the Platform.`,
    },
    {
        id: "liability",
        title: "11. Limitation of Liability",
        content: `To the maximum extent permitted by applicable law:

• AyurXHub's liability for any claim arising from use of the Platform is limited to the amount paid by you in the 3 months preceding the claim
• We are not liable for indirect, incidental, special, or consequential damages including loss of health outcomes, loss of data, or loss of profits
• We make no warranty that the Platform will be uninterrupted, error-free, or free of harmful components
• We are not responsible for the professional advice, conduct, or qualifications of individual Consultants beyond our stated verification process`,
    },
    {
        id: "termination",
        title: "12. Account Termination",
        content: `We may suspend or terminate your account without notice for:

• Violation of any provision of these Terms
• Conduct that is harmful to other Users, Consultants, or the Platform
• Provision of fraudulent information
• Non-payment of fees

You may delete your account at any time through Settings. Upon deletion, your personal data will be handled per our Privacy Policy. Certain records required by law may be retained.`,
    },
    {
        id: "governing",
        title: "13. Governing Law & Disputes",
        content: `These Terms are governed by the laws of India, specifically applicable statutes including the Information Technology Act 2000, Consumer Protection Act 2019, and relevant Ayurvedic medicine regulations under the Ministry of AYUSH.

Any disputes shall first be attempted to be resolved through good-faith mediation. Unresolved disputes shall be subject to arbitration under the Arbitration and Conciliation Act, 1996, with proceedings conducted in New Delhi, India. Courts in New Delhi shall have exclusive jurisdiction.

For consumer grievances, you may also approach the Consumer Disputes Redressal Forum in your jurisdiction.`,
    },
    {
        id: "contact",
        title: "14. Contact Us",
        content: `For questions, complaints, or legal notices regarding these Terms, contact our Grievance Officer:

Email: ${EMAIL}
Website: ${WEBSITE}
Response Time: We aim to respond to all queries within 48 business hours.

For urgent health-related concerns, please contact emergency services or your nearest hospital.`,
    },
];

const CONSULTANT_SECTIONS = [
    {
        id: "c-acceptance",
        title: "1. Practitioner Agreement",
        content: `By registering as a Consultant ("Practitioner", "Expert") on AyurXHub, you enter into a binding professional agreement with ${COMPANY}. These terms govern your use of the Platform to provide Ayurvedic consultation services and supplement the general User Terms and Conditions.

You affirm that you have read, understood, and agree to all provisions herein. These terms may be updated periodically and continued use of Practitioner features constitutes acceptance of changes. We will provide 14 days' notice before material changes take effect.`,
    },
    {
        id: "c-credentials",
        title: "2. Credential Verification & Eligibility",
        content: `2.1 Mandatory Qualifications: To list as a Consultant you must hold one or more of the following:
• BAMS (Bachelor of Ayurvedic Medicine and Surgery) from a UGC-recognised institution
• MD (Ayurveda) or equivalent postgraduate Ayurvedic qualification
• Any other qualification recognised by the Central Council of Indian Medicine (CCIM)

2.2 Registration: You must hold a valid, current registration with the State Council of Indian Medicine or CCIM. Your registration number must be provided and will be displayed on your public profile.

2.3 Verification Process: AyurXHub verifies credentials through document submission. Verification does not constitute endorsement. You remain solely responsible for the currency and validity of your registrations.

2.4 Ongoing Compliance: You must immediately notify AyurXHub of:
• Revocation, suspension, or lapsing of any professional registration
• Any disciplinary proceedings initiated against you by any professional body
• Any criminal charges or convictions that may affect your fitness to practise
• Any significant health conditions affecting your ability to consult safely

2.5 Continuing Education: You are responsible for maintaining professional competency through ongoing education as required by your regulatory body.`,
    },
    {
        id: "c-scope",
        title: "3. Scope of Practice",
        content: `3.1 Ayurvedic Scope Only: You may only provide guidance within the scope of Ayurvedic medicine as defined by the CCIM. You must not:
• Prescribe modern allopathic medicines (unless separately licensed)
• Claim to diagnose or treat conditions that fall outside Ayurvedic practice
• Perform procedures outside your training and scope of practice

3.2 Referral Obligation: When a patient presents with symptoms suggesting an acute medical emergency, serious underlying pathology, or a condition outside Ayurvedic scope, you must advise them to seek immediate conventional medical attention. Document this referral in your session notes.

3.3 Prescription Standards: All prescriptions and recommendations must:
• Be within Ayurvedic pharmacopoeia (API standards)
• Include appropriate dosage, duration, and contraindications
• Be provided through the Platform's built-in prescription feature — external prescription documents sent via chat are prohibited
• Consider disclosed medications and medical history

3.4 Confidentiality of Patient Information: All patient information disclosed during consultations is strictly confidential. You must not share, disclose, or use patient information for any purpose other than providing the requested consultation. This obligation survives termination of your Practitioner agreement.`,
    },
    {
        id: "c-platform",
        title: "4. Platform-Exclusive Conduct",
        content: `4.1 No Off-Platform Solicitation: You are strictly prohibited from:
• Sharing your personal contact details (phone number, email, social media, WhatsApp, Telegram) with patients through Platform communication channels
• Soliciting patients to continue consultations outside of AyurXHub
• Redirecting patients to your private practice, other platforms, or third-party services you commercially benefit from
• Accepting direct payments from patients outside the Platform's payment system

4.2 Communication Standards: All patient communication must occur through AyurXHub's video, audio, or text systems. Our automated filters detect and block attempts to share contact information. Repeated violations will result in immediate account suspension.

4.3 Session Integrity: You must not:
• Record consultations without explicit patient consent obtained through the Platform's consent mechanism
• Share session content, patient queries, or case details on social media or elsewhere
• Allow third parties to be present during video consultations without patient knowledge and consent

4.4 Competitive Conduct: During your active Practitioner agreement, you may not use patient data or contacts obtained through AyurXHub to promote competing platforms or services.`,
    },
    {
        id: "c-availability",
        title: "5. Availability & Session Commitments",
        content: `5.1 Accurate Availability: You must keep your availability calendar accurate and up to date. Setting availability you cannot honour causes patient inconvenience and damages Platform trust.

5.2 Confirmation Obligation: Once you confirm a booking, you are committed to honouring that session. Confirmed sessions must not be cancelled except in genuine emergencies.

5.3 Emergency Cancellations: If you must cancel a confirmed session, you must:
• Provide as much notice as possible through the Platform
• Provide a genuine reason for cancellation
• Not make a pattern of last-minute cancellations (3 or more in 30 days triggers review)

5.4 Punctuality: You are expected to join sessions within 5 minutes of the scheduled start time. Repeated late joins (more than 5 minutes late on 3 occasions) will be flagged for review.

5.5 Accepting Bookings Toggle: The "Accepting Bookings" toggle on your dashboard is your responsibility. If you set it to available, patients may attempt to book. Ensure this accurately reflects your capacity.`,
    },
    {
        id: "c-compensation",
        title: "6. Fees, Compensation & Taxes",
        content: `6.1 Fee Setting: You may set your own consultation fees within ranges permitted by AyurXHub. Fees must be displayed transparently and not changed after a booking is confirmed.

6.2 Platform Commission: AyurXHub charges a platform fee on each completed consultation. The current commission rate is displayed in your Practitioner dashboard and may be revised with 30 days' notice.

6.3 Payment Schedule: Earnings are disbursed to your registered bank account on a weekly basis, subject to minimum balance thresholds and successful KYC verification.

6.4 Tax Responsibility: You are solely responsible for:
• Declaring income from Platform consultations to tax authorities
• GST registration and compliance if applicable under Indian GST law
• Filing professional tax returns
AyurXHub may issue TDS certificates as required under Indian tax law.

6.5 Disputed Sessions: In the event of a patient dispute regarding session quality or completion, AyurXHub may withhold payment pending investigation. We aim to resolve all payment disputes within 10 business days.`,
    },
    {
        id: "c-content",
        title: "7. Content & Intellectual Property",
        content: `7.1 Study Materials: If you contribute study materials, journal articles, or question bank entries to the Platform:
• You warrant that the content is original and does not infringe third-party rights
• You grant AyurXHub a non-exclusive, royalty-free licence to use, display, and distribute the content on the Platform
• Questions contributed to the test series are reviewed and approved by administrators before publication

7.2 Platform IP: You may not reproduce, extract, or commercially exploit any AyurXHub content including test questions, study materials, patient databases, or Platform interface elements.

7.3 Professional Content: Any Ayurvedic content you share must be evidence-informed, based on classical texts or peer-reviewed research, and must not make unsubstantiated disease cure claims prohibited under AYUSH advertising guidelines.`,
    },
    {
        id: "c-ethics",
        title: "8. Professional Ethics & Patient Safety",
        content: `8.1 Primum Non Nocere: Patient safety is paramount. You must not recommend treatments that carry serious risk of harm, particularly:
• Heavy metal formulations without clear therapeutic indication and patient consent
• Treatments contraindicated for disclosed conditions
• Stopping prescribed modern medications without coordination with the patient's physician

8.2 Informed Consent: Before recommending any significant intervention (Panchakarma, bhasma preparations, dietary restrictions), you must ensure the patient understands the rationale, expected outcomes, and risks.

8.3 Vulnerable Patients: Extra care is required when consulting with:
• Pregnant or lactating women
• Children (note: appropriate qualifications in Kaumarabhritya are required)
• Elderly patients with multiple comorbidities
• Patients presenting with mental health conditions

8.4 Reporting Obligations: You must report to AyurXHub any:
• Patient disclosure of self-harm intent — provide appropriate crisis resources
• Suspected abuse or exploitation involving a patient
• Adverse reactions or patient harm attributable to advised treatments

8.5 No Personal Relationships: Romantic, financial, or other personal relationships with current patients are strictly prohibited. A minimum 6-month cooling-off period applies before any financial engagement beyond Platform fees.`,
    },
    {
        id: "c-suspension",
        title: "9. Suspension & Termination",
        content: `9.1 AyurXHub may immediately suspend or terminate your Practitioner account for:
• Loss or suspension of professional registration
• Patient safety concerns or serious complaints
• Violation of the off-platform solicitation policy
• Fraudulent credential claims
• Behaviour found to be abusive, discriminatory, or harassing toward patients or staff
• Repeated failure to honour confirmed bookings

9.2 Investigation Period: During any investigation of a complaint against you, your profile may be hidden from new patient searches while confirmed sessions proceed normally.

9.3 Appeal: You may appeal a suspension by contacting legal@ayurxhub.com within 14 days with supporting documentation. Appeals are reviewed by a panel within 21 business days.

9.4 Effect of Termination: Upon termination:
• Existing confirmed session obligations must still be honoured or cancelled with appropriate patient notification
• Outstanding earnings will be released after any pending disputes are resolved
• You may not re-register on the Platform without written approval from AyurXHub`,
    },
    {
        id: "c-indemnity",
        title: "10. Indemnification",
        content: `You agree to indemnify, defend, and hold harmless ${COMPANY}, its directors, officers, employees, and agents from any claims, damages, losses, or expenses (including legal fees) arising from:

• Your professional advice, recommendations, or omissions during consultations
• Your breach of these Terms or applicable law
• Any claim that your credentials are fraudulent or misrepresented
• Your violation of patient rights or applicable healthcare regulations
• Any third-party claim arising from your use of the Platform

AyurXHub strongly recommends that all Practitioners maintain professional indemnity insurance appropriate for teleconsultation practice.`,
    },
    {
        id: "c-telemedicine",
        title: "11. Telemedicine Compliance",
        content: `You must comply with the Telemedicine Practice Guidelines issued by the Ministry of Health & Family Welfare (March 2020) and any subsequent amendments, including:

• Obtaining proper consent before initiating teleconsultation
• Maintaining patient records for the mandatory period
• Complying with restrictions on first consultation prescriptions
• Adhering to guidelines on prescribable medicines via telemedicine

The AYUSH Telemedicine Guidelines (2021) additionally apply to Ayurvedic practitioners. Compliance with these guidelines is your sole responsibility.`,
    },
    {
        id: "c-governing",
        title: "12. Governing Law & Dispute Resolution",
        content: `This Practitioner Agreement is governed by Indian law including the Indian Medical Degrees Act, CCIM Act 1970, Information Technology Act 2000, and all applicable AYUSH regulations.

Disputes between Practitioners and AyurXHub shall be resolved through binding arbitration in New Delhi under the Arbitration and Conciliation Act 1996. The arbitral award shall be final and binding.

For patient-raised complaints against Practitioners, AyurXHub operates an internal dispute resolution mechanism. Unresolved patient complaints may be referred to the relevant State Council of Indian Medicine.

Contact: ${EMAIL} | ${WEBSITE}`,
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TermsPage() {
    const [activeRole, setActiveRole] = useState("user");
    const [activeSection, setActiveSection] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const contentRef = useRef(null);

    const sections = activeRole === "user" ? USER_SECTIONS : CONSULTANT_SECTIONS;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        setActiveSection(sections[0]?.id || null);
    }, [activeRole]);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setActiveSection(id); }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#0c0f16", fontFamily: "'Georgia', serif", color: "#e2e8f0" }}>

            {/* ── Sticky Header ── */}
            <header style={{
                position: "sticky", top: 0, zIndex: 50,
                background: scrolled ? "rgba(12,15,22,0.97)" : "transparent",
                borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
                backdropFilter: scrolled ? "blur(16px)" : "none",
                padding: "16px 48px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.3s ease",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #1D9E75, #00256e)", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "sans-serif" }}>A</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "sans-serif", letterSpacing: "-0.02em" }}>AyurXHub</span>
                </div>
                <span style={{ fontSize: 11, color: "#4a5568", fontFamily: "sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>Legal Documents</span>
            </header>

            {/* ── Hero ── */}
            <div style={{ padding: "80px 48px 60px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                {/* Background pattern */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(29,158,117,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,37,110,0.12) 0%, transparent 50%)", pointerEvents: "none" }} />

                <div style={{ maxWidth: 860, margin: "0 auto", position: "relative" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.3)", marginBottom: 24 }}>
                        <span style={{ fontSize: 10, color: "#1D9E75", fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Last Updated: {LAST_UPDATED}</span>
                    </div>
                    <h1 style={{ fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 400, color: "#f8fafc", lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
                        Terms &{" "}
                        <span style={{ fontStyle: "italic", color: "#1D9E75" }}>Conditions</span>
                    </h1>
                    <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.8, maxWidth: 600, margin: 0, fontFamily: "sans-serif" }}>
                        Please read these terms carefully. They govern your use of the AyurXHub platform and define the rights and responsibilities of all parties.
                    </p>

                    {/* Role switcher */}
                    <div style={{ display: "inline-flex", marginTop: 36, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 4, gap: 4 }}>
                        {[
                            { key: "user", label: "Patient / Student", icon: "🎓" },
                            { key: "consultant", label: "Practitioner / Expert", icon: "🩺" },
                        ].map(({ key, label, icon }) => (
                            <button
                                key={key}
                                onClick={() => { setActiveRole(key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "10px 22px", borderRadius: 11, border: "none", cursor: "pointer",
                                    fontFamily: "sans-serif", fontSize: 13, fontWeight: 500, transition: "all 0.2s",
                                    background: activeRole === key
                                        ? (key === "user" ? "linear-gradient(135deg, #00256e, #1f3c88)" : "linear-gradient(135deg, #0e4f3b, #1D9E75)")
                                        : "transparent",
                                    color: activeRole === key ? "#fff" : "#64748b",
                                    boxShadow: activeRole === key ? "0 4px 16px rgba(0,0,0,0.3)" : "none",
                                }}
                            >
                                <span>{icon}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 48px 80px", display: "flex", gap: 60, alignItems: "flex-start" }}>

                {/* Sidebar TOC */}
                <aside style={{ width: 240, flexShrink: 0, position: "sticky", top: 80, paddingTop: 48 }}>
                    <p style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#334155", marginBottom: 16 }}>
                        Table of Contents
                    </p>
                    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {sections.map((s) => {
                            const isActive = activeSection === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => scrollTo(s.id)}
                                    style={{
                                        textAlign: "left", background: "none", border: "none",
                                        padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                                        fontSize: 12, fontFamily: "sans-serif", lineHeight: 1.4,
                                        color: isActive ? "#1D9E75" : "#475569",
                                        background: isActive ? "rgba(29,158,117,0.08)" : "transparent",
                                        borderLeft: `2px solid ${isActive ? "#1D9E75" : "transparent"}`,
                                        fontWeight: isActive ? 600 : 400,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {s.title}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main content */}
                <main ref={contentRef} style={{ flex: 1, paddingTop: 48 }}>

                    {/* Role badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: activeRole === "user" ? "rgba(0,37,110,0.2)" : "rgba(29,158,117,0.15)", border: `1px solid ${activeRole === "user" ? "rgba(0,37,110,0.4)" : "rgba(29,158,117,0.3)"}`, display: "grid", placeItems: "center", fontSize: 22 }}>
                            {activeRole === "user" ? "🎓" : "🩺"}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 20, fontWeight: 400, color: "#f1f5f9", margin: "0 0 3px", letterSpacing: "-0.01em" }}>
                                {activeRole === "user" ? "Patient & Student" : "Practitioner & Expert"} Terms
                            </h2>
                            <p style={{ fontSize: 13, color: "#475569", margin: 0, fontFamily: "sans-serif" }}>
                                {activeRole === "user"
                                    ? "Governs your use of AyurXHub as a patient or student"
                                    : "Governs your listing and practice on AyurXHub as a verified Ayurvedic practitioner"}
                            </p>
                        </div>
                    </div>

                    {sections.map((section, idx) => (
                        <section
                            key={section.id}
                            id={section.id}
                            style={{ marginBottom: 56, scrollMarginTop: 100 }}
                        >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#1D9E75", fontFamily: "sans-serif", fontWeight: 700, flexShrink: 0, marginTop: 4 }}>
                                    {idx + 1}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 400, color: "#f1f5f9", letterSpacing: "-0.01em", margin: 0, lineHeight: 1.3 }}>
                                    {section.title.replace(/^\d+\.\s/, "")}
                                </h3>
                            </div>

                            <div style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 14, padding: "24px 28px",
                                marginLeft: 48,
                            }}>
                                {section.content.split("\n\n").map((para, i) => {
                                    const isList = para.includes("\n•");
                                    if (isList) {
                                        const [intro, ...items] = para.split("\n");
                                        return (
                                            <div key={i} style={{ marginBottom: i < section.content.split("\n\n").length - 1 ? 16 : 0 }}>
                                                {intro && !intro.startsWith("•") && (
                                                    <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.85, margin: "0 0 10px", fontFamily: "sans-serif" }}>{intro}</p>
                                                )}
                                                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                                                    {items.filter(Boolean).map((item, j) => (
                                                        <li key={j} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                                                            <span style={{ color: "#1D9E75", flexShrink: 0, marginTop: 2 }}>◆</span>
                                                            <span style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, fontFamily: "sans-serif" }}>{item.replace(/^•\s*/, "")}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    }
                                    return (
                                        <p key={i} style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.85, margin: i < section.content.split("\n\n").length - 1 ? "0 0 16px" : 0, fontFamily: "sans-serif" }}>
                                            {para}
                                        </p>
                                    );
                                })}
                            </div>
                        </section>
                    ))}

                    {/* Acceptance footer */}
                    <div style={{ marginTop: 60, padding: "28px 32px", borderRadius: 16, background: "linear-gradient(135deg, rgba(29,158,117,0.08), rgba(0,37,110,0.12))", border: "1px solid rgba(29,158,117,0.2)" }}>
                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>📜</span>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: "0 0 6px", fontFamily: "sans-serif" }}>
                                    By using AyurXHub, you acknowledge that you have read and agree to these Terms
                                </p>
                                <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.7, fontFamily: "sans-serif" }}>
                                    These terms were last updated on <strong style={{ color: "#94a3b8" }}>{LAST_UPDATED}</strong>. For questions or concerns, contact us at <a href={`mailto:${EMAIL}`} style={{ color: "#1D9E75", textDecoration: "none" }}>{EMAIL}</a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Switch CTA */}
                    <div style={{ marginTop: 32, textAlign: "center" }}>
                        <p style={{ fontSize: 13, color: "#334155", fontFamily: "sans-serif", marginBottom: 12 }}>
                            Also read the terms for{" "}
                            <button
                                onClick={() => { setActiveRole(activeRole === "user" ? "consultant" : "user"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                style={{ background: "none", border: "none", color: "#1D9E75", cursor: "pointer", fontSize: 13, fontFamily: "sans-serif", textDecoration: "underline" }}>
                                {activeRole === "user" ? "Practitioners" : "Patients & Students"}
                            </button>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}