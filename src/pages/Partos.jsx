import {
  AlertTriangle,
  Baby,
  Clock,
  Edit3,
  Eye,
  Plus,
  Stethoscope,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { gestationDetails, totalBorn } from '../utils/calculations.js'
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
  const {
    partos,
    matrizes,
    coberturas,
    alunos,
    addParto,
    updateParto,
    deleteParto,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [confirming, setConfirming] = useState(null)
  const total = useMemo(() => totalBorn(form), [form])

  const priorities = matrizes
    .filter((matrix) => ['Prenha', 'Coberta', 'Próximo ao parto'].includes(matrix.status))
    .map((matrix) => {
      const coverage = coberturas
        .filter((item) => item.matrixId === matrix.id && !['Falhou', 'Finalizada'].includes(item.status))
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      return coverage ? { matrix, coverage, ...gestationDetails(coverage.date) } : null
    })
    .filter((item) => item && item.remaining <= 7)
    .sort((a, b) => a.remaining - b.remaining)

  const matrixName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }

  function openCreate(matrixId = '') {
    setEditingId('')
    setForm({ ...initialForm, matrixId })
    setOpen(true)
  }

  function openEdit(birth) {
    setEditingId(birth.id)
    setForm({ ...initialForm, ...birth })
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    const record = {
      ...form,
      alive: Number(form.alive),
      stillborn: Number(form.stillborn),
      mummified: Number(form.mummified),
      birthWeight: Number(form.birthWeight) || null,
    }
    if (editingId) updateParto(editingId, record)
    else addParto(record)
    setForm(initialForm)
    setEditingId('')
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Maternidade"
        title="Partos"
        description="Registre nascimentos e crie automaticamente a ninhada e o checklist inicial."
        action={<button className="primary-button w-full sm:w-auto" onClick={() => openCreate()}><Plus size={19} /> Registrar parto</button>}
      />

      <section className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <h2 className="section-title">Para registrar hoje</h2>
        </div>
        {priorities.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {priorities.map((item) => (
              <article key={item.matrix.id} className={`surface-card grid gap-4 border-l-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center ${item.remaining < 0 ? 'border-l-red-500' : 'border-l-amber-500'}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[#073f2b]">{item.matrix.id} · {item.matrix.name}</strong>
                    <StatusBadge>{item.stage}</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Previsão: {formatDate(item.expectedDate)}</p>
                  <strong className={`mt-1 block text-xs ${item.remaining < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {item.remaining < 0 ? `${Math.abs(item.remaining)} dia(s) de atraso` : `Faltam ${item.remaining} dia(s)`}
                  </strong>
                </div>
                <button className="primary-button" onClick={() => openCreate(item.matrix.id)}><Stethoscope size={17} /> Registrar parto</button>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card p-5 text-sm text-slate-500">Nenhuma matriz prevista para os próximos 7 dias.</div>
        )}
      </section>

      <div className="mb-3 flex items-center gap-2">
        <Baby size={18} className="text-[#0b6847]" />
        <h2 className="section-title">Partos registrados</h2>
      </div>

      {partos.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {partos.map((birth) => (
            <article key={birth.id} className="surface-card premium-card p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]"><Stethoscope size={22} strokeWidth={1.7} /></span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">{birth.id}</p>
                    <h2 className="text-lg font-bold text-[#082f1f]">{matrixName(birth.matrixId)}</h2>
                    <p className="text-sm text-slate-500">{formatDate(birth.date)} · ninhada {birth.lotId}</p>
                  </div>
                </div>
                <StatusBadge>Concluído</StatusBadge>
              </div>

              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#e2ddd2] sm:grid-cols-4">
                <NumberBlock label="Vivos" value={birth.alive} tone="text-emerald-700" />
                <NumberBlock label="Natimortos" value={birth.stillborn} tone="text-red-600" />
                <NumberBlock label="Mumificados" value={birth.mummified} tone="text-amber-700" />
                <NumberBlock label="Total" value={totalBorn(birth)} tone="text-[#073f2b]" />
              </div>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-2"><Clock size={16} />{birth.startTime || '--:--'} {birth.endTime ? `até ${birth.endTime}` : ''}</span>
                <span>Responsável: <strong className="text-slate-700">{birth.responsible}</strong></span>
              </div>
              {birth.notes && <p className="mt-4 rounded-2xl bg-[#f7f5ef] p-4 text-sm leading-6 text-slate-600">{birth.notes}</p>}
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[#eee9df] pt-4">
                <Link to="/leitoes" className="action-button"><Eye size={15} /> Ninhada</Link>
                <button className="action-button" onClick={() => openEdit(birth)}><Edit3 size={15} /> Editar</button>
                <button className="action-button action-danger" onClick={() => setConfirming(birth)}><Trash2 size={15} /> Excluir</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nenhum parto registrado" description="Use o botão Registrar parto para criar o primeiro nascimento." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar parto' : 'Registrar parto'} subtitle={editingId ? 'A ninhada vinculada será atualizada.' : 'Uma ninhada e o checklist serão criados automaticamente.'} size="max-w-3xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            label="Matriz"
            required
            options={(editingId ? matrizes : matrizes.filter((item) => ['Prenha', 'Coberta', 'Próximo ao parto'].includes(item.status))).map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))}
            value={form.matrixId}
            onChange={(e) => setForm({ ...form, matrixId: e.target.value })}
          />
          <FormInput label="Data do parto" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormInput label="Hora de início (opcional)" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <FormInput label="Hora de término (opcional)" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <FormInput label="Nascidos vivos" required type="number" min="0" value={form.alive} onChange={(e) => setForm({ ...form, alive: e.target.value })} />
          <FormInput label="Peso médio ao nascer (kg)" type="number" min="0" step="0.01" value={form.birthWeight || ''} onChange={(e) => setForm({ ...form, birthWeight: e.target.value })} />
          <FormInput label="Natimortos" required type="number" min="0" value={form.stillborn} onChange={(e) => setForm({ ...form, stillborn: e.target.value })} />
          <FormInput label="Mumificados" required type="number" min="0" value={form.mummified} onChange={(e) => setForm({ ...form, mummified: e.target.value })} />
          <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-[#d8c79e] bg-[#f8f2e5] p-5 text-[#082f1f]"><span className="flex items-center gap-3 text-sm font-semibold"><Baby size={22} className="text-[#ad7b22]" /> Total calculado</span><strong className="text-3xl font-bold">{total}</strong></div>
          <FormSelect label="Responsável" required options={['Profª Carla', ...alunos.map((item) => item.name)]} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações do parto</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <label className="sm:col-span-2"><span className="field-label">Ocorrências</span><textarea className="field-control min-h-24 py-3" value={form.occurrences} onChange={(e) => setForm({ ...form, occurrences: e.target.value })} /></label>
          <div className="modal-actions sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar e criar ninhada'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Excluir parto?"
        description="O parto e a ninhada vinculada, incluindo checklist e pesagens, serão removidos. A matriz voltará para o acompanhamento de gestação."
        onConfirm={() => {
          deleteParto(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}

function NumberBlock({ label, value, tone }) {
  return (
    <div className="border-b border-r border-[#e2ddd2] p-3 last:border-r-0 sm:border-b-0">
      <span className={`text-xs font-semibold ${tone}`}>{label}</span>
      <strong className="mt-1 block text-2xl font-bold text-slate-900">{value}</strong>
    </div>
  )
}
