
export default function MarketplacePage() {
  return (
    <div>
      <div className="p-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#00256e" }}>Marketplace</h1>
        <p className="text-sm mb-8" style={{ color: "#444651" }}>Purchase books, notes and herbal guides</p>
        <div className="rounded-2xl p-16 text-center" style={{ background: "#ffffff", boxShadow: "0 1px 8px rgba(0,37,110,0.06)" }}>
          <span className="material-symbols-outlined block mx-auto mb-4" style={{ fontSize: "48px", color: "#c5c6d3" }}>storefront</span>
          <p className="font-bold text-lg" style={{ color: "#00256e" }}>Coming in Phase 3</p>
          <p className="text-sm mt-1" style={{ color: "#757682" }}>Paid downloads with Razorpay integration coming soon</p>
        </div>
      </div>
    </div>
  );
}
