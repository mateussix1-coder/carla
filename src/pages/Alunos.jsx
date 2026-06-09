import { GraduationCap, Plus, UserCheck } from 'lucide-react'
import { useState } from 'react'
import FormInput from '../components/FormInput.jsx'
import Modal from '../components/Modal.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { useAppData } from '../context/AppDataContext.jsx'

const initialForm = { name: '', className: '', role: '', notes: '' }

export default function Alunos() {
  const { alunos, addAluno, coberturas, partos, sanitario } = useAppData()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  function activityCount(name) {
    return (
      coberturas.filter((item) => item.responsible === name).length +
      partos.filter((item) => item.responsible === name).length +
      sanitario.filter((item) => item.responsible === name).length
    )
  }

  function submit(event) {
    event.preventDefault()
    addAluno(form)
    setForm(initialForm)
    setOpen(false)
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Equipe"
        title="Alunos e turmas"
        description="Identifique os responsáveis pelos registros e organize as atividades práticas."
        action={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={19} /> Novo aluno</button>}
      />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {alunos.map((student) => (
          <article key={student.id} className="surface-card p-6">
            <div className="flex items-start justify-between">
              <span className="grid h-12 w-12 place-items-center border border-[#b8c6ba] bg-[#f3f6f1] text-[#0b3b27]"><GraduationCap size={22} strokeWidth={1.7} /></span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{activityCount(student.name)} registros</span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-[#082f1f]">{student.name}</h2>
            <p className="mt-1 text-sm font-semibold text-[#ad7b22]">{student.className}</p>
            <div className="mt-5 flex items-center gap-3 border-y border-[#e2ddd2] py-4">
              <UserCheck size={19} className="text-[#1b6a41]" />
              <div><span className="block text-xs text-slate-400">Responsabilidade</span><strong className="text-sm text-slate-700">{student.role}</strong></div>
            </div>
            {student.notes && <p className="mt-4 text-sm text-slate-500">{student.notes}</p>}
          </article>
        ))}
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Cadastrar aluno">
        <form onSubmit={submit} className="space-y-4">
          <FormInput label="Nome do aluno" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormInput label="Turma" required value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} placeholder="Ex.: Zootecnia A" />
          <FormInput label="Função / responsabilidade" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ex.: Manejo e pesagens" />
          <label><span className="field-label">Observações</span><textarea className="field-control min-h-24 py-3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="flex justify-end gap-3"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Salvar aluno</button></div>
        </form>
      </Modal>
    </div>
  )
}
