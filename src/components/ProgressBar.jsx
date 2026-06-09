export default function ProgressBar({ value, label, color = 'bg-emerald-500' }) {
  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden bg-[#e5e0d5]">
        <div
          className={`h-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}
