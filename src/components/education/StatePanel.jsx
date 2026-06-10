import { AlertTriangle, Inbox, LoaderCircle, RefreshCw } from 'lucide-react'

export function LoadingState({ label = 'Carregando informações...' }) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <LoaderCircle className="animate-spin text-[#0b6847]" size={30} />
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="surface-card flex min-h-64 flex-col items-center justify-center border-red-100 p-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle size={25} />
      </span>
      <h3 className="mt-4 font-bold text-slate-900">Não foi possível carregar</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="secondary-button mt-5">
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}) {
  return (
    <div className="surface-card flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef6f0] text-[#0b6847]">
        <Icon size={25} />
      </span>
      <h3 className="mt-4 font-bold text-[#073f2b]">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
