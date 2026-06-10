import {
  Baby,
  CalendarDays,
  GraduationCap,
  MapPin,
  Scale,
  ShieldPlus,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const eventIcons = {
  class: GraduationCap,
  weighing: Scale,
  birth: Baby,
  vaccine: ShieldPlus,
  evaluation: CalendarDays,
}

export default function Agenda() {
  const { user, apiRequest } = useAuth()
  const isTeacher = user.role === 'teacher'
  const { coberturas } = useAppData()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/education/events')
      setEvents(result.events)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const combined = useMemo(() => {
    const births = coberturas.map((coverage) => ({
      id: `birth-${coverage.id}`,
      title: `Parto previsto · ${coverage.matrixId}`,
      type: 'birth',
      startsAt: `${coverage.expectedDate}T08:00:00`,
      location: 'Maternidade',
      notes: 'Revisar baia, materiais e equipe responsável.',
      className: 'Rotina zootécnica',
      classId: '',
    }))
    return [...events, ...births].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
  }, [events, coberturas])

  if (loading) return <div className="page-shell"><LoadingState label="Organizando a agenda..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Planejamento"
        title="Agenda"
        description="Aulas práticas e eventos zootécnicos na mesma linha do tempo."
        action={isTeacher
          ? <Link to="/turmas" className="primary-button w-full sm:w-auto"><CalendarDays size={18} /> Novo evento</Link>
          : null}
      />

      {combined.length > 0 ? (
        <section className="relative space-y-3 before:absolute before:bottom-6 before:left-[1.85rem] before:top-6 before:w-px before:bg-[#d8d3c7] sm:before:left-[4.65rem]">
          {combined.map((event) => {
            const Icon = eventIcons[event.type] || CalendarDays
            const date = new Date(event.startsAt)
            return (
              <article key={event.id} className="relative grid grid-cols-[60px_1fr] gap-3 sm:grid-cols-[132px_1fr]">
                <div className="relative z-10 flex flex-col items-center rounded-2xl bg-[#f5f2ea] py-2 text-center">
                  <strong className="text-xl text-[#073f2b]">{date.getDate()}</strong>
                  <span className="text-[9px] font-bold uppercase text-[#ad7b22]">
                    {date.toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                  <span className="mt-1 hidden text-[10px] text-slate-400 sm:block">
                    {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="surface-card premium-card flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef6f0] text-[#0b6847]">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#ad7b22]">{event.className}</p>
                    <h2 className="mt-1 font-bold text-[#073f2b]">{event.title}</h2>
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={13} /> {event.location || 'Local a definir'}
                    </p>
                    {event.notes && <p className="mt-2 text-sm leading-5 text-slate-600">{event.notes}</p>}
                  </div>
                  {event.classId && (
                    <Link to={`/turmas/${event.classId}`} className="secondary-button shrink-0">Abrir turma</Link>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState title="Agenda vazia" description="Crie um evento dentro de uma turma para começar o planejamento." />
      )}
    </div>
  )
}
