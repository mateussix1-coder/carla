import { Award, Baby, BarChart3, Scale, Target, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import FormSelect from '../components/FormSelect.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { average, stillbornRate, WEIGHT_PHASES } from '../utils/calculations.js'

const statusColors = ['#17633d', '#ad7b22', '#72927c', '#d2b56c', '#8d938f']
const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Relatorios() {
  const { matrizes, partos, lotes, sanitario } = useAppData()
  const [matrixFilter, setMatrixFilter] = useState('Todos')
  const [lotFilter, setLotFilter] = useState('Todos')

  const filteredBirths = partos.filter((birth) => matrixFilter === 'Todos' || birth.matrixId === matrixFilter)
  const filteredLots = lotes.filter((lot) => lotFilter === 'Todos' || lot.id === lotFilter)
  const averageAlive = average(filteredBirths.map((birth) => birth.alive))
  const averageBirthWeight = average(filteredLots.map((lot) => lot.weights.PN))
  const averageWeaningWeight = average(filteredLots.map((lot) => lot.weights.PD))
  const statusData = Object.entries(
    matrizes.reduce((acc, matrix) => ({ ...acc, [matrix.status]: (acc[matrix.status] || 0) + 1 }), {}),
  ).map(([name, value], index) => ({ name, value, color: statusColors[index % statusColors.length] }))

  const weightData = WEIGHT_PHASES.map((phase) => ({
    phase,
    peso: Number(average(filteredLots.map((lot) => lot.weights[phase])).toFixed(2)),
  })).filter((item) => item.peso > 0)
  const maxWeight = Math.max(...weightData.map((item) => item.peso), 1)

  const birthsByMonth = useMemo(() => {
    const months = partos.reduce((acc, birth) => {
      const date = new Date(`${birth.date}T12:00:00`)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      acc[key] = (acc[key] || 0) + Number(birth.alive)
      return acc
    }, {})
    return Object.entries(months).map(([key, value]) => {
      const [, month] = key.split('-').map(Number)
      return { month: monthNames[month], leitoes: value }
    })
  }, [partos])
  const maxBirths = Math.max(...birthsByMonth.map((item) => item.leitoes), 1)

  const productivity = matrizes
    .map((matrix) => ({
      matrix,
      alive: partos.filter((birth) => birth.matrixId === matrix.id).reduce((sum, birth) => sum + Number(birth.alive), 0),
    }))
    .sort((a, b) => b.alive - a.alive)[0]

  let angle = 0
  const totalStatus = statusData.reduce((sum, item) => sum + item.value, 0) || 1
  const donutStops = statusData.map((item) => {
    const start = angle
    angle += (item.value / totalStatus) * 360
    return `${item.color} ${start}deg ${angle}deg`
  }).join(', ')

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Indicadores"
        title="Relatórios"
        description="Resultados reprodutivos, evolução de peso e histórico sanitário em uma visão simples."
      />

      <section className="surface-card mb-5 grid gap-4 p-5 sm:grid-cols-2">
        <FormSelect label="Relatório por matriz" options={matrizes.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} placeholder="Todas as matrizes" value={matrixFilter === 'Todos' ? '' : matrixFilter} onChange={(e) => setMatrixFilter(e.target.value || 'Todos')} />
        <FormSelect label="Relatório por lote" options={lotes.map((item) => ({ value: item.id, label: `${item.id} · matriz ${item.matrixId}` }))} placeholder="Todos os lotes" value={lotFilter === 'Todos' ? '' : lotFilter} onChange={(e) => setLotFilter(e.target.value || 'Todos')} />
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard title="Vivos por parto" value={averageAlive.toFixed(1)} detail="média do período" icon={Baby} />
        <StatCard title="Taxa de natimortos" value={`${stillbornRate(filteredBirths).toFixed(1)}%`} detail="sobre o total" icon={Target} theme="rose" />
        <StatCard title="Peso ao nascer" value={`${averageBirthWeight.toFixed(2)} kg`} detail="média dos lotes" icon={Scale} theme="sky" />
        <StatCard title="Peso ao desmame" value={averageWeaningWeight ? `${averageWeaningWeight.toFixed(2)} kg` : '--'} detail="média registrada" icon={TrendingUp} theme="amber" />
        <div className="col-span-2 xl:col-span-1"><StatCard title="Registros sanitários" value={sanitario.length} detail="vacinas e medicamentos" icon={BarChart3} theme="violet" /></div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="surface-card p-5 sm:p-7">
          <h2 className="section-title">Evolução de peso dos leitões</h2>
          <p className="mt-1 text-sm text-slate-500">Média por fase de acompanhamento</p>
          <div className="mt-7 flex h-64 items-end gap-3 border-b border-l border-[#ddd7cb] px-4 pb-3">
            {weightData.map((item) => (
              <div key={item.phase} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <strong className="text-xs text-[#073b28]">{item.peso} kg</strong>
                <div
                  className="w-full max-w-16 rounded-t-xl bg-[linear-gradient(180deg,#2b8057,#0b5136)]"
                  style={{ height: `${Math.max(8, (item.peso / maxWeight) * 82)}%` }}
                />
                <span className="text-[10px] font-bold text-slate-500">{item.phase}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-5 sm:p-7">
          <h2 className="section-title">Status das matrizes</h2>
          <p className="mt-1 text-sm text-slate-500">Distribuição atual do plantel</p>
          <div className="mt-7 grid items-center gap-7 sm:grid-cols-[190px_1fr]">
            <div className="relative mx-auto h-44 w-44 rounded-full" style={{ background: `conic-gradient(${donutStops})` }}>
              <div className="absolute inset-8 grid place-items-center rounded-full bg-white text-center">
                <span><strong className="block text-3xl text-[#073b28]">{matrizes.length}</strong><small className="text-slate-500">matrizes</small></span>
              </div>
            </div>
            <div className="space-y-3">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-slate-600"><i className="h-3 w-3 rounded-full" style={{ background: item.color }} />{item.name}</span>
                  <strong className="text-[#073b28]">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card p-5 sm:p-7">
          <h2 className="section-title">Partos por período</h2>
          <p className="mt-1 text-sm text-slate-500">Leitões vivos agrupados por mês</p>
          <div className="mt-7 flex h-52 items-end gap-4 border-b border-[#ddd7cb] px-4 pb-3">
            {birthsByMonth.map((item) => (
              <div key={item.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <strong className="text-xs text-[#073b28]">{item.leitoes}</strong>
                <div
                  className="w-full max-w-20 rounded-t-xl bg-[#d2b56c]"
                  style={{ height: `${Math.max(10, (item.leitoes / maxBirths) * 78)}%` }}
                />
                <span className="text-[10px] font-bold text-slate-500">{item.month}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="surface-card overflow-hidden">
          <img src={productivity?.matrix.image || '/images/aurora.jpg'} alt="" width="960" height="720" loading="lazy" decoding="async" className="h-40 w-full object-cover" />
          <div className="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4df] text-[#ad7b22]"><Award size={21} /></span>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ad7b22]">Maior produtividade</p>
            <h2 className="mt-2 text-3xl font-bold text-[#073b28]">{productivity?.matrix.name || '--'}</h2>
            <p className="mt-1 text-sm text-slate-500">{productivity?.matrix.id} · {productivity?.matrix.breed}</p>
            <div className="mt-5 rounded-2xl bg-[#f4f8f5] p-4">
              <strong className="block text-3xl font-bold text-[#1b6a41]">{productivity?.alive || 0}</strong>
              <span className="text-sm font-semibold text-slate-500">leitões vivos registrados</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}
