import { CalendarDays, Clock3, Plus, Search, Weight } from 'lucide-react'
import { useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import PhotoPlaceholder from '../components/PhotoPlaceholder.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { formatDate } from '../utils/dateUtils.js'

const initialForm = {
  id: '',
  name: '',
  breed: '',
  birthDate: '',
  weight: '',
  status: 'Vazia',
  notes: '',
}

export default function Matrizes() {
  const { matrizes, coberturas, partos, addMatriz } = useAppData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todos')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  const filtered = useMemo(
    () =>
      matrizes.filter((matrix) => {
        const matchesSearch = `${matrix.id} ${matrix.name}`.toLowerCase().includes(search.toLowerCase())
        return matchesSearch && (status === 'Todos' || matrix.status === status)
      }),
    [matrizes, search, status],
  )

  function submit(event) {
    event.preventDefault()
    if (matrizes.some((matrix) => matrix.id.toLowerCase() === form.id.trim().toLowerCase())) {
      setError('Já existe uma matriz com este brinco.')
      return
    }
    addMatriz({ ...form, id: form.id.trim().toUpperCase(), weight: Number(form.weight) })
    setForm(initialForm)
    setError('')
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Plantel"
        title="Matrizes"
        description="Cadastre as matrizes e acompanhe o histórico reprodutivo de cada animal."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Nova matriz</button>}
      />

      <section className="surface-card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field-control pl-11"
            placeholder="Buscar por brinco ou nome"
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control">
          {['Todos', 'Vazia', 'Coberta', 'Prenha', 'Parida', 'Desmamada'].map((option) => <option key={option}>{option}</option>)}
        </select>
      </section>

      {filtered.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((matrix) => {
            const coverageCount = coberturas.filter((item) => item.matrixId === matrix.id).length
            const birthCount = partos.filter((item) => item.matrixId === matrix.id).length
            return (
              <article key={matrix.id} className="surface-card overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-lg font-bold text-[#0b3b27]">
                        {matrix.name?.charAt(0) || matrix.id.charAt(0)}
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">{matrix.id}</p>
                        <h2 className="text-lg font-bold text-[#082f1f]">{matrix.name || 'Sem apelido'}</h2>
                        <p className="text-sm text-slate-500">{matrix.breed}</p>
                      </div>
                    </div>
                    <StatusBadge>{matrix.status}</StatusBadge>
                  </div>
                  <div className="mt-5 grid grid-cols-2 divide-x divide-[#e2ddd2] border-y border-[#e2ddd2]">
                    <div className="py-3 pr-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><Weight size={14} /> Peso</span>
                      <strong className="mt-1 block text-sm text-slate-800">{matrix.weight} kg</strong>
                    </div>
                    <div className="py-3 pl-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400"><CalendarDays size={14} /> Nascimento</span>
                      <strong className="mt-1 block text-sm text-slate-800">{formatDate(matrix.birthDate)}</strong>
                    </div>
                  </div>
                  <p className="mt-4 min-h-10 text-sm leading-5 text-slate-500">{matrix.notes || 'Sem observações registradas.'}</p>
                  <div className="mt-5 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-[#1b6a41]" /> {coverageCount} cobertura(s)</span>
                    <span>{birthCount} parto(s)</span>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : <EmptyState description="Revise a busca ou o filtro de status selecionado." />}

      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar nova matriz" subtitle="Preencha os dados de identificação e manejo.">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="ID / brinco" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Ex.: M005" />
          <FormInput label="Nome / apelido" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Bela" />
          <FormInput label="Raça" required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Ex.: Large White" />
          <FormInput label="Data de nascimento" required type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <FormInput label="Peso aproximado (kg)" required type="number" min="1" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <FormSelect label="Status" required options={['Vazia', 'Coberta', 'Prenha', 'Parida', 'Desmamada']} placeholder="" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-28 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Condição corporal, comportamento e histórico relevante" /></label>
          <div className="sm:col-span-2"><PhotoPlaceholder compact /></div>
          {error && <p className="sm:col-span-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button">Salvar matriz</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
