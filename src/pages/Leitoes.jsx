import { Baby, CalendarClock, Camera, Plus, Scale, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAppData } from '../context/AppDataContext.jsx'
import { currentWeight, lotStatus, nextWeighing, weightGain, WEIGHT_PHASES } from '../utils/calculations.js'
import { formatDate } from '../utils/dateUtils.js'

const phaseLabels = {
  PN: 'Peso ao nascer',
  P07: 'Peso com 7 dias',
  P14: 'Peso com 14 dias',
  P21: 'Peso com 21 dias',
  PD: 'Peso ao desmame',
}

export default function Leitoes() {
  const { lotes, matrizes, addPesagem } = useAppData()
  const [open, setOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState('')
  const [weight, setWeight] = useState('')
  const selected = useMemo(() => lotes.find((lot) => lot.id === selectedLot), [lotes, selectedLot])
  const selectedPhase = selected ? nextWeighing(selected.weights) : ''

  function submit(event) {
    event.preventDefault()
    addPesagem(selectedLot, selectedPhase, weight)
    setSelectedLot('')
    setWeight('')
    setOpen(false)
  }

  const motherName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manejo"
        title="Leitões"
        description="Acompanhe cada lote do nascimento ao desmame, com pesagens e ocorrências."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Nova pesagem</button>}
      />

      <section className="grid gap-5 xl:grid-cols-2">
        {lotes.map((lot) => {
          const status = lotStatus(lot.weights)
          const currentPhase = currentWeight(lot.weights)
          const next = nextWeighing(lot.weights)
          const completed = WEIGHT_PHASES.filter((phase) => Number(lot.weights[phase]) > 0).length
          return (
            <article key={lot.id} className="surface-card overflow-hidden">
              <div className="border-b border-white/10 bg-[#0b3b27] p-5 text-white sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center border border-[#d0a44c] text-[#e2c170]"><Baby size={23} strokeWidth={1.7} /></span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#e2c170]">Lote {lot.id}</p>
                      <h2 className="text-lg font-bold">{motherName(lot.matrixId)}</h2>
                      <p className="mt-1 text-sm text-white/70">Nascido em {formatDate(lot.birthDate)}</p>
                    </div>
                  </div>
                  <StatusBadge className="bg-white/90">{status}</StatusBadge>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="grid grid-cols-3 divide-x divide-[#e2ddd2] border-y border-[#e2ddd2]">
                  <div className="p-3 first:pl-0">
                    <span className="text-xs font-semibold text-slate-400">Leitões vivos</span>
                    <strong className="mt-1 block text-2xl font-bold text-slate-900">{lot.alive}</strong>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-semibold text-[#1b6a41]">Peso atual</span>
                    <strong className="mt-1 block text-2xl font-bold text-[#082f1f]">{currentPhase ? `${lot.weights[currentPhase]} kg` : '--'}</strong>
                  </div>
                  <div className="p-3">
                    <span className="text-xs font-semibold text-[#ad7b22]">Ganho</span>
                    <strong className="mt-1 block text-2xl font-bold text-slate-900">+{weightGain(lot.weights).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="mt-5">
                  <ProgressBar value={(completed / WEIGHT_PHASES.length) * 100} label="Acompanhamento de pesagens" color="bg-[#1b6a41]" />
                </div>

                <div className="mt-5 grid grid-cols-5 gap-2">
                  {WEIGHT_PHASES.map((phase) => (
                    <div key={phase} className={`border px-2 py-3 text-center ${Number(lot.weights[phase]) > 0 ? 'border-[#b9cabb] bg-[#f3f6f1] text-[#082f1f]' : 'border-[#e2ddd2] bg-[#f7f5ef] text-slate-400'}`}>
                      <span className="block text-[10px] font-black uppercase">{phase}</span>
                      <strong className="mt-1 block text-xs">{Number(lot.weights[phase]) > 0 ? `${lot.weights[phase]} kg` : '--'}</strong>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-3 border border-[#d8d3c7] bg-[#f7f5ef] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center border border-[#d8c79e] bg-white text-[#ad7b22]"><CalendarClock size={18} /></span>
                    <div><p className="text-xs font-semibold text-slate-400">Próxima pesagem</p><strong className="text-sm text-slate-800">{next ? `${next} · ${phaseLabels[next]}` : 'Ciclo concluído'}</strong></div>
                  </div>
                  {next && <button className="secondary-button" onClick={() => { setSelectedLot(lot.id); setOpen(true) }}><Scale size={17} /> Registrar</button>}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="text-sm leading-6 text-slate-500">
                    <p>{lot.notes}</p>
                    {lot.occurrences && <p className="mt-1"><strong className="text-slate-700">Ocorrências:</strong> {lot.occurrences}</p>}
                  </div>
                  <button className="flex min-h-11 items-center justify-center gap-2 border border-[#d8d3c7] bg-white px-4 text-xs font-semibold text-slate-600"><Camera size={17} /> Fotos</button>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar pesagem semanal" subtitle="Informe o peso médio dos leitões no lote.">
        <form onSubmit={submit} className="space-y-4">
          <FormSelect
            label="Lote"
            required
            options={lotes.filter((lot) => nextWeighing(lot.weights)).map((lot) => ({ value: lot.id, label: `${lot.id} · ${motherName(lot.matrixId)} · próxima ${nextWeighing(lot.weights)}` }))}
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
          />
          {selectedPhase && (
            <div className="flex items-center gap-3 border border-[#b9cabb] bg-[#f3f6f1] p-4 text-[#082f1f]">
              <TrendingUp size={20} className="text-[#1b6a41]" />
              <div><span className="block text-xs font-semibold text-[#1b6a41]">Fase calculada</span><strong>{selectedPhase} · {phaseLabels[selectedPhase]}</strong></div>
            </div>
          )}
          <FormInput label="Peso médio (kg)" required type="number" min="0.1" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex.: 5,20" />
          <div className="flex justify-end gap-3"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button" disabled={!selectedPhase}>Salvar pesagem</button></div>
        </form>
      </Modal>
    </div>
  )
}
