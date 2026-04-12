"use client";

interface FilterChipsProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
  variant?: "header" | "body";
}

export function FilterChips({
  options,
  selected,
  onChange,
  variant = "body",
}: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar">
      {options.map((opt) => {
        const active = opt.value === selected;

        const classes =
          variant === "header"
            ? active
              ? "bg-white text-indigo-700 shadow-sm"
              : "bg-white/15 text-white/90 hover:bg-white/25"
            : active
              ? "text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200";

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${classes}`}
            style={variant === "body" && active ? { background: "#6366f1" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
