import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  PiggyBank,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import BirthRegisterModal from '../components/gestation/BirthRegisterModal.jsx'
import GestationCard from '../components/gestation/GestationCard.jsx'
import MatrixDetailsModal from '../components/gestation/MatrixDetailsModal.jsx'
import SummaryCard from '../components/gestation/SummaryCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { gestationDetails } from '../utils/calculations.js'

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'overdue', label: 'Atrasadas' },
  { id: 'onTime', label: 'Dentro do prazo' },
]

export default function Gestacao() {
  const {
    matrizes,
    coberturas,
    varroes,
    alunos,
    partos,
    lotes,
    sanitario,
    settings,
    addParto,
  } = useAppData()
  const [filter, setFilter] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [birthItem, setBirthItem] = useState(null)
  const listRef = useRef(null)

  const gestations = useMemo(
    () =>
      matrizes
        .filter((matrix) => ['Prenha', 'Coberta'].includes(matrix.status))
        .map((matrix) => {
          const coverage = coberturas
            .filter((item) => item.matrixId === matrix.id)
            .sort((a, b) => b.date.localeCompare(a.date))[0]
          return coverage ? { matrix, coverage, ...gestationDetails(coverage.date, undefined, settings.alertDays) } : null
        })
        .filter(Boolean)
        .sort((a, b) => a.remaining - b.remaining),
    [matrizes, coberturas, settings.alertDays],
  )

  const upcoming = gestations.filter((item) => item.remaining >= 0 && item.remaining <= settings.alertDays)
  const overdue = gestations.filter((item) => item.remaining < 0)
  const onTime = gestations.filter((item) => item.remaining > settings.alertDays)

  const filteredGestations = gestations.filter((item) => {
    if (filter === 'upcoming') return item.remaining >= 0 && item.remaining <= settings.alertDays
    if (filter === 'overdue') return item.remaining < 0
    if (filter === 'onTime') return item.remaining > settings.alertDays
    return true
  })

  const boarName = (id) => varroes.find((item) => item.id === id)?.name || id

  function showCritical() {
    setFilter('upcoming')
    window.requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="page-shell pb-36 lg:pb-10">
      <PageHeader
        eyebrow="Gestão reprodutiva"
        title="Gestação de matrizes"
        description="Acompanhe o ciclo de 114 dias, identifique prioridades e mantenha o histórico de cada matriz."
      />

      <section className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <SummaryCard
          icon={HeartPulse}
          label="Gestantes"
          value={gestations.length}
          detail="matrizes em acompanhamento"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Partos próximos"
          value={upcoming.length}
          detail={`previstos em até ${settings.alertDays} dias`}
          tone="gold"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Atrasadas"
          value={overdue.length}
          detail="além dos 114 dias"
          tone="red"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Dentro do prazo"
          value={onTime.length}
          detail="sem alerta imediato"
          tone="neutral"
        />
      </section>

      {upcoming.length > 0 && (
        <section className="mb-4 border border-red-200 border-l-4 border-l-red-600 bg-red-50 p-4 text-red-900">
          <div className="flex gap-3">
            <AlertTriangle size={21} className="mt-0.5 shrink-0 text-red-700" />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">Parto previsto em até {settings.alertDays} dias</h2>
              <p className="mt-1 text-xs leading-5 text-red-700">
                Revise baia maternidade, materiais, ficha da matriz e equipe responsável.
              </p>
              <button
                className="mt-3 inline-flex min-h-10 items-center justify-center border border-red-300 bg-white px-4 text-xs font-bold text-red-700 transition hover:bg-red-100"
                onClick={showCritical}
              >
                Ver matrizes críticas
              </button>
            </div>
          </div>
        </section>
      )}

      <section ref={listRef} className="scroll-mt-20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d7d1c2] pb-3">
          <div className="flex items-center gap-2">
            <PiggyBank size={18} className="text-[#0b3b27]" />
            <h2 className="section-title">Matrizes em acompanhamento</h2>
          </div>
          <div className="flex max-w-full flex-wrap gap-1.5" aria-label="Filtros de gestação">
            {filters.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
                className={`min-h-9 border px-3 text-[11px] font-semibold transition ${
                  filter === option.id
                    ? 'border-[#0b3b27] bg-[#0b3b27] text-white'
                    : 'border-[#cbc5b8] bg-white text-slate-600 hover:border-[#1b6a41]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {filteredGestations.length ? (
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            {filteredGestations.map((item) => (
              <GestationCard
                key={item.matrix.id}
                item={item}
                boar={boarName(item.coverage.boarId)}
                onDetails={() => setSelectedItem(item)}
                onRegister={() => setBirthItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="surface-card p-8 text-center">
            <CheckCircle2 size={28} className="mx-auto text-[#1b6a41]" />
            <h3 className="mt-3 font-bold text-[#082f1f]">Nenhuma matriz neste filtro</h3>
            <p className="mt-1 text-sm text-slate-500">Selecione outra situação para consultar o acompanhamento.</p>
          </div>
        )}
      </section>

      <MatrixDetailsModal
        item={selectedItem}
        boarName={boarName}
        coverages={coberturas}
        births={partos}
        lots={lotes}
        sanitary={sanitario}
        onClose={() => setSelectedItem(null)}
        onRegister={() => {
          setBirthItem(selectedItem)
          setSelectedItem(null)
        }}
      />

      <BirthRegisterModal
        item={birthItem}
        alunos={alunos}
        teacherName={settings.teacherName}
        addParto={addParto}
        onClose={() => setBirthItem(null)}
      />
    </div>
  )
}
