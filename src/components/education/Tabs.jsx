export default function Tabs({ items, value, onChange, label = 'Seções' }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto rounded-2xl border border-[#e2ddd2] bg-white p-1.5 shadow-sm"
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
          className={`flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition sm:text-sm ${
            value === item.value
              ? 'bg-[#073f2b] text-white shadow-md shadow-emerald-950/15'
              : 'text-slate-500 hover:bg-[#f4f1ea] hover:text-[#073f2b]'
          }`}
        >
          {item.icon && <item.icon size={16} />}
          {item.label}
          {item.count > 0 && (
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${
              value === item.value ? 'bg-white/15' : 'bg-amber-100 text-amber-700'
            }`}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
