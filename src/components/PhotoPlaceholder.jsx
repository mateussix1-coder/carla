import { Camera, Plus } from 'lucide-react'

export default function PhotoPlaceholder({ compact = false }) {
  return (
    <button
      type="button"
      className={`group flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#c8c1b1] bg-white text-slate-500 transition hover:border-emerald-700 hover:bg-[#f7f5ef] ${
        compact ? 'min-h-28' : 'min-h-40'
      }`}
    >
      <span className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[#d8d3c7] bg-[#f7f5ef] text-[#0b3b27] transition">
        <Camera size={22} />
        <Plus size={13} className="absolute -right-1 -top-1 rounded-full bg-white" />
      </span>
      <span className="mt-3 text-sm font-bold">Adicionar foto</span>
      <span className="mt-1 text-xs text-slate-400">Imagem do registro</span>
    </button>
  )
}
