const SEV = {
  CRITICAL: "bg-red-600 text-white",
  HIGH:     "bg-orange-500 text-white",
  MEDIUM:   "bg-yellow-400 text-gray-900",
  LOW:      "bg-green-600 text-white",
};

export default function SeverityBadge({ level }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${SEV[level] ?? "bg-gray-400 text-white"}`}>
      {level}
    </span>
  );
}
