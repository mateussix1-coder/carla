import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const initialForm = {
  name: '',
  email: '',
  className: '',
  password: '',
  confirmPassword: '',
}

export default function Cadastro() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inviteToken = searchParams.get('convite') || ''
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [invitedClass, setInvitedClass] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken))
  const [pendingApproval, setPendingApproval] = useState(false)

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/education/invite/${encodeURIComponent(inviteToken)}`)
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        setInvitedClass(result.class)
        setForm((current) => ({ ...current, className: result.class.name }))
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setInviteLoading(false))
  }, [inviteToken])

  async function submit(event) {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const result = await register({ ...form, inviteToken })
      if (result.pendingApproval) {
        setPendingApproval(true)
      } else {
        navigate('/aluno', { replace: true })
      }
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(214,181,103,0.18),transparent_28rem),linear-gradient(180deg,#f8f5ee,#efebe1)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link to="/entrar" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b5136]">
          <ArrowLeft size={17} />
          Voltar para entrar
        </Link>

        <section className="surface-card mt-6 overflow-hidden">
          <header className="bg-[linear-gradient(135deg,#073b28,#0b5136)] px-6 py-7 text-white sm:px-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#edcb7c]">
              {pendingApproval ? <CheckCircle2 size={25} /> : <GraduationCap size={25} />}
            </span>
            <h1 className="mt-5 text-3xl font-bold">
              {pendingApproval ? 'Solicitação enviada' : 'Criar acesso de aluno'}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
              {pendingApproval
                ? 'A professora recebeu seus dados e precisa aprovar o primeiro acesso.'
                : invitedClass
                  ? `Você está solicitando entrada em ${invitedClass.name}.`
                  : 'Use seus dados reais. Suas publicações e atividades ficarão vinculadas ao seu perfil acadêmico.'}
            </p>
          </header>

          {pendingApproval ? (
            <div className="p-6 text-center sm:p-8">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={30} />
              </span>
              <h2 className="mt-5 text-xl font-bold text-[#073f2b]">Agora é com a professora</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Assim que a entrada for aprovada, use este e-mail e senha na tela de login.
              </p>
              <Link to="/entrar" className="primary-button mt-6 w-full">
                Voltar para o login
                <ArrowRight size={17} />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4 p-6 sm:p-8">
              {invitedClass && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Convite válido</span>
                  <strong className="mt-1 block text-sm text-[#073f2b]">{invitedClass.name}</strong>
                  <span className="mt-1 block text-xs text-slate-500">{invitedClass.code}</span>
                </div>
              )}

              <label>
                <span className="field-label">Nome completo</span>
                <input required autoComplete="name" className="field-control" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </label>
              <label>
                <span className="field-label">E-mail</span>
                <input required type="email" autoComplete="email" className="field-control" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                <span className="field-label">Turma ou curso</span>
                <input
                  required
                  className="field-control"
                  value={form.className}
                  onChange={(event) => setForm({ ...form, className: event.target.value })}
                  placeholder="Ex.: Zootecnia A"
                  disabled={Boolean(invitedClass)}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="field-label">Senha</span>
                  <input required minLength="8" type="password" autoComplete="new-password" className="field-control" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </label>
                <label>
                  <span className="field-label">Confirmar senha</span>
                  <input required minLength="8" type="password" autoComplete="new-password" className="field-control" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                </label>
              </div>

              <div className="rounded-2xl bg-[#eef6f0] p-4">
                {[
                  'A professora acompanha sua participação',
                  'Seus indicadores são privados',
                  invitedClass ? 'O acesso só será liberado após aprovação' : 'Sua sessão fica salva neste aparelho',
                ].map((item) => (
                  <p key={item} className="flex items-center gap-2 py-1 text-xs text-[#335b47]">
                    <CheckCircle2 size={15} className="text-[#1b6a41]" />
                    {item}
                  </p>
                ))}
              </div>

              {error && <p className="feedback-error">{error}</p>}

              <button
                disabled={busy || inviteLoading || (Boolean(inviteToken) && !invitedClass)}
                className="primary-button w-full"
              >
                {busy
                  ? 'Enviando solicitação...'
                  : invitedClass
                    ? 'Solicitar entrada na turma'
                    : 'Criar minha conta'}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
