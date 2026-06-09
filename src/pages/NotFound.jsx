import { ArrowLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page-shell flex min-h-[75vh] items-center justify-center">
      <div className="surface-card max-w-lg p-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-700"><Home size={28} /></span>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Página não encontrada</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Este caminho não existe</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Use o menu do aplicativo ou retorne para o painel principal.</p>
        <Link to="/" className="primary-button mt-6"><ArrowLeft size={18} /> Voltar ao início</Link>
      </div>
    </div>
  )
}
