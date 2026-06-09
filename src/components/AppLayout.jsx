import {
  Baby,
  BarChart3,
  BookOpenCheck,
  ChevronRight,
  ClipboardPlus,
  GraduationCap,
  HeartPulse,
  Home,
  Menu,
  Bell,
  PiggyBank,
  RotateCcw,
  ShieldPlus,
  Stethoscope,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext.jsx'

const primaryMobile = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/matrizes', label: 'Matrizes', icon: PiggyBank },
  { to: '/gestacao', label: 'Gestação', icon: HeartPulse },
  { to: '/partos', label: 'Partos', icon: Stethoscope },
  { to: '/leitoes', label: 'Leitões', icon: Baby },
]

const allNavigation = [
  ...primaryMobile,
  { to: '/varroes', label: 'Varrões', icon: Users },
  { to: '/coberturas', label: 'Coberturas', icon: ClipboardPlus },
  { to: '/sanitario', label: 'Sanitário', icon: ShieldPlus },
  { to: '/alunos', label: 'Alunos e turmas', icon: GraduationCap },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
]

function DesktopSidebar() {
  const { resetData } = useAppData()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[#244d38] bg-[#082f1f] text-white lg:flex">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
        <span className="grid h-11 w-11 place-items-center border border-[#d0a44c] text-[#e2c170]">
          <PiggyBank size={24} strokeWidth={1.7} />
        </span>
        <div>
          <strong className="display-serif block text-2xl font-normal leading-none">Ciclo 114</strong>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Gestão zootécnica
          </span>
        </div>
      </div>

      <div className="px-5 pb-3 pt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d7bc78]">
        Módulos do sistema
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {allNavigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm transition ${
                isActive
                  ? 'border-[#d0a44c] bg-white/10 font-semibold text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.7} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="m-4 border border-white/12 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#d7bc78]">
          <BookOpenCheck size={16} />
          Modo demonstração
        </div>
        <p className="mt-2 text-xs leading-5 text-white/55">
          Os dados ficam salvos apenas neste dispositivo.
        </p>
        <button
          onClick={resetData}
          className="mt-3 flex items-center gap-2 text-xs font-semibold text-white hover:text-[#e2c170]"
        >
          <RotateCcw size={14} />
          Restaurar exemplos
        </button>
      </div>
    </aside>
  )
}

function MobileBottomNav({ onMore }) {
  const location = useLocation()
  const extraActive = allNavigation
    .slice(primaryMobile.length)
    .some((item) => location.pathname.startsWith(item.to))

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 w-full border-t border-[#d8d3c7] bg-[#fbfaf6] px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5 lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-6">
        {primaryMobile.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition ${
                isActive ? 'text-[#0b3b27]' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`border p-1.5 ${isActive ? 'border-[#d0a44c] bg-[#f5ecd8] text-[#0b3b27]' : 'border-transparent'}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={onMore}
          className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
            extraActive ? 'text-[#0b3b27]' : 'text-slate-400'
          }`}
        >
          <span className={`border p-1.5 ${extraActive ? 'border-[#d0a44c] bg-[#f5ecd8] text-[#0b3b27]' : 'border-transparent'}`}>
            <Menu size={19} />
          </span>
          Mais
        </button>
      </div>
    </nav>
  )
}

function MoreMenu({ open, onClose }) {
  const { resetData } = useAppData()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-[#082f1f]/50 lg:hidden">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fechar menu" />
      <section className="absolute inset-x-0 bottom-0 rounded-t-xl bg-[#fbfaf6] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ad7b22]">Navegação</p>
            <h2 className="mt-1 text-xl font-bold text-[#082f1f]">Mais módulos</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center border border-[#d8d3c7] bg-white"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {allNavigation.slice(primaryMobile.length).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className="flex min-h-16 items-center justify-between border border-[#d8d3c7] bg-white p-4 text-sm font-semibold text-slate-700"
            >
              <span className="flex items-center gap-3">
                <Icon size={19} className="text-[#0b3b27]" />
                {label}
              </span>
              <ChevronRight size={16} className="text-slate-300" />
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => {
            resetData()
            onClose()
          }}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 border border-[#d8d3c7] bg-white text-sm font-semibold text-slate-600"
        >
          <RotateCcw size={17} />
          Restaurar dados de demonstração
        </button>
      </section>
    </div>
  )
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0b3b27] px-4 text-white lg:hidden">
      <div className="flex items-center gap-2.5">
        <PiggyBank size={22} strokeWidth={1.7} className="text-[#e2c170]" />
        <div>
          <strong className="display-serif block text-lg font-normal leading-none">Ciclo 114</strong>
          <span className="text-[8px] uppercase tracking-[0.18em] text-white/55">Gestão zootécnica</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Bell size={19} strokeWidth={1.7} />
        <span className="grid h-8 w-8 place-items-center rounded-full border border-[#d0a44c] bg-white/10 text-[10px] font-bold">
          PC
        </span>
      </div>
    </header>
  )
}

export default function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="min-h-screen max-w-full overflow-x-clip">
      <DesktopSidebar />
      <div className="lg:pl-60">
        <MobileHeader />
      </div>
      <main className="lg:pl-60">
        <Outlet />
      </main>
      <MobileBottomNav onMore={() => setMoreOpen(true)} />
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  )
}
