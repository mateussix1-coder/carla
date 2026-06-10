export default function PermissionToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`flex min-h-20 items-center gap-4 rounded-2xl border border-[#e5e0d6] bg-white p-4 transition ${
        disabled
          ? 'cursor-wait opacity-65'
          : 'cursor-pointer hover:border-[#b9ccbf] hover:shadow-sm'
      }`}
    >
      <span className="min-w-0 flex-1">
        <strong className="block text-sm text-[#073f2b]">{label}</strong>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="peer sr-only"
      />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-slate-200 transition peer-checked:bg-[#0b6847] peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-100">
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </label>
  )
}
