export default function SummaryCard({ icon: Icon, label, value, detail, tone = 'green' }) {
  const tones = {
    green: 'border-[#b9cabb] bg-[#f3f6f1] text-[#0b3b27]',
    gold: 'border-[#d8c79e] bg-[#f8f2e5] text-[#946719]',
    red: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-[#d8d3c7] bg-white text-slate-600',
  }

  return (
    <article className={`min-w-0 border p-3.5 sm:p-4 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em]">{label}</span>
        <Icon size={17} strokeWidth={1.8} className="shrink-0" />
      </div>
      <strong className="mt-3 block text-2xl font-bold leading-none sm:text-3xl">{value}</strong>
      <span className="mt-2 block text-[11px] leading-4 opacity-75">{detail}</span>
    </article>
  )
}
