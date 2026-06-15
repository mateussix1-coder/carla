import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  GraduationCap,
  Link2,
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
import {
  ACCESS_MODULES,
  DEFAULT_MONITOR_MODULES,
  DEFAULT_STUDENT_MODULES,
} from '../utils/access.js'

const initialForm = {
  name: '',
  code: '',
  description: '',
  color: 'forest',
}

export default function Turmas() {
  const { user, apiRequest } = useAuth()
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
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteForm, setInviteForm] = useState({
    role: 'student',
    classIds: [],
    modules: DEFAULT_STUDENT_MODULES,
  })

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

  function openInvite() {
    const activeClassIds = classes
      .filter((item) => item.status === 'active')
      .map((item) => item.id)
    setInviteForm({
      role: 'student',
      classIds: activeClassIds,
      modules: DEFAULT_STUDENT_MODULES,
    })
    setInviteResult(null)
    setInviteError('')
    setInviteOpen(true)
  }

  function setInviteRole(role) {
    setInviteForm((current) => ({
      ...current,
      role,
      modules: role === 'monitor'
        ? DEFAULT_MONITOR_MODULES
        : DEFAULT_STUDENT_MODULES,
    }))
  }

  function toggleInviteValue(key, value) {
    setInviteForm((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }))
  }

  async function createAccessInvite(event) {
    event.preventDefault()
    setInviteBusy(true)
    setInviteError('')
    try {
      const result = await apiRequest('/api/education/invites', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      })
      setInviteResult({
        ...result,
        url: `${window.location.origin}/cadastro?convite=${encodeURIComponent(result.token)}`,
      })
    } catch (requestError) {
      setInviteError(requestError.message)
    } finally {
      setInviteBusy(false)
    }
  }

  async function copyAccessInvite() {
    if (!inviteResult?.url) return
    await navigator.clipboard.writeText(inviteResult.url)
  }

  const weeklyActivities = classes.reduce((sum, item) => sum + item.activityCount, 0)

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Gestão acadêmica"
        title="Turmas"
        description="Crie turmas, compartilhe acessos e acompanhe alunos e atividades sem perder o controle."
        action={isTeacher ? (
          <div className="grid w-full gap-2 sm:flex sm:w-auto">
            <button type="button" className="secondary-button w-full sm:w-auto" onClick={() => setOpen(true)}>
              <Plus size={18} />
              Nova turma
            </button>
            <button type="button" className="primary-button w-full sm:w-auto" onClick={openInvite} disabled={!classes.some((item) => item.status === 'active')}>
              <Link2 size={18} />
              Novo convite de acesso
            </button>
          </div>
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

      {isTeacher && <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convite único de acesso"
        subtitle="Escolha o papel, as turmas e os módulos que a pessoa poderá abrir"
        size="max-w-3xl"
      >
        {inviteResult ? (
          <div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-700" />
                <div>
                  <strong className="block text-sm text-[#073f2b]">Convite criado</strong>
                  <span className="text-xs text-slate-500">
                    {inviteResult.role === 'monitor' ? 'Monitor' : 'Aluno'} · {inviteResult.classes.length} turma(s)
                  </span>
                </div>
              </div>
              <p className="mt-4 break-all rounded-xl bg-white p-3 text-xs font-semibold text-slate-600">
                {inviteResult.url}
              </p>
            </div>
            <div className="modal-actions mt-5">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8d3c7] bg-white px-5 text-sm font-bold text-[#073f2b]"
                onClick={() => setInviteOpen(false)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b5136] px-5 text-sm font-bold text-white"
                onClick={copyAccessInvite}
              >
                <Copy size={16} />
                Copiar link
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={createAccessInvite} className="space-y-5">
            <fieldset>
              <legend className="field-label">Papel da pessoa</legend>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['student', 'Aluno', 'Acessa somente as partes selecionadas.'],
                  ['monitor', 'Monitor', 'Recebe todos os módulos por padrão.'],
                ].map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInviteRole(value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      inviteForm.role === value
                        ? 'border-[#0b6847] bg-[#eef6f0]'
                        : 'border-[#ded9ce] bg-white'
                    }`}
                  >
                    <strong className="block text-sm text-[#073f2b]">{label}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <div className="flex items-center justify-between gap-3">
                <legend className="field-label">Turmas incluídas no mesmo convite</legend>
                <button
                  type="button"
                  className="text-xs font-bold text-[#0b6847]"
                  onClick={() => setInviteForm((current) => ({
                    ...current,
                    classIds: classes.filter((item) => item.status === 'active').map((item) => item.id),
                  }))}
                >
                  Selecionar todas
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {classes.filter((item) => item.status === 'active').map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e3ded3] bg-white p-3">
                    <input
                      type="checkbox"
                      checked={inviteForm.classIds.includes(item.id)}
                      onChange={() => toggleInviteValue('classIds', item.id)}
                      className="mt-0.5 h-5 w-5 accent-[#0b6847]"
                    />
                    <span>
                      <strong className="block text-xs text-[#073f2b]">{item.name}</strong>
                      <span className="mt-1 block text-[10px] text-slate-400">{item.code}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="field-label">Partes do sistema permitidas</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ACCESS_MODULES.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3ded3] bg-white p-3">
                    <input
                      type="checkbox"
                      checked={inviteForm.modules.includes(item.key)}
                      onChange={() => toggleInviteValue('modules', item.key)}
                      className="h-5 w-5 accent-[#0b6847]"
                    />
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {inviteError && <p className="feedback-error">{inviteError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d8d3c7] bg-white px-5 text-sm font-bold text-[#073f2b]"
                onClick={() => setInviteOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0b5136] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={inviteBusy || !inviteForm.classIds.length || !inviteForm.modules.length}
              >
                {inviteBusy ? 'Gerando...' : 'Gerar um único link'}
              </button>
            </div>
          </form>
        )}
      </Modal>}
    </div>
  )
}
