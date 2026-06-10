import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Filter,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function dueLabel(value) {
  if (!value) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function Atividades() {
  const { user, apiRequest } = useAuth()
  const isTeacher = user.role === 'teacher'
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/education/activities')
      setActivities(result.activities)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const classes = useMemo(
    () => [...new Map(activities.map((item) => [item.classId, item.className])).entries()],
    [activities],
  )
  const filtered = activities.filter((item) =>
    (classFilter === 'all' || item.classId === classFilter) &&
    (statusFilter === 'all' || item.status === statusFilter),
  )
  const overdue = activities.filter((item) => item.dueAt && new Date(item.dueAt) < new Date()).length

  if (loading) return <div className="page-shell"><LoadingState label="Carregando atividades..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Ensino e prática"
        title="Atividades"
        description="Prazos, entregas e orientações organizados por turma."
        action={isTeacher ? (
          <Link to="/turmas" className="primary-button w-full sm:w-auto">
            <BookOpenCheck size={18} />
            Criar em uma turma
          </Link>
        ) : null}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Publicadas" value={activities.filter((item) => item.status === 'published').length} detail="disponíveis aos alunos" icon={BookOpenCheck} />
        <StatCard title="Entregas" value={activities.reduce((sum, item) => sum + item.submissions, 0)} detail="registros recebidos" icon={ClipboardCheck} theme="sky" />
        <StatCard title="Prazos vencidos" value={overdue} detail="requerem revisão" icon={Clock3} theme="rose" />
        <StatCard title="Turmas" value={classes.length} detail="com atividades" icon={CheckCircle2} theme="violet" />
      </section>

      <section className="surface-card my-5 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
        <label>
          <span className="field-label">Turma</span>
          <select className="field-control" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="all">Todas as turmas</option>
            {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">Status</span>
          <select className="field-control" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Todos os status</option>
            <option value="published">Publicadas</option>
            <option value="draft">Rascunhos</option>
            <option value="closed">Encerradas</option>
          </select>
        </label>
        <div className="flex items-end">
          <div className="flex min-h-11 items-center gap-2 rounded-xl bg-[#eef6f0] px-4 text-xs font-bold text-[#0b6847]">
            <Filter size={15} />
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {filtered.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => (
            <article key={item.id} className="surface-card premium-card p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#073f2b] text-white">
                  <BookOpenCheck size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="status-pill bg-emerald-50 text-emerald-700">Publicada</span>
                    <span className="text-[10px] font-bold text-[#ad7b22]">{item.classCode}</span>
                  </div>
                  <h2 className="mt-2 font-bold text-[#073f2b]">{item.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#f7f5ef] p-3">
                      <CalendarClock size={15} className="text-[#ad7b22]" />
                      <strong className="mt-2 block text-xs text-[#073f2b]">{dueLabel(item.dueAt)}</strong>
                      <span className="text-[9px] text-slate-500">prazo de entrega</span>
                    </div>
                    <div className="rounded-xl bg-[#f7f5ef] p-3">
                      <ClipboardCheck size={15} className="text-[#0b6847]" />
                      <strong className="mt-2 block text-lg text-[#073f2b]">{item.submissions}</strong>
                      <span className="text-[9px] text-slate-500">entregas</span>
                    </div>
                  </div>
                  <Link to={`/turmas/${item.classId}`} className="secondary-button mt-4 w-full">
                    Abrir {item.className}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState title="Nenhuma atividade encontrada" description="Altere os filtros ou crie uma atividade dentro de uma turma." />
      )}
    </div>
  )
}
