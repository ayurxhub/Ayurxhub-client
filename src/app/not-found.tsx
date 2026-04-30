import Link from "next/link";

export default function NotFound() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
                <p style={{ fontSize: 64, fontWeight: 800, color: "#00256e", margin: "0 0 8px" }}>404</p>
                <h2 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Page not found</h2>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>The page you're looking for doesn't exist or has been moved.</p>
                <Link href="/" style={{
                    padding: "10px 24px", borderRadius: 8,
                    background: "#00256e", color: "#fff", fontSize: 14,
                    fontWeight: 600, textDecoration: "none", display: "inline-block",
                }}>Go home</Link>
            </div>
        </div>
    );
}