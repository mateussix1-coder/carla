import {
  ArrowRight,
  Camera,
  CheckCircle2,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { mediaUrl } from '../utils/api.js'

export default function AlunoDashboard() {
  const { user } = useAuth()
  const { feedPosts } = useAppData()
  const ownPosts = feedPosts.filter((post) => post.authorId === user.id)
  const recognition = ownPosts.reduce((sum, post) => sum + post.likes.length, 0)
  const avatar = mediaUrl(user.avatarPath)

  return (
    <div className="page-shell">
      <header className="student-welcome premium-tilt overflow-hidden rounded-[26px] p-6 text-white sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10 text-white">
            {avatar ? (
              <img src={avatar} alt={`Foto de ${user.name}`} className="h-full w-full object-cover" />
            ) : (
              <UserRound size={35} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#edcb7c]">
              Portal do aluno
            </p>
            <h1 className="mt-2 text-3xl font-bold">Olá, {user.name.split(' ')[0]}</h1>
            <p className="mt-2 text-sm text-white/65">
              {user.className || 'Turma prática'} · registre suas atividades com clareza.
            </p>
          </div>
          <Link to="/rede" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#0b5136]">
            <Camera size={17} />
            Publicar atividade
          </Link>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Publicações', ownPosts.length, MessageCircleMore],
          ['Reconhecimentos', recognition, Sparkles],
          ['Perfil', user.setupComplete ? 'Completo' : 'Pendente', UserRound],
          ['Privacidade', 'Protegida', ShieldCheck],
        ].map(([label, value, Icon]) => (
          <article key={label} className="surface-card premium-tilt p-4 sm:p-5">
            <Icon size={19} className="text-[#ad7b22]" />
            <strong className="mt-4 block text-xl text-[#073b28]">{value}</strong>
            <span className="mt-1 block text-xs text-slate-500">{label}</span>
          </article>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <article className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e9e4d9] px-5 py-4">
            <div>
              <h2 className="section-title">Minhas publicações</h2>
              <p className="mt-1 text-xs text-slate-500">Evidências vinculadas ao seu perfil</p>
            </div>
            <Link to="/rede" className="text-xs font-bold text-[#0b5136]">Ver mural</Link>
          </div>
          {ownPosts.length ? (
            <div className="divide-y divide-[#eee9df]">
              {ownPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center gap-4 p-4 sm:px-5">
                  <img
                    src={mediaUrl(post.image) || '/images/aula-manejo.jpg'}
                    alt=""
                    className="h-16 w-20 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-sm text-[#073b28]">{post.activity}</strong>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{post.text}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-7 text-center">
              <Camera className="mx-auto text-[#ad7b22]" size={27} />
              <p className="mt-3 text-sm font-semibold text-[#073b28]">Nenhuma atividade publicada</p>
              <p className="mt-1 text-xs text-slate-500">Use o mural para registrar sua primeira evidência.</p>
            </div>
          )}
        </article>

        <article className="surface-card p-5 sm:p-6">
          <h2 className="section-title">Como registrar bem</h2>
          <div className="mt-5 space-y-4">
            {[
              'Fotografe a atividade ou o resultado do manejo.',
              'Descreva o que foi observado e o que foi feito.',
              'Vincule a matriz ou lote correto.',
              'Confira os dados antes de publicar.',
            ].map((item, index) => (
              <div key={item} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e7f3ec] text-xs font-bold text-[#0b5136]">
                  {index + 1}
                </span>
                <p className="pt-1 text-xs leading-5 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff7e7] p-4">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#ad7b22]" />
            <p className="text-xs leading-5 text-[#75551d]">
              Seus indicadores individuais são privados e visíveis apenas para a professora.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
