/**
 * piiFilter.js — AyurXHub PII / contact-sharing filter
 * ─────────────────────────────────────────────────────
 * Use on BOTH server (socket.js) and client (chat UI).
 * Works as plain ES module — no dependencies.
 *
 * Usage:
 *   import { scanMessage } from "./piiFilter.js";
 *   const result = scanMessage("call me at 9876543210");
 *   // { blocked: true, reason: "Phone number detected", cleaned: "call me at [REDACTED]" }
 */

// ─── Regex patterns ───────────────────────────────────────────────────────────

const PATTERNS = [
    // ── Phone numbers ────────────────────
    // ──────────────────────────────────
    {
        id: "phone_in",
        label: "Indian phone number",
        // Matches: 9876543210 / +91 9876543210 / 091-9876543210 / (91)9876543210
        regex: /(?:\+?91[-.\s]?)?[6-9]\d{9}/g,
        severity: "block",
    },
    {
        id: "phone_intl",
        label: "International phone number",
        // Matches: +1-800-555-1234 / +44 20 7946 0958 etc.
        regex: /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
        severity: "block",
    },
    {
        id: "phone_obfuscated",
        label: "Obfuscated phone number",
        // Catches: 98 76 54 32 10 / 98.76.54.32.10 / 9876-543-210
        regex: /\b\d[\d\s.\-]{8,}\d\b/g,
        severity: "block",
    },

    // ── Email addresses ───────────────────────────────────────────────────
    {
        id: "email",
        label: "Email address",
        regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
        severity: "block",
    },

    // ── External video / call platforms ──────────────────────────────────
    {
        id: "zoom",
        label: "Zoom link",
        regex: /zoom\.us\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "gmeet",
        label: "Google Meet link",
        regex: /meet\.google\.com\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "teams",
        label: "Microsoft Teams link",
        regex: /teams\.microsoft\.com\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "skype",
        label: "Skype handle or link",
        regex: /skype:[^\s]*/gi,
        severity: "block",
    },

    // ── Messaging apps ────────────────────────────────────────────────────
    {
        id: "whatsapp",
        label: "WhatsApp reference",
        regex: /whatsapp|whats.?app|wa\.me\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "telegram",
        label: "Telegram reference",
        regex: /telegram|t\.me\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "signal",
        label: "Signal reference",
        regex: /\bsignal\s*(app|me|chat|number)?\b/gi,
        severity: "block",
    },

    // ── Social media ──────────────────────────────────────────────────────
    {
        id: "instagram",
        label: "Instagram handle or link",
        regex: /instagram\.com\/[^\s]*|insta\s*:\s*@?[\w.]+/gi,
        severity: "block",
    },
    {
        id: "facebook",
        label: "Facebook link",
        regex: /facebook\.com\/[^\s]*|fb\.com\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "twitter",
        label: "Twitter/X handle",
        regex: /twitter\.com\/[^\s]*|x\.com\/[^\s]*/gi,
        severity: "block",
    },
    {
        id: "linkedin",
        label: "LinkedIn profile link",
        regex: /linkedin\.com\/in\/[^\s]*/gi,
        severity: "block",
    },

    // ── UPI / payment IDs ────────────────────────────────────────────────
    {
        id: "upi",
        label: "UPI ID",
        // name@paytm / name@upi / name@ybl / name@okaxis etc.
        regex: /[\w.\-]+@(paytm|upi|ybl|okaxis|okhdfcbank|okicici|oksbi|apl|pytm|ibl)\b/gi,
        severity: "block",
    },

    // ── Generic URLs (anything that looks like an external site) ─────────
    {
        id: "url",
        label: "External website link",
        regex: /https?:\/\/(?!ayurxhub\.com)[^\s]+/gi,
        severity: "block",
    },
    {
        id: "bare_url",
        label: "Bare domain link",
        // www.something.com or something.com/path — but not ayurxhub.com
        regex: /(?<!\w)(www\.)?(?!ayurxhub)[a-zA-Z0-9\-]{2,}\.(com|in|net|org|io|co|app|me|info)(?:\/[^\s]*)?/gi,
        severity: "warn", // warn rather than block (too many false positives)
    },

    // ── "Contact me outside" phrases ─────────────────────────────────────
    {
        id: "contact_phrase",
        label: "Off-platform contact solicitation",
        regex: /\b(call\s+me|text\s+me|message\s+me|reach\s+me|contact\s+me|dm\s+me|ping\s+me|add\s+me|find\s+me|connect\s+with\s+me)\s+(on|at|via|through|outside|directly)?\b/gi,
        severity: "block",
    },
    {
        id: "outside_platform",
        label: "Off-platform reference",
        regex: /\b(outside|off\s*platform|private(ly)?|directly|personally)\s+(chat|talk|consult|connect|discuss|meet)\b/gi,
        severity: "block",
    },
    {
        id: "my_number",
        label: "Sharing contact info",
        regex: /\b(my\s+(number|no\.?|num|phone|mobile|cell|email|id|handle|username|account)|share\s+my\s+(contact|details|info|number))\b/gi,
        severity: "block",
    },
];

// ─── Severity levels ──────────────────────────────────────────────────────────
// "block" → message is rejected entirely
// "warn"  → message is delivered but flagged (admin can review)

/**
 * Scan a message for PII / contact-sharing attempts.
 *
 * @param {string} text  Raw message text
 * @returns {{
 *   blocked:  boolean,   // true = reject the message
 *   warned:   boolean,   // true = allow but flag
 *   reason:   string,    // human-readable reason (shown to sender)
 *   matches:  Array,     // details of what triggered
 *   cleaned:  string,    // text with PII replaced by [REDACTED]
 * }}
 */
export function scanMessage(text) {
    if (!text || typeof text !== "string") {
        return { blocked: false, warned: false, reason: "", matches: [], cleaned: text };
    }

    let cleaned = text;
    const matches = [];
    let blocked = false;
    let warned = false;

    for (const pattern of PATTERNS) {
        const hits = text.match(pattern.regex);
        if (hits && hits.length > 0) {
            matches.push({ id: pattern.id, label: pattern.label, hits, severity: pattern.severity });
            if (pattern.severity === "block") blocked = true;
            if (pattern.severity === "warn") warned = true;
            // Replace matches in cleaned version
            cleaned = cleaned.replace(pattern.regex, "[REDACTED]");
        }
    }

    const firstBlock = matches.find(m => m.severity === "block");
    const reason = firstBlock
        ? `Sharing contact information is not allowed: ${firstBlock.label} detected. All consultations must happen on AyurXHub.`
        : warned
            ? "Message contains content that may violate our contact policy."
            : "";

    return { blocked, warned, reason, matches, cleaned };
}

/**
 * Quick boolean check — use this for the server-side gate.
 * Returns true if the message should be blocked.
 */
export function isBlocked(text) {
    return scanMessage(text).blocked;
}

/**
 * Returns a short user-facing warning string for the client UI,
 * or empty string if clean.
 */
export function getWarning(text) {
    const result = scanMessage(text);
    if (result.blocked) return result.reason;
    if (result.warned) return result.reason;
    return "";
}