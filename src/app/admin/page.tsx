"use client";

import { useState } from "react";
import AdminPanel from "./AdminPanel";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "helena2024";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (authenticated) return <AdminPanel />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Jost', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');`}</style>
      <div style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(20px)",
        borderRadius: 24,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 360,
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8, fontFamily: "'Cormorant Garamond', serif", color: "white", fontWeight: 300 }}>
          Helena <em style={{ color: "#b7a05a" }}>Admin</em>
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#b7a05a", textTransform: "uppercase", marginBottom: 32 }}>
          Pannello di controllo
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            border: error ? "1.5px solid #ef4444" : "1.5px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.07)",
            color: "white",
            fontSize: 14,
            outline: "none",
            marginBottom: 16,
            fontFamily: "'Jost', sans-serif",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Password errata</div>}
        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: 16,
            borderRadius: 12,
            background: "linear-gradient(135deg, #b7a05a, #d4be78)",
            border: "none",
            color: "white",
            fontSize: 12,
            letterSpacing: 3,
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "'Jost', sans-serif",
          }}
        >
          Accedi
        </button>
      </div>
    </div>
  );
}
