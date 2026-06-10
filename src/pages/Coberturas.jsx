import {
  CalendarCheck,
  CheckCircle2,
  Edit3,
  HeartPulse,
  Paperclip,
  Plus,
  Stethoscope,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AttachmentManager from '../components/AttachmentManager.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
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
  type: 'Monta natural',
  status: 'Aguardando confirmação',
  responsible: '',
  notes: '',
}

export default function Coberturas() {
  const {
    coberturas,
    matrizes,
    varroes,
    alunos,
    settings,
    addCobertura,
    updateCobertura,
    setCoberturaStatus,
    deleteCobertura,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [confirming, setConfirming] = useState(null)
  const [attachmentsFor, setAttachmentsFor] = useState(null)

  const matrixName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }
  const boarName = (id) => {
    const boar = varroes.find((item) => item.id === id)
    return boar ? `${boar.id} · ${boar.name}` : `${id} · removido do cadastro`
  }

  function openCreate() {
    setEditingId('')
    setForm({ ...initialForm, responsible: settings.teacherName })
    setOpen(true)
  }

  function openEdit(coverage) {
    setEditingId(coverage.id)
    setForm({ ...initialForm, ...coverage })
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    if (editingId) updateCobertura(editingId, form)
    else addCobertura(form)
    setForm(initialForm)
    setEditingId('')
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reprodução"
        title="Coberturas"
        description="Registre a cruza, confirme a prenhez e receba a previsão automática de parto."
        action={<button className="primary-button w-full sm:w-auto" onClick={openCreate}><Plus size={19} /> Nova cobertura</button>}
      />

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Registradas', coberturas.length, 'text-[#073f2b]'],
          ['Aguardando confirmação', coberturas.filter((item) => item.status === 'Aguardando confirmação').length, 'text-sky-700'],
          ['Prenhezes confirmadas', coberturas.filter((item) => item.status === 'Prenhez confirmada').length, 'text-emerald-700'],
          ['Falhas registradas', coberturas.filter((item) => item.status === 'Falhou').length, 'text-red-700'],
        ].map(([label, value, color]) => (
          <article key={label} className="surface-card p-4 sm:p-5">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <strong className={`mt-2 block text-3xl font-black ${color}`}>{value}</strong>
          </article>
        ))}
      </section>

      {coberturas.length ? (
        <section className="space-y-4">
          {coberturas.map((coverage) => (
            <article key={coverage.id} className="surface-card premium-card p-5 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ad7b22]">{coverage.id}</span>
                    <StatusBadge>{coverage.status}</StatusBadge>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-[#082f1f]">{matrixName(coverage.matrixId)}</h2>
                  <p className="mt-1 text-sm text-slate-500">Varrão: {boarName(coverage.boarId)} · {coverage.type}</p>
                  <p className="mt-1 text-xs text-slate-400">Responsável: {coverage.responsible || 'Não informado'}</p>
                  {coverage.notes && <p className="mt-3 text-sm leading-6 text-slate-600">{coverage.notes}</p>}
                </div>
                <div className="rounded-2xl border border-[#e2d2a9] bg-[#faf5e9] p-4 lg:min-w-56 lg:text-right">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#ad7b22] lg:justify-end"><CalendarCheck size={14} /> Previsão de parto</span>
                  <strong className="mt-1 block text-lg text-[#082f1f]">{formatDate(coverage.expectedDate)}</strong>
                  <span className="text-xs text-slate-500">Cobertura: {formatDate(coverage.date)}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#eee9df] pt-4 sm:flex sm:flex-wrap">
                <button className="action-button" onClick={() => openEdit(coverage)}><Edit3 size={15} /> Editar</button>
                <button className="action-button" onClick={() => setAttachmentsFor(coverage)}><Paperclip size={15} /> Anexos</button>
                {coverage.status === 'Aguardando confirmação' && (
                  <>
                    <button className="action-button action-success" onClick={() => setCoberturaStatus(coverage.id, 'Prenhez confirmada')}><CheckCircle2 size={15} /> Confirmar prenhez</button>
                    <button className="action-button action-warning" onClick={() => setCoberturaStatus(coverage.id, 'Falhou')}><XCircle size={15} /> Marcar falha</button>
                  </>
                )}
                {coverage.status === 'Prenhez confirmada' && (
                  <Link to="/partos" className="action-button action-success"><Stethoscope size={15} /> Registrar parto</Link>
                )}
                <button className="action-button action-danger sm:ml-auto" onClick={() => setConfirming(coverage)}><Trash2 size={15} /> Excluir</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nenhuma cobertura registrada" description="Registre uma cobertura para iniciar o ciclo de 114 dias." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar cobertura' : 'Registrar cobertura'} subtitle="A previsão é calculada automaticamente.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormSelect label="Matriz" required options={matrizes.filter((item) => !item.archived).map((item) => ({ value: item.id, label: `${item.id} · ${item.name} (${item.status})` }))} value={form.matrixId} onChange={(e) => setForm({ ...form, matrixId: e.target.value })} />
          <FormSelect label="Varrão utilizado" required options={varroes.filter((item) => !item.archived && item.status === 'Ativo').map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} value={form.boarId} onChange={(e) => setForm({ ...form, boarId: e.target.value })} />
          <FormInput label="Data da cobertura" required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <FormSelect label="Tipo de cobertura" required options={['Monta natural', 'Inseminação artificial', 'Outro']} placeholder="" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          {editingId && <FormSelect label="Status" options={['Aguardando confirmação', 'Prenhez confirmada', 'Falhou', 'Finalizada']} placeholder="" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />}
          <FormSelect label="Responsável" required options={[settings.teacherName, ...alunos.map((item) => item.name)]} value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {form.date && (
            <div className="sm:col-span-2 rounded-2xl border border-[#d8c79e] border-l-4 border-l-[#ad7b22] bg-[#f8f2e5] p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#ad7b22]">Previsão automática</span>
              <strong className="mt-1 block text-2xl font-bold text-[#082f1f]">{formatDate(expectedBirthDate(form.date))}</strong>
              <p className="mt-1 text-sm text-slate-600">114 dias após a cobertura</p>
            </div>
          )}
          <div className="modal-actions sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="secondary-button">Cancelar</button><button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar cobertura'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(attachmentsFor)} onClose={() => setAttachmentsFor(null)} title={`Anexos da cobertura ${attachmentsFor?.id || ''}`} size="max-w-4xl">
        {attachmentsFor && <AttachmentManager entityType="cobertura" entityId={attachmentsFor.id} title="Evidências da cobertura" />}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Excluir cobertura?"
        description={`A cobertura ${confirming?.id || ''} será removida e o status da matriz será recalculado.`}
        onConfirm={() => {
          deleteCobertura(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}
