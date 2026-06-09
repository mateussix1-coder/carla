import { SearchX } from 'lucide-react'

export default function EmptyState({ title = 'Nenhum registro encontrado', description }) {
  return (
    <div className="surface-card flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <SearchX size={25} />
      </span>
      <h3 className="mt-4 font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>}
    </div>
  )
}
