import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  PiggyBank,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import ProgressBar from '../ProgressBar.jsx'
import { formatDate } from '../../utils/dateUtils.js'
import GestationStatusChip from './GestationStatusChip.jsx'

function remainingLabel(remaining) {
  if (remaining < 0) return `Atrasada há ${Math.abs(remaining)} dias`
  if (remaining === 0) return 'Parto previsto hoje'
  return `Faltam ${remaining} dias`
}

export default function GestationCard({ item, boar, onDetails, onRegister }) {
  const { matrix, coverage, elapsed, remaining, progress, stage, expectedDate } = item
  const critical = remaining <= 7
  const barColor = critical ? 'bg-red-600' : remaining <= 21 ? 'bg-[#ad7b22]' : 'bg-[#1b6a41]'
  const emphasis = critical ? 'text-red-700' : remaining <= 21 ? 'text-[#946719]' : 'text-[#0b3b27]'

  const facts = [
    { label: 'Cobertura', value: formatDate(coverage.date), icon: CalendarDays },
    { label: 'Parto previsto', value: formatDate(expectedDate), icon: CalendarDays },
    { label: 'VARRÃO', value: boar, icon: PiggyBank },
    { label: 'Responsável', value: coverage.responsible, icon: UserRound },
  ]

  return (
    <article className="surface-card min-w-0 overflow-hidden">
      <div className={`h-1.5 ${critical ? 'bg-red-600' : 'bg-[#0b3b27]'}`} />
      <div className="p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]">
            <PiggyBank size={21} strokeWidth={1.7} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ad7b22]">{matrix.id}</p>
              <GestationStatusChip status={stage} />
            </div>
            <h2 className="mt-1 truncate text-lg font-bold text-[#082f1f]">{matrix.name}</h2>
            <p className="text-xs text-slate-500">{matrix.breed}</p>
          </div>
        </div>

        <div className="mt-5 border-y border-[#e2ddd2] py-4">
          <div className="mb-2 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <strong className="text-sm text-[#082f1f]">{elapsed}/114 dias</strong>
            <strong className={`text-base ${emphasis}`}>{remainingLabel(remaining)}</strong>
            <span className="text-xs font-bold text-slate-500">{progress}%</span>
          </div>
          <ProgressBar value={progress} color={barColor} />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 py-4 lg:grid-cols-4">
          {facts.map(({ label, value, icon: Icon }) => (
            <div key={label} className="min-w-0">
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                <Icon size={13} />
                {label}
              </span>
              <strong className="mt-1.5 block truncate text-xs text-slate-800">{value}</strong>
            </div>
          ))}
        </div>

        <div className="grid gap-2 border-t border-[#e2ddd2] pt-4 sm:grid-cols-2">
          <button className="primary-button w-full" onClick={onRegister}>
            <Stethoscope size={17} />
            Registrar parto
          </button>
          <button className="secondary-button w-full" onClick={onDetails}>
            <ClipboardList size={17} />
            Ver detalhes
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  )
}
