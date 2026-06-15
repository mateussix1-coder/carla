import {
  ArrowRight,
  GraduationCap,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { firstAllowedPath } from '../utils/access.js'

export default function Entrar() {
  const {
    login,
    quickTeacherLoginAvailable,
    systemError,
  } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const destination = location.state?.from || '/'

  async function signIn(credentials) {
    setBusy(true)
    setError('')
    try {
      const user = await login(credentials)
      const teacherDestination = destination === '/aluno' ? '/' : destination
      navigate(user.role === 'teacher' ? teacherDestination : firstAllowedPath(user), { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  function submit(event) {
    event.preventDefault()
    signIn(form)
  }

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[#f3d994] backdrop-blur">
            <ShieldCheck size={16} />
            Dados protegidos e sincronizados
          </span>
          <div className="mt-8 flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[#d7b56a]/60 bg-white/10 text-[#edcb7c]">
              <PiggyBank size={30} strokeWidth={1.6} />
            </span>
            <div>
              <strong className="display-serif text-4xl font-normal">Ciclo 114</strong>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-white/55">
                Gestão zootécnica
              </span>
            </div>
          </div>
          <h1 className="mt-10 max-w-lg text-4xl font-bold leading-tight sm:text-5xl">
            Matrizes, partos e leitões sob controle.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/68 sm:text-base">
            Acompanhe coberturas, os 114 dias de gestação, nascimentos e cuidados
            dos leitões. Cada registro fica vinculado ao responsável e salvo no histórico.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/7 p-4">
              <UserRoundCheck size={20} className="text-[#edcb7c]" />
              <strong className="mt-3 block text-sm">Portal da professora</strong>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Controle completo do plantel e dos partos.
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/7 p-4">
              <GraduationCap size={20} className="text-[#edcb7c]" />
              <strong className="mt-3 block text-sm">Portal do aluno</strong>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Evidências e participação no manejo autorizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ad7b22]">
            Acesso seguro
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#073b28]">
            Entre no Ciclo 114
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sua sessão fica salva neste aparelho por 30 dias.
          </p>

          {quickTeacherLoginAvailable && (
            <button
              type="button"
              disabled={busy}
              onClick={() => signIn({ quickTeacher: true })}
              className="premium-tilt mt-7 flex w-full items-center gap-4 rounded-[22px] border border-[#c7ae70] bg-[linear-gradient(145deg,#fffaf0,#f6ebd2)] p-5 text-left shadow-[0_18px_40px_rgba(95,69,22,0.12)]"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#0b5136] font-bold text-white">
                PC
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-base text-[#073b28]">
                  Entrar como Carla
                </strong>
                <small className="mt-1 block text-xs leading-5 text-slate-500">
                  Primeiro acesso. Depois, proteja o perfil com uma senha.
                </small>
              </span>
              <ArrowRight size={19} className="text-[#ad7b22]" />
            </button>
          )}

          <div className="my-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="h-px flex-1 bg-[#ddd7cb]" />
            {quickTeacherLoginAvailable ? 'ou use sua conta' : 'use sua conta'}
            <span className="h-px flex-1 bg-[#ddd7cb]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label>
              <span className="field-label">E-mail</span>
              <input
                type="email"
                autoComplete="email"
                required
                className="field-control"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="voce@escola.com"
              />
            </label>
            <label>
              <span className="field-label">Senha</span>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  className="field-control pl-10"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Sua senha"
                />
              </div>
            </label>

            {(error || systemError) && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {error || systemError}
              </p>
            )}

            <button disabled={busy} className="primary-button w-full">
              {busy ? 'Entrando...' : 'Entrar'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <div className="mt-7 rounded-2xl border border-[#dfd9cc] bg-white/70 p-4 text-center">
            <p className="text-sm font-semibold text-[#073b28]">É aluno e ainda não tem conta?</p>
            <Link to="/cadastro" className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#ad7b22]">
              Criar meu acesso
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
