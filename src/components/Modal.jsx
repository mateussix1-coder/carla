import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, subtitle, children, size = 'max-w-2xl' }) {
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', closeOnEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#082f1f]/50 p-0 sm:items-center sm:p-6">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fechar modal" />
      <section
        role="dialog"
        aria-modal="true"
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-t-xl bg-[#f7f5ef] shadow-2xl sm:rounded-xl ${size}`}
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#d9d4c7] bg-[#0b3b27] px-5 py-4 text-white sm:px-7">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-white/70">{subtitle}</p>}
          </div>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>
        <div className="p-5 sm:p-7">{children}</div>
      </section>
    </div>
  )
}
