import {
  ArchiveRestore,
  Baby,
  CalendarClock,
  CalendarDays,
  Edit3,
  Eye,
  HeartPulse,
  PiggyBank,
  Plus,
  Search,
  Stethoscope,
  Weight,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { gestationDetails } from '../utils/calculations.js'
import { formatDate, startOfMonth } from '../utils/dateUtils.js'

const initialForm = {
  id: '',
  name: '',
  breed: '',
  birthDate: '',
  weight: '',
  status: 'Vazia',
  origin: '',
  responsible: '',
  image: '',
  notes: '',
}

const statuses = [
  'Vazia',
  'Coberta',
  'Prenha',
  'Próximo ao parto',
  'Parida',
  'Lactação',
  'Desmamada',
  'Inativa',
]

export default function Matrizes() {
  const {
    matrizes,
    coberturas,
    partos,
    addMatriz,
    updateMatriz,
    archiveMatriz,
    restoreMatriz,
    deleteMatriz,
  } = useAppData()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('Todas')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(null)

  const matrixDetails = useMemo(() => Object.fromEntries(matrizes.map((matrix) => {
    const coverages = coberturas
      .filter((item) => item.matrixId === matrix.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    const activeCoverage = coverages.find((item) => !['Falhou', 'Finalizada'].includes(item.status))
    return [
      matrix.id,
      {
        coverageCount: coverages.length,
        birthCount: partos.filter((item) => item.matrixId === matrix.id).length,
        latestCoverage: coverages[0],
        gestation: activeCoverage ? gestationDetails(activeCoverage.date) : null,
      },
    ]
  })), [matrizes, coberturas, partos])

  const filtered = useMemo(
    () => matrizes.filter((matrix) => {
      const matchesSearch = `${matrix.id} ${matrix.name} ${matrix.breed}`.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'Todas'
        || (status === 'Arquivadas' ? matrix.archived : matrix.status === status)
      return matchesSearch && matchesStatus
    }),
    [matrizes, search, status],
  )

  const gestations = Object.values(matrixDetails).filter((item) => item.gestation)
  const nearBirth = gestations.filter((item) => item.gestation.remaining >= 0 && item.gestation.remaining <= 7).length
  const birthsThisMonth = partos
    .filter((birth) => birth.date >= startOfMonth())
    .reduce((sum, birth) => sum + Number(birth.alive), 0)

  function openCreate() {
    setEditingId('')
    setForm(initialForm)
    setError('')
    setOpen(true)
  }

  function openEdit(matrix) {
    setEditingId(matrix.id)
    setForm({
      ...initialForm,
      ...matrix,
      weight: matrix.weight || '',
      image: matrix.image || '',
    })
    setError('')
    setOpen(true)
  }

  function submit(event) {
    event.preventDefault()
    const nextId = form.id.trim().toUpperCase()
    if (matrizes.some((matrix) => matrix.id.toLowerCase() === nextId.toLowerCase() && matrix.id !== editingId)) {
      setError('Já existe uma matriz com este brinco.')
      return
    }
    const record = {
      ...form,
      id: nextId,
      name: form.name.trim(),
      weight: Number(form.weight),
      image: form.image.trim() || '/images/aurora.jpg',
      archived: form.status === 'Inativa',
    }
    if (editingId) updateMatriz(editingId, record)
    else addMatriz(record)
    setOpen(false)
    setForm(initialForm)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Plantel"
        title="Matrizes"
        description="Cadastre, edite e acompanhe todas as fêmeas do plantel."
        action={<button className="primary-button w-full sm:w-auto" onClick={openCreate}><Plus size={19} /> Nova matriz</button>}
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Matrizes ativas" value={matrizes.filter((item) => !item.archived).length} detail="no plantel" icon={PiggyBank} />
        <StatCard title="Em gestação" value={gestations.length} detail="cobertas ou prenhas" icon={HeartPulse} theme="sky" />
        <StatCard title="Partos próximos" value={nearBirth} detail="próximos 7 dias" icon={CalendarClock} theme="amber" />
        <StatCard title="Nascidos no mês" value={birthsThisMonth} detail="leitões vivos" icon={Baby} theme="violet" />
      </section>

      <section className="surface-card my-5 grid gap-3 p-3 sm:grid-cols-[1fr_220px] sm:p-4">
        <label className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field-control pl-11"
            placeholder="Buscar por brinco, nome ou raça..."
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="field-control">
          {['Todas', ...statuses.filter((item) => item !== 'Inativa'), 'Arquivadas'].map((option) => <option key={option}>{option}</option>)}
        </select>
      </section>

      {filtered.length ? (
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((matrix) => {
            const details = matrixDetails[matrix.id]
            const gestation = details.gestation
            const effectiveStatus = gestation?.stage === 'Próximo ao parto' || gestation?.stage === 'Atrasada'
              ? gestation.stage
              : matrix.status
            return (
              <article key={matrix.id} className="surface-card premium-card overflow-hidden">
                <div className="grid sm:grid-cols-[180px_1fr]">
                  <div className="relative min-h-48 bg-[#e9e6de] sm:min-h-full">
                    <img
                      src={matrix.image || '/images/aurora.jpg'}
                      alt={`Matriz ${matrix.name}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-lg bg-[#fff8e9]/95 px-2.5 py-1 text-[10px] font-bold text-[#946719] shadow-sm">{matrix.id}</span>
                  </div>
                  <div className="min-w-0 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-[#073b28]">{matrix.name}</h2>
                        <p className="text-sm text-slate-500">{matrix.breed}</p>
                      </div>
                      <StatusBadge>{effectiveStatus}</StatusBadge>
                    </div>

                    {gestation && (
                      <div className={`mt-4 rounded-2xl border p-3 ${
                        gestation.remaining < 0
                          ? 'border-red-200 bg-red-50'
                          : gestation.remaining <= 7
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-emerald-100 bg-emerald-50'
                      }`}>
                        <strong className="block text-sm text-[#073b28]">
                          {gestation.remaining < 0
                            ? `${Math.abs(gestation.remaining)} dia(s) de atraso`
                            : `Faltam ${gestation.remaining} dia(s) para o parto`}
                        </strong>
                        <span className="mt-1 block text-xs text-slate-500">
                          {gestation.elapsed}/114 dias · previsão {formatDate(gestation.expectedDate)}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <span className="flex items-center gap-2 text-slate-500"><Weight size={14} /> {matrix.weight || '--'} kg</span>
                      <span className="flex items-center gap-2 text-slate-500"><CalendarDays size={14} /> {formatDate(matrix.birthDate)}</span>
                      <span className="text-slate-500"><strong className="text-[#073b28]">{details.coverageCount}</strong> coberturas</span>
                      <span className="text-slate-500"><strong className="text-[#073b28]">{details.birthCount}</strong> partos</span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <Link to={`/matrizes/${matrix.id}`} className="action-button"><Eye size={15} /> Detalhes</Link>
                      <button type="button" className="action-button" onClick={() => openEdit(matrix)}><Edit3 size={15} /> Editar</button>
                      {!matrix.archived && (
                        <>
                          <Link to="/coberturas" className="action-button action-success"><HeartPulse size={15} /> Cobertura</Link>
                          <Link to="/partos" className="action-button action-warning"><Stethoscope size={15} /> Parto</Link>
                        </>
                      )}
                    </div>
                    <div className="mt-3">
                      {matrix.archived ? (
                        <button className="action-button w-full" onClick={() => restoreMatriz(matrix.id)}><ArchiveRestore size={15} /> Restaurar matriz</button>
                      ) : (
                        <button className="action-button action-danger w-full" onClick={() => setConfirming(matrix)}>Arquivar ou excluir</button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState
          title={matrizes.length ? 'Nenhuma matriz encontrada' : 'Nenhuma matriz cadastrada'}
          description={matrizes.length ? 'Revise a busca ou o filtro.' : 'Cadastre a primeira matriz para iniciar o controle reprodutivo.'}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? 'Editar matriz' : 'Cadastrar nova matriz'} subtitle="Dados de identificação e manejo">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Código / brinco" required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="Ex.: M006" />
          <FormInput label="Nome / apelido" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Bela" />
          <FormInput label="Raça" required value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="Ex.: Large White" />
          <FormInput label="Data de nascimento" required type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <FormInput label="Peso aproximado (kg)" required type="number" min="1" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <FormSelect label="Status" required options={statuses} placeholder="" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <FormInput label="Origem" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Ex.: Fazenda experimental" />
          <FormInput label="Responsável" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Ex.: Profª Carla" />
          <FormInput label="Foto (URL opcional)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="/images/aurora.jpg" className="sm:col-span-2" />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-28 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {error && <p className="feedback-error sm:col-span-2">{error}</p>}
          <div className="modal-actions sm:col-span-2">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="primary-button">{editingId ? 'Salvar alterações' : 'Salvar matriz'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title={`Excluir ${confirming?.name || 'matriz'}?`}
        description="Arquivar preserva todo o histórico. Excluir definitivamente remove também coberturas, partos, ninhadas e registros sanitários vinculados."
        archiveLabel="Arquivar matriz"
        onArchive={() => {
          archiveMatriz(confirming.id)
          setConfirming(null)
        }}
        onConfirm={() => {
          deleteMatriz(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}
