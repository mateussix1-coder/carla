export default function GestationStatusChip({ status }) {
  const styles = {
    Atrasada: 'border-red-200 bg-red-50 text-red-700',
    'Próximo ao parto': 'border-[#efc4be] bg-[#fff1ef] text-[#a92a20]',
    'Dentro do prazo': 'border-[#b9cabb] bg-[#f3f6f1] text-[#17633d]',
  }

  const labels = {
    'Próximo ao parto': 'Próximo',
  }

  return (
    <span
      className={`inline-flex items-center border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
        styles[status] || styles['Dentro do prazo']
      }`}
    >
      {labels[status] || status}
    </span>
  )
}
