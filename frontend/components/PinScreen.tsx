"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function PinScreen() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);
    const ok = await login(pin);
    setLoading(false);
    if (!ok) {
      setError(true);
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(20,168,122,0.1)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#14a87a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-heading text-xl text-text-primary">אבישג - ניהול רכש</h1>
          <p className="font-body text-sm text-text-secondary mt-1">הזן קוד PIN להתחברות</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="קוד PIN"
            autoFocus
            className={`w-full bg-surface-raised border rounded-xl px-4 py-3 text-center text-lg font-body text-text-primary tracking-[0.3em] placeholder:text-text-secondary placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-transparent ${
              error ? "border-red-500/50" : "border-white/[0.06]"
            }`}
          />
          {error && (
            <p className="text-red-400 text-sm font-body text-center">קוד שגוי, נסה שוב</p>
          )}
          <button
            type="submit"
            disabled={!pin || loading}
            className="w-full py-3 rounded-xl text-white font-body font-medium text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #14a87a, #0d8c63)" }}
          >
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>
      </div>
    </div>
  );
}
