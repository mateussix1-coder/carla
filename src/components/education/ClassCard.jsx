import {
  ArrowRight,
  BookOpenCheck,
  MoreHorizontal,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const themes = {
  forest: 'from-[#073f2b] to-[#0b5b3d]',
  emerald: 'from-[#0d6847] to-[#159364]',
  gold: 'from-[#8a641e] to-[#d09a35]',
  blue: 'from-[#174f67] to-[#2785a8]',
  violet: 'from-[#554174] to-[#8d68ae]',
}

export default function ClassCard({ item, onMenu }) {
  return (
    <article className="group surface-card premium-card overflow-hidden">
      <div className={`relative min-h-32 bg-gradient-to-br ${themes[item.color] || themes.forest} p-5 text-white`}>
        <div className="absolute -right-6 -top-8 h-32 w-32 rounded-full border border-white/15 bg-white/5" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
            <BookOpenCheck size={22} />
          </span>
          <button
            type="button"
            onClick={() => onMenu?.(item)}
            className="grid h-10 w-10 place-items-center rounded-xl text-white/75 transition hover:bg-white/15 hover:text-white"
            aria-label={`Mais opções para ${item.name}`}
          >
            <MoreHorizontal size={21} />
          </button>
        </div>
        <span className="relative mt-5 inline-flex rounded-full border border-white/20 bg-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
          {item.status === 'active' ? 'Turma ativa' : 'Turma inativa'}
        </span>
      </div>

      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ad7b22]">
          {item.code}
        </p>
        <h2 className="mt-2 text-lg font-bold tracking-tight text-[#073f2b]">
          {item.name}
        </h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
          {item.description}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-[#ece7dd] pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Users size={16} className="text-[#0b6847]" />
            {item.studentCount} {item.studentCount === 1 ? 'aluno' : 'alunos'}
          </div>
          {item.pendingCount > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              {item.pendingCount} pendente{item.pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Link
          to={`/turmas/${item.id}`}
          className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#eff6f1] px-4 text-sm font-bold text-[#073f2b] transition hover:bg-[#0b5137] hover:text-white"
        >
          Abrir turma
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  )
}
