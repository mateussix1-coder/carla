import {
  Camera,
  CheckCircle2,
  Heart,
  ImagePlus,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { mediaUrl } from '../utils/api.js'
import { uploadImageFile } from '../utils/imageUtils.js'

const emptyForm = {
  activity: '',
  related: '',
  text: '',
  imagePath: '',
}

function formatPostDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Avatar({ name, path, className = 'h-11 w-11' }) {
  const source = mediaUrl(path)
  return (
    <span className={`grid ${className} shrink-0 place-items-center overflow-hidden rounded-full bg-[#e7f3ec] text-xs font-bold text-[#0b5136]`}>
      {source ? (
        <img src={source} alt={`Foto de ${name}`} className="h-full w-full object-cover" />
      ) : (
        name.split(' ').map((part) => part[0]).slice(0, 2).join('')
      )}
    </span>
  )
}

export default function RedeAcademica() {
  const {
    feedPosts,
    alunos,
    matrizes,
    lotes,
    addFeedPost,
    togglePostLike,
    addPostComment,
    deletePost,
  } = useAppData()
  const { user, apiRequest } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [imageBusy, setImageBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [comments, setComments] = useState({})
  const fileInputRef = useRef(null)

  const relatedOptions = useMemo(
    () => [
      ...matrizes.map((matrix) => `${matrix.id} · ${matrix.name}`),
      ...lotes.map((lot) => `${lot.id} · Lote da matriz ${lot.matrixId}`),
      'Atividade geral da turma',
    ],
    [matrizes, lotes],
  )

  async function selectImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImageBusy(true)
    setError('')
    try {
      const upload = await uploadImageFile(file, 'feed', apiRequest)
      setForm((current) => ({ ...current, imagePath: upload.path }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setImageBusy(false)
      event.target.value = ''
    }
  }

  async function submit(event) {
    event.preventDefault()
    setPublishing(true)
    setError('')
    try {
      await addFeedPost(form)
      setForm(emptyForm)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPublishing(false)
    }
  }

  async function submitComment(event, postId) {
    event.preventDefault()
    const text = comments[postId]?.trim()
    if (!text) return
    try {
      await addPostComment(postId, text)
      setComments((current) => ({ ...current, [postId]: '' }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const ownPosts = feedPosts.filter((post) => post.authorId === user.id).length
  const recognition = feedPosts
    .filter((post) => post.authorId === user.id)
    .reduce((sum, post) => sum + post.likes.length, 0)

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Rede acadêmica"
        title="Mural da turma"
        description="Atividades, fotos e evidências com autoria e horário preservados."
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="surface-card premium-tilt flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e7f3ec] text-[#0b5136]"><Users size={20} /></span>
          <div>
            <strong className="block text-2xl text-[#073b28]">{user.role === 'teacher' ? alunos.length : ownPosts}</strong>
            <span className="text-xs text-slate-500">{user.role === 'teacher' ? 'alunos cadastrados' : 'minhas publicações'}</span>
          </div>
        </div>
        <div className="surface-card premium-tilt flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4df] text-[#ad7b22]"><Camera size={20} /></span>
          <div><strong className="block text-2xl text-[#073b28]">{feedPosts.length}</strong><span className="text-xs text-slate-500">evidências publicadas</span></div>
        </div>
        <div className="surface-card premium-tilt flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef1ff] text-indigo-700"><Trophy size={20} /></span>
          <div>
            <strong className="block text-2xl text-[#073b28]">
              {user.role === 'teacher'
                ? feedPosts.reduce((sum, post) => sum + post.likes.length, 0)
                : recognition}
            </strong>
            <span className="text-xs text-slate-500">reconhecimentos</span>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="surface-card p-5 xl:sticky xl:top-6">
          <div className="flex items-center gap-3 border-b border-[#ebe6dc] pb-4">
            <Avatar name={user.name} path={user.avatarPath} className="h-11 w-11" />
            <div className="min-w-0">
              <h2 className="truncate font-bold text-[#073b28]">{user.name}</h2>
              <p className="text-xs text-slate-500">Nova atividade no campo</p>
            </div>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <label>
              <span className="field-label">Atividade realizada</span>
              <input
                className="field-control"
                required
                value={form.activity}
                onChange={(event) => setForm({ ...form, activity: event.target.value })}
                placeholder="Ex.: Inspeção da baia"
              />
            </label>
            <label>
              <span className="field-label">Matriz, lote ou contexto</span>
              <select
                className="field-control"
                required
                value={form.related}
                onChange={(event) => setForm({ ...form, related: event.target.value })}
              >
                <option value="">Selecione o vínculo</option>
                {relatedOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span className="field-label">Relato da atividade</span>
              <textarea
                className="field-control min-h-28 py-3"
                required
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                placeholder="Descreva o manejo, condição observada e resultado."
              />
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={selectImage}
            />
            {form.imagePath ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative block w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={mediaUrl(form.imagePath)}
                  alt="Prévia da evidência"
                  className="aspect-[4/3] w-full object-cover"
                />
                <span className="absolute inset-x-3 bottom-3 rounded-xl bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                  Trocar foto
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#c9c1b2] bg-[#f8f6f1] text-[#0b5136]"
              >
                <ImagePlus size={25} />
                <strong className="mt-2 text-sm">{imageBusy ? 'Guardando foto...' : 'Tirar ou escolher foto'}</strong>
                <span className="mt-1 text-[11px] text-slate-400">Armazenamento privado e otimizado</span>
              </button>
            )}

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>}

            <button className="primary-button w-full" disabled={imageBusy || publishing}>
              <Send size={17} />
              {publishing ? 'Publicando...' : 'Publicar atividade'}
            </button>
          </form>
        </aside>

        <section className="min-w-0 space-y-5">
          {feedPosts.map((post) => {
            const canDelete = user.role === 'teacher' || post.authorId === user.id
            const image = mediaUrl(post.image)
            return (
              <article key={post.id} className="surface-card premium-tilt overflow-hidden">
                <header className="flex items-start gap-3 p-4 sm:p-5">
                  <Avatar name={post.author} path={post.avatarPath} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <strong className="text-sm text-[#073b28]">{post.author}</strong>
                      <span className="text-[11px] text-slate-400">{post.className}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{formatPostDate(post.date)} · {post.activity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="hidden rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-bold text-[#946719] sm:block">{post.related}</span>
                    {canDelete && (
                      <button
                        onClick={() => deletePost(post.id)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600"
                        aria-label="Excluir publicação"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </header>

                {image ? (
                  <img
                    src={image}
                    alt={post.activity}
                    width="960"
                    height="720"
                    loading="lazy"
                    decoding="async"
                    className="max-h-[620px] w-full bg-[#ebe8e0] object-cover"
                  />
                ) : (
                  <div className="grid min-h-48 place-items-center bg-[linear-gradient(135deg,#0b5136,#d3ad5b)] text-white">
                    <Sparkles size={34} />
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <span className="mb-3 inline-flex rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-bold text-[#946719] sm:hidden">{post.related}</span>
                  <p className="text-sm leading-6 text-slate-700">{post.text}</p>
                  <div className="mt-4 flex items-center gap-4 border-y border-[#ebe6dc] py-3">
                    <button
                      onClick={() => togglePostLike(post.id)}
                      className={`flex items-center gap-2 text-xs font-semibold ${post.likedByMe ? 'text-rose-600' : 'text-slate-500'}`}
                    >
                      <Heart size={17} fill={post.likedByMe ? 'currentColor' : 'none'} />
                      {post.likes.length} curtidas
                    </button>
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <MessageCircle size={17} />
                      {post.comments.length} comentários
                    </span>
                  </div>

                  {post.comments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-[#f7f5f0] px-4 py-3 text-xs leading-5 text-slate-600">
                          <strong className="mr-2 text-[#073b28]">{comment.author}</strong>
                          {comment.text}
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={(event) => submitComment(event, post.id)} className="mt-4 flex gap-2">
                    <input
                      className="field-control min-w-0 flex-1"
                      value={comments[post.id] || ''}
                      onChange={(event) => setComments((current) => ({ ...current, [post.id]: event.target.value }))}
                      placeholder="Escreva um comentário..."
                    />
                    <button className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0b5136] text-white" aria-label="Publicar comentário">
                      <Send size={17} />
                    </button>
                  </form>
                </div>
              </article>
            )
          })}

          <div className="flex items-center justify-center gap-2 py-3 text-xs text-slate-400">
            <CheckCircle2 size={16} className="text-[#1b6a41]" />
            Publicações sincronizadas com o banco de dados
          </div>
        </section>
      </div>
    </div>
  )
}
