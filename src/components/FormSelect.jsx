export default function FormSelect({
  label,
  required,
  options,
  placeholder = 'Selecione',
  className = '',
  ...props
}) {
  return (
    <label className={className}>
      <span className="field-label">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <select className="field-control" required={required} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const text = typeof option === 'string' ? option : option.label
          return (
            <option key={value} value={value}>
              {text}
            </option>
          )
        })}
      </select>
    </label>
  )
}
