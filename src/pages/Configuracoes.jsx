import { BellRing, Building2, RotateCcw, Save, Settings2, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import FormInput from '../components/FormInput.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

export default function Configuracoes() {
  const { settings, updateSettings, resetSettings } = useAppData()
  const [form, setForm] = useState(settings)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  function submit(event) {
    event.preventDefault()
    updateSettings(form)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Preferências do sistema"
        title="Configurações"
        description="Ajuste os nomes exibidos e quantos dias antes do parto o sistema deve alertar."
      />

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card p-5 sm:p-7">
          <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
            <FormInput label="Nome do sistema" required value={form.systemName || ''} onChange={(event) => setForm({ ...form, systemName: event.target.value })} />
            <FormInput label="Escola ou fazenda" required value={form.farmName || ''} onChange={(event) => setForm({ ...form, farmName: event.target.value })} />
            <FormInput label="Nome da professora" required value={form.teacherName || ''} onChange={(event) => setForm({ ...form, teacherName: event.target.value })} />
            <FormInput label="Alertar antes do parto (dias)" type="number" min="1" max="30" required value={form.alertDays || 7} onChange={(event) => setForm({ ...form, alertDays: event.target.value })} />
            <div className="modal-actions sm:col-span-2">
              <button type="button" className="secondary-button" onClick={() => setResetOpen(true)}><RotateCcw size={17} /> Restaurar padrão</button>
              <button className="primary-button"><Save size={17} /> Salvar configurações</button>
            </div>
          </form>
        </article>

        <aside className="space-y-3">
          {[
            [Settings2, 'Aplicação', form.systemName || 'Ciclo 114'],
            [Building2, 'Unidade', form.farmName || 'Não informada'],
            [UserRound, 'Responsável padrão', form.teacherName || 'Não informada'],
            [BellRing, 'Janela de alerta', `${form.alertDays || 7} dias antes do parto`],
          ].map(([Icon, label, value]) => (
            <article key={label} className="surface-card premium-card flex items-center gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#eef6f0] text-[#0b6847]"><Icon size={20} /></span>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                <strong className="mt-1 block truncate text-sm text-[#073f2b]">{value}</strong>
              </div>
            </article>
          ))}
        </aside>
      </section>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restaurar configurações padrão?"
        description="Os nomes e a janela de alertas voltarão para os valores iniciais do Ciclo 114."
        confirmLabel="Restaurar padrão"
        onConfirm={() => {
          resetSettings()
          setResetOpen(false)
        }}
      />
    </div>
  )
}
