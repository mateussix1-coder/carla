import {
  Baby,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Edit3,
  Plus,
  RotateCcw,
  Scale,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import FormInput from '../components/FormInput.jsx'
import FormSelect from '../components/FormSelect.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { CHECKLIST_ITEMS, useAppData } from '../context/AppDataContext.jsx'
import { currentWeight, lotStatus, nextWeighing, weightGain, WEIGHT_PHASES } from '../utils/calculations.js'
import { differenceInDays, formatDate, toISODate } from '../utils/dateUtils.js'

const phaseLabels = {
  PN: 'Peso ao nascer',
  P07: 'Peso com 7 dias',
  P14: 'Peso com 14 dias',
  P21: 'Peso com 21 dias',
  PD: 'Peso ao desmame',
}

export default function Leitoes() {
  const {
    lotes,
    matrizes,
    alunos,
    addPesagem,
    updateLote,
    deleteLote,
    updateChecklistItem,
    undoChecklistItem,
  } = useAppData()
  const [weightOpen, setWeightOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState('')
  const [weight, setWeight] = useState('')
  const [weightResponsible, setWeightResponsible] = useState('Profª Carla')
  const [checkItem, setCheckItem] = useState(null)
  const [checkForm, setCheckForm] = useState({ date: toISODate(), responsible: 'Profª Carla', notes: '' })
  const [editingLot, setEditingLot] = useState(null)
  const [confirming, setConfirming] = useState(null)
  const selected = useMemo(() => lotes.find((lot) => lot.id === selectedLot), [lotes, selectedLot])
  const selectedPhase = selected ? nextWeighing(selected.weights) : ''

  const motherName = (id) => {
    const matrix = matrizes.find((item) => item.id === id)
    return matrix ? `${matrix.id} · ${matrix.name}` : id
  }
  const mother = (id) => matrizes.find((item) => item.id === id)

  function openWeight(lotId = '') {
    setSelectedLot(lotId)
    setWeight('')
    setWeightResponsible('Profª Carla')
    setWeightOpen(true)
  }

  function submitWeight(event) {
    event.preventDefault()
    addPesagem(selectedLot, selectedPhase, weight, weightResponsible)
    setSelectedLot('')
    setWeight('')
    setWeightOpen(false)
  }

  function openChecklist(lot, item) {
    const record = lot.checklist?.[item.key]
    setCheckItem({ lot, item })
    setCheckForm({
      date: record?.date || toISODate(),
      responsible: record?.responsible || lot.responsible || 'Profª Carla',
      notes: record?.notes || '',
    })
  }

  function submitChecklist(event) {
    event.preventDefault()
    updateChecklistItem(checkItem.lot.id, checkItem.item.key, checkForm)
    setCheckItem(null)
  }

  function submitLot(event) {
    event.preventDefault()
    updateLote(editingLot.id, {
      currentQuantity: Number(editingLot.currentQuantity),
      responsible: editingLot.responsible,
      notes: editingLot.notes,
      occurrences: editingLot.occurrences,
      weanedAt: editingLot.weanedAt,
    })
    setEditingLot(null)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Manejo pós-parto"
        title="Leitões e ninhadas"
        description="Registre datas, responsáveis, pesagens e cuidados do nascimento ao desmame."
        action={<button className="primary-button w-full sm:w-auto" onClick={() => openWeight()}><Plus size={19} /> Nova pesagem</button>}
      />

      {lotes.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {lotes.map((lot) => {
            const status = lotStatus(lot.weights)
            const currentPhase = currentWeight(lot.weights)
            const next = nextWeighing(lot.weights)
            const completedWeights = WEIGHT_PHASES.filter((phase) => Number(lot.weights?.[phase]) > 0).length
            const completedChecklist = CHECKLIST_ITEMS.filter((item) => lot.checklist?.[item.key]?.completed).length
            const age = Math.max(0, differenceInDays(toISODate(), lot.birthDate))
            return (
              <article key={lot.id} className="surface-card overflow-hidden">
                <div className="border-b border-[#ebe6dc] bg-white p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <img src={mother(lot.matrixId)?.image || '/images/aurora.jpg'} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#ad7b22]">Ninhada {lot.id}</p>
                        <h2 className="truncate text-lg font-bold text-[#073b28]">{motherName(lot.matrixId)}</h2>
                        <p className="mt-1 text-sm text-slate-500">{age} dia(s) · nascida em {formatDate(lot.birthDate)}</p>
                      </div>
                    </div>
                    <StatusBadge>{status}</StatusBadge>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-[#e2ddd2]">
                    <Metric label="Ao nascer" value={lot.alive} />
                    <Metric label="Quantidade atual" value={lot.currentQuantity} />
                    <Metric label="Mortalidade" value={Math.max(0, Number(lot.alive) - Number(lot.currentQuantity || 0))} />
                  </div>

                  <div className="mt-5">
                    <ProgressBar value={(completedChecklist / CHECKLIST_ITEMS.length) * 100} label={`Manejos concluídos: ${completedChecklist}/${CHECKLIST_ITEMS.length}`} color="bg-[#1b6a41]" />
                  </div>

                  <div className="mt-5 rounded-2xl border border-[#dce7df] bg-[#f6faf7] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0b5136] text-white"><ClipboardCheck size={19} /></span>
                        <div><h3 className="font-bold text-[#073b28]">Checklist dos leitões</h3><p className="text-xs text-slate-500">Cada conclusão exige data e responsável</p></div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {CHECKLIST_ITEMS.map((item) => {
                        const record = lot.checklist?.[item.key]
                        return (
                          <div key={item.key} className={`rounded-xl border p-3 ${record?.completed ? 'border-[#b8d3c0] bg-white' : 'border-[#e1ddd4] bg-white/70'}`}>
                            <div className="flex items-start gap-3">
                              {record?.completed
                                ? <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-[#1b6a41]" />
                                : <Circle size={19} className="mt-0.5 shrink-0 text-slate-300" />}
                              <div className="min-w-0 flex-1">
                                <strong className={`block text-xs ${record?.completed ? 'text-[#17633d]' : 'text-slate-600'}`}>{item.label}</strong>
                                {record?.completed ? (
                                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                    Concluído em {formatDate(record.date)} por {record.responsible}
                                    {record.notes ? ` · ${record.notes}` : ''}
                                  </p>
                                ) : <p className="mt-1 text-[11px] text-slate-400">Pendente</p>}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button className="action-button" onClick={() => openChecklist(lot, item)}><Edit3 size={14} /> {record?.completed ? 'Editar' : 'Concluir'}</button>
                              {record?.completed && <button className="action-button action-warning" onClick={() => undoChecklistItem(lot.id, item.key)}><RotateCcw size={14} /> Desfazer</button>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div><h3 className="text-sm font-bold text-[#073b28]">Pesagens</h3><p className="text-xs text-slate-500">{completedWeights}/5 fases registradas</p></div>
                      {next && <button className="action-button action-success" onClick={() => openWeight(lot.id)}><Scale size={15} /> Registrar {next}</button>}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {WEIGHT_PHASES.map((phase) => (
                        <div key={phase} className={`min-w-0 rounded-xl border px-1 py-3 text-center ${Number(lot.weights?.[phase]) > 0 ? 'border-[#b9cabb] bg-[#f3f6f1] text-[#082f1f]' : 'border-[#e2ddd2] bg-[#f7f5ef] text-slate-400'}`}>
                          <span className="block text-[9px] font-black">{phase}</span>
                          <strong className="mt-1 block truncate text-[10px]">{Number(lot.weights?.[phase]) > 0 ? `${lot.weights[phase]} kg` : '--'}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>Peso atual: <strong className="text-[#073b28]">{currentPhase ? `${lot.weights[currentPhase]} kg` : '--'}</strong></span>
                      <span>Ganho: <strong className="text-[#073b28]">+{weightGain(lot.weights).toFixed(2)} kg</strong></span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#eee9df] pt-4">
                    <button className="action-button" onClick={() => setEditingLot({ ...lot })}><Edit3 size={15} /> Editar ninhada</button>
                    <button className="action-button action-danger" onClick={() => setConfirming(lot)}><Trash2 size={15} /> Excluir</button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <EmptyState title="Nenhuma ninhada cadastrada" description="Ao registrar um parto, a ninhada e o checklist serão criados automaticamente." />
      )}

      <Modal open={weightOpen} onClose={() => setWeightOpen(false)} title="Registrar pesagem" subtitle="Informe o peso médio da ninhada.">
        <form onSubmit={submitWeight} className="space-y-4">
          <FormSelect
            label="Ninhada"
            required
            options={lotes.filter((lot) => nextWeighing(lot.weights)).map((lot) => ({ value: lot.id, label: `${lot.id} · ${motherName(lot.matrixId)} · próxima ${nextWeighing(lot.weights)}` }))}
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
          />
          {selectedPhase && (
            <div className="rounded-2xl border border-[#b9cabb] bg-[#f3f6f1] p-4 text-[#082f1f]">
              <span className="block text-xs font-semibold text-[#1b6a41]">Fase calculada</span>
              <strong>{selectedPhase} · {phaseLabels[selectedPhase]}</strong>
            </div>
          )}
          <FormInput label="Peso médio (kg)" required type="number" min="0.1" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <FormSelect label="Responsável" required options={['Profª Carla', ...alunos.map((item) => item.name)]} value={weightResponsible} onChange={(e) => setWeightResponsible(e.target.value)} />
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setWeightOpen(false)}>Cancelar</button><button className="primary-button" disabled={!selectedPhase}>Salvar pesagem</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(checkItem)} onClose={() => setCheckItem(null)} title={checkItem?.item.label || 'Checklist'} subtitle="Registre quando e por quem o manejo foi realizado.">
        {checkItem && (
          <form onSubmit={submitChecklist} className="space-y-4">
            <FormInput label="Data de realização" required type="date" value={checkForm.date} onChange={(e) => setCheckForm({ ...checkForm, date: e.target.value })} />
            <FormSelect label="Responsável" required options={['Profª Carla', ...alunos.map((item) => item.name)]} value={checkForm.responsible} onChange={(e) => setCheckForm({ ...checkForm, responsible: e.target.value })} />
            <label><span className="field-label">Observação</span><textarea className="field-control min-h-24 py-3" value={checkForm.notes} onChange={(e) => setCheckForm({ ...checkForm, notes: e.target.value })} placeholder="Ex.: realizado em todos os leitões" /></label>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setCheckItem(null)}>Cancelar</button><button className="primary-button">Salvar conclusão</button></div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(editingLot)} onClose={() => setEditingLot(null)} title="Editar ninhada">
        {editingLot && (
          <form onSubmit={submitLot} className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Quantidade atual" required type="number" min="0" max={editingLot.alive} value={editingLot.currentQuantity} onChange={(e) => setEditingLot({ ...editingLot, currentQuantity: e.target.value })} />
            <FormSelect label="Responsável" options={['Profª Carla', ...alunos.map((item) => item.name)]} value={editingLot.responsible || ''} onChange={(e) => setEditingLot({ ...editingLot, responsible: e.target.value })} />
            <FormInput label="Data do desmame" type="date" value={editingLot.weanedAt || ''} onChange={(e) => setEditingLot({ ...editingLot, weanedAt: e.target.value })} />
            <label className="sm:col-span-2"><span className="field-label">Observações</span><textarea className="field-control min-h-20 py-3" value={editingLot.notes || ''} onChange={(e) => setEditingLot({ ...editingLot, notes: e.target.value })} /></label>
            <label className="sm:col-span-2"><span className="field-label">Ocorrências</span><textarea className="field-control min-h-20 py-3" value={editingLot.occurrences || ''} onChange={(e) => setEditingLot({ ...editingLot, occurrences: e.target.value })} /></label>
            <div className="modal-actions sm:col-span-2"><button type="button" className="secondary-button" onClick={() => setEditingLot(null)}>Cancelar</button><button className="primary-button">Salvar alterações</button></div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Excluir ninhada?"
        description="A ninhada, o checklist, as pesagens e os registros sanitários vinculados serão removidos. O parto permanecerá no histórico sem vínculo com a ninhada."
        onConfirm={() => {
          deleteLote(confirming.id)
          setConfirming(null)
        }}
      />
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="border-r border-[#e2ddd2] p-3 text-center last:border-r-0">
      <span className="block text-[10px] font-semibold text-slate-400">{label}</span>
      <strong className="mt-1 block text-xl text-[#073b28]">{value}</strong>
    </div>
  )
}
