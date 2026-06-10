import {
  ExternalLink,
  FileText,
  Image,
  Link2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useAppData } from '../context/AppDataContext.jsx'
import { isValidHttpUrl, videoEmbedUrl } from '../utils/dataUtils.js'
import { formatDate, toISODate } from '../utils/dateUtils.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import FormInput from './FormInput.jsx'
import FormSelect from './FormSelect.jsx'
import Modal from './Modal.jsx'

const emptyForm = {
  title: '',
  type: 'Imagem',
  url: '',
  date: toISODate(),
  responsible: '',
  notes: '',
}

const icons = {
  Imagem: Image,
  Vídeo: Video,
  Documento: FileText,
}

export default function AttachmentManager({ entityType, entityId, title = 'Fotos e documentos' }) {
  const {
    attachments,
    settings,
    addAttachment,
    updateAttachment,
    deleteAttachment,
    notify,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [confirming, setConfirming] = useState(null)

  const records = useMemo(
    () => attachments
      .filter((item) => item.entityType === entityType && item.entityId === entityId)
      .sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [attachments, entityType, entityId],
  )

  function openCreate() {
    setEditingId('')
    setForm({ ...emptyForm, responsible: settings.teacherName })
    setOpen(true)
  }

  function openEdit(record) {
    setEditingId(record.id)
    setForm({ ...emptyForm, ...record })
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    if (!isValidHttpUrl(form.url)) {
      notify('Informe uma URL válida iniciada por http:// ou https://.')
      return
    }
    const record = { ...form, entityType, entityId }
    const saved = editingId
      ? updateAttachment(editingId, record)
      : addAttachment(record)
    if (saved !== false) {
      setOpen(false)
      setEditingId('')
      setForm(emptyForm)
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebe6dc] p-5">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            Registre evidências por URL sem aumentar o tamanho do aplicativo.
          </p>
        </div>
        <button type="button" className="action-button action-success" onClick={openCreate}>
          <Plus size={16} />
          Adicionar anexo
        </button>
      </header>

      {records.length > 0 ? (
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {records.map((record) => {
            const Icon = icons[record.type] || Link2
            const embedUrl = record.type === 'Vídeo' ? videoEmbedUrl(record.url) : ''
            return (
              <article key={record.id} className="overflow-hidden rounded-2xl border border-[#e2ddd2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                {record.type === 'Imagem' && (
                  <a href={record.url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden bg-[#eef2ec]">
                    <img src={record.url} alt={record.title} loading="lazy" className="h-full w-full object-cover" />
                  </a>
                )}
                {embedUrl && (
                  <div className="aspect-video bg-slate-950">
                    <iframe
                      src={embedUrl}
                      title={record.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      className="h-full w-full border-0"
                    />
                  </div>
                )}
                {!embedUrl && record.type !== 'Imagem' && (
                  <a href={record.url} target="_blank" rel="noreferrer" className="grid min-h-36 place-items-center bg-[#f3f6f1] text-[#0b5136]">
                    <Icon size={36} strokeWidth={1.5} />
                  </a>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ad7b22]">{record.type}</span>
                      <h3 className="mt-1 truncate font-bold text-[#073f2b]">{record.title}</h3>
                    </div>
                    <a href={record.url} target="_blank" rel="noreferrer" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e2ddd2] text-slate-500 hover:text-[#0b5136]" aria-label="Abrir anexo">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(record.date)} · {record.responsible || 'Sem responsável'}</p>
                  {record.notes && <p className="mt-2 text-xs leading-5 text-slate-500">{record.notes}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" className="action-button" onClick={() => openEdit(record)}><Pencil size={14} /> Editar</button>
                    <button type="button" className="action-button action-danger" onClick={() => setConfirming(record)}><Trash2 size={14} /> Excluir</button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Link2 size={28} className="mx-auto text-[#ad7b22]" />
          <strong className="mt-3 block text-sm text-[#073f2b]">Nenhum anexo registrado</strong>
          <p className="mt-1 text-xs text-slate-500">Adicione fotos, vídeos ou documentos por link.</p>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar anexo' : 'Adicionar anexo'} subtitle="Use links HTTPS públicos e confiáveis.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Título" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <FormSelect label="Tipo" required options={['Imagem', 'Vídeo', 'Documento']} placeholder="" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
          <label className="sm:col-span-2">
            <span className="field-label">URL do arquivo</span>
            <input className="field-control" type="url" required placeholder="https://..." value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
          </label>
          <FormInput label="Data" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <FormInput label="Responsável" required value={form.responsible} onChange={(event) => setForm({ ...form, responsible: event.target.value })} />
          <label className="sm:col-span-2">
            <span className="field-label">Observações</span>
            <textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </label>
          <div className="modal-actions sm:col-span-2">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar anexo'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Excluir anexo?"
        description={`O anexo ${confirming?.title || ''} será removido deste registro.`}
        onConfirm={() => {
          deleteAttachment(confirming.id)
          setConfirming(null)
        }}
      />
    </section>
  )
}
