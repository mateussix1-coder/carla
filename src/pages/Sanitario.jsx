import { CalendarClock, Filter, Pill, Plus, ShieldPlus, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { differenceInDays, formatDate, toISODate } from '../utils/dateUtils.js'

const initialForm = {
  type: 'Vacina',
  product: '',
  date: toISODate(),
  related: '',
  dosage: '',
  responsible: '',
  notes: '',
  nextDate: '',
}

export default function Sanitario() {
  const { sanitario, matrizes, lotes, alunos, addSanitario } = useAppData()
  const [filter, setFilter] = useState('Todos')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const filtered = useMemo(
    () => sanitario.filter((record) => filter === 'Todos' || record.type === filter),
    [sanitario, filter],
  )
  const upcoming = sanitario
    .filter((record) => record.nextDate)
    .map((record) => ({ ...record, days: differenceInDays(record.nextDate, toISODate()) }))
    .filter((record) => record.days >= 0 && record.days <= 14)
    .sort((a, b) => a.days - b.days)

  function submit(event) {
    event.preventDefault()
    addSanitario(form)
    setForm(initialForm)
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Saúde animal"
        title="Vacinas e medicamentos"
        description="Histórico sanitário de matrizes e lotes, com lembretes para as próximas aplicações."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Novo manejo</button>}
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-[#d8c79e] bg-[#f8f2e5] text-[#ad7b22]"><CalendarClock size={19} /></span>
            <div><h2 className="section-title">Próximas aplicações</h2><p className="text-sm text-slate-500">Agenda dos próximos 14 dias</p></div>
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.map((record) => (
              <div key={record.id} className="flex items-center justify-between gap-3 border-l-4 border-l-[#ad7b22] bg-[#f8f2e5] p-4">
                <div><strong className="block text-sm text-amber-950">{record.product}</strong><span className="text-xs text-amber-700">{record.related} · {formatDate(record.nextDate)}</span></div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700">{record.days === 0 ? 'Hoje' : `${record.days}d`}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="surface-card p-5 sm:p-6">
          <div className="grid grid-cols-2 divide-x divide-y divide-[#e2ddd2] border border-[#e2ddd2] sm:grid-cols-3 sm:divide-y-0">
            <div className="p-4"><Syringe className="text-[#1b6a41]" size={20} /><strong className="mt-4 block text-2xl font-bold text-[#082f1f]">{sanitario.filter((item) => item.type === 'Vacina').length}</strong><span className="text-xs font-semibold text-slate-600">Vacinas registradas</span></div>
            <div className="p-4"><Pill className="text-[#0b3b27]" size={20} /><strong className="mt-4 block text-2xl font-bold text-[#082f1f]">{sanitario.filter((item) => item.type === 'Medicamento').length}</strong><span className="text-xs font-semibold text-slate-600">Medicamentos</span></div>
            <div className="col-span-2 bg-[#f8f2e5] p-4 sm:col-span-1"><ShieldPlus className="text-[#ad7b22]" size={20} /><strong className="mt-4 block text-2xl font-bold text-[#082f1f]">{upcoming.length}</strong><span className="text-xs font-semibold text-slate-600">Alertas próximos</span></div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
            <Filter size={18} className="text-slate-400" />
            <div className="flex flex-wrap gap-2">
              {['Todos', 'Vacina', 'Medicamento'].map((option) => (
                <button key={option} onClick={() => setFilter(option)} className={`rounded-full px-4 py-2 text-xs font-bold ${filter === option ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{option}</button>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        {filtered.map((record) => (
          <article key={record.id} className="surface-card grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <span className="grid h-11 w-11 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]">
              {record.type === 'Vacina' ? <Syringe size={21} /> : <Pill size={21} />}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-900">{record.product}</h2><StatusBadge>{record.type}</StatusBadge></div>
              <p className="mt-1 text-sm text-slate-500">{record.related} · {record.dosage} · {record.responsible}</p>
              {record.notes && <p className="mt-1 text-xs text-slate-400">{record.notes}</p>}
            </div>
            <div className="sm:text-right"><strong className="block text-sm text-slate-800">{formatDate(record.date)}</strong>{record.nextDate && <span className="text-xs text-amber-600">Próxima: {formatDate(record.nextDate)}</span>}</div>
          </article>
        ))}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar manejo sanitário">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect label="Tipo" required options={['Vacina', 'Medicamento']} placeholder="" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <FormInput label="Nome do produto" required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <FormInput label="Data" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormSelect label="Matriz ou lote relacionado" required options={[...matrizes.map((item) => ({ value: item.id, label: `Matriz ${item.id} · ${item.name}` })), ...lotes.map((item) => ({ value: item.id, label: `Lote ${item.id}` }))]} value={form.related} onChange={(e) => setForm({ ...form, related: e.target.value })} />
          <FormInput label="Dosagem" required value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="Ex.: 2 ml/animal" />
          <FormSelect label="Responsável" required options={alunos.map((item) => item.name)} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <FormInput label="Próxima aplicação" type="date" value={form.nextDate} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Salvar manejo</button></div>
        </form>
      </Modal>
    </div>
  )
}
