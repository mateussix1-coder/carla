import {
  Activity,
  Ban,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clipboard,
  Clock3,
  Copy,
  Link2,
  MessageCircleMore,
  MoreHorizontal,
  Plus,
  QrCode,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PermissionToggle from '../components/education/PermissionToggle.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import Tabs from '../components/education/Tabs.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { mediaUrl } from '../utils/api.js'
import { ACCESS_MODULES } from '../utils/access.js'

const tabItems = [
  { value: 'wall', label: 'Mural', icon: MessageCircleMore },
  { value: 'activities', label: 'Atividades', icon: BookOpenCheck },
  { value: 'students', label: 'Alunos', icon: Users },
  { value: 'agenda', label: 'Agenda', icon: CalendarDays },
  { value: 'performance', label: 'Desempenho', icon: Activity },
]

const settingLabels = {
  linkActive: ['Link ativo', 'Permite novas solicitações pelo link da turma.'],
  manualApproval: ['Aprovação manual', 'A professora decide quem entra antes do primeiro acesso.'],
  allowReentry: ['Permitir reativação', 'A professora pode restaurar matrículas removidas.'],
  notifications: ['Notificações', 'Avisar sobre solicitações e novas atividades.'],
  allowComments: ['Comentários no mural', 'Alunos podem comentar as publicações da turma.'],
  allowAttachments: ['Envio de anexos', 'Alunos podem anexar fotos às atividades.'],
}

function formatDateTime(value) {
  if (!value) return 'Ainda não acessou'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StudentAvatar({ student }) {
  const avatar = mediaUrl(student.avatarPath)
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8f3ec] font-bold text-[#0b6847]">
      {avatar
        ? <img src={avatar} alt="" className="h-full w-full object-cover" />
        : student.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
    </span>
  )
}

function MemberStatus({ status }) {
  const labels = {
    active: ['Ativo', 'bg-emerald-50 text-emerald-700'],
    pending: ['Pendente', 'bg-amber-50 text-amber-700'],
    blocked: ['Bloqueado', 'bg-red-50 text-red-700'],
    removed: ['Removido', 'bg-slate-100 text-slate-600'],
    rejected: ['Recusado', 'bg-slate-100 text-slate-600'],
  }
  const [label, style] = labels[status] || labels.pending
  return <span className={`status-pill ${style}`}>{label}</span>
}

export default function TurmaDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, apiRequest } = useAuth()
  const isTeacher = user.role === 'teacher'
  const { feedPosts, addFeedPost, notify, refreshEducation } = useAppData()
  const [detail, setDetail] = useState(null)
  const [tab, setTab] = useState('wall')
  const [studentFilter, setStudentFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [deleteClassOpen, setDeleteClassOpen] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [qrOpen, setQrOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [accessMember, setAccessMember] = useState(null)
  const [accessDraft, setAccessDraft] = useState([])
  const [announcement, setAnnouncement] = useState('')
  const [activityForm, setActivityForm] = useState({ title: '', description: '', dueAt: '' })
  const [eventForm, setEventForm] = useState({ title: '', type: 'class', startsAt: '', location: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDetail(await apiRequest(`/api/education/classes/${id}`))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const classItem = detail?.class
  const visibleTabs = isTeacher
    ? tabItems
    : tabItems.filter((item) => ['wall', 'activities', 'agenda'].includes(item.value))
  const inviteUrl = classItem?.inviteToken
    ? `${window.location.origin}/cadastro?convite=${encodeURIComponent(classItem.inviteToken)}`
    : ''

  const filteredMembers = useMemo(
    () => (detail?.members || []).filter((member) => {
      if (studentFilter === 'all') return true
      if (studentFilter === 'monitor') return member.membershipRole === 'monitor'
      return member.membershipStatus === studentFilter
    }),
    [detail?.members, studentFilter],
  )
  const classPosts = useMemo(
    () => feedPosts.filter((post) => post.classId === id),
    [feedPosts, id],
  )

  async function copyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    notify('Link da turma copiado.')
  }

  async function regenerateInvite() {
    setBusy('invite')
    try {
      const result = await apiRequest(`/api/education/classes/${id}/invite`, { method: 'POST' })
      setDetail((current) => ({
        ...current,
        class: { ...current.class, inviteToken: result.token },
      }))
      await refreshEducation()
      notify('Novo convite gerado. O link anterior foi desativado.')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
    }
  }

  async function showQrCode() {
    if (!inviteUrl) return
    const QRCodeLibrary = await import('qrcode')
    setQrCode(await QRCodeLibrary.toDataURL(inviteUrl, {
      width: 360,
      margin: 2,
      color: { dark: '#073f2b', light: '#ffffff' },
    }))
    setQrOpen(true)
  }

  async function memberAction(member, action, role, modules) {
    setBusy(`${member.id}-${action}`)
    try {
      const next = await apiRequest(`/api/education/classes/${id}/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, role, modules }),
      })
      setDetail(next)
      await refreshEducation()
      const messages = {
        approve: 'Aluno aprovado e acesso liberado.',
        reject: 'Solicitação recusada.',
        block: 'Aluno bloqueado e sessões encerradas.',
        reactivate: 'Acesso do aluno reativado.',
        remove: 'Aluno removido. O histórico foi preservado.',
        role: 'Papel do aluno atualizado.',
        access: 'Partes do sistema atualizadas.',
      }
      notify(messages[action])
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
      setConfirmAction(null)
      if (action === 'access') setAccessMember(null)
    }
  }

  function openMemberAccess(member) {
    setAccessMember(member)
    setAccessDraft(member.accessModules || ['academic'])
  }

  function toggleAccessModule(moduleKey) {
    setAccessDraft((current) => current.includes(moduleKey)
      ? current.filter((item) => item !== moduleKey)
      : [...current, moduleKey])
  }

  async function updateSetting(key, value) {
    const previous = detail
    const settings = { ...classItem.settings, [key]: value }
    setDetail((current) => ({
      ...current,
      class: { ...current.class, settings },
    }))
    setBusy(`setting-${key}`)
    try {
      const next = await apiRequest(`/api/education/classes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: classItem.name,
          description: classItem.description,
          status: classItem.status,
          settings,
        }),
      })
      setDetail(next)
      notify('Configuração atualizada.')
    } catch (requestError) {
      setDetail(previous)
      notify(requestError.message)
    } finally {
      setBusy('')
    }
  }

  async function deleteClass() {
    setBusy('delete-class')
    try {
      const result = await apiRequest(`/api/education/classes/${id}`, { method: 'DELETE' })
      await refreshEducation()
      notify(result.message)
      navigate('/turmas', { replace: true })
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
      setDeleteClassOpen(false)
    }
  }

  async function publishAnnouncement(event) {
    event.preventDefault()
    if (announcement.trim().length < 3) return
    setBusy('announcement')
    try {
      await addFeedPost({
        classId: id,
        activity: isTeacher ? 'Aviso da turma' : 'Registro do aluno',
        related: `${classItem.code} · ${classItem.name}`,
        text: announcement,
        imagePath: '',
      })
      setAnnouncement('')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
    }
  }

  async function createActivity(event) {
    event.preventDefault()
    setBusy('activity')
    try {
      const next = await apiRequest(`/api/education/classes/${id}/activities`, {
        method: 'POST',
        body: JSON.stringify(activityForm),
      })
      setDetail(next)
      setActivityOpen(false)
      setActivityForm({ title: '', description: '', dueAt: '' })
      notify('Atividade publicada para a turma.')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
    }
  }

  async function createEvent(event) {
    event.preventDefault()
    setBusy('event')
    try {
      const next = await apiRequest(`/api/education/classes/${id}/events`, {
        method: 'POST',
        body: JSON.stringify(eventForm),
      })
      setDetail(next)
      setEventOpen(false)
      setEventForm({ title: '', type: 'class', startsAt: '', location: '', notes: '' })
      notify('Evento incluído na agenda.')
    } catch (requestError) {
      notify(requestError.message)
    } finally {
      setBusy('')
    }
  }

  if (loading) return <div className="page-shell"><LoadingState label="Abrindo a turma..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>
  if (!detail) return null

  const pending = detail.members.filter((member) => member.membershipStatus === 'pending').length

  return (
    <div className="page-shell">
      <section className="class-hero">
        <div className="relative z-10">
          <Link to="/turmas" className="text-xs font-bold text-white/70 hover:text-white">
            ← Voltar para turmas
          </Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {classItem.status === 'active' ? 'Turma ativa' : 'Turma inativa'}
                </span>
                <span className="rounded-full border border-[#e6c16c]/50 px-3 py-1 text-[10px] font-bold text-[#f2d58e]">
                  {classItem.code}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
                {classItem.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {classItem.description}
              </p>
              <p className="mt-3 text-xs font-semibold text-white/80">
                {classItem.teacher} · {classItem.studentCount} {classItem.studentCount === 1 ? 'aluno ativo' : 'alunos ativos'}
              </p>
            </div>
            {isTeacher && <div className="grid grid-cols-2 gap-2 sm:flex">
              <button type="button" className="hero-button" onClick={copyInvite}>
                <Copy size={17} />
                Copiar link
              </button>
              <button type="button" className="hero-button" onClick={showQrCode}>
                <QrCode size={17} />
                QR Code
              </button>
              <button type="button" className="hero-button col-span-2" onClick={regenerateInvite} disabled={busy === 'invite'}>
                <RefreshCw size={17} />
                {busy === 'invite' ? 'Gerando...' : 'Novo convite'}
              </button>
              <button type="button" className="hero-button col-span-2 text-red-100" onClick={() => setDeleteClassOpen(true)}>
                <Trash2 size={17} />
                Excluir turma
              </button>
            </div>}
          </div>
        </div>
      </section>

      {isTeacher && pending > 0 && (
        <button
          type="button"
          onClick={() => setTab('students')}
          className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:border-amber-300"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500 text-white">
            <Clock3 size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm text-amber-950">
              {pending} solicitação{pending > 1 ? 'ões' : ''} aguardando aprovação
            </strong>
            <span className="mt-1 block text-xs text-amber-700">
              Revise os dados antes de liberar o primeiro acesso.
            </span>
          </span>
          <UserCheck size={18} className="text-amber-700" />
        </button>
      )}

      <div className="mt-5">
        <Tabs
          items={visibleTabs.map((item) => (
            item.value === 'students' ? { ...item, count: pending } : item
          ))}
          value={tab}
          onChange={setTab}
          label="Áreas da turma"
        />
      </div>

      <div className={`mt-5 grid gap-5 ${isTeacher ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
        <section className="min-w-0">
          {tab === 'wall' && (
            <div className="space-y-4">
              <form onSubmit={publishAnnouncement} className="surface-card p-4 sm:p-5">
                <div className="flex gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0b6847] font-bold text-white">
                    {user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <textarea
                      value={announcement}
                      onChange={(event) => setAnnouncement(event.target.value)}
                      className="field-control min-h-24 py-3"
                      placeholder={isTeacher
                        ? 'Publique um aviso para esta turma...'
                        : 'Compartilhe uma atividade, observação ou evidência...'}
                    />
                    <div className="mt-3 flex justify-end">
                      <button className="primary-button" disabled={busy === 'announcement' || announcement.trim().length < 3}>
                        <MessageCircleMore size={17} />
                        {busy === 'announcement'
                          ? 'Publicando...'
                          : isTeacher
                            ? 'Publicar aviso'
                            : 'Publicar no mural'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              {classPosts.length > 0 ? classPosts.slice(0, 20).map((post) => (
                <article key={post.id} className="surface-card premium-card p-5">
                  <div className="flex items-start gap-3">
                    <StudentAvatar student={{ name: post.author, avatarPath: post.avatarPath }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-sm text-[#073f2b]">{post.author}</strong>
                        <span className="text-[10px] text-slate-400">{formatDateTime(post.date)}</span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[#ad7b22]">{post.activity}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{post.text}</p>
                      {post.image && (
                        <img src={mediaUrl(post.image)} alt="" className="mt-4 aspect-[16/8] w-full rounded-2xl object-cover" />
                      )}
                    </div>
                  </div>
                </article>
              )) : (
                <EmptyState title="Mural sem publicações" description="Publique o primeiro aviso para orientar a turma." />
              )}
            </div>
          )}

          {tab === 'activities' && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Atividades da turma</h2>
                  <p className="mt-1 text-xs text-slate-500">Entregas, prazos e andamento em uma visão.</p>
                </div>
                {isTeacher && <button type="button" className="primary-button" onClick={() => setActivityOpen(true)}>
                  <Plus size={17} />
                  Nova atividade
                </button>}
              </div>
              <div className="grid gap-4">
                {detail.activities.map((activity) => (
                  <article key={activity.id} className="surface-card premium-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#eef6f0] text-[#0b6847]">
                        <Clipboard size={21} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="status-pill bg-emerald-50 text-emerald-700">Publicada</span>
                        <h3 className="mt-2 font-bold text-[#073f2b]">{activity.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">{activity.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#f7f5ef] p-3 text-center sm:min-w-56">
                        <div>
                          <strong className="block text-lg text-[#073f2b]">{activity.submissions}</strong>
                          <span className="text-[10px] text-slate-500">entregas</span>
                        </div>
                        <div>
                          <strong className="block text-xs text-[#073f2b]">{activity.dueAt ? formatDateTime(activity.dueAt) : 'Sem prazo'}</strong>
                          <span className="text-[10px] text-slate-500">prazo</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === 'students' && (
            <div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="section-title">Alunos da turma</h2>
                  <p className="mt-1 text-xs text-slate-500">Ações aparecem conforme o estado de cada matrícula.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {[
                    ['all', 'Todos'],
                    ['active', 'Ativos'],
                    ['pending', 'Pendentes'],
                    ['blocked', 'Bloqueados'],
                    ['monitor', 'Monitores'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStudentFilter(value)}
                      className={`filter-pill ${studentFilter === value ? 'filter-pill-active' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMembers.length > 0 ? (
                <div className="space-y-3">
                  {filteredMembers.map((member) => (
                    <article key={member.id} className="surface-card premium-card p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <StudentAvatar student={member} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-bold text-[#073f2b]">{member.name}</h3>
                              <MemberStatus status={member.membershipStatus} />
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500">{member.email}</p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Último acesso: {formatDateTime(member.lastLoginAt)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                          {member.membershipStatus === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="action-button action-success"
                                onClick={() => memberAction(member, 'approve')}
                                disabled={busy.startsWith(member.id)}
                              >
                                <Check size={16} /> Aprovar
                              </button>
                              <button
                                type="button"
                                className="action-button"
                                onClick={() => setConfirmAction({ member, action: 'reject' })}
                              >
                                <X size={16} /> Recusar
                              </button>
                            </>
                          )}
                          {member.membershipStatus === 'active' && (
                            <>
                              <select
                                value={member.membershipRole}
                                onChange={(event) => memberAction(member, 'role', event.target.value)}
                                className="min-h-10 rounded-xl border border-[#d8d3c7] bg-white px-3 text-xs font-semibold text-slate-600"
                                aria-label={`Papel de ${member.name}`}
                              >
                                <option value="student">Aluno</option>
                                <option value="monitor">Monitor</option>
                              </select>
                              <button
                                type="button"
                                className="action-button"
                                onClick={() => openMemberAccess(member)}
                              >
                                <Settings2 size={16} /> Acessos
                              </button>
                              <button
                                type="button"
                                className="action-button action-warning"
                                onClick={() => setConfirmAction({ member, action: 'block' })}
                              >
                                <Ban size={16} /> Bloquear
                              </button>
                            </>
                          )}
                          {['blocked', 'removed', 'rejected'].includes(member.membershipStatus) && (
                            <button
                              type="button"
                              className="action-button action-success col-span-2"
                              onClick={() => memberAction(member, 'reactivate')}
                              disabled={busy.startsWith(member.id)}
                            >
                              <RefreshCw size={16} /> Reativar
                            </button>
                          )}
                          {!['removed', 'rejected'].includes(member.membershipStatus) && (
                            <button
                              type="button"
                              className="action-button action-danger col-span-2"
                              onClick={() => setConfirmAction({ member, action: 'remove' })}
                            >
                              <Trash2 size={16} /> Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhum aluno neste filtro" description="Altere o filtro ou compartilhe o link da turma." />
              )}
            </div>
          )}

          {tab === 'agenda' && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="section-title">Agenda da turma</h2>
                  <p className="mt-1 text-xs text-slate-500">Aulas, pesagens, partos e avaliações.</p>
                </div>
                {isTeacher && <button type="button" className="primary-button" onClick={() => setEventOpen(true)}>
                  <Plus size={17} />
                  Novo evento
                </button>}
              </div>
              <div className="space-y-3">
                {detail.events.map((event) => (
                  <article key={event.id} className="surface-card premium-card flex gap-4 p-4 sm:p-5">
                    <div className="w-16 shrink-0 rounded-2xl bg-[#073f2b] p-3 text-center text-white">
                      <strong className="block text-xl">{new Date(event.startsAt).getDate()}</strong>
                      <span className="text-[9px] uppercase">{new Date(event.startsAt).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#ad7b22]">{event.type}</span>
                      <h3 className="mt-1 font-bold text-[#073f2b]">{event.title}</h3>
                      <p className="mt-2 text-xs text-slate-500">{formatDateTime(event.startsAt)} · {event.location || 'Local a definir'}</p>
                      {event.notes && <p className="mt-2 text-sm leading-5 text-slate-600">{event.notes}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="grid gap-4 md:grid-cols-2">
              {detail.members.filter((member) => member.membershipStatus === 'active').map((member) => (
                <article key={member.id} className="surface-card premium-card p-5">
                  <div className="flex items-center gap-3">
                    <StudentAvatar student={member} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#073f2b]">{member.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.membershipRole === 'monitor' ? 'Monitor' : 'Aluno'}
                      </p>
                    </div>
                    <strong className="text-xl text-[#0b6847]">{member.progress}%</strong>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0b6847] to-[#d9a441]" style={{ width: `${member.progress}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-[#f7f5ef] p-3">
                      <strong className="block text-sm text-[#073f2b]">{detail.activities.length}</strong>
                      <span className="text-[9px] text-slate-500">atividades</span>
                    </div>
                    <div className="rounded-xl bg-[#f7f5ef] p-3">
                      <strong className="block text-xs text-[#073f2b]">{formatDateTime(member.lastLoginAt)}</strong>
                      <span className="text-[9px] text-slate-500">último acesso</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {isTeacher && <aside className="space-y-4">
          <article className="surface-card overflow-hidden">
            <header className="border-b border-[#e9e4da] bg-[#fbfaf6] p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#073f2b] text-white">
                  <Link2 size={19} />
                </span>
                <div>
                  <h2 className="font-bold text-[#073f2b]">Convite da turma</h2>
                  <p className="mt-1 text-[10px] text-slate-500">Compartilhe somente com seus alunos.</p>
                </div>
              </div>
            </header>
            <div className="p-5">
              <div className="rounded-xl border border-dashed border-[#cfc8b9] bg-[#f8f6f1] p-3">
                <p className="truncate text-xs font-semibold text-slate-600">{inviteUrl}</p>
              </div>
              <button type="button" onClick={copyInvite} className="primary-button mt-3 w-full">
                <Copy size={16} /> Copiar link
              </button>
            </div>
          </article>

          <article className="surface-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <Settings2 size={19} className="text-[#ad7b22]" />
              <div>
                <h2 className="font-bold text-[#073f2b]">Controle da turma</h2>
                <p className="mt-1 text-[10px] text-slate-500">Alterações são salvas automaticamente.</p>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(settingLabels).map(([key, [label, description]]) => (
                <PermissionToggle
                  key={key}
                  label={label}
                  description={description}
                  checked={classItem.settings?.[key] !== false}
                  onChange={(value) => updateSetting(key, value)}
                  disabled={busy === `setting-${key}`}
                />
              ))}
            </div>
          </article>
        </aside>}
      </div>

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR Code da turma" subtitle={classItem.name} size="max-w-md">
        <div className="text-center">
          {qrCode && <img src={qrCode} alt={`QR Code da turma ${classItem.name}`} className="mx-auto w-full max-w-72 rounded-2xl border bg-white p-3" />}
          <p className="mt-4 text-sm leading-6 text-slate-500">O aluno aponta a câmera e solicita entrada na turma.</p>
          <button type="button" className="primary-button mt-5 w-full" onClick={copyInvite}>
            <Copy size={17} /> Copiar link também
          </button>
        </div>
      </Modal>

      <Modal open={activityOpen} onClose={() => setActivityOpen(false)} title="Nova atividade" subtitle={classItem.name}>
        <form onSubmit={createActivity} className="space-y-4">
          <FormInput label="Título" required value={activityForm.title} onChange={(event) => setActivityForm({ ...activityForm, title: event.target.value })} />
          <label>
            <span className="field-label">Orientações</span>
            <textarea className="field-control min-h-28 py-3" value={activityForm.description} onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })} />
          </label>
          <FormInput label="Data de entrega" type="datetime-local" value={activityForm.dueAt} onChange={(event) => setActivityForm({ ...activityForm, dueAt: event.target.value })} />
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setActivityOpen(false)}>Cancelar</button>
            <button className="primary-button" disabled={busy === 'activity'}>{busy === 'activity' ? 'Publicando...' : 'Publicar atividade'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={eventOpen} onClose={() => setEventOpen(false)} title="Novo evento" subtitle={classItem.name}>
        <form onSubmit={createEvent} className="space-y-4">
          <FormInput label="Título" required value={eventForm.title} onChange={(event) => setEventForm({ ...eventForm, title: event.target.value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Tipo"
              value={eventForm.type}
              onChange={(event) => setEventForm({ ...eventForm, type: event.target.value })}
              options={[
                { value: 'class', label: 'Aula prática' },
                { value: 'weighing', label: 'Pesagem' },
                { value: 'birth', label: 'Parto previsto' },
                { value: 'vaccine', label: 'Vacinação' },
                { value: 'evaluation', label: 'Avaliação' },
              ]}
              placeholder=""
            />
            <FormInput label="Data e horário" required type="datetime-local" value={eventForm.startsAt} onChange={(event) => setEventForm({ ...eventForm, startsAt: event.target.value })} />
          </div>
          <FormInput label="Local" value={eventForm.location} onChange={(event) => setEventForm({ ...eventForm, location: event.target.value })} />
          <label>
            <span className="field-label">Observações</span>
            <textarea className="field-control min-h-24 py-3" value={eventForm.notes} onChange={(event) => setEventForm({ ...eventForm, notes: event.target.value })} />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setEventOpen(false)}>Cancelar</button>
            <button className="primary-button" disabled={busy === 'event'}>{busy === 'event' ? 'Salvando...' : 'Adicionar à agenda'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(accessMember)}
        onClose={() => setAccessMember(null)}
        title={`Partes liberadas para ${accessMember?.name || ''}`}
        subtitle="A alteração vale para esta matrícula e preserva os outros vínculos da pessoa"
        size="max-w-2xl"
      >
        {accessMember && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              memberAction(
                accessMember,
                'access',
                accessMember.membershipRole,
                accessDraft,
              )
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCESS_MODULES.map((item) => (
                <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e3ded3] bg-white p-3">
                  <input
                    type="checkbox"
                    checked={accessDraft.includes(item.key)}
                    onChange={() => toggleAccessModule(item.key)}
                    className="h-5 w-5 accent-[#0b6847]"
                  />
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions mt-5">
              <button type="button" className="secondary-button" onClick={() => setAccessMember(null)}>Cancelar</button>
              <button className="primary-button" disabled={!accessDraft.length || busy !== ''}>Salvar acessos</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === 'remove' ? 'Remover aluno?' : confirmAction?.action === 'block' ? 'Bloquear aluno?' : 'Recusar solicitação?'}
        subtitle="Esta ação ficará registrada no histórico"
        size="max-w-lg"
      >
        {confirmAction && (
          <div>
            <div className="rounded-2xl bg-[#f7f5ef] p-4">
              <strong className="text-sm text-[#073f2b]">{confirmAction.member.name}</strong>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {confirmAction.action === 'remove'
                  ? 'O acesso será removido e o histórico acadêmico permanecerá preservado.'
                  : confirmAction.action === 'block'
                    ? 'A sessão será encerrada imediatamente. Você poderá reativar o acesso depois.'
                    : 'A solicitação será recusada e o aluno não conseguirá entrar nesta turma.'}
              </p>
            </div>
            <div className="modal-actions mt-5">
              <button type="button" className="secondary-button" onClick={() => setConfirmAction(null)}>Cancelar</button>
              <button
                type="button"
                className="danger-button"
                onClick={() => memberAction(confirmAction.member, confirmAction.action)}
                disabled={busy.startsWith(confirmAction.member.id)}
              >
                {confirmAction.action === 'remove' ? <UserX size={17} /> : confirmAction.action === 'block' ? <Ban size={17} /> : <X size={17} />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={deleteClassOpen}
        onClose={() => setDeleteClassOpen(false)}
        title="Excluir turma?"
        subtitle="Esta ação remove convites, matrículas, atividades e eventos vinculados"
        size="max-w-lg"
      >
        <div>
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
            A turma <strong>{classItem.name}</strong> será excluída definitivamente. As contas dos alunos continuam preservadas.
          </p>
          <div className="modal-actions mt-5">
            <button type="button" className="secondary-button" onClick={() => setDeleteClassOpen(false)}>Cancelar</button>
            <button type="button" className="danger-button" onClick={deleteClass} disabled={busy === 'delete-class'}>
              <Trash2 size={17} />
              {busy === 'delete-class' ? 'Excluindo...' : 'Excluir turma'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
