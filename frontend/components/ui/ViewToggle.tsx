"use client";

export type ViewMode = "cards" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "cards", label: "כרטיסים" },
  { value: "table", label: "טבלה" },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
              active
                ? "bg-white/20 text-white shadow-sm"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
