import { Award, Baby, BarChart3, Scale, Target, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import FormSelect from '../components/FormSelect.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { average, stillbornRate, totalBorn, WEIGHT_PHASES } from '../utils/calculations.js'

const COLORS = ['#1b6a41', '#ad7b22', '#6d8b75', '#c9aa62', '#7c827d']
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
  ).map(([name, value]) => ({ name, value }))

  const weightData = WEIGHT_PHASES.map((phase) => ({
    phase,
    peso: Number(average(filteredLots.map((lot) => lot.weights[phase])).toFixed(2)),
  })).filter((item) => item.peso > 0)

  const birthsByMonth = useMemo(() => {
    const months = partos.reduce((acc, birth) => {
      const date = new Date(`${birth.date}T12:00:00`)
      const key = `${date.getFullYear()}-${date.getMonth()}`
      acc[key] = (acc[key] || 0) + Number(birth.alive)
      return acc
    }, {})
    return Object.entries(months).map(([key, value]) => {
      const [, month] = key.split('-').map(Number)
      return { month: monthNames[month], leitões: value }
    })
  }, [partos])

  const productivity = matrizes
    .map((matrix) => ({
      matrix,
      alive: partos.filter((birth) => birth.matrixId === matrix.id).reduce((sum, birth) => sum + Number(birth.alive), 0),
    }))
    .sort((a, b) => b.alive - a.alive)[0]

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Indicadores"
        title="Relatórios"
        description="Resultados reprodutivos, evolução de peso e histórico sanitário em uma visão simples."
      />

      <section className="surface-card mb-6 grid gap-4 p-5 sm:grid-cols-2">
        <FormSelect label="Relatório por matriz" options={matrizes.map((item) => ({ value: item.id, label: `${item.id} · ${item.name}` }))} placeholder="Todas as matrizes" value={matrixFilter === 'Todos' ? '' : matrixFilter} onChange={(e) => setMatrixFilter(e.target.value || 'Todos')} />
        <FormSelect label="Relatório por lote" options={lotes.map((item) => ({ value: item.id, label: `${item.id} · matriz ${item.matrixId}` }))} placeholder="Todos os lotes" value={lotFilter === 'Todos' ? '' : lotFilter} onChange={(e) => setLotFilter(e.target.value || 'Todos')} />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <StatCard title="Vivos por parto" value={averageAlive.toFixed(1)} detail="média do período" icon={Baby} />
        <StatCard title="Taxa de natimortos" value={`${stillbornRate(filteredBirths).toFixed(1)}%`} detail="sobre o total" icon={Target} theme="rose" />
        <StatCard title="Peso ao nascer" value={`${averageBirthWeight.toFixed(2)} kg`} detail="média dos lotes" icon={Scale} theme="sky" />
        <StatCard title="Peso ao desmame" value={averageWeaningWeight ? `${averageWeaningWeight.toFixed(2)} kg` : '--'} detail="média registrada" icon={TrendingUp} theme="amber" />
        <div className="col-span-2 xl:col-span-1"><StatCard title="Registros sanitários" value={sanitario.length} detail="vacinas e medicamentos" icon={BarChart3} theme="violet" /></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <article className="surface-card min-w-0 p-5 sm:p-7">
          <h2 className="section-title">Evolução de peso dos leitões</h2>
          <p className="mt-1 text-sm text-slate-500">Média por fase de acompanhamento</p>
          <div className="mt-5 h-72 min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 240, height: 288 }}
            >
              <LineChart data={weightData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="phase" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value} kg`, 'Peso médio']} contentStyle={{ borderRadius: 6, border: '1px solid #d8d3c7' }} />
                <Line dataKey="peso" type="monotone" stroke="#1b6a41" strokeWidth={2.5} dot={{ r: 4, fill: '#fbfaf6', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="surface-card min-w-0 p-5 sm:p-7">
          <h2 className="section-title">Status das matrizes</h2>
          <p className="mt-1 text-sm text-slate-500">Distribuição atual do plantel</p>
          <div className="mt-5 h-72 min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 240, height: 288 }}
            >
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={4}>
                  {statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #d8d3c7' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card min-w-0 p-5 sm:p-7">
          <h2 className="section-title">Partos por período</h2>
          <p className="mt-1 text-sm text-slate-500">Leitões vivos agrupados por mês</p>
          <div className="mt-5 h-64 min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 240, height: 256 }}
            >
              <BarChart data={birthsByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 6, border: '1px solid #d8d3c7' }} />
                <Bar dataKey="leitões" fill="#1b6a41" radius={[3, 3, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="surface-card border-t-4 border-t-[#ad7b22] p-6 sm:p-7">
          <span className="grid h-11 w-11 place-items-center border border-[#d8c79e] bg-[#f8f2e5] text-[#ad7b22]"><Award size={21} /></span>
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ad7b22]">Maior produtividade</p>
          <h2 className="mt-2 text-3xl font-bold text-[#082f1f]">{productivity?.matrix.name || '--'}</h2>
          <p className="mt-1 text-sm text-slate-500">{productivity?.matrix.id} · {productivity?.matrix.breed}</p>
          <div className="mt-6 border-y border-[#e2ddd2] py-4">
            <strong className="block text-3xl font-bold text-[#1b6a41]">{productivity?.alive || 0}</strong>
            <span className="text-sm font-semibold text-slate-500">leitões vivos registrados</span>
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">O indicador considera os partos presentes neste dispositivo e será ampliado conforme novos registros forem adicionados.</p>
        </article>
      </section>
    </div>
  )
}
