import { Plus, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

const initialForm = { id: '', name: '', breed: '', age: '', status: 'Ativo', notes: '' }

export default function Varroes() {
  const { varroes, addVarrao } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    if (varroes.some((boar) => boar.id.toLowerCase() === form.id.trim().toLowerCase())) {
      setError('Já existe um varrão com este brinco.')
      return
    }
    addVarrao({ ...form, id: form.id.trim().toUpperCase() })
    setForm(initialForm)
    setError('')
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Reprodução"
        title="Varrões"
        description="Reprodutores disponíveis para coberturas naturais ou planejamento genético."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Novo varrão</button>}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {varroes.map((boar) => (
          <article key={boar.id} className="surface-card p-6">
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]"><UserRound size={22} strokeWidth={1.7} /></span>
              <StatusBadge>{boar.status}</StatusBadge>
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">{boar.id}</p>
            <h2 className="mt-1 text-xl font-bold text-[#082f1f]">{boar.name}</h2>
            <p className="text-sm text-slate-500">{boar.breed} · {boar.age}</p>
            <p className="mt-5 min-h-12 text-sm leading-6 text-slate-600">{boar.notes}</p>
            <div className="mt-5 flex items-center gap-2 border-t border-[#e2ddd2] pt-4 text-xs font-semibold text-[#1b6a41]">
              <ShieldCheck size={17} />
              Cadastro reprodutivo atualizado
            </div>
          </article>
        ))}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar varrão">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="ID / brinco" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Ex.: V003" />
          <FormInput label="Nome / apelido" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormInput label="Raça" required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <FormInput label="Idade aproximada" required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Ex.: 2 anos" />
          <FormSelect label="Status" options={['Ativo', 'Inativo']} placeholder="" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-28 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {error && <p className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => setOpen(false)} className="secondary-button">Cancelar</button><button className="primary-button">Salvar varrão</button></div>
        </form>
      </Modal>
    </div>
  )
}
