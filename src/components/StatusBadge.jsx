const styles = {
  Prenha: 'bg-emerald-100 text-emerald-800',
  Coberta: 'bg-sky-100 text-sky-800',
  Parida: 'bg-violet-100 text-violet-800',
  Lactação: 'bg-violet-100 text-violet-800',
  Vazia: 'bg-slate-100 text-slate-700',
  Desmamada: 'bg-teal-100 text-teal-800',
  Ativo: 'bg-emerald-100 text-emerald-800',
  Inativo: 'bg-slate-100 text-slate-600',
  Inativa: 'bg-slate-100 text-slate-600',
  'Aguardando confirmação': 'bg-sky-100 text-sky-800',
  'Prenhez confirmada': 'bg-emerald-100 text-emerald-800',
  Falhou: 'bg-red-100 text-red-800',
  Finalizada: 'bg-violet-100 text-violet-800',
  Concluído: 'bg-emerald-100 text-emerald-800',
  Início: 'bg-sky-100 text-sky-800',
  'Meio da gestação': 'bg-emerald-100 text-emerald-800',
  Atenção: 'bg-amber-100 text-amber-800',
  'Próximo ao parto': 'bg-rose-100 text-rose-800',
  Atrasada: 'bg-red-100 text-red-800',
  'Dentro do prazo': 'bg-emerald-100 text-emerald-800',
  'Recém-nascido': 'bg-sky-100 text-sky-800',
  'Em acompanhamento': 'bg-emerald-100 text-emerald-800',
  'Próximo ao desmame': 'bg-amber-100 text-amber-800',
  Desmamado: 'bg-teal-100 text-teal-800',
  Vacina: 'bg-emerald-100 text-emerald-800',
  Medicamento: 'bg-blue-100 text-blue-800',
  Ocorrência: 'bg-amber-100 text-amber-800',
  Vermífugo: 'bg-teal-100 text-teal-800',
}

export default function StatusBadge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-current/10 px-2.5 py-1 text-[11px] font-semibold ${
        styles[children] || 'bg-slate-100 text-slate-700'
      } ${className}`}
    >
      {children}
    </span>
  )
}
