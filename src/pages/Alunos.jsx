import {
  Ban,
  Check,
  Clock3,
  Eye,
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { mediaUrl } from '../utils/api.js'

function formatDate(value) {
  if (!value) return 'Nunca acessou'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Avatar({ member }) {
  const avatar = mediaUrl(member.avatarPath)
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8f3ec] font-bold text-[#0b6847]">
      {avatar
        ? <img src={avatar} alt="" className="h-full w-full object-cover" />
        : <UserRound size={20} />}
    </span>
  )
}

function Status({ value }) {
  const values = {
    active: ['Ativo', 'bg-emerald-50 text-emerald-700'],
    pending: ['Pendente', 'bg-amber-50 text-amber-700'],
    blocked: ['Bloqueado', 'bg-red-50 text-red-700'],
    removed: ['Removido', 'bg-slate-100 text-slate-600'],
    rejected: ['Recusado', 'bg-slate-100 text-slate-600'],
  }
  const [label, style] = values[value] || values.pending
  return <span className={`status-pill ${style}`}>{label}</span>
}

export default function Alunos() {
  const { apiRequest } = useAuth()
  const { studentAnalytics, notify, refreshEducation } = useAppData()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [classId, setClassId] = useState('all')
  const [role, setRole] = useState('all')
  const [busy, setBusy] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [performance, setPerformance] = useState(null)

  const analytics = useMemo(
    () => Object.fromEntries(studentAnalytics.map((item) => [item.id, item])),
    [studentAnalytics],
  )

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/education/members')
      setMembers(result.members)
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
    () => [...new Map(members.map((item) => [item.classId, item.className])).entries()],
    [members],
  )
  const filtered = members.filter((member) => {
    const term = search.trim().toLowerCase()
    return (
      (!term || `${member.name} ${member.email}`.toLowerCase().includes(term)) &&
      (status === 'all' || member.membershipStatus === status) &&
      (classId === 'all' || member.classId === classId) &&
      (role === 'all' || member.membershipRole === role)
    )
  })

  async function action(member, actionName, roleName) {
    setBusy(`${member.id}-${actionName}`)
    try {
      await apiRequest(`/api/education/classes/${member.classId}/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: actionName, role: roleName }),
      })
      await Promise.all([load(), refreshEducation()])
      const messages = {
        approve: 'Aluno aprovado e acesso liberado.',
        reject: 'Solicitação recusada.',
        block: 'Aluno bloqueado e sessão encerrada.',
        reactivate: 'Aluno reativado.',
        remove: 'Aluno removido com histórico preservado.',
        role: 'Papel atualizado.',
      }
      notify(messages[actionName])
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
      setConfirmAction(null)
    }
  }

  function actionsFor(member) {
    if (member.membershipStatus === 'pending') {
      return (
        <>
          <button type="button" className="action-button action-success" onClick={() => action(member, 'approve')}>
            <Check size={15} /> Aprovar
          </button>
          <button type="button" className="action-button" onClick={() => setConfirmAction({ member, action: 'reject' })}>
            <X size={15} /> Recusar
          </button>
        </>
      )
    }
    if (['blocked', 'removed', 'rejected'].includes(member.membershipStatus)) {
      return (
        <button
          type="button"
          className="action-button action-success"
          onClick={() => action(member, 'reactivate')}
          disabled={busy.startsWith(member.id)}
        >
          <RefreshCw size={15} /> Reativar
        </button>
      )
    }
    if (member.membershipStatus === 'active') {
      return (
        <>
          <button type="button" className="action-button" onClick={() => setPerformance({ ...member, ...analytics[member.id] })} disabled={busy.startsWith(member.id)}>
            <Eye size={15} /> Desempenho
          </button>
          <button type="button" className="action-button action-warning" onClick={() => setConfirmAction({ member, action: 'block' })} disabled={busy.startsWith(member.id)}>
            <Ban size={15} /> Bloquear
          </button>
          <button type="button" className="action-button action-danger" onClick={() => setConfirmAction({ member, action: 'remove' })} disabled={busy.startsWith(member.id)}>
            <Trash2 size={15} /> Remover
          </button>
        </>
      )
    }
    return null
  }

  if (loading) return <div className="page-shell"><LoadingState label="Carregando alunos..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>

  const active = members.filter((item) => item.membershipStatus === 'active').length
  const pending = members.filter((item) => item.membershipStatus === 'pending').length
  const blocked = members.filter((item) => item.membershipStatus === 'blocked').length

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Pessoas e participação"
        title="Alunos"
        description="Aprove entradas, acompanhe progresso e controle o acesso sem perder o histórico."
        action={<Link to="/turmas" className="primary-button w-full sm:w-auto"><GraduationCap size={18} /> Convidar por turma</Link>}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Matrículas ativas" value={active} detail="com acesso" icon={UserCheck} />
        <StatCard title="Pendentes" value={pending} detail="aguardando aprovação" icon={Clock3} theme="amber" />
        <StatCard title="Bloqueados" value={blocked} detail="sessões encerradas" icon={Ban} theme="rose" />
        <StatCard title="Turmas" value={classes.length} detail="com alunos" icon={Users} theme="sky" />
      </section>

      <section className="surface-card my-5 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="field-label">Buscar aluno</span>
          <Search size={16} className="pointer-events-none absolute bottom-3.5 left-3 text-slate-400" />
          <input className="field-control pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" />
        </label>
        <label>
          <span className="field-label">Turma</span>
          <select className="field-control" value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="all">Todas</option>
            {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">Status</span>
          <select className="field-control" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="pending">Pendentes</option>
            <option value="blocked">Bloqueados</option>
            <option value="removed">Removidos</option>
          </select>
        </label>
        <label>
          <span className="field-label">Papel</span>
          <select className="field-control" value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="all">Todos</option>
            <option value="student">Aluno</option>
            <option value="monitor">Monitor</option>
          </select>
        </label>
        <div className="flex items-end">
          <span className="flex min-h-11 items-center gap-2 rounded-xl bg-[#eef6f0] px-4 text-xs font-bold text-[#0b6847]">
            <Filter size={15} /> {filtered.length}
          </span>
        </div>
      </section>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum aluno encontrado" description="Altere os filtros ou compartilhe um convite de turma." />
      ) : (
        <>
          <section className="space-y-3 xl:hidden">
            {filtered.map((member) => (
              <article key={`${member.classId}-${member.id}`} className="surface-card premium-card p-4">
                <div className="flex items-start gap-3">
                  <Avatar member={member} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[#073f2b]">{member.name}</h2>
                      <Status value={member.membershipStatus} />
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{member.email}</p>
                    <p className="mt-2 text-xs font-semibold text-[#ad7b22]">{member.className}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-sm text-[#073f2b]">{member.membershipRole === 'monitor' ? 'Monitor' : 'Aluno'}</strong><span className="text-[9px] text-slate-500">papel</span></div>
                  <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-sm text-[#073f2b]">{member.progress}%</strong><span className="text-[9px] text-slate-500">progresso</span></div>
                  <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-[10px] text-[#073f2b]">{formatDate(member.lastLoginAt)}</strong><span className="text-[9px] text-slate-500">acesso</span></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">{actionsFor(member)}</div>
              </article>
            ))}
          </section>

          <section className="surface-card hidden overflow-hidden xl:block">
            <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(190px,1fr)_120px_110px_130px_minmax(260px,1.4fr)] gap-4 border-b border-[#e9e4da] bg-[#fbfaf6] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Aluno</span><span>Turma</span><span>Papel</span><span>Status</span><span>Progresso</span><span>Ações</span>
            </div>
            <div className="divide-y divide-[#eee9df]">
              {filtered.map((member) => (
                <div key={`${member.classId}-${member.id}`} className="grid grid-cols-[minmax(240px,1.4fr)_minmax(190px,1fr)_120px_110px_130px_minmax(260px,1.4fr)] items-center gap-4 px-5 py-4 transition hover:bg-[#fbfaf6]">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0"><strong className="block truncate text-sm text-[#073f2b]">{member.name}</strong><span className="mt-1 block truncate text-[10px] text-slate-400">{member.email}</span></div>
                  </div>
                  <div><strong className="block text-xs text-slate-700">{member.className}</strong><span className="text-[9px] text-slate-400">{member.classCode}</span></div>
                  <select
                    value={member.membershipRole}
                    onChange={(event) => action(member, 'role', event.target.value)}
                    className="min-h-9 rounded-xl border border-[#d8d3c7] bg-white px-2 text-xs"
                    disabled={member.membershipStatus !== 'active'}
                  >
                    <option value="student">Aluno</option>
                    <option value="monitor">Monitor</option>
                  </select>
                  <Status value={member.membershipStatus} />
                  <div><strong className="text-sm text-[#073f2b]">{member.progress}%</strong><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#0b6847]" style={{ width: `${member.progress}%` }} /></div></div>
                  <div className="flex flex-wrap gap-2">{actionsFor(member)}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === 'remove' ? 'Remover aluno?' : confirmAction?.action === 'block' ? 'Bloquear aluno?' : 'Recusar solicitação?'}
        subtitle="A decisão ficará registrada no histórico"
        size="max-w-lg"
      >
        {confirmAction && (
          <div>
            <div className="rounded-2xl bg-[#f7f5ef] p-4">
              <strong className="text-sm text-[#073f2b]">{confirmAction.member.name}</strong>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {confirmAction.action === 'block'
                  ? 'O aluno perderá o acesso imediatamente, mas poderá ser reativado.'
                  : confirmAction.action === 'remove'
                    ? 'A matrícula será removida e o histórico continuará preservado.'
                    : 'O aluno não receberá acesso à turma.'}
              </p>
            </div>
            <div className="modal-actions mt-5">
              <button type="button" className="secondary-button" onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button type="button" className="danger-button" onClick={() => action(confirmAction.member, confirmAction.action)} disabled={busy !== ''}>
                Confirmar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(performance)} onClose={() => setPerformance(null)} title={performance?.name || ''} subtitle="Desempenho individual e acessos">
        {performance && (
          <div>
            <div className="flex items-center gap-4">
              <Avatar member={performance} />
              <div className="min-w-0 flex-1"><strong className="block text-lg text-[#073f2b]">{performance.name}</strong><span className="text-xs text-slate-500">{performance.className}</span></div>
              <strong className="text-2xl text-[#0b6847]">{performance.engagementScore || performance.progress || 0}</strong>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Acessos', performance.pageViews || 0],
                ['Posts', performance.posts || 0],
                ['Comentários', performance.comments || 0],
                ['Progresso', `${performance.progress}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f7f5ef] p-4 text-center"><strong className="block text-xl text-[#073f2b]">{value}</strong><span className="mt-1 text-[10px] text-slate-500">{label}</span></div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
