import { CalendarCheck, Check, Circle, Clock3, ShieldCheck, Stethoscope } from 'lucide-react'
import { addDays, formatDate } from '../../utils/dateUtils.js'

export default function GestationTimeline({ coverage, elapsed, remaining }) {
  const steps = [
    { label: 'Cobertura', date: coverage.date, day: 0, icon: CalendarCheck },
    { label: 'Diagnóstico', date: addDays(coverage.date, 28), day: 28, icon: Check },
    { label: 'Vacinas', date: addDays(coverage.date, 75), day: 75, icon: ShieldCheck },
    { label: 'Pré-parto', date: addDays(coverage.expectedDate, -7), day: 107, icon: Clock3 },
    { label: 'Parto', date: coverage.expectedDate, day: 114, icon: Stethoscope },
  ]

  const nextIndex = steps.findIndex((step) => elapsed < step.day)

  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {steps.map(({ label, date, day, icon: Icon }, index) => {
        const completed = day < 114 && elapsed >= day
        const upcoming = (index === nextIndex || (day === 114 && remaining <= 7)) && !completed
        const status = completed ? 'Concluído' : upcoming ? 'Próximo' : 'Pendente'
        const tone = completed
          ? 'border-[#b9cabb] bg-[#f3f6f1] text-[#17633d]'
          : upcoming
            ? 'border-[#d8c79e] bg-[#f8f2e5] text-[#946719]'
            : 'border-[#ddd8ca] bg-white text-slate-500'

        return (
          <div key={label} className={`border p-3 ${tone}`}>
            <div className="flex items-center justify-between gap-2">
              <Icon size={17} strokeWidth={1.8} />
              {completed ? <Check size={14} /> : <Circle size={12} />}
            </div>
            <strong className="mt-3 block text-xs">{label}</strong>
            <span className="mt-1 block text-[10px]">{formatDate(date, { shortYear: true })}</span>
            <span className="mt-2 block text-[9px] font-bold uppercase tracking-wider">{status}</span>
          </div>
        )
      })}
    </div>
  )
}
