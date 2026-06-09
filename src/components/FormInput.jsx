export default function FormInput({ label, required, className = '', ...props }) {
  return (
    <label className={className}>
      <span className="field-label">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      <input className="field-control" required={required} {...props} />
    </label>
  )
}
