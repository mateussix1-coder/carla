import {
  Ban,
  Clock3,
  History,
  KeyRound,
  Link2,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { ErrorState, LoadingState } from '../components/education/StatePanel.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const eventLabels = {
  membership_approve: 'Acesso aprovado',
  membership_reject: 'Solicitação recusada',
  membership_block: 'Aluno bloqueado',
  membership_reactivate: 'Aluno reativado',
  membership_remove: 'Aluno removido',
  membership_role_updated: 'Papel atualizado',
  class_created: 'Turma criada',
  class_updated: 'Configuração de turma alterada',
  class_invite_regenerated: 'Convite renovado',
}

export default function Permissoes() {
  const { apiRequest } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      setData(await apiRequest('/api/education/permissions'))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <div className="page-shell"><LoadingState label="Carregando permissões..." /></div>
  if (error) return <div className="page-shell"><ErrorState message={error} onRetry={load} /></div>

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Segurança e acesso"
        title="Permissões"
        description="Regras de entrada, convites ativos e histórico de decisões da professora."
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Aprovações pendentes" value={data.totals.pending} detail="aguardando revisão" icon={Clock3} theme="amber" />
        <StatCard title="Alunos bloqueados" value={data.totals.blocked} detail="sem acesso" icon={Ban} theme="rose" />
        <StatCard title="Links ativos" value={data.totals.activeInvites} detail="convites disponíveis" icon={Link2} theme="sky" />
        <StatCard title="Proteção" value="Ativa" detail="sessões e auditoria" icon={ShieldCheck} theme="emerald" />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#073f2b] text-white">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="section-title">Como o acesso funciona</h2>
              <p className="mt-1 text-xs text-slate-500">Fluxo padrão para novas turmas.</p>
            </div>
          </div>
          <ol className="mt-6 space-y-4">
            {[
              'A professora cria a turma e copia o link.',
              'O aluno preenche o cadastro pelo convite.',
              'A solicitação aparece como pendente.',
              'A professora aprova ou recusa.',
              'A conta aprovada recebe acesso à turma.',
              'Bloqueios encerram as sessões imediatamente.',
            ].map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eef6f0] text-xs font-bold text-[#0b6847]">{index + 1}</span>
                <p className="pt-1 text-sm leading-5 text-slate-600">{item}</p>
              </li>
            ))}
          </ol>
        </article>

        <article className="surface-card overflow-hidden">
          <header className="flex items-center gap-3 border-b border-[#e9e4da] p-5">
            <History size={20} className="text-[#ad7b22]" />
            <div>
              <h2 className="section-title">Histórico de ações</h2>
              <p className="mt-1 text-xs text-slate-500">Registro de auditoria das decisões importantes.</p>
            </div>
          </header>
          <div className="divide-y divide-[#eee9df]">
            {data.history.length > 0 ? data.history.map((item) => (
              <div key={item.id} className="flex gap-3 px-5 py-4">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0b6847]" />
                <div className="min-w-0 flex-1">
                  <strong className="text-sm text-[#073f2b]">{eventLabels[item.type] || item.type}</strong>
                  <p className="mt-1 text-xs text-slate-500">{item.user}</p>
                </div>
                <time className="shrink-0 text-[10px] text-slate-400">
                  {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}
                </time>
              </div>
            )) : (
              <p className="p-8 text-center text-sm text-slate-500">As próximas ações aparecerão aqui.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
