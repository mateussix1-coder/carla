export default function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ad7b22]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[1.7rem] font-bold tracking-[-0.03em] text-[#073b28] sm:text-4xl">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
      </div>
      <div className="app-rule mt-5 w-24" />
    </header>
  )
}
