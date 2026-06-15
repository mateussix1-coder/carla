import {
  Baby,
  BarChart3,
  Bell,
  BookOpenCheck,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  Database,
  GraduationCap,
  HeartPulse,
  Home,
  LogOut,
  Menu,
  MessageCircleMore,
  PiggyBank,
  Settings2,
  ShieldCheck,
  ShieldPlus,
  Stethoscope,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { mediaUrl } from '../utils/api.js'
import { hasModuleAccess } from '../utils/access.js'

const teacherGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/', label: 'Início', icon: Home },
      { to: '/matrizes', label: 'Matrizes', icon: PiggyBank },
      { to: '/gestacao', label: 'Gestação', icon: HeartPulse },
      { to: '/partos', label: 'Partos', icon: Stethoscope },
      { to: '/leitoes', label: 'Leitões', icon: Baby },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/varroes', label: 'Varrões', icon: Users },
      { to: '/coberturas', label: 'Coberturas', icon: ClipboardPlus },
      { to: '/sanitario', label: 'Sanitário', icon: ShieldPlus },
    ],
  },
  {
    label: 'Escola',
    items: [
      { to: '/turmas', label: 'Turmas e acessos', icon: GraduationCap },
      { to: '/alunos', label: 'Alunos', icon: Users },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { to: '/permissoes', label: 'Permissões', icon: ShieldCheck },
      { to: '/configuracoes', label: 'Configurações', icon: Settings2 },
      { to: '/perfil', label: 'Meu perfil', icon: UserRound },
      { to: '/dados-demonstracao', label: 'Dados e backup', icon: Database },
    ],
  },
]

function studentGroups(user) {
  const groups = []
  if (hasModuleAccess(user, 'academic')) {
    groups.push({
      label: user.membershipRole === 'monitor' ? 'Portal do monitor' : 'Portal do aluno',
      items: [
        { to: '/aluno', label: 'Início', icon: Home },
        { to: '/turmas', label: 'Minhas turmas', icon: GraduationCap },
        { to: '/atividades', label: 'Atividades', icon: BookOpenCheck },
        { to: '/agenda', label: 'Agenda', icon: CalendarDays },
        { to: '/rede', label: 'Mural', icon: MessageCircleMore },
      ],
    })
  }

  const managementItems = [
    ['matrizes', '/matrizes', 'Matrizes', PiggyBank],
    ['gestacao', '/gestacao', 'Gestação', HeartPulse],
    ['partos', '/partos', 'Partos', Stethoscope],
    ['leitoes', '/leitoes', 'Leitões', Baby],
    ['varroes', '/varroes', 'Varrões', Users],
    ['coberturas', '/coberturas', 'Coberturas', ClipboardPlus],
    ['sanitario', '/sanitario', 'Sanitário', ShieldPlus],
    ['relatorios', '/relatorios', 'Relatórios', BarChart3],
  ]
    .filter(([moduleKey]) => hasModuleAccess(user, moduleKey))
    .map(([, to, label, icon]) => ({ to, label, icon }))

  if (managementItems.length) {
    groups.push({ label: 'Manejo autorizado', items: managementItems })
  }
  groups.push({
    label: 'Conta',
    items: [{ to: '/perfil', label: 'Meu perfil', icon: UserRound }],
  })
  return groups
}

const pageTitles = {
  '/': 'Visão geral',
  '/aluno': 'Portal do aluno',
  '/turmas': 'Turmas',
  '/alunos': 'Alunos',
  '/atividades': 'Atividades',
  '/agenda': 'Agenda',
  '/rede': 'Mural',
  '/matrizes': 'Matrizes',
  '/gestacao': 'Gestação',
  '/partos': 'Partos',
  '/leitoes': 'Leitões',
  '/varroes': 'Varrões',
  '/coberturas': 'Coberturas',
  '/sanitario': 'Sanitário',
  '/relatorios': 'Relatórios',
  '/permissoes': 'Permissões',
  '/configuracoes': 'Configurações',
  '/perfil': 'Meu perfil',
  '/dados': 'Dados e backup',
  '/dados-demonstracao': 'Dados e backup',
}

function UserAvatar({ user, size = 'h-10 w-10' }) {
  const avatar = mediaUrl(user.avatarPath)
  return (
    <span className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full border border-[#d0a44c] bg-white/10 text-[10px] font-bold`}>
      {avatar ? (
        <img src={avatar} alt={`Foto de ${user.name}`} className="h-full w-full object-cover" />
      ) : (
        user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')
      )}
    </span>
  )
}

function DesktopSidebar({ groups }) {
  const { user, logout } = useAuth()
  const { syncStatus, educationTotals, settings } = useAppData()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[276px] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#063b28_0%,#075036_56%,#063b28_100%)] text-white shadow-[12px_0_40px_rgba(6,59,40,0.12)] lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d7b56a]/60 bg-white/5 text-[#edcb7c]">
          <PiggyBank size={24} strokeWidth={1.7} />
        </span>
        <div>
          <strong className="display-serif block text-2xl font-normal leading-none">{settings.systemName}</strong>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Gestão zootécnica
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-[#d7bc78]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => {
                const cleanTo = to.split('?')[0]
                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={cleanTo === '/' || cleanTo === '/aluno'}
                    className={({ isActive }) =>
                      `group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition ${
                        isActive
                          ? 'bg-white/12 font-semibold text-white shadow-sm'
                          : 'text-white/65 hover:bg-white/7 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#edcb7c]" />}
                        <Icon size={17} strokeWidth={isActive ? 2.1 : 1.7} />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                        {label === 'Turmas' && educationTotals.pending > 0 && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-[#4f3706]">
                            {educationTotals.pending}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-4 rounded-2xl border border-white/15 bg-black/10 p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-sm">{user.name}</strong>
            <span className="mt-0.5 block truncate text-[10px] text-white/50">
              {user.role === 'teacher'
                ? 'Professora responsável'
                : user.membershipRole === 'monitor'
                  ? `Monitor · ${user.className}`
                  : user.className}
            </span>
          </div>
        </div>
        {user.role === 'teacher' && (
          <p className="mt-4 flex items-center gap-2 text-[10px] text-white/55">
            <ShieldCheck size={14} className="text-[#edcb7c]" />
            {syncStatus === 'saving'
              ? 'Salvando alterações...'
              : syncStatus === 'error'
                ? 'Falha de sincronização'
                : 'Dados sincronizados'}
          </p>
        )}
        <button onClick={logout} className="mt-3 flex min-h-9 items-center gap-2 text-xs font-semibold text-white/70 transition hover:text-white">
          <LogOut size={14} />
          Sair deste aparelho
        </button>
      </div>
    </aside>
  )
}

function DesktopHeader() {
  const { user } = useAuth()
  const { educationTotals, settings } = useAppData()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/turmas/') ? '/turmas' : location.pathname

  return (
    <header className="sticky top-0 z-30 hidden h-[72px] items-center justify-between border-b border-[#e2ddd2] bg-[#f7f4ed]/90 px-8 backdrop-blur-xl lg:flex">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ad7b22]">{settings.systemName}</p>
        <strong className="mt-1 block text-sm text-[#073f2b]">{pageTitles[basePath] || 'Gestão acadêmica'}</strong>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#ddd7cb] bg-white text-slate-500 transition hover:border-[#aebfb3] hover:text-[#073f2b]" aria-label="Notificações">
          <Bell size={18} />
          {educationTotals.pending > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />}
        </button>
        <div className="flex items-center gap-3 rounded-xl border border-[#ddd7cb] bg-white py-1.5 pl-2 pr-3">
          <UserAvatar user={user} size="h-8 w-8" />
          <div>
            <strong className="block text-xs text-[#073f2b]">{user.name}</strong>
            <span className="block text-[9px] text-slate-400">
              {user.role === 'teacher' ? 'Professora' : user.membershipRole === 'monitor' ? 'Monitor' : 'Aluno'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileHeader() {
  const { user } = useAuth()
  const { educationTotals, settings } = useAppData()
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,#063b28,#0b5136)] px-4 text-white shadow-md lg:hidden">
      <div className="flex items-center gap-2.5">
        <PiggyBank size={22} strokeWidth={1.7} className="text-[#e2c170]" />
        <div>
          <strong className="display-serif block text-lg font-normal leading-none">{settings.systemName}</strong>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/55">
            {user.role === 'teacher'
              ? 'Gestão zootécnica'
              : user.membershipRole === 'monitor'
                ? 'Portal do monitor'
                : 'Portal do aluno'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="relative">
          <Bell size={19} strokeWidth={1.7} />
          {educationTotals.pending > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-[#0b5136]" />}
        </span>
        <UserAvatar user={user} size="h-9 w-9" />
      </div>
    </header>
  )
}

function MobileBottomNav({ teacher, groups, onMore }) {
  const main = teacher
    ? [
        { to: '/', label: 'Início', icon: Home },
        { to: '/matrizes', label: 'Matrizes', icon: PiggyBank },
        { to: '/gestacao', label: 'Gestação', icon: HeartPulse },
        { to: '/partos', label: 'Partos', icon: Stethoscope },
      ]
    : groups
        .flatMap((group) => group.items)
        .filter((item) => item.to !== '/perfil')
        .slice(0, 4)
  const location = useLocation()
  const mainActive = main.some((item) => (
    item.to === '/' || item.to === '/aluno'
      ? location.pathname === item.to
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
  ))

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 w-full border-t border-[#e1ddd4] bg-white/96 px-1 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-10px_30px_rgba(23,35,28,0.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {main.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/aluno'}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className={`mobile-nav-icon ${isActive ? 'bg-[#0b5136] text-white shadow-md shadow-emerald-900/20' : ''}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={onMore} className={`mobile-nav-item ${!mainActive ? 'mobile-nav-active' : ''}`}>
          <span className={`mobile-nav-icon ${!mainActive ? 'bg-[#0b5136] text-white shadow-md shadow-emerald-900/20' : ''}`}>
            <Menu size={19} />
          </span>
          Mais
        </button>
      </div>
    </nav>
  )
}

function MoreMenu({ open, groups, onClose, teacher }) {
  const { logout } = useAuth()
  if (!open) return null
  const items = groups
    .flatMap((group) => group.items)
    .filter((item) => !teacher || !['/', '/matrizes', '/gestacao', '/partos'].includes(item.to))

  async function handleLogout() {
    onClose()
    await logout()
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#082f1f]/50 lg:hidden">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fechar menu" />
      <section className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-y-auto rounded-t-[28px] bg-[#fbfaf6] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ad7b22]">Navegação</p>
            <h2 className="mt-1 text-xl font-bold text-[#082f1f]">Todos os módulos</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl border border-[#d8d3c7] bg-white" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className="flex min-h-16 items-center justify-between rounded-2xl border border-[#e3ded3] bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm transition active:scale-[0.98]">
              <span className="flex min-w-0 items-center gap-3">
                <Icon size={19} className="shrink-0 text-[#0b3b27]" />
                <span className="truncate">{label}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-slate-300" />
            </NavLink>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-sm font-bold text-red-700 transition active:scale-[0.98]"
        >
          <LogOut size={17} />
          Sair deste aparelho
        </button>
      </section>
    </div>
  )
}

export default function AppLayout() {
  const { user, apiRequest } = useAuth()
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const teacher = user.role === 'teacher'
  const groups = useMemo(
    () => (teacher ? teacherGroups : studentGroups(user)),
    [teacher, user.accessModules, user.membershipRole],
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      apiRequest('/api/analytics/track', {
        method: 'POST',
        body: JSON.stringify({ route: location.pathname }),
      }).catch(() => {})
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [location.pathname])

  return (
    <div className="min-h-screen max-w-full overflow-x-clip">
      <DesktopSidebar groups={groups} />
      <div className="lg:pl-[276px]">
        <MobileHeader />
        <DesktopHeader />
        <main>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav teacher={teacher} groups={groups} onMore={() => setMoreOpen(true)} />
      <MoreMenu open={moreOpen} groups={groups} teacher={teacher} onClose={() => setMoreOpen(false)} />
    </div>
  )
}
