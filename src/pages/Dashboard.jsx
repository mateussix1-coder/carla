import {
  AlertTriangle,
  ArrowRight,
  Baby,
  CalendarClock,
  ClipboardCheck,
  ClipboardPlus,
  HeartPulse,
  History,
  PiggyBank,
  Plus,
  Stethoscope,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { gestationDetails } from '../utils/calculations.js'
import { formatDate, startOfMonth } from '../utils/dateUtils.js'

function buildGestations(matrizes, coberturas) {
  return matrizes
    .filter((matrix) => !matrix.archived && ['Prenha', 'Coberta', 'Próximo ao parto'].includes(matrix.status))
    .map((matrix) => {
      const coverage = coberturas
        .filter((item) => item.matrixId === matrix.id && item.status !== 'Falhou')
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      return coverage ? { matrix, coverage, ...gestationDetails(coverage.date) } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.remaining - b.remaining)
}

export default function Dashboard() {
  const { matrizes, coberturas, partos, lotes, historico } = useAppData()
  const { user } = useAuth()
  const gestations = buildGestations(matrizes, coberturas)
  const upcoming = gestations.filter((item) => item.remaining >= 0 && item.remaining <= 7)
  const overdue = gestations.filter((item) => item.remaining < 0)
  const bornThisMonth = partos
    .filter((birth) => birth.date >= startOfMonth())
    .reduce((sum, birth) => sum + Number(birth.alive || 0), 0)
  const pendingChecklist = lotes.reduce(
    (total, lot) => total + Object.values(lot.checklist || {}).filter((item) => !item.completed).length,
    0,
  )

  const alerts = [
    ...overdue.map((item) => ({
      id: `overdue-${item.matrix.id}`,
      tone: 'red',
      title: `${item.matrix.name}: parto atrasado há ${Math.abs(item.remaining)} dia(s)`,
      text: `Previsão original: ${formatDate(item.expectedDate)}.`,
      to: '/partos',
    })),
    ...upcoming.map((item) => ({
      id: `upcoming-${item.matrix.id}`,
      tone: 'amber',
      title: `${item.matrix.name}: parto previsto em ${item.remaining} dia(s)`,
      text: 'Revise baia maternidade, materiais e responsável.',
      to: `/matrizes/${item.matrix.id}`,
    })),
    ...lotes.flatMap((lot) => Object.entries(lot.checklist || {})
      .filter(([, item]) => !item.completed)
      .slice(0, 1)
      .map(([key]) => ({
        id: `lot-${lot.id}-${key}`,
        tone: 'blue',
        title: `Ninhada ${lot.id}: manejo pendente`,
        text: 'Abra o checklist para registrar data e responsável.',
        to: '/leitoes',
      }))),
  ].slice(0, 5)

  return (
    <div className="page-shell">
      <header className="dashboard-welcome">
        <div className="relative z-10 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e5c777]">
            Controle zootécnico diário
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Olá, {user.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Veja primeiro os partos que exigem atenção e registre o manejo com poucos toques.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <Link to="/matrizes" className="hero-button"><Plus size={17} /> Nova matriz</Link>
            <Link to="/coberturas" className="hero-button"><ClipboardPlus size={17} /> Registrar cobertura</Link>
            <Link to="/partos" className="hero-button bg-[#d9a441] text-[#183426] hover:bg-[#e5b657]"><Stethoscope size={17} /> Registrar parto</Link>
          </div>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard title="Matrizes" value={matrizes.filter((item) => !item.archived).length} detail="no plantel ativo" icon={PiggyBank} />
        <StatCard title="Cobertas/prenhas" value={gestations.length} detail="em acompanhamento" icon={HeartPulse} theme="sky" />
        <StatCard title="Partos próximos" value={upcoming.length} detail="em até 7 dias" icon={CalendarClock} theme="amber" />
        <StatCard title="Partos atrasados" value={overdue.length} detail="exigem atenção" icon={AlertTriangle} theme="rose" />
        <StatCard title="Nascidos no mês" value={bornThisMonth} detail={`${pendingChecklist} manejos pendentes`} icon={Baby} theme="violet" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card overflow-hidden">
          <header className="flex items-center justify-between border-b border-[#e9e4da] p-5">
            <div>
              <h2 className="section-title">Partos próximos</h2>
              <p className="mt-1 text-xs text-slate-500">Ordem de prioridade calculada pelos 114 dias.</p>
            </div>
            <Link to="/gestacao" className="text-xs font-bold text-[#0b6847]">Ver gestação</Link>
          </header>
          {gestations.length ? (
            <div className="divide-y divide-[#eee9df]">
              {gestations.slice(0, 6).map(({ matrix, remaining, expectedDate, stage }) => (
                <div key={matrix.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <img src={matrix.image || '/images/aurora.jpg'} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-[#073f2b]">{matrix.id} · {matrix.name}</strong>
                        <StatusBadge>{stage}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Previsão: {formatDate(expectedDate)}</p>
                      <strong className={`mt-1 block text-xs ${remaining < 0 ? 'text-red-700' : remaining <= 7 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {remaining < 0 ? `${Math.abs(remaining)} dia(s) de atraso` : `Faltam ${remaining} dia(s)`}
                      </strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to={`/matrizes/${matrix.id}`} className="action-button">Ver matriz</Link>
                    <Link to="/partos" className="action-button action-success">Registrar parto</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <HeartPulse className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">Nenhuma matriz em gestação no momento.</p>
              <Link to="/coberturas" className="primary-button mt-4">Registrar cobertura</Link>
            </div>
          )}
        </article>

        <article className="surface-card overflow-hidden">
          <header className="border-b border-[#e9e4da] p-5">
            <h2 className="section-title">Alertas de manejo</h2>
            <p className="mt-1 text-xs text-slate-500">O que precisa ser resolvido primeiro.</p>
          </header>
          {alerts.length ? (
            <div className="divide-y divide-[#eee9df]">
              {alerts.map((alert) => (
                <Link key={alert.id} to={alert.to} className="flex gap-3 p-4 transition hover:bg-[#fbfaf6]">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    alert.tone === 'red' ? 'bg-red-500' : alert.tone === 'amber' ? 'bg-amber-500' : 'bg-sky-500'
                  }`} />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm text-[#073f2b]">{alert.title}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{alert.text}</span>
                  </span>
                  <ArrowRight size={16} className="mt-1 shrink-0 text-slate-300" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              <ClipboardCheck className="mx-auto mb-3 text-emerald-600" />
              Nenhum alerta urgente.
            </div>
          )}
        </article>
      </section>

      <section className="mt-6 surface-card overflow-hidden">
        <header className="flex items-center justify-between border-b border-[#e9e4da] p-5">
          <div>
            <h2 className="section-title">Atividade recente</h2>
            <p className="mt-1 text-xs text-slate-500">Alterações operacionais salvas no histórico.</p>
          </div>
          <History size={19} className="text-[#ad7b22]" />
        </header>
        <div className="grid divide-y divide-[#eee9df] md:grid-cols-2 md:divide-x md:divide-y-0">
          {(historico || []).slice(0, 6).map((item) => (
            <div key={item.id} className="p-4">
              <strong className="block text-sm text-[#073f2b]">{item.action}</strong>
              <p className="mt-1 text-xs text-slate-500">{item.detail || item.entityId} · {item.responsible}</p>
            </div>
          ))}
          {!historico?.length && <p className="p-6 text-sm text-slate-500">As próximas alterações aparecerão aqui.</p>}
        </div>
      </section>
    </div>
  )
}
