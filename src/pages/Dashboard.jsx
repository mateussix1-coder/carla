import {
  AlertTriangle,
  ArrowRight,
  Baby,
  CalendarClock,
  Check,
  ClipboardPlus,
  HeartPulse,
  PiggyBank,
  Scale,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { average, gestationDetails, nextWeighing, WEIGHT_PHASES } from '../utils/calculations.js'
import { formatDate, isWithinNextDays, startOfMonth, toISODate } from '../utils/dateUtils.js'

const phaseLabels = {
  PN: 'PN',
  P07: 'P07',
  P14: 'P14',
  P21: 'P21',
  PD: 'PD',
}

function DashboardIntro() {
  return (
    <header className="mb-5 flex items-center justify-between border-b border-[#d7d1c2] pb-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-[#c6a45d] bg-[#f5ecd8] text-sm font-bold text-[#0b3b27]">
          PC
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ad7b22]">
            Escola / Fazenda experimental
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-[#082f1f] sm:text-2xl">Olá, Profª Carla</h1>
          <p className="text-xs text-slate-500">Acompanhamento reprodutivo e rotina acadêmica</p>
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Painel atualizado</p>
        <p className="mt-1 text-sm font-semibold text-[#0b3b27]">{formatDate(toISODate())}</p>
      </div>
    </header>
  )
}

function GestationTimeline({ nextBirth }) {
  return (
    <article className="surface-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Linha do tempo gestacional</h2>
          <p className="mt-1 text-xs text-slate-500">Regra padrão de acompanhamento</p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ad7b22]">
          Ciclo reprodutivo
        </span>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        <div className="text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#8aa28f] text-[#0b3b27]">
            <PiggyBank size={19} strokeWidth={1.7} />
          </span>
          <strong className="mt-2 block text-xs text-[#0b3b27]">Cobertura</strong>
          <span className="text-[10px] text-slate-500">{nextBirth ? formatDate(nextBirth.coverage.date, { shortYear: true }) : '--'}</span>
        </div>
        <ArrowRight size={18} className="text-[#9b927e]" />
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-[#1b6a41] bg-[#fbfaf6] text-[#0b3b27]">
            <span><strong className="block text-xl leading-none">114</strong><small className="text-[9px]">dias</small></span>
          </span>
          <strong className="mt-2 block text-xs text-[#0b3b27]">Acompanhamento</strong>
        </div>
        <ArrowRight size={18} className="text-[#9b927e]" />
        <div className="text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-[#c59a42] text-[#9a6816]">
            <CalendarClock size={19} strokeWidth={1.7} />
          </span>
          <strong className="mt-2 block text-xs text-[#0b3b27]">Parto previsto</strong>
          <span className="text-[10px] text-slate-500">{nextBirth ? formatDate(nextBirth.expectedDate, { shortYear: true }) : '--'}</span>
        </div>
      </div>
    </article>
  )
}

export default function Dashboard() {
  const { matrizes, coberturas, partos, lotes, sanitario, alunos } = useAppData()
  const gestatingMatrices = matrizes.filter((matrix) => ['Prenha', 'Coberta'].includes(matrix.status))
  const upcomingBirths = gestatingMatrices
    .map((matrix) => {
      const coverage = coberturas
        .filter((item) => item.matrixId === matrix.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      if (!coverage) return null
      return { matrix, coverage, ...gestationDetails(coverage.date) }
    })
    .filter(Boolean)
    .filter((item) => item.remaining >= -2)
    .sort((a, b) => a.remaining - b.remaining)

  const birthsThisMonth = partos
    .filter((birth) => birth.date >= startOfMonth())
    .reduce((sum, birth) => sum + Number(birth.alive), 0)

  const sanitaryAlerts = sanitario.filter(
    (record) => record.nextDate && isWithinNextDays(record.nextDate, 7),
  )
  const weighingAlerts = lotes.filter((lot) => nextWeighing(lot.weights))
  const weightChart = WEIGHT_PHASES.map((phase) => ({
    phase: phaseLabels[phase],
    peso: Number(average(lotes.map((lot) => lot.weights[phase])).toFixed(2)),
  })).filter((item) => item.peso > 0)

  const alerts = [
    ...upcomingBirths
      .filter((item) => item.remaining <= 7)
      .map((item) => ({
        icon: Stethoscope,
        title: `Parto de ${item.matrix.name}`,
        detail: item.remaining <= 0 ? 'Previsto para hoje ou em atraso' : `Faltam ${item.remaining} dias`,
        tone: 'critical',
      })),
    ...sanitaryAlerts.map((record) => ({
      icon: Syringe,
      title: record.product,
      detail: `${record.related} · ${formatDate(record.nextDate)}`,
      tone: 'warning',
    })),
    ...weighingAlerts.slice(0, 2).map((lot) => ({
      icon: Scale,
      title: `Pesagem ${nextWeighing(lot.weights)}`,
      detail: `Lote ${lot.id}`,
      tone: 'normal',
    })),
  ].slice(0, 5)

  return (
    <div className="page-shell">
      <DashboardIntro />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard title="Matrizes monitoradas" value={matrizes.length} detail={`${gestatingMatrices.length} em gestação`} icon={PiggyBank} />
        <StatCard title="Partos previstos" value={upcomingBirths.length} detail={`${upcomingBirths.filter((item) => item.remaining <= 7).length} nos próximos 7 dias`} icon={CalendarClock} theme="amber" />
        <StatCard title="Nascimentos no mês" value={birthsThisMonth} detail="leitões nascidos vivos" icon={Baby} theme="sky" />
        <StatCard title="Alunos em atividade" value={alunos.length} detail="responsáveis cadastrados" icon={Users} theme="violet" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#e0dbcf] pb-3">
            <div>
              <h2 className="section-title">Próximos eventos</h2>
              <p className="mt-1 text-xs text-slate-500">Prioridades da rotina zootécnica</p>
            </div>
            <Link to="/gestacao" className="text-xs font-semibold text-[#1b6a41]">Ver agenda</Link>
          </div>
          <div className="divide-y divide-[#e8e3d9]">
            {upcomingBirths.slice(0, 3).map(({ matrix, expectedDate, remaining, stage }) => (
              <div key={matrix.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
                <span className={`h-2.5 w-2.5 rounded-full ${remaining <= 0 ? 'bg-red-600' : remaining <= 7 ? 'bg-amber-500' : 'bg-[#8b8a82]'}`} />
                <div>
                  <strong className="block text-sm text-slate-900">Matriz {matrix.id} · {matrix.name}</strong>
                  <span className="text-xs text-slate-500">Parto previsto em {formatDate(expectedDate)}</span>
                </div>
                <div className="text-right">
                  <StatusBadge>{stage}</StatusBadge>
                  <span className="mt-1 block text-[10px] text-slate-500">{remaining <= 0 ? 'hoje/atraso' : `${remaining} dias`}</span>
                </div>
              </div>
            ))}
            {sanitaryAlerts.slice(0, 1).map((record) => (
              <div key={record.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1b6a41]" />
                <div>
                  <strong className="block text-sm text-slate-900">{record.product}</strong>
                  <span className="text-xs text-slate-500">Aplicação sanitária · {record.related}</span>
                </div>
                <span className="text-xs font-semibold text-[#0b3b27]">{formatDate(record.nextDate, { shortYear: true })}</span>
              </div>
            ))}
          </div>
        </article>

        <GestationTimeline nextBirth={upcomingBirths[0]} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article className="surface-card min-w-0 max-w-full overflow-hidden p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#e0dbcf] pb-3">
            <div>
              <h2 className="section-title">Matrizes em acompanhamento</h2>
              <p className="mt-1 text-xs text-slate-500">Situação reprodutiva e previsão de parto</p>
            </div>
            <Link to="/matrizes" className="text-xs font-semibold text-[#1b6a41]">Ver todas</Link>
          </div>
          <div className="max-w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="border-b border-[#e0dbcf] text-[10px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  <th className="py-3 font-semibold">Matriz</th>
                  <th className="py-3 font-semibold">Cobertura</th>
                  <th className="py-3 font-semibold">Parto previsto</th>
                  <th className="py-3 font-semibold">Responsável</th>
                  <th className="py-3 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee9df]">
                {upcomingBirths.map(({ matrix, coverage, expectedDate, stage }) => (
                  <tr key={matrix.id}>
                    <td className="py-3 font-semibold text-slate-900">{matrix.id} · {matrix.name}</td>
                    <td className="py-3 text-slate-600">{formatDate(coverage.date, { shortYear: true })}</td>
                    <td className="py-3 text-slate-600">{formatDate(expectedDate, { shortYear: true })}</td>
                    <td className="py-3 text-slate-600">{coverage.responsible}</td>
                    <td className="py-3 text-right"><StatusBadge>{stage}</StatusBadge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5">
          <div className="flex items-center gap-3 border-b border-[#e0dbcf] pb-3">
            <AlertTriangle size={18} className="text-[#ad7b22]" />
            <div>
              <h2 className="section-title">Alertas importantes</h2>
              <p className="mt-0.5 text-xs text-slate-500">Pendências que pedem atenção</p>
            </div>
          </div>
          <div className="divide-y divide-[#e8e3d9]">
            {alerts.map(({ icon: Icon, title, detail, tone }, index) => {
              const colors = {
                critical: 'text-red-700 bg-red-50',
                warning: 'text-amber-700 bg-amber-50',
                normal: 'text-[#1b6a41] bg-emerald-50',
              }
              return (
                <div key={`${title}-${index}`} className="flex items-center gap-3 py-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center ${colors[tone]}`}>
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              )
            })}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-card min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-[#e0dbcf] pb-3">
            <div>
              <h2 className="section-title">Evolução média de peso</h2>
              <p className="mt-1 text-xs text-slate-500">Média dos lotes por fase, em kg</p>
            </div>
            <Scale size={19} className="text-[#0b3b27]" />
          </div>
          <div className="mt-4 h-56 min-w-0 w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 240, height: 224 }}
            >
              <LineChart data={weightChart} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ded8cb" />
                <XAxis dataKey="phase" tick={{ fontSize: 11, fill: '#667067' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8a8f89' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${value} kg`, 'Peso médio']}
                  contentStyle={{ borderRadius: 6, border: '1px solid #d8d3c7' }}
                />
                <Line type="monotone" dataKey="peso" stroke="#1b6a41" strokeWidth={2.5} dot={{ r: 4, fill: '#fbfaf6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card p-4 sm:p-5">
          <div className="flex items-center gap-3 border-b border-[#e0dbcf] pb-3">
            <ShieldCheck size={19} className="text-[#0b3b27]" />
            <div>
              <h2 className="section-title">Resumo da semana</h2>
              <p className="mt-0.5 text-xs text-slate-500">Situação geral da rotina</p>
            </div>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p><strong className="text-[#0b3b27]">{gestatingMatrices.length} matrizes</strong> estão em acompanhamento reprodutivo.</p>
            <p>O lote <strong className="text-[#0b3b27]">{lotes[0]?.id}</strong> segue para a pesagem {nextWeighing(lotes[0]?.weights)}.</p>
            <div className="border border-[#d8d3c7] bg-[#f7f5ef] p-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-[#0b3b27]">
                <Check size={16} /> Registros locais atualizados neste dispositivo
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Ações rápidas</h2>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Rotina operacional</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link to="/coberturas" className="flex min-h-16 items-center gap-3 border border-[#0b3b27] bg-[#0b3b27] p-4 text-white transition hover:bg-[#082f1f]">
            <ClipboardPlus size={20} strokeWidth={1.8} />
            <span><strong className="block text-sm">Nova cobertura</strong><small className="text-white/60">Calcular previsão</small></span>
          </Link>
          <Link to="/partos" className="flex min-h-16 items-center gap-3 border border-[#9d792f] bg-[#fbfaf6] p-4 text-[#0b3b27] transition hover:bg-[#f5ecd8]">
            <Stethoscope size={20} strokeWidth={1.8} />
            <span><strong className="block text-sm">Registrar parto</strong><small className="text-slate-500">Criar lote de leitões</small></span>
          </Link>
          <Link to="/leitoes" className="flex min-h-16 items-center gap-3 border border-[#9d792f] bg-[#fbfaf6] p-4 text-[#0b3b27] transition hover:bg-[#f5ecd8]">
            <HeartPulse size={20} strokeWidth={1.8} />
            <span><strong className="block text-sm">Nova pesagem</strong><small className="text-slate-500">Atualizar evolução</small></span>
          </Link>
        </div>
      </section>
    </div>
  )
}
