import { Camera, KeyRound, Save, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { uploadImageFile } from '../utils/imageUtils.js'
import { mediaUrl } from '../utils/api.js'

export default function Perfil() {
  const { user, updateProfile, apiRequest } = useAuth()
  const [form, setForm] = useState({
    name: '',
    className: '',
    responsibility: '',
    notes: '',
    avatarPath: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user?.name || '',
      className: user?.className || '',
      responsibility: user?.responsibility || '',
      notes: user?.notes || '',
      avatarPath: user?.avatarPath || '',
    }))
  }, [user])

  async function chooseAvatar(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const upload = await uploadImageFile(file, 'avatars', apiRequest)
      setForm((current) => ({ ...current, avatarPath: upload.path }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  async function submit(event) {
    event.preventDefault()
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError('A confirmação da nova senha não coincide.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')
    try {
      await updateProfile(form)
      setForm((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      setMessage('Perfil atualizado e sincronizado.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const avatar = mediaUrl(form.avatarPath)

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Conta pessoal"
        title="Meu perfil"
        description="Foto, identificação e segurança vinculadas ao seu acesso."
      />

      <form onSubmit={submit} className="grid items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="surface-card premium-tilt p-6 text-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={chooseAvatar}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative mx-auto block h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-[#e7f3ec] shadow-xl"
          >
            {avatar ? (
              <img src={avatar} alt={`Foto de ${form.name}`} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-[#0b5136]">
                <UserRound size={54} strokeWidth={1.4} />
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-2 text-[10px] font-bold text-white backdrop-blur">
              <Camera size={13} />
              Alterar foto
            </span>
          </button>
          <h2 className="mt-5 text-xl font-bold text-[#073b28]">{form.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
          <span className="mt-4 inline-flex rounded-full bg-[#eef6f0] px-3 py-1 text-xs font-bold text-[#1b6a41]">
            {user?.role === 'teacher' ? 'Professora' : 'Aluno'}
          </span>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#f7f5ef] p-4 text-left">
            <ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#1b6a41]" />
            <p className="text-xs leading-5 text-slate-500">
              Fotos são guardadas em armazenamento privado e só aparecem para
              usuários autenticados.
            </p>
          </div>
        </aside>

        <section className="surface-card p-5 sm:p-7">
          <h2 className="section-title">Dados do perfil</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Nome</span>
              <input
                required
                className="field-control"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label>
              <span className="field-label">{user?.role === 'teacher' ? 'Instituição' : 'Turma'}</span>
              <input
                className="field-control"
                value={form.className}
                onChange={(event) => setForm({ ...form, className: event.target.value })}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Responsabilidade</span>
              <input
                className="field-control"
                value={form.responsibility}
                onChange={(event) => setForm({ ...form, responsibility: event.target.value })}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="field-label">Apresentação</span>
              <textarea
                className="field-control min-h-24 py-3"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </label>
          </div>

          <div className="my-7 h-px bg-[#e5e0d6]" />

          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff4df] text-[#ad7b22]">
              <KeyRound size={19} />
            </span>
            <div>
              <h2 className="section-title">Segurança</h2>
              <p className="text-xs text-slate-500">
                {user?.setupComplete
                  ? 'Preencha apenas quando quiser trocar a senha.'
                  : 'Crie uma senha agora para proteger o acesso da Carla.'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {user?.setupComplete && (
              <label>
                <span className="field-label">Senha atual</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className="field-control"
                  value={form.currentPassword}
                  onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
                />
              </label>
            )}
            <label>
              <span className="field-label">Nova senha</span>
              <input
                type="password"
                minLength="8"
                autoComplete="new-password"
                className="field-control"
                value={form.newPassword}
                onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
              />
            </label>
            <label>
              <span className="field-label">Confirmar nova senha</span>
              <input
                type="password"
                minLength="8"
                autoComplete="new-password"
                className="field-control"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
              />
            </label>
          </div>

          {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}
          {message && <p className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">{message}</p>}

          <div className="mt-6 flex justify-end">
            <button disabled={busy} className="primary-button">
              <Save size={17} />
              {busy ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </section>
      </form>
    </div>
  )
}
