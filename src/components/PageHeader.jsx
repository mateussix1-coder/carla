export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="mb-6 border-b border-[#d7d1c2] pb-5 sm:mb-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ad7b22]">
            {eyebrow}
          </p>
        )}
          <h1 className="text-2xl font-bold tracking-tight text-[#082f1f] sm:text-3xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {action}
      </div>
      <div className="app-rule mt-5 w-32" />
    </header>
  )
}
