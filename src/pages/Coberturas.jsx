import { CalendarCheck, ClipboardPlus, Plus } from 'lucide-react'
import { useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { expectedBirthDate } from '../utils/calculations.js'
import { formatDate, toISODate } from '../utils/dateUtils.js'

const initialForm = {
  matrixId: '',
  boarId: '',
  date: toISODate(),
  type: 'Natural',
  responsible: '',
  notes: '',
}

export default function Coberturas() {
  const { coberturas, matrizes, varroes, alunos, addCobertura } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  function submit(event) {
    event.preventDefault()
    addCobertura(form)
    setForm(initialForm)
    setOpen(false)
  }

  const matrixName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }
  const boarName = (id) => {
    const boar = varroes.find((item) => item.id === id)
    return boar ? `${boar.id} · ${boar.name}` : id
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reprodução"
        title="Coberturas"
        description="Registre a cruza e receba automaticamente a previsão de parto em 114 dias."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Registrar cobertura</button>}
      />
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5"><p className="text-sm font-semibold text-slate-500">Coberturas registradas</p><strong className="mt-2 block text-3xl font-black">{coberturas.length}</strong></div>
        <div className="surface-card p-5"><p className="text-sm font-semibold text-slate-500">Matrizes cobertas/prenhas</p><strong className="mt-2 block text-3xl font-black text-emerald-700">{matrizes.filter((item) => ['Coberta', 'Prenha'].includes(item.status)).length}</strong></div>
        <div className="surface-card p-5"><p className="text-sm font-semibold text-slate-500">Reprodutores ativos</p><strong className="mt-2 block text-3xl font-black text-sky-700">{varroes.filter((item) => item.status === 'Ativo').length}</strong></div>
      </section>
      <section className="space-y-4">
        {coberturas.map((coverage) => (
          <article key={coverage.id} className="surface-card grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
            <span className="grid h-12 w-12 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]"><ClipboardPlus size={21} strokeWidth={1.7} /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#082f1f]">{matrixName(coverage.matrixId)}</h2>
                <StatusBadge>{coverage.type}</StatusBadge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Com {boarName(coverage.boarId)} · responsável: {coverage.responsible}</p>
              {coverage.notes && <p className="mt-2 text-sm text-slate-600">{coverage.notes}</p>}
            </div>
            <div className="border-l-2 border-[#ad7b22] bg-[#f7f5ef] px-4 py-3 sm:min-w-48 sm:text-right">
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#ad7b22] sm:justify-end"><CalendarCheck size={14} /> Previsão de parto</span>
              <strong className="mt-1 block text-lg text-[#082f1f]">{formatDate(coverage.expectedDate)}</strong>
              <span className="text-xs text-slate-500">Cobertura em {formatDate(coverage.date)}</span>
            </div>
          </article>
        ))}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Registrar cobertura" subtitle="A previsão será calculada automaticamente.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect label="Matriz" required options={matrizes.map((item) => ({ value: item.id, label: `${item.id} · ${item.name} (${item.status})` }))} value={form.matrixId} onChange={(e) => setForm({ ...form, matrixId: e.target.value })} />
          <FormSelect label="Varrão utilizado" required options={varroes.filter((item) => item.status === 'Ativo').map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} value={form.boarId} onChange={(e) => setForm({ ...form, boarId: e.target.value })} />
          <FormInput label="Data da cobertura" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormSelect label="Tipo de cobertura" required options={['Natural', 'Inseminação artificial', 'Outra']} placeholder="" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <FormSelect label="Responsável / aluno" required options={alunos.map((item) => item.name)} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {form.date && <div className="sm:col-span-2 border border-[#d8c79e] border-l-4 border-l-[#ad7b22] bg-[#f8f2e5] p-5"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#ad7b22]">Previsão automática</span><strong className="mt-1 block text-2xl font-bold text-[#082f1f]">{formatDate(expectedBirthDate(form.date))}</strong><p className="mt-1 text-sm text-slate-600">114 dias após a cobertura</p></div>}
          <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="secondary-button">Cancelar</button><button className="primary-button">Salvar cobertura</button></div>
        </form>
      </Modal>
    </div>
  )
}
