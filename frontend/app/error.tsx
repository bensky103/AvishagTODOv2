"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6" dir="rtl">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="font-heading text-lg text-gray-900 mb-2">משהו השתבש</h2>
        <p className="font-body text-sm text-gray-500 mb-4">
          {error.message || "אירעה שגיאה לא צפויה"}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-body font-medium rounded-xl transition-colors text-sm"
        >
          נסה שוב
        </button>
      </div>
    </div>
  );
}
