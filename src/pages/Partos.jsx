import { Baby, Clock, Plus, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { totalBorn } from '../utils/calculations.js'
import { formatDate, toISODate } from '../utils/dateUtils.js'

const initialForm = {
  matrixId: '',
  date: toISODate(),
  startTime: '',
  endTime: '',
  alive: '',
  stillborn: '0',
  mummified: '0',
  birthWeight: '',
  notes: '',
  occurrences: '',
  responsible: '',
}

export default function Partos() {
  const { partos, matrizes, alunos, addParto } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const total = useMemo(() => totalBorn(form), [form])
  const matrixName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }

  function submit(event) {
    event.preventDefault()
    addParto({
      ...form,
      alive: Number(form.alive),
      stillborn: Number(form.stillborn),
      mummified: Number(form.mummified),
    })
    setForm(initialForm)
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Maternidade"
        title="Partos"
        description="Registre a atividade do parto e crie automaticamente o lote para acompanhamento."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Registrar parto</button>}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        {partos.map((birth) => {
          const total = totalBorn(birth)
          return (
            <article key={birth.id} className="surface-card p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]">
                    <Stethoscope size={22} strokeWidth={1.7} />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">{birth.id}</p>
                    <h2 className="text-lg font-bold text-[#082f1f]">{matrixName(birth.matrixId)}</h2>
                    <p className="text-sm text-slate-500">{formatDate(birth.date)} · lote {birth.lotId}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Concluído</span>
              </div>

              <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-[#e2ddd2] border border-[#e2ddd2] sm:grid-cols-4 sm:divide-y-0">
                <div className="p-3"><span className="text-xs font-semibold text-[#1b6a41]">Vivos</span><strong className="mt-1 block text-2xl font-bold text-[#082f1f]">{birth.alive}</strong></div>
                <div className="p-3"><span className="text-xs font-semibold text-red-600">Natimortos</span><strong className="mt-1 block text-2xl font-bold text-slate-900">{birth.stillborn}</strong></div>
                <div className="p-3"><span className="text-xs font-semibold text-[#ad7b22]">Mumificados</span><strong className="mt-1 block text-2xl font-bold text-slate-900">{birth.mummified}</strong></div>
                <div className="bg-[#f7f5ef] p-3"><span className="text-xs font-semibold text-slate-500">Total</span><strong className="mt-1 block text-2xl font-bold text-slate-900">{total}</strong></div>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Clock size={16} />
                  {birth.startTime || birth.endTime
                    ? `${birth.startTime || '--:--'} às ${birth.endTime || '--:--'}`
                    : 'Horário não informado'}
                </span>
                <span>Responsável: <strong className="text-slate-700">{birth.responsible}</strong></span>
              </div>
              {(birth.notes || birth.occurrences) && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {birth.notes && <p>{birth.notes}</p>}
                  {birth.occurrences && <p className="mt-1"><strong>Ocorrências:</strong> {birth.occurrences}</p>}
                </div>
              )}
            </article>
          )
        })}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar atividade do parto" size="max-w-3xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect label="Matriz" required options={matrizes.filter((item) => ['Prenha', 'Coberta'].includes(item.status)).map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} value={form.matrixId} onChange={(e) => setForm({ ...form, matrixId: e.target.value })} />
          <FormInput label="Data do parto" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormInput label="Hora de início" required type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <FormInput label="Hora de término" required type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <FormInput label="Leitões nascidos vivos" required type="number" min="0" value={form.alive} onChange={(e) => setForm({ ...form, alive: e.target.value })} />
          <FormInput label="Peso médio ao nascer (kg)" type="number" min="0" step="0.01" value={form.birthWeight} onChange={(e) => setForm({ ...form, birthWeight: e.target.value })} />
          <FormInput label="Natimortos" required type="number" min="0" value={form.stillborn} onChange={(e) => setForm({ ...form, stillborn: e.target.value })} />
          <FormInput label="Mumificados" required type="number" min="0" value={form.mummified} onChange={(e) => setForm({ ...form, mummified: e.target.value })} />
          <div className="sm:col-span-2 flex items-center justify-between border border-[#d8c79e] bg-[#f8f2e5] p-5 text-[#082f1f]">
            <span className="flex items-center gap-3 text-sm font-semibold"><Baby size={22} className="text-[#ad7b22]" /> Total nascido calculado</span>
            <strong className="text-3xl font-bold">{total}</strong>
          </div>
          <FormSelect label="Responsável / aluno" required options={alunos.map((item) => item.name)} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações do parto</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className="field-label">Ocorrências</span><textarea className="field-control min-h-24 py-3" value={form.occurrences} onChange={(e) => setForm({ ...form, occurrences: e.target.value })} placeholder="Intervenções, comportamento, suporte aos leitões..." /></label>
          <div className="sm:col-span-2"><PhotoPlaceholder compact /></div>
          <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Salvar e criar lote</button></div>
        </form>
      </Modal>
    </div>
  )
}
