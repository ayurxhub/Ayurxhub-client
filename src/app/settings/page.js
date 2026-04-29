
export default function SettingsPage() {
  return (
    <div>
      <div className="p-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#00256e" }}>Settings</h1>
        <p className="text-sm mb-8" style={{ color: "#444651" }}>Manage your account and preferences</p>
        <div className="rounded-2xl p-16 text-center" style={{ background: "#ffffff", boxShadow: "0 1px 8px rgba(0,37,110,0.06)" }}>
          <span className="material-symbols-outlined block mx-auto mb-4" style={{ fontSize: "48px", color: "#c5c6d3" }}>settings</span>
          <p className="font-bold text-lg" style={{ color: "#00256e" }}>Coming after auth</p>
          <p className="text-sm mt-1" style={{ color: "#757682" }}>Profile settings will be available after login system is built</p>
        </div>
      </div>
    </div>
  );
}
