import { Baby, Stethoscope } from 'lucide-react'
import { useEffect, useState } from 'react'
import FormInput from '../FormInput.jsx'
import FormSelect from '../FormSelect.jsx'
import Modal from '../Modal.jsx'
import { totalBorn } from '../../utils/calculations.js'
import { toISODate } from '../../utils/dateUtils.js'

const emptyForm = {
  date: toISODate(),
  alive: '',
  stillborn: '0',
  mummified: '0',
  birthWeight: '',
  notes: '',
  responsible: '',
}

export default function BirthRegisterModal({ item, alunos, teacherName, addParto, onClose }) {
  const [form, setForm] = useState(emptyForm)
  const total = totalBorn(form)

  useEffect(() => {
    if (!item) return
    setForm({
      ...emptyForm,
      date: toISODate(),
      responsible: item.coverage.responsible || alunos[0]?.name || '',
    })
  }, [item, alunos])

  if (!item) return null

  function submit(event) {
    event.preventDefault()
    addParto({
      matrixId: item.matrix.id,
      date: form.date,
      startTime: '',
      endTime: '',
      alive: Number(form.alive),
      stillborn: Number(form.stillborn),
      mummified: Number(form.mummified),
      birthWeight: Number(form.birthWeight) || null,
      notes: form.notes,
      occurrences: '',
      responsible: form.responsible,
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Registrar parto"
      subtitle={`${item.matrix.id} · ${item.matrix.name}`}
      size="max-w-2xl"
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <FormInput
          label="Data do parto"
          required
          type="date"
          value={form.date}
          onChange={(event) => setForm({ ...form, date: event.target.value })}
        />
        <FormSelect
          label="Responsável"
          required
          options={[teacherName, ...alunos.map((student) => student.name)]}
          value={form.responsible}
          onChange={(event) => setForm({ ...form, responsible: event.target.value })}
        />
        <FormInput
          label="Leitões vivos"
          required
          type="number"
          min="0"
          value={form.alive}
          onChange={(event) => setForm({ ...form, alive: event.target.value })}
        />
        <FormInput
          label="Natimortos"
          required
          type="number"
          min="0"
          value={form.stillborn}
          onChange={(event) => setForm({ ...form, stillborn: event.target.value })}
        />
        <FormInput
          label="Mumificados"
          required
          type="number"
          min="0"
          value={form.mummified}
          onChange={(event) => setForm({ ...form, mummified: event.target.value })}
        />
        <FormInput
          label="Peso médio ao nascer (kg)"
          type="number"
          min="0"
          step="0.01"
          value={form.birthWeight}
          onChange={(event) => setForm({ ...form, birthWeight: event.target.value })}
        />
        <div className="flex items-center justify-between border border-[#d8c79e] bg-[#f8f2e5] p-4 sm:col-span-2">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#082f1f]">
            <Baby size={20} className="text-[#ad7b22]" />
            Total de leitões
          </span>
          <strong className="text-2xl text-[#082f1f]">{total}</strong>
        </div>
        <label className="sm:col-span-2">
          <span className="field-label">Observações</span>
          <textarea
            className="field-control min-h-28 py-3"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Intervenções, comportamento da matriz e condição dos leitões."
          />
        </label>
        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button className="primary-button">
            <Stethoscope size={17} />
            Salvar parto
          </button>
        </div>
      </form>
    </Modal>
  )
}
