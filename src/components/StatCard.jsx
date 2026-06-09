const themes = {
  emerald: 'text-emerald-800 bg-emerald-50 border-emerald-100',
  sky: 'text-blue-800 bg-blue-50 border-blue-100',
  amber: 'text-amber-800 bg-amber-50 border-amber-100',
  rose: 'text-red-700 bg-red-50 border-red-100',
  violet: 'text-teal-800 bg-teal-50 border-teal-100',
}

export default function StatCard({ title, value, detail, icon: Icon, theme = 'emerald' }) {
  return (
    <article className="surface-card flex min-h-28 flex-col justify-between p-4 sm:min-h-32 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold leading-4 text-slate-600">{title}</span>
        <span className={`grid h-9 w-9 shrink-0 place-items-center border ${themes[theme]}`}>
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>
      <div className="mt-3">
        <strong className="block text-3xl font-bold tracking-tight text-slate-950">{value}</strong>
        {detail && <span className="mt-1 block text-[11px] text-slate-500">{detail}</span>}
      </div>
    </article>
  )
}
