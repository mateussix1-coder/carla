import {
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Filter,
  Link2,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { mediaUrl } from '../utils/api.js'
import {
  ACCESS_MODULES,
  DEFAULT_MONITOR_MODULES,
  DEFAULT_STUDENT_MODULES,
} from '../utils/access.js'

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
    pending: ['Aguardando aprovação', 'bg-amber-50 text-amber-700'],
    blocked: ['Bloqueado', 'bg-red-50 text-red-700'],
    removed: ['Removido', 'bg-slate-100 text-slate-600'],
    rejected: ['Recusado', 'bg-slate-100 text-slate-600'],
  }
  const [label, style] = values[value] || values.removed
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
  const [role, setRole] = useState('all')
  const [busy, setBusy] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [accessDraft, setAccessDraft] = useState([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)
  const [inviteForm, setInviteForm] = useState({
    role: 'student',
    modules: DEFAULT_STUDENT_MODULES,
  })

  const analytics = useMemo(
    () => Object.fromEntries(studentAnalytics.map((item) => [item.id, item])),
    [studentAnalytics],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest('/api/education/members')
      setMembers(result.members)
      setSelectedMember((current) => (
        current
          ? result.members.find((item) => item.id === current.id) || null
          : null
      ))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    load()
  }, [load])

  const filtered = members.filter((member) => {
    const term = search.trim().toLowerCase()
    return (
      (!term || `${member.name} ${member.email}`.toLowerCase().includes(term))
      && (status === 'all' || member.membershipStatus === status)
      && (role === 'all' || member.membershipRole === role)
    )
  })

  async function action(member, actionName, roleName, modules) {
    setBusy(`${member.id}-${actionName}`)
    try {
      const result = await apiRequest(`/api/education/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: actionName, role: roleName, modules }),
      })
      setMembers((current) => current.map((item) => (
        item.id === member.id ? result.member : item
      )))
      setSelectedMember((current) => current?.id === member.id ? result.member : current)
      await refreshEducation()
      const messages = {
        approve: 'Pessoa aprovada e acesso geral liberado.',
        reject: 'Solicitação recusada.',
        block: 'Pessoa bloqueada e sessões encerradas.',
        reactivate: 'Acesso geral reativado.',
        remove: 'Pessoa removida com histórico preservado.',
        role: 'Papel atualizado em todas as áreas.',
        access: 'Acessos atualizados em todas as áreas.',
      }
      notify(messages[actionName])
      if (actionName === 'access') setAccessDraft(result.member.accessModules)
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
      setConfirmAction(null)
    }
  }

  function openDetails(member) {
    setSelectedMember(member)
    setAccessDraft(member.accessModules || DEFAULT_STUDENT_MODULES)
  }

  function toggleAccess(moduleKey) {
    setAccessDraft((current) => current.includes(moduleKey)
      ? current.filter((item) => item !== moduleKey)
      : [...current, moduleKey])
  }

  function openInvite() {
    setInviteForm({ role: 'student', modules: DEFAULT_STUDENT_MODULES })
    setInviteResult(null)
    setInviteError('')
    setInviteOpen(true)
  }

  function setInviteRole(nextRole) {
    setInviteForm({
      role: nextRole,
      modules: nextRole === 'monitor'
        ? DEFAULT_MONITOR_MODULES
        : DEFAULT_STUDENT_MODULES,
    })
  }

  function toggleInviteModule(moduleKey) {
    setInviteForm((current) => ({
      ...current,
      modules: current.modules.includes(moduleKey)
        ? current.modules.filter((item) => item !== moduleKey)
        : [...current.modules, moduleKey],
    }))
  }

  async function createInvite(event) {
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

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteResult.url)
    notify('Link de convite copiado.')
  }

  function actionsFor(member) {
    if (member.membershipStatus === 'pending') {
      return (
        <>
          <button type="button" className="action-button" onClick={() => openDetails(member)}>
            <Eye size={15} /> Ver
          </button>
          <button type="button" className="action-button action-success" onClick={() => action(member, 'approve')} disabled={busy !== ''}>
            <Check size={15} /> Aprovar
          </button>
          <button type="button" className="action-button" onClick={() => setConfirmAction({ member, action: 'reject' })} disabled={busy !== ''}>
            <X size={15} /> Recusar
          </button>
        </>
      )
    }
    if (['blocked', 'removed', 'rejected'].includes(member.membershipStatus)) {
      return (
        <>
          <button type="button" className="action-button" onClick={() => openDetails(member)}>
            <Eye size={15} /> Ver
          </button>
          <button
            type="button"
            className="action-button action-success"
            onClick={() => action(member, 'reactivate')}
            disabled={busy.startsWith(member.id)}
          >
            <RefreshCw size={15} /> Reativar
          </button>
        </>
      )
    }
    return (
      <>
        <button type="button" className="action-button" onClick={() => openDetails(member)}>
          <Eye size={15} /> Ver acessos
        </button>
        <button type="button" className="action-button action-warning" onClick={() => setConfirmAction({ member, action: 'block' })} disabled={busy !== ''}>
          <Ban size={15} /> Bloquear
        </button>
        <button type="button" className="action-button action-danger" onClick={() => setConfirmAction({ member, action: 'remove' })} disabled={busy !== ''}>
          <Trash2 size={15} /> Remover
        </button>
      </>
    )
  }

  if (loading) return <div className="page-shell"><LoadingState label="Carregando pessoas..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>

  const active = members.filter((item) => item.membershipStatus === 'active').length
  const pending = members.filter((item) => item.membershipStatus === 'pending').length
  const blocked = members.filter((item) => item.membershipStatus === 'blocked').length
  const monitors = members.filter((item) => (
    item.membershipStatus === 'active' && item.membershipRole === 'monitor'
  )).length

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Pessoas e acessos"
        title="Alunos e monitores"
        description="Cada pessoa aparece uma única vez. Aprove o acesso e consulte todas as áreas na mesma janela."
        action={(
          <button type="button" className="primary-button w-full sm:w-auto" onClick={openInvite}>
            <Link2 size={18} /> Novo convite
          </button>
        )}
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Pessoas ativas" value={active} detail="com acesso" icon={UserCheck} />
        <StatCard title="Pendentes" value={pending} detail="aprovar aqui" icon={Clock3} theme="amber" />
        <StatCard title="Monitores" value={monitors} detail="acesso ampliado" icon={Users} theme="sky" />
        <StatCard title="Bloqueados" value={blocked} detail="sem acesso" icon={Ban} theme="rose" />
      </section>

      <section className="surface-card my-5 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_auto]">
        <label className="relative">
          <span className="field-label">Buscar pessoa</span>
          <Search size={16} className="pointer-events-none absolute bottom-3.5 left-3 text-slate-400" />
          <input className="field-control pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou e-mail" />
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
        <EmptyState title="Nenhuma pessoa encontrada" description="Altere os filtros ou gere um novo convite." />
      ) : (
        <>
          <section className="space-y-3 xl:hidden">
            {filtered.map((member) => {
              const activeClasses = member.classes.filter((item) => item.status === 'active')
              return (
                <article key={member.id} className="surface-card premium-card p-4">
                  <div className="flex items-start gap-3">
                    <Avatar member={member} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-[#073f2b]">{member.name}</h2>
                        <Status value={member.membershipStatus} />
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{member.email}</p>
                      <p className="mt-2 text-xs font-semibold text-[#ad7b22]">
                        {activeClasses.length} área{activeClasses.length !== 1 ? 's' : ''} ativa{activeClasses.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-sm text-[#073f2b]">{member.membershipRole === 'monitor' ? 'Monitor' : 'Aluno'}</strong><span className="text-[9px] text-slate-500">papel</span></div>
                    <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-sm text-[#073f2b]">{member.progress}%</strong><span className="text-[9px] text-slate-500">progresso</span></div>
                    <div className="rounded-xl bg-[#f7f5ef] p-3"><strong className="block text-[10px] text-[#073f2b]">{formatDate(member.lastLoginAt)}</strong><span className="text-[9px] text-slate-500">acesso</span></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">{actionsFor(member)}</div>
                </article>
              )
            })}
          </section>

          <section className="surface-card hidden overflow-hidden xl:block">
            <div className="grid grid-cols-[minmax(240px,1.4fr)_minmax(220px,1.2fr)_120px_150px_110px_minmax(290px,1.5fr)] gap-4 border-b border-[#e9e4da] bg-[#fbfaf6] px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Pessoa</span><span>Áreas ativas</span><span>Papel</span><span>Status</span><span>Progresso</span><span>Ações</span>
            </div>
            <div className="divide-y divide-[#eee9df]">
              {filtered.map((member) => {
                const activeClasses = member.classes.filter((item) => item.status === 'active')
                return (
                  <div key={member.id} className="grid grid-cols-[minmax(240px,1.4fr)_minmax(220px,1.2fr)_120px_150px_110px_minmax(290px,1.5fr)] items-center gap-4 px-5 py-4 transition hover:bg-[#fbfaf6]">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar member={member} />
                      <div className="min-w-0"><strong className="block truncate text-sm text-[#073f2b]">{member.name}</strong><span className="mt-1 block truncate text-[10px] text-slate-400">{member.email}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeClasses.slice(0, 2).map((item) => (
                        <span key={item.id} className="rounded-full bg-[#eef6f0] px-2.5 py-1 text-[10px] font-semibold text-[#0b6847]">{item.name}</span>
                      ))}
                      {activeClasses.length > 2 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">+{activeClasses.length - 2}</span>}
                      {!activeClasses.length && <span className="text-xs text-slate-400">Nenhuma área ativa</span>}
                    </div>
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
                )
              })}
            </div>
          </section>
        </>
      )}

      <Modal
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title={selectedMember?.name || ''}
        subtitle="Uma pessoa, com todas as áreas e permissões reunidas"
        size="max-w-3xl"
      >
        {selectedMember && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar member={selectedMember} />
              <div className="min-w-0 flex-1">
                <strong className="block text-lg text-[#073f2b]">{selectedMember.name}</strong>
                <span className="text-xs text-slate-500">{selectedMember.email}</span>
              </div>
              <Status value={selectedMember.membershipStatus} />
            </div>

            <section>
              <h3 className="field-label">Áreas vinculadas</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {selectedMember.classes.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#e3ded3] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <strong className="block text-sm text-[#073f2b]">{item.name}</strong>
                        <span className="mt-1 block text-[10px] text-slate-400">{item.code}</span>
                      </div>
                      <Status value={item.status} />
                    </div>
                  </div>
                ))}
                {!selectedMember.classes.length && (
                  <p className="rounded-2xl bg-[#f7f5ef] p-4 text-sm text-slate-500">Nenhuma área vinculada ainda.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="field-label">Partes do sistema permitidas</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ACCESS_MODULES.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3ded3] bg-white p-3">
                    <input
                      type="checkbox"
                      checked={accessDraft.includes(item.key)}
                      onChange={() => toggleAccess(item.key)}
                      className="h-5 w-5 accent-[#0b6847]"
                    />
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Acessos', analytics[selectedMember.id]?.pageViews || 0],
                ['Posts', analytics[selectedMember.id]?.posts || 0],
                ['Comentários', analytics[selectedMember.id]?.comments || 0],
                ['Progresso', `${selectedMember.progress}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f7f5ef] p-4 text-center"><strong className="block text-xl text-[#073f2b]">{value}</strong><span className="mt-1 text-[10px] text-slate-500">{label}</span></div>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setSelectedMember(null)}>Fechar</button>
              <button
                type="button"
                className="primary-button"
                disabled={!accessDraft.length || busy !== ''}
                onClick={() => action(selectedMember, 'access', selectedMember.membershipRole, accessDraft)}
              >
                Salvar acessos
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === 'remove' ? 'Remover pessoa?' : confirmAction?.action === 'block' ? 'Bloquear pessoa?' : 'Recusar solicitação?'}
        subtitle="A decisão vale para o acesso geral e ficará no histórico"
        size="max-w-lg"
      >
        {confirmAction && (
          <div>
            <div className="rounded-2xl bg-[#f7f5ef] p-4">
              <strong className="text-sm text-[#073f2b]">{confirmAction.member.name}</strong>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {confirmAction.action === 'block'
                  ? 'A pessoa perderá o acesso imediatamente em todas as áreas.'
                  : confirmAction.action === 'remove'
                    ? 'Todos os vínculos serão removidos e o histórico continuará preservado.'
                    : 'A solicitação de acesso será recusada.'}
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

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convite de acesso"
        subtitle="Um único link, sem escolher turma. A aprovação aparecerá nesta tela."
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
                    {inviteResult.role === 'monitor' ? 'Monitor' : 'Aluno'} · acesso geral
                  </span>
                </div>
              </div>
              <p className="mt-4 break-all rounded-xl bg-white p-3 text-xs font-semibold text-slate-600">{inviteResult.url}</p>
            </div>
            <div className="modal-actions mt-5">
              <button type="button" className="secondary-button" onClick={() => setInviteOpen(false)}>Fechar</button>
              <button type="button" className="primary-button" onClick={copyInvite}><Copy size={16} /> Copiar link</button>
            </div>
          </div>
        ) : (
          <form onSubmit={createInvite} className="space-y-5">
            <fieldset>
              <legend className="field-label">Papel da pessoa</legend>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['student', 'Aluno', 'Recebe somente as partes selecionadas.'],
                  ['monitor', 'Monitor', 'Recebe todas as partes por padrão.'],
                ].map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setInviteRole(value)}
                    aria-pressed={inviteForm.role === value}
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
              <legend className="field-label">Partes do sistema permitidas</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {ACCESS_MODULES.map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3ded3] bg-white p-3">
                    <input
                      type="checkbox"
                      checked={inviteForm.modules.includes(item.key)}
                      onChange={() => toggleInviteModule(item.key)}
                      className="h-5 w-5 accent-[#0b6847]"
                    />
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl bg-[#eef6f0] p-4 text-xs leading-5 text-[#335b47]">
              A pessoa preencherá o cadastro uma vez. Depois aparecerá em “Pendentes” para uma única aprovação.
            </div>
            {inviteError && <p className="feedback-error">{inviteError}</p>}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setInviteOpen(false)}>Cancelar</button>
              <button className="primary-button" disabled={inviteBusy || !inviteForm.modules.length}>
                {inviteBusy ? 'Gerando...' : 'Gerar convite'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
