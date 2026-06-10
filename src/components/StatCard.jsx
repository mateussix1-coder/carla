const themes = {
  emerald: 'text-emerald-800 bg-emerald-50 border-emerald-100',
  sky: 'text-blue-800 bg-blue-50 border-blue-100',
  amber: 'text-amber-800 bg-amber-50 border-amber-100',
  rose: 'text-red-700 bg-red-50 border-red-100',
  violet: 'text-teal-800 bg-teal-50 border-teal-100',
}

export default function StatCard({ title, value, detail, icon: Icon, theme = 'emerald' }) {
  return (
    <article className="surface-card flex min-h-28 items-center gap-3 p-4 sm:min-h-32 sm:gap-4 sm:p-5">
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border sm:h-14 sm:w-14 ${themes[theme]}`}>
          <Icon size={21} strokeWidth={1.8} />
        </span>
      <div className="min-w-0">
        <span className="block text-[11px] font-semibold leading-4 text-slate-600 sm:text-xs">{title}</span>
        <strong className="mt-1 block text-3xl font-bold tracking-tight text-slate-950">{value}</strong>
        {detail && <span className="mt-1 block text-[11px] text-slate-500">{detail}</span>}
      </div>
    </article>
  )
}
