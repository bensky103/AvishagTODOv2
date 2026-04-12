"use client";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 md:bottom-8 left-6 z-50 rounded-2xl text-white shadow-lg
        flex items-center justify-center hover:shadow-xl active:scale-95 transition-all duration-200"
      style={{
        width: 52,
        height: 52,
        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
        boxShadow: "0 4px 14px rgba(99,102,241,0.4)",
      }}
      aria-label="הוספה"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
