import { Edit3, Filter, Paperclip, Pill, Plus, ShieldPlus, Syringe, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import AttachmentManager from '../components/AttachmentManager.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { formatDate, toISODate } from '../utils/dateUtils.js'

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
  const {
    sanitario,
    matrizes,
    lotes,
    alunos,
    settings,
    addSanitario,
    updateSanitario,
    deleteSanitario,
  } = useAppData()
  const [filter, setFilter] = useState('Todos')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [confirming, setConfirming] = useState(null)
  const [attachmentsFor, setAttachmentsFor] = useState(null)
  const filtered = useMemo(
    () => sanitario.filter((record) => filter === 'Todos' || record.type === filter),
    [sanitario, filter],
  )

  function openCreate() {
    setEditingId('')
    setForm({ ...initialForm, responsible: settings.teacherName })
    setOpen(true)
  }

  function openEdit(record) {
    setEditingId(record.id)
    setForm({ ...initialForm, ...record })
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    if (editingId) updateSanitario(editingId, form)
    else addSanitario(form)
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Saúde animal"
        title="Sanitário"
        description="Registros simples de vacinas, medicamentos, ocorrências e vermifugação."
        action={<button className="primary-button w-full sm:w-auto" onClick={openCreate}><Plus size={19} /> Novo registro</button>}
      />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {['Vacina', 'Medicamento', 'Ocorrência', 'Vermífugo'].map((type) => (
          <article key={type} className="surface-card p-4">
            <strong className="block text-2xl text-[#073b28]">{sanitario.filter((item) => item.type === type).length}</strong>
            <span className="text-xs text-slate-500">{type}</span>
          </article>
        ))}
      </section>

      <div className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1">
        <Filter size={17} className="mt-2.5 shrink-0 text-slate-400" />
        {['Todos', 'Vacina', 'Medicamento', 'Ocorrência', 'Vermífugo'].map((option) => (
          <button key={option} onClick={() => setFilter(option)} className={`filter-pill ${filter === option ? 'filter-pill-active' : ''}`}>{option}</button>
        ))}
      </div>

      {filtered.length ? (
        <section className="space-y-3">
          {filtered.map((record) => (
            <article key={record.id} className="surface-card premium-card grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]">
                {record.type === 'Vacina' ? <Syringe size={21} /> : record.type === 'Medicamento' ? <Pill size={21} /> : <ShieldPlus size={21} />}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-900">{record.product}</h2><StatusBadge>{record.type}</StatusBadge></div>
                <p className="mt-1 text-sm text-slate-500">{record.related} · {record.dosage || 'sem dosagem'} · {record.responsible}</p>
                {record.notes && <p className="mt-1 text-xs text-slate-400">{record.notes}</p>}
              </div>
              <div className="sm:text-right">
                <strong className="block text-sm text-slate-800">{formatDate(record.date)}</strong>
                {record.nextDate && <span className="text-xs text-amber-600">Próxima: {formatDate(record.nextDate)}</span>}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button className="action-button" onClick={() => setAttachmentsFor(record)}><Paperclip size={14} /> Anexos</button>
                  <button className="action-button" onClick={() => openEdit(record)}><Edit3 size={14} /> Editar</button>
                  <button className="action-button action-danger" onClick={() => setConfirming(record)}><Trash2 size={14} /> Excluir</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nenhum registro sanitário" description="Crie um registro ou altere o filtro." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar registro sanitário' : 'Registrar manejo sanitário'}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect label="Tipo" required options={['Vacina', 'Medicamento', 'Ocorrência', 'Vermífugo']} placeholder="" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <FormInput label="Produto ou descrição" required value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <FormInput label="Data" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormSelect label="Animal ou ninhada" required options={[...matrizes.map((item) => ({ value: item.id, label: `Matriz ${item.id} · ${item.name}` })), ...lotes.map((item) => ({ value: item.id, label: `Ninhada ${item.id}` }))]} value={form.related} onChange={(e) => setForm({ ...form, related: e.target.value })} />
          <FormInput label="Dosagem (opcional)" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
          <FormSelect label="Responsável" required options={[settings.teacherName, ...alunos.map((item) => item.name)]} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <FormInput label="Próxima aplicação" type="date" value={form.nextDate} onChange={(e) => setForm({ ...form, nextDate: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="modal-actions sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar registro'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(attachmentsFor)} onClose={() => setAttachmentsFor(null)} title={`Anexos · ${attachmentsFor?.product || ''}`} size="max-w-4xl">
        {attachmentsFor && <AttachmentManager entityType="sanitario" entityId={attachmentsFor.id} title="Evidências do manejo sanitário" />}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Excluir registro sanitário?"
        description="O registro será removido definitivamente do histórico operacional."
        onConfirm={() => {
          deleteSanitario(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}
