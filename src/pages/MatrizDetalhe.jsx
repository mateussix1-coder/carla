import {
  ArrowLeft,
  Baby,
  CalendarClock,
  ClipboardPlus,
  Edit3,
  HeartPulse,
  History,
  PiggyBank,
  ShieldPlus,
  Stethoscope,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import AttachmentManager from '../components/AttachmentManager.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { gestationDetails, totalBorn } from '../utils/calculations.js'
import { formatDate } from '../utils/dateUtils.js'

const tabs = ['Resumo', 'Gestação', 'Coberturas', 'Partos', 'Leitões', 'Sanitário', 'Anexos', 'Histórico']
const statuses = ['Vazia', 'Coberta', 'Prenha', 'Próximo ao parto', 'Parida', 'Lactação', 'Desmamada', 'Inativa']

export default function MatrizDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    matrizes,
    varroes,
    coberturas,
    partos,
    lotes,
    sanitario,
    historico,
    settings,
    dataReady,
    updateMatriz,
    archiveMatriz,
    deleteMatriz,
  } = useAppData()
  const matrix = matrizes.find((item) => item.id === id)
  const [tab, setTab] = useState('Resumo')
  const [editOpen, setEditOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [form, setForm] = useState(matrix || {})

  if (!matrix && !dataReady) {
    return (
      <div className="page-shell">
        <div className="surface-card flex min-h-72 items-center justify-center">
          <div className="text-center">
            <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
            <p className="mt-4 text-sm font-semibold text-slate-500">Carregando matriz...</p>
          </div>
        </div>
      </div>
    )
  }
  if (!matrix) return <Navigate to="/matrizes" replace />

  const matrixCoverages = coberturas.filter((item) => item.matrixId === matrix.id).sort((a, b) => b.date.localeCompare(a.date))
  const matrixBirths = partos.filter((item) => item.matrixId === matrix.id).sort((a, b) => b.date.localeCompare(a.date))
  const matrixLots = lotes.filter((item) => item.matrixId === matrix.id)
  const lotIds = matrixLots.map((item) => item.id)
  const matrixSanitary = sanitario.filter((item) => item.related === matrix.id || lotIds.includes(item.related))
  const matrixHistory = historico.filter((item) => item.entityId === matrix.id || matrixCoverages.some((coverage) => coverage.id === item.entityId) || matrixBirths.some((birth) => birth.id === item.entityId))
  const currentCoverage = matrixCoverages.find((item) => !['Falhou', 'Finalizada'].includes(item.status))
  const gestation = currentCoverage ? gestationDetails(currentCoverage.date, undefined, settings.alertDays) : null
  const currentBoar = currentCoverage ? varroes.find((item) => item.id === currentCoverage.boarId) : null
  const totalPiglets = matrixBirths.reduce((sum, birth) => sum + totalBorn(birth), 0)

  function submit(event) {
    event.preventDefault()
    updateMatriz(matrix.id, { ...form, weight: Number(form.weight) })
    setEditOpen(false)
    if (form.id !== matrix.id) navigate(`/matrizes/${form.id}`, { replace: true })
  }

  return (
    <div className="page-shell">
      <Link to="/matrizes" className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#0b6847]">
        <ArrowLeft size={16} /> Voltar para matrizes
      </Link>

      <section className="class-hero">
        <div className="relative z-10 grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <img src={matrix.image || '/images/aurora.jpg'} alt="" className="h-28 w-28 rounded-[28px] border-4 border-white/20 object-cover shadow-xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge>{gestation?.stage === 'Próximo ao parto' || gestation?.stage === 'Atrasada' ? gestation.stage : matrix.status}</StatusBadge>
              <span className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold">{matrix.id}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold sm:text-5xl">{matrix.name}</h1>
            <p className="mt-2 text-sm text-white/65">{matrix.breed} · {matrix.weight || '--'} kg · responsável {matrix.responsible || 'não informado'}</p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button className="hero-button" onClick={() => { setForm(matrix); setEditOpen(true) }}><Edit3 size={16} /> Editar matriz</button>
              <Link to="/coberturas" className="hero-button"><ClipboardPlus size={16} /> Cobertura</Link>
              <Link to="/partos" className="hero-button"><Stethoscope size={16} /> Registrar parto</Link>
              <button className="hero-button text-red-100" onClick={() => setConfirming(true)}>Arquivar/excluir</button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-6">
        {[
          ['Status atual', matrix.status, PiggyBank],
          ['Gestação', gestation ? `${gestation.elapsed}/114 dias` : 'Sem ciclo ativo', HeartPulse],
          ['Previsão', gestation ? formatDate(gestation.expectedDate) : '--', CalendarClock],
          ['Última cobertura', currentCoverage ? formatDate(currentCoverage.date) : '--', ClipboardPlus],
          ['Varrão', currentBoar?.name || currentCoverage?.boarId || '--', PiggyBank],
          ['Leitões totais', totalPiglets, Baby],
        ].map(([label, value, Icon]) => (
          <article key={label} className="surface-card p-4">
            <Icon size={18} className="text-[#ad7b22]" />
            <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <strong className="mt-1 block text-sm text-[#073f2b]">{value}</strong>
          </article>
        ))}
      </section>

      <div role="tablist" className="mt-6 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((item) => (
          <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`filter-pill ${tab === item ? 'filter-pill-active' : ''}`}>{item}</button>
        ))}
      </div>

      <section className="mt-3">
        {tab === 'Resumo' && (
          <article className="surface-card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
            {[
              ['Código/brinco', matrix.id],
              ['Nome', matrix.name],
              ['Raça', matrix.breed],
              ['Nascimento', formatDate(matrix.birthDate)],
              ['Peso', `${matrix.weight || '--'} kg`],
              ['Origem', matrix.origin || 'Não informada'],
              ['Responsável', matrix.responsible || 'Não informado'],
              ['Observações', matrix.notes || 'Sem observações'],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-[#eee9df] pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <strong className="mt-1 block text-sm text-[#073f2b]">{value}</strong>
              </div>
            ))}
          </article>
        )}

        {tab === 'Gestação' && (
          gestation ? (
            <article className="surface-card p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ad7b22]">Ciclo atual</span>
                  <h2 className="mt-1 text-2xl font-bold text-[#073f2b]">
                    {gestation.remaining < 0
                      ? `${Math.abs(gestation.remaining)} dia(s) de atraso`
                      : `Faltam ${gestation.remaining} dia(s) para o parto`}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{gestation.elapsed}/114 dias · previsão em {formatDate(gestation.expectedDate)}</p>
                </div>
                <StatusBadge>{gestation.stage}</StatusBadge>
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#e7e3d9]">
                <div className="h-full rounded-full bg-[linear-gradient(90deg,#0b6847,#d0a44c)]" style={{ width: `${gestation.progress}%` }} />
              </div>
              <div className="mt-7 grid grid-cols-5 gap-2">
                {[
                  ['Cobertura', 0],
                  ['Diagnóstico', 24],
                  ['Vacinas', 70],
                  ['Pré-parto', 100],
                  ['Parto', 114],
                ].map(([label, day]) => {
                  const completed = gestation.elapsed >= day
                  return (
                    <div key={label} className="text-center">
                      <span className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[10px] font-bold ${completed ? 'border-[#0b6847] bg-[#0b6847] text-white' : 'border-[#d8d3c7] bg-white text-slate-400'}`}>
                        {day}
                      </span>
                      <span className="mt-2 block text-[9px] font-semibold text-slate-500">{label}</span>
                    </div>
                  )
                })}
              </div>
            </article>
          ) : <EmptyBlock text="Nenhuma gestação ativa para esta matriz." />
        )}

        {tab === 'Coberturas' && (
          <div className="space-y-3">
            {matrixCoverages.map((coverage) => (
              <article key={coverage.id} className="surface-card grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><strong className="text-[#073f2b]">{formatDate(coverage.date)}</strong><StatusBadge>{coverage.status}</StatusBadge></div>
                  <p className="mt-2 text-sm text-slate-500">Varrão: {varroes.find((item) => item.id === coverage.boarId)?.name || coverage.boarId} · {coverage.type}</p>
                  <p className="mt-1 text-xs text-slate-400">Previsão: {formatDate(coverage.expectedDate)} · {coverage.responsible}</p>
                </div>
                <Link to="/coberturas" className="action-button"><Edit3 size={15} /> Gerenciar</Link>
              </article>
            ))}
            {!matrixCoverages.length && <EmptyBlock text="Nenhuma cobertura registrada." />}
          </div>
        )}

        {tab === 'Partos' && (
          <div className="space-y-3">
            {matrixBirths.map((birth) => (
              <article key={birth.id} className="surface-card grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <strong className="text-[#073f2b]">{formatDate(birth.date)} · {totalBorn(birth)} leitões</strong>
                  <p className="mt-2 text-sm text-slate-500">{birth.alive} vivos · {birth.stillborn} natimortos · {birth.mummified} mumificados</p>
                  <p className="mt-1 text-xs text-slate-400">Responsável: {birth.responsible}</p>
                </div>
                <Link to="/partos" className="action-button"><Edit3 size={15} /> Gerenciar</Link>
              </article>
            ))}
            {!matrixBirths.length && <EmptyBlock text="Nenhum parto registrado." />}
          </div>
        )}

        {tab === 'Leitões' && (
          <div className="space-y-3">
            {matrixLots.map((lot) => {
              const completed = Object.values(lot.checklist || {}).filter((item) => item.completed).length
              return (
                <article key={lot.id} className="surface-card grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <strong className="text-[#073f2b]">Ninhada {lot.id} · {lot.currentQuantity} leitões atuais</strong>
                    <p className="mt-2 text-sm text-slate-500">Nascimento: {formatDate(lot.birthDate)} · checklist {completed}/{Object.keys(lot.checklist || {}).length}</p>
                  </div>
                  <Link to="/leitoes" className="action-button"><Baby size={15} /> Abrir checklist</Link>
                </article>
              )
            })}
            {!matrixLots.length && <EmptyBlock text="Nenhuma ninhada vinculada." />}
          </div>
        )}

        {tab === 'Sanitário' && (
          <div className="space-y-3">
            {matrixSanitary.map((record) => (
              <article key={record.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center gap-2"><ShieldPlus size={17} className="text-[#ad7b22]" /><strong className="text-[#073f2b]">{record.product}</strong><StatusBadge>{record.type}</StatusBadge></div>
                <p className="mt-2 text-sm text-slate-500">{formatDate(record.date)} · {record.responsible}</p>
              </article>
            ))}
            {!matrixSanitary.length && <EmptyBlock text="Nenhum registro sanitário." />}
          </div>
        )}

        {tab === 'Anexos' && (
          <AttachmentManager entityType="matriz" entityId={matrix.id} title={`Evidências de ${matrix.name}`} />
        )}

        {tab === 'Histórico' && (
          <div className="surface-card divide-y divide-[#eee9df] overflow-hidden">
            {matrixHistory.map((item) => (
              <div key={item.id} className="flex gap-3 p-5">
                <History size={18} className="mt-0.5 shrink-0 text-[#ad7b22]" />
                <div><strong className="text-sm text-[#073f2b]">{item.action}</strong><p className="mt-1 text-xs text-slate-500">{item.detail} · {item.responsible}</p></div>
              </div>
            ))}
            {!matrixHistory.length && <p className="p-6 text-sm text-slate-500">O histórico será preenchido automaticamente.</p>}
          </div>
        )}
      </section>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar matriz">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Código/brinco" required value={form.id || ''} onChange={(e) => setForm({ ...form, id: e.target.value.toUpperCase() })} />
          <FormInput label="Nome" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormInput label="Raça" required value={form.breed || ''} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          <FormInput label="Nascimento" type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
          <FormInput label="Peso (kg)" type="number" min="1" step="0.1" value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
          <FormSelect label="Status" options={statuses} placeholder="" value={form.status || 'Vazia'} onChange={(e) => setForm({ ...form, status: e.target.value })} />
          <FormInput label="Origem" value={form.origin || ''} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          <FormInput label="Responsável" value={form.responsible || ''} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="modal-actions sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setEditOpen(false)}>Cancelar</button><button className="primary-button">Salvar alterações</button></div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Excluir ${matrix.name}?`}
        description="Arquivar mantém o histórico disponível. Excluir definitivamente remove todos os registros vinculados a esta matriz."
        onArchive={() => {
          archiveMatriz(matrix.id)
          setConfirming(false)
          navigate('/matrizes')
        }}
        onConfirm={() => {
          deleteMatriz(matrix.id)
          setConfirming(false)
          navigate('/matrizes')
        }}
      />
    </div>
  )
}

function EmptyBlock({ text }) {
  return <div className="surface-card p-8 text-center text-sm text-slate-500">{text}</div>
}
