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
              ? "bg-white/20 text-white shadow-sm"
              : "bg-white/10 text-white/70 hover:bg-white/15"
            : active
              ? "text-white shadow-sm"
              : "bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]";

        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${classes}`}
            style={variant === "body" && active ? { background: "#14a87a" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
