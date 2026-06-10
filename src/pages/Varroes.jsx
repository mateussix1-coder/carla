import { Archive, ArchiveRestore, Edit3, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { formatDate } from '../utils/dateUtils.js'

const initialForm = {
  id: '',
  name: '',
  breed: '',
  birthDate: '',
  status: 'Ativo',
  notes: '',
}

export default function Varroes() {
  const {
    varroes,
    addVarrao,
    updateVarrao,
    archiveVarrao,
    deleteVarrao,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null)

  function openCreate() {
    setEditingId('')
    setForm(initialForm)
    setError('')
    setOpen(true)
  }

  function openEdit(boar) {
    setEditingId(boar.id)
    setForm({ ...initialForm, ...boar })
    setError('')
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    const id = form.id.trim().toUpperCase()
    if (varroes.some((boar) => boar.id.toLowerCase() === id.toLowerCase() && boar.id !== editingId)) {
      setError('Já existe um varrão com este brinco.')
      return
    }
    const record = { ...form, id, archived: form.status === 'Inativo' }
    if (editingId) updateVarrao(editingId, record)
    else addVarrao(record)
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reprodução"
        title="Varrões"
        description="Cadastre e gerencie os reprodutores utilizados nas coberturas."
        action={<button className="primary-button w-full sm:w-auto" onClick={openCreate}><Plus size={19} /> Novo varrão</button>}
      />

      {varroes.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {varroes.map((boar) => (
            <article key={boar.id} className="surface-card premium-card p-6">
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]"><UserRound size={22} strokeWidth={1.7} /></span>
                <StatusBadge>{boar.status}</StatusBadge>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">{boar.id}</p>
              <h2 className="mt-1 text-xl font-bold text-[#082f1f]">{boar.name}</h2>
              <p className="text-sm text-slate-500">{boar.breed}</p>
              <p className="mt-2 text-xs text-slate-400">Nascimento: {formatDate(boar.birthDate)}</p>
              <p className="mt-5 min-h-12 text-sm leading-6 text-slate-600">{boar.notes || 'Sem observações.'}</p>
              <div className="mt-5 flex items-center gap-2 border-t border-[#e2ddd2] pt-4 text-xs font-semibold text-[#1b6a41]">
                <ShieldCheck size={17} />
                Cadastro reprodutivo disponível para edição
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="action-button" onClick={() => openEdit(boar)}><Edit3 size={15} /> Editar</button>
                {boar.archived ? (
                  <button className="action-button action-success" onClick={() => updateVarrao(boar.id, { ...boar, status: 'Ativo', archived: false })}><ArchiveRestore size={15} /> Reativar</button>
                ) : (
                  <button className="action-button action-warning" onClick={() => archiveVarrao(boar.id)}><Archive size={15} /> Arquivar</button>
                )}
                <button className="action-button action-danger col-span-2" onClick={() => setConfirming(boar)}><Trash2 size={15} /> Excluir definitivamente</button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nenhum varrão cadastrado" description="Cadastre o primeiro reprodutor para registrar coberturas." />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar varrão' : 'Cadastrar varrão'}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Código / brinco" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Ex.: V003" />
          <FormInput label="Nome / apelido" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormInput label="Raça" required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <FormInput label="Data de nascimento" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <FormSelect label="Status" options={['Ativo', 'Inativo']} placeholder="" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-28 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {error && <p className="feedback-error sm:col-span-2">{error}</p>}
          <div className="modal-actions sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="secondary-button">Cancelar</button><button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar varrão'}</button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title={`Excluir ${confirming?.name || 'varrão'}?`}
        description="O cadastro será removido. Coberturas antigas continuarão mostrando o código utilizado para preservar o histórico."
        onConfirm={() => {
          deleteVarrao(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}
