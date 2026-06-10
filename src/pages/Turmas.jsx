import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  GraduationCap,
  Plus,
  UserCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ClassCard from '../components/education/ClassCard.jsx'
import { EmptyState } from '../components/education/StatePanel.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const initialForm = {
  name: '',
  code: '',
  description: '',
  color: 'forest',
}

export default function Turmas() {
  const { user } = useAuth()
  const isTeacher = user.role === 'teacher'
  const {
    classes,
    educationTotals,
    createClass,
    loading,
  } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(
    () => classes.filter((item) => filter === 'all' || item.status === filter),
    [classes, filter],
  )

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await createClass(form)
      setOpen(false)
      setForm(initialForm)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const weeklyActivities = classes.reduce((sum, item) => sum + item.activityCount, 0)

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Gestão acadêmica"
        title="Turmas"
        description="Crie turmas, compartilhe acessos e acompanhe alunos e atividades sem perder o controle."
        action={isTeacher ? (
          <button type="button" className="primary-button w-full sm:w-auto" onClick={() => setOpen(true)}>
            <Plus size={18} />
            Nova turma
          </button>
        ) : null}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard title="Turmas ativas" value={educationTotals.activeClasses} detail="em andamento" icon={GraduationCap} />
        <StatCard title="Alunos vinculados" value={educationTotals.students} detail="matrículas ativas" icon={UserCheck} theme="sky" />
        <StatCard title="Convites pendentes" value={educationTotals.pending} detail="aguardando decisão" icon={Clock3} theme="amber" />
        <StatCard title="Atividades" value={weeklyActivities} detail="publicadas" icon={BookOpenCheck} theme="violet" />
        <StatCard title="Agenda" value={classes.reduce((sum, item) => sum + item.eventCount, 0)} detail="eventos programados" icon={CalendarDays} theme="rose" />
      </section>

      <div className="my-6 flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ['all', 'Todas'],
            ['active', 'Ativas'],
            ['inactive', 'Inativas'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`filter-pill ${filter === value ? 'filter-pill-active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="hidden text-xs font-semibold text-slate-400 sm:block">
          {filtered.length} turma{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((item) => <ClassCard key={item.id} item={item} />)}
        </section>
      ) : !loading && (
        <EmptyState
          title="Nenhuma turma neste filtro"
          description={isTeacher
            ? 'Crie a primeira turma ou altere o filtro para visualizar outras turmas.'
            : 'Quando sua entrada for aprovada, a turma aparecerá aqui.'}
          action={isTeacher ? (
            <button type="button" className="primary-button" onClick={() => setOpen(true)}>
              <Plus size={17} />
              Criar turma
            </button>
          ) : null}
        />
      )}

      {isTeacher && <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nova turma"
        subtitle="O link de convite será criado automaticamente"
      >
        <form onSubmit={submit} className="space-y-4">
          <FormInput
            label="Nome da turma"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Ex.: Manejo Reprodutivo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Código"
              required
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              placeholder="C114-MR-26"
            />
            <FormSelect
              label="Tema visual"
              value={form.color}
              onChange={(event) => setForm({ ...form, color: event.target.value })}
              options={[
                { value: 'forest', label: 'Verde institucional' },
                { value: 'emerald', label: 'Verde vivo' },
                { value: 'gold', label: 'Dourado' },
                { value: 'blue', label: 'Azul técnico' },
                { value: 'violet', label: 'Violeta' },
              ]}
              placeholder=""
            />
          </div>
          <label>
            <span className="field-label">Descrição</span>
            <textarea
              className="field-control min-h-28 py-3"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Explique em uma frase o objetivo da turma."
            />
          </label>
          {error && <p className="feedback-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? 'Criando...' : 'Criar turma e convite'}
            </button>
          </div>
        </form>
      </Modal>}
    </div>
  )
}
