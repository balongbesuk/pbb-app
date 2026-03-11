"use client";

export function PrintButtons() {
  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 100,
        display: "flex",
        gap: "8px",
      }}
      className="no-print"
    >
      <button
        onClick={() => window.print()}
        style={{
          padding: "10px 20px",
          background: "#1d4ed8",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "sans-serif",
          fontSize: "14px",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        🖨️ Cetak / Simpan PDF
      </button>
      <button
        onClick={() => window.close()}
        style={{
          padding: "10px 20px",
          background: "#6b7280",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontFamily: "sans-serif",
          fontSize: "14px",
        }}
      >
        ✕ Tutup
      </button>
    </div>
  );
}
