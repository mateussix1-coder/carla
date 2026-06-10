import {
  Database,
  Download,
  Eraser,
  FileJson,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

export default function DadosDemonstracao() {
  const data = useAppData()
  const {
    matrizes,
    varroes,
    coberturas,
    partos,
    lotes,
    sanitario,
    historico,
    syncStatus,
    restoreDemoData,
    clearOperationalData,
    importOperationalData,
    notify,
  } = data
  const fileRef = useRef(null)
  const [confirming, setConfirming] = useState('')
  const hasExamples = ['M001', 'M002', 'M003', 'M004', 'M005'].some((id) => matrizes.some((item) => item.id === id))

  function exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: { matrizes, varroes, coberturas, partos, lotes, sanitario, historico },
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ciclo-114-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    notify('Backup JSON exportado.')
  }

  async function importFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      importOperationalData(parsed.data || parsed)
    } catch {
      notify('Arquivo inválido. Selecione um backup JSON do Ciclo 114.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Sistema"
        title="Dados e backup"
        description="Controle os exemplos, exporte um backup e restaure os dados sem depender de registros travados."
      />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="surface-card p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#073f2b] text-white"><Database size={22} /></span>
            <div>
              <h2 className="section-title">Estado atual</h2>
              <p className="text-xs text-slate-500">Persistência principal no banco Neon.</p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><ShieldCheck size={17} />{syncStatus === 'saving' ? 'Salvando alterações...' : syncStatus === 'error' ? 'Falha na sincronização' : 'Dados sincronizados'}</div>
            <p className="mt-2 text-xs leading-5 text-emerald-700">Toda alteração operacional é enviada ao banco e recebe controle de versão.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              ['Matrizes', matrizes.length],
              ['Varrões', varroes.length],
              ['Coberturas', coberturas.length],
              ['Partos', partos.length],
              ['Ninhadas', lotes.length],
              ['Sanitário', sanitario.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#f7f5ef] p-4"><strong className="block text-xl text-[#073f2b]">{value}</strong><span className="text-[10px] text-slate-500">{label}</span></div>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            {hasExamples ? 'Há registros iniciais no banco. Todos podem ser editados ou excluídos.' : 'Os dados iniciais foram removidos.'}
          </p>
        </article>

        <article className="surface-card p-5 sm:p-7">
          <h2 className="section-title">Ações de dados</h2>
          <p className="mt-1 text-sm text-slate-500">Use backup antes de limpar registros importantes.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button className="secondary-button min-h-20 flex-col" onClick={exportData}><Download size={20} /> Exportar backup JSON</button>
            <button className="secondary-button min-h-20 flex-col" onClick={() => fileRef.current?.click()}><Upload size={20} /> Importar backup JSON</button>
            <button className="action-button action-warning min-h-20 flex-col" onClick={() => setConfirming('restore')}><RefreshCw size={20} /> Restaurar exemplos</button>
            <button className="action-button action-danger min-h-20 flex-col" onClick={() => setConfirming('clear')}><Eraser size={20} /> Limpar dados operacionais</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importFile} />
          <div className="mt-5 flex gap-3 rounded-2xl border border-[#e2ddd2] bg-[#f7f5ef] p-4">
            <FileJson size={20} className="shrink-0 text-[#ad7b22]" />
            <p className="text-xs leading-5 text-slate-600">O backup inclui matrizes, varrões, coberturas, partos, ninhadas, checklists, pesagens, sanitário e histórico. Contas e turmas continuam protegidas separadamente no banco.</p>
          </div>
        </article>
      </section>

      <ConfirmDialog
        open={confirming === 'clear'}
        onClose={() => setConfirming('')}
        title="Limpar todos os dados operacionais?"
        description="Isso apagará matrizes, varrões, coberturas, partos, ninhadas e registros sanitários atuais do banco. Turmas e contas não serão afetadas."
        confirmLabel="Sim, limpar dados"
        onConfirm={() => {
          clearOperationalData()
          setConfirming('')
        }}
      />

      <ConfirmDialog
        open={confirming === 'restore'}
        onClose={() => setConfirming('')}
        title="Restaurar dados de exemplo?"
        description="Os dados operacionais atuais serão substituídos pelos exemplos iniciais editáveis do Ciclo 114."
        confirmLabel="Restaurar exemplos"
        onConfirm={() => {
          restoreDemoData()
          setConfirming('')
        }}
      />
    </div>
  )
}
