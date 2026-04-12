"use client";

interface FABProps {
  onClick: () => void;
}

export function FAB({ onClick }: FABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full bg-ocean-500 text-white shadow-lg
        flex items-center justify-center hover:bg-ocean-600 active:scale-95 transition-all duration-150"
      aria-label="\u05D4\u05D5\u05E1\u05E4\u05D4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}
