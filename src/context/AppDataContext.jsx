import { createContext, useContext, useMemo, useState } from 'react'
import { createSeedData } from '../data/seedData.js'
import { expectedBirthDate } from '../utils/calculations.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'

const AppDataContext = createContext(null)

function nextId(prefix, records) {
  const highest = records.reduce((max, record) => {
    const number = Number(String(record.id).replace(/\D/g, ''))
    return Number.isFinite(number) ? Math.max(max, number) : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

export function AppDataProvider({ children }) {
  const [data, setData] = useLocalStorage('rpa-professora-carla-data-v2', createSeedData())
  const [toast, setToast] = useState(null)

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }

  function addMatriz(record) {
    setData((current) => ({ ...current, matrizes: [...current.matrizes, record] }))
    notify('Matriz cadastrada com sucesso.')
  }

  function addVarrao(record) {
    setData((current) => ({ ...current, varroes: [...current.varroes, record] }))
    notify('Varrão cadastrado com sucesso.')
  }

  function addAluno(record) {
    setData((current) => ({
      ...current,
      alunos: [...current.alunos, { ...record, id: nextId('A', current.alunos) }],
    }))
    notify('Aluno cadastrado com sucesso.')
  }

  function addCobertura(record) {
    setData((current) => {
      const coverage = {
        ...record,
        id: nextId('C', current.coberturas),
        expectedDate: expectedBirthDate(record.date),
      }
      return {
        ...current,
        coberturas: [coverage, ...current.coberturas],
        matrizes: current.matrizes.map((matrix) =>
          matrix.id === record.matrixId ? { ...matrix, status: 'Coberta' } : matrix,
        ),
      }
    })
    notify('Cobertura registrada e previsão calculada.')
  }

  function addParto(record) {
    setData((current) => {
      const birthId = nextId('P', current.partos)
      const lotId = nextId('L', current.lotes)
      const birth = { ...record, id: birthId, lotId }
      const lot = {
        id: lotId,
        matrixId: record.matrixId,
        birthDate: record.date,
        alive: Number(record.alive),
        weights: { PN: Number(record.birthWeight) || null, P07: null, P14: null, P21: null, PD: null },
        responsible: record.responsible,
        notes: 'Lote criado automaticamente a partir do parto.',
        occurrences: record.occurrences,
      }
      return {
        ...current,
        partos: [birth, ...current.partos],
        lotes: [lot, ...current.lotes],
        matrizes: current.matrizes.map((matrix) =>
          matrix.id === record.matrixId ? { ...matrix, status: 'Parida' } : matrix,
        ),
      }
    })
    notify('Parto registrado e lote de leitões criado.')
  }

  function addPesagem(lotId, phase, weight) {
    setData((current) => ({
      ...current,
      lotes: current.lotes.map((lot) =>
        lot.id === lotId
          ? { ...lot, weights: { ...lot.weights, [phase]: Number(weight) } }
          : lot,
      ),
    }))
    notify('Pesagem registrada com sucesso.')
  }

  function addSanitario(record) {
    setData((current) => ({
      ...current,
      sanitario: [
        { ...record, id: nextId('S', current.sanitario) },
        ...current.sanitario,
      ],
    }))
    notify('Manejo sanitário registrado.')
  }

  function resetData() {
    setData(createSeedData())
    notify('Dados de demonstração restaurados.')
  }

  const value = useMemo(
    () => ({
      ...data,
      addMatriz,
      addVarrao,
      addAluno,
      addCobertura,
      addParto,
      addPesagem,
      addSanitario,
      resetData,
    }),
    [data],
  )

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-semibold text-white shadow-2xl lg:bottom-8">
          {toast}
        </div>
      )}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData deve ser usado dentro de AppDataProvider')
  return context
}
