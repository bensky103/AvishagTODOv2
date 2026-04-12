interface KpiCardProps {
  value: number | string;
  label: string;
  variant?: "default" | "danger";
}

export function KpiCard({ value, label, variant = "default" }: KpiCardProps) {
  const classes =
    variant === "danger"
      ? "bg-red-50 border border-red-200 text-red-700"
      : "bg-white border border-gray-200 text-gray-900";

  return (
    <div className={`rounded-xl p-4 ${classes}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p
        className={`text-xs mt-1 ${
          variant === "danger" ? "text-red-500" : "text-gray-500"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
