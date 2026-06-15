import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createSeedData } from '../data/seedData.js'
import { expectedBirthDate } from '../utils/calculations.js'
import { generateId, isValidHttpUrl, sanitizeInput } from '../utils/dataUtils.js'
import { toISODate } from '../utils/dateUtils.js'
import { useAuth } from './AuthContext.jsx'

const AppDataContext = createContext(null)

export const DEFAULT_SETTINGS = {
  systemName: 'Ciclo 114',
  farmName: 'Escola / Fazenda Experimental',
  teacherName: 'Profª Carla',
  alertDays: 7,
}

export const DEFAULT_PERMISSIONS = {
  teacher: {
    viewAnimals: true,
    editAnimals: true,
    recordManagement: true,
    manageStudents: true,
    viewReports: true,
  },
  monitor: {
    viewAnimals: true,
    editAnimals: false,
    recordManagement: true,
    manageStudents: false,
    viewReports: true,
  },
  student: {
    viewAnimals: true,
    editAnimals: false,
    recordManagement: true,
    manageStudents: false,
    viewReports: false,
  },
}

export const CHECKLIST_ITEMS = [
  { key: 'dentes', label: 'Corte dos dentes' },
  { key: 'cauda', label: 'Corte da cauda' },
  { key: 'castracao', label: 'Castração' },
  { key: 'ferro', label: 'Aplicação de ferro' },
  { key: 'coccidiostatico', label: 'Aplicação de coccidiostático' },
  { key: 'ade', label: 'Aplicação de ADE' },
  { key: 'vermifugacao', label: 'Vermifugação' },
  { key: 'pesoNascimento', label: 'Pesagem ao nascer' },
  { key: 'pesoP07', label: 'Pesagem P07' },
  { key: 'pesoP14', label: 'Pesagem P14' },
  { key: 'pesoP21', label: 'Pesagem P21' },
  { key: 'pesoDesmame', label: 'Pesagem ao desmame' },
]

const EMPTY_OPERATIONAL_DATA = {
  matrizes: [],
  varroes: [],
  coberturas: [],
  partos: [],
  lotes: [],
  sanitario: [],
  historico: [],
  attachments: [],
  settings: DEFAULT_SETTINGS,
  permissions: DEFAULT_PERMISSIONS,
}

const DEMO_IDS = {
  matrizes: new Set(['M001', 'M002', 'M003', 'M004', 'M005']),
  varroes: new Set(['V001', 'V002', 'V003', 'V004']),
  coberturas: new Set(['C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007']),
  partos: new Set(['P001', 'P002']),
  lotes: new Set(['L001', 'L002']),
  sanitario: new Set(['S001', 'S002', 'S003', 'S004', 'S005']),
}

function nextId(prefix, records) {
  const highest = records.reduce((max, record) => {
    const number = Number(String(record.id).replace(/\D/g, ''))
    return Number.isFinite(number) ? Math.max(max, number) : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

function operationalData(data) {
  const { alunos, feedPosts, ...state } = data
  return state
}

function checklistRecord(value, fallbackResponsible = '') {
  if (typeof value === 'object' && value !== null) {
    return {
      completed: Boolean(value.completed),
      date: value.date || '',
      responsible: value.responsible || fallbackResponsible,
      notes: value.notes || '',
    }
  }
  return {
    completed: Boolean(value),
    date: '',
    responsible: fallbackResponsible,
    notes: '',
  }
}

function createChecklist(responsible = '', birthWeight = null, date = '') {
  return Object.fromEntries(CHECKLIST_ITEMS.map(({ key }) => {
    const isBirthWeight = key === 'pesoNascimento' && Number(birthWeight) > 0
    return [
      key,
      {
        completed: isBirthWeight,
        date: isBirthWeight ? date : '',
        responsible: isBirthWeight ? responsible : '',
        notes: isBirthWeight ? `Peso médio: ${Number(birthWeight)} kg` : '',
      },
    ]
  }))
}

function normalizeState(source) {
  const seed = createSeedData()
  const merged = {
    ...seed,
    ...EMPTY_OPERATIONAL_DATA,
    ...source,
  }

  return {
    ...merged,
    matrizes: (merged.matrizes || []).map((matrix) => ({
      origin: '',
      responsible: '',
      archived: matrix.status === 'Inativa',
      ...matrix,
    })),
    varroes: (merged.varroes || []).map((boar) => ({
      birthDate: '',
      archived: boar.status === 'Inativo',
      ...boar,
    })),
    coberturas: (merged.coberturas || []).map((coverage) => ({
      status: 'Prenhez confirmada',
      expectedDate: expectedBirthDate(coverage.date),
      ...coverage,
    })),
    partos: merged.partos || [],
    lotes: (merged.lotes || []).map((lot) => {
      const checklist = createChecklist(lot.responsible, lot.weights?.PN, lot.birthDate)
      const previous = lot.checklist || lot.manejos || {}
      Object.keys(checklist).forEach((key) => {
        if (key in previous) checklist[key] = checklistRecord(previous[key], lot.responsible)
      })
      return {
        currentQuantity: Number(lot.currentQuantity ?? lot.alive ?? 0),
        weanedAt: '',
        ...lot,
        checklist,
      }
    }),
    sanitario: merged.sanitario || [],
    historico: merged.historico || [],
    attachments: (merged.attachments || []).filter((item) => item?.entityType && item?.entityId),
    settings: {
      ...DEFAULT_SETTINGS,
      ...(merged.settings || {}),
      alertDays: Math.min(30, Math.max(1, Number(merged.settings?.alertDays || DEFAULT_SETTINGS.alertDays))),
    },
    permissions: Object.fromEntries(
      Object.entries(DEFAULT_PERMISSIONS).map(([role, defaults]) => [
        role,
        { ...defaults, ...(merged.permissions?.[role] || {}) },
      ]),
    ),
  }
}

function historyEntry(user, action, entityType, entityId, detail) {
  return {
    id: `H-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action,
    entityType,
    entityId,
    detail,
    responsible: user?.name || 'Sistema',
    createdAt: new Date().toISOString(),
  }
}

function withHistory(state, user, action, entityType, entityId, detail) {
  return {
    ...state,
    historico: [
      historyEntry(user, action, entityType, entityId, detail),
      ...(state.historico || []),
    ].slice(0, 500),
  }
}

function latestCoverage(state, matrixId) {
  return state.coberturas
    .filter((item) => item.matrixId === matrixId)
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

function matrixStatusAfterCoverageChange(state, matrixId) {
  const coverage = latestCoverage(state, matrixId)
  if (!coverage) return 'Vazia'
  if (coverage.status === 'Prenhez confirmada') return 'Prenha'
  if (coverage.status === 'Finalizada') return 'Lactação'
  if (coverage.status === 'Falhou') return 'Vazia'
  return 'Coberta'
}

export function AppDataProvider({ children }) {
  const { user, apiRequest } = useAuth()
  const [data, setData] = useState(() => normalizeState(createSeedData()))
  const [students, setStudents] = useState([])
  const [studentAnalytics, setStudentAnalytics] = useState([])
  const [feedPosts, setFeedPosts] = useState([])
  const [classes, setClasses] = useState([])
  const [educationTotals, setEducationTotals] = useState({
    activeClasses: 0,
    students: 0,
    pending: 0,
    activities: 0,
  })
  const [loading, setLoading] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [toast, setToast] = useState(null)
  const dataRef = useRef(data)
  const versionRef = useRef(1)
  const saveQueueRef = useRef(Promise.resolve())

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(null), 2800)
  }

  async function refreshStudents() {
    if (user?.role !== 'teacher') return []
    const [usersResult, analyticsResult] = await Promise.all([
      apiRequest('/api/users'),
      apiRequest('/api/analytics/students'),
    ])
    setStudents(usersResult.users)
    setStudentAnalytics(analyticsResult.students)
    return usersResult.users
  }

  async function refreshFeed() {
    if (!user) return []
    const result = await apiRequest('/api/feed')
    setFeedPosts(result.posts)
    return result.posts
  }

  async function refreshEducation() {
    if (!user) return []
    const result = await apiRequest('/api/education/summary')
    setClasses(result.classes)
    setEducationTotals(result.totals)
    return result.classes
  }

  async function refreshData() {
    if (!user) return
    setLoading(true)
    try {
      const tasks = [apiRequest('/api/state'), refreshFeed(), refreshEducation()]
      if (user.role === 'teacher') tasks.push(refreshStudents())
      const [stateResult] = await Promise.all(tasks)
      versionRef.current = stateResult.version
      const nextData = normalizeState({
        ...dataRef.current,
        ...stateResult.data,
      })
      dataRef.current = nextData
      setData(nextData)
      setSyncStatus('saved')
    } catch (error) {
      setSyncStatus('error')
      notify(error.message)
    } finally {
      setLoading(false)
      setDataReady(true)
    }
  }

  useEffect(() => {
    if (user) {
      setDataReady(false)
      refreshData()
    } else {
      setDataReady(false)
      setStudents([])
      setStudentAnalytics([])
      setFeedPosts([])
      setClasses([])
    }
  }, [user?.id])

  function queueStateSave(snapshot) {
    if (user?.role !== 'teacher') return
    setSyncStatus('saving')
    saveQueueRef.current = saveQueueRef.current
      .then(async () => {
        const result = await apiRequest('/api/state', {
          method: 'PUT',
          body: JSON.stringify({
            data: operationalData(snapshot),
            version: versionRef.current,
          }),
        })
        versionRef.current = result.version
        setSyncStatus('saved')
      })
      .catch((error) => {
        setSyncStatus('error')
        notify(error.message)
        if (error.status === 409) refreshData()
      })
  }

  function updateOperationalState(recipe, message) {
    if (user?.role !== 'teacher') {
      notify('Seu acesso a este módulo é somente para consulta. Os cadastros atuais não foram alterados.')
      return dataRef.current
    }
    const next = normalizeState(recipe(dataRef.current))
    dataRef.current = next
    setData(next)
    queueStateSave(next)
    if (message) notify(message)
    return next
  }

  function addMatriz(record) {
    const id = record.id || nextId('M', dataRef.current.matrizes)
    updateOperationalState((current) => withHistory({
      ...current,
      matrizes: [...current.matrizes, {
        ...record,
        id,
        archived: false,
        status: record.status || 'Vazia',
      }],
    }, user, 'Matriz criada', 'matriz', id, record.name), 'Matriz cadastrada com sucesso.')
  }

  function updateMatriz(id, record) {
    const nextMatrixId = record.id || id
    updateOperationalState((current) => withHistory({
      ...current,
      matrizes: current.matrizes.map((matrix) =>
        matrix.id === id ? { ...matrix, ...record, id: nextMatrixId } : matrix,
      ),
      coberturas: current.coberturas.map((item) =>
        item.matrixId === id ? { ...item, matrixId: nextMatrixId } : item,
      ),
      partos: current.partos.map((item) =>
        item.matrixId === id ? { ...item, matrixId: nextMatrixId } : item,
      ),
      lotes: current.lotes.map((item) =>
        item.matrixId === id ? { ...item, matrixId: nextMatrixId } : item,
      ),
      sanitario: current.sanitario.map((item) =>
        item.related === id ? { ...item, related: nextMatrixId } : item,
      ),
      attachments: current.attachments.map((item) =>
        item.entityType === 'matriz' && item.entityId === id
          ? { ...item, entityId: nextMatrixId }
          : item,
      ),
    }, user, 'Matriz editada', 'matriz', nextMatrixId, record.name), 'Matriz alterada com sucesso.')
  }

  function archiveMatriz(id) {
    updateOperationalState((current) => {
      const matrix = current.matrizes.find((item) => item.id === id)
      return withHistory({
        ...current,
        matrizes: current.matrizes.map((item) =>
          item.id === id
            ? { ...item, archived: true, previousStatus: item.status, status: 'Inativa' }
            : item,
        ),
      }, user, 'Matriz arquivada', 'matriz', id, matrix?.name)
    }, 'Matriz arquivada. Ela pode ser restaurada depois.')
  }

  function restoreMatriz(id) {
    updateOperationalState((current) => {
      const matrix = current.matrizes.find((item) => item.id === id)
      return withHistory({
        ...current,
        matrizes: current.matrizes.map((item) =>
          item.id === id
            ? { ...item, archived: false, status: item.previousStatus || 'Vazia' }
            : item,
        ),
      }, user, 'Matriz restaurada', 'matriz', id, matrix?.name)
    }, 'Matriz restaurada com sucesso.')
  }

  function deleteMatriz(id) {
    updateOperationalState((current) => {
      const matrix = current.matrizes.find((item) => item.id === id)
      const lotIds = current.lotes.filter((item) => item.matrixId === id).map((item) => item.id)
      const coverageIds = current.coberturas.filter((item) => item.matrixId === id).map((item) => item.id)
      const birthIds = current.partos.filter((item) => item.matrixId === id).map((item) => item.id)
      const sanitaryIds = current.sanitario
        .filter((item) => item.related === id || lotIds.includes(item.related))
        .map((item) => item.id)
      return withHistory({
        ...current,
        matrizes: current.matrizes.filter((item) => item.id !== id),
        coberturas: current.coberturas.filter((item) => item.matrixId !== id),
        partos: current.partos.filter((item) => item.matrixId !== id),
        lotes: current.lotes.filter((item) => item.matrixId !== id),
        sanitario: current.sanitario.filter((item) => item.related !== id && !lotIds.includes(item.related)),
        attachments: current.attachments.filter((item) => {
          if (item.entityType === 'matriz' && item.entityId === id) return false
          if (item.entityType === 'cobertura' && coverageIds.includes(item.entityId)) return false
          if (item.entityType === 'parto' && birthIds.includes(item.entityId)) return false
          if (item.entityType === 'lote' && lotIds.includes(item.entityId)) return false
          if (item.entityType === 'sanitario' && sanitaryIds.includes(item.entityId)) return false
          if (item.entityType === 'checklist' && lotIds.some((lotId) => item.entityId.startsWith(`${lotId}:`))) return false
          return true
        }),
      }, user, 'Matriz excluída definitivamente', 'matriz', id, matrix?.name)
    }, 'Matriz e registros vinculados excluídos.')
  }

  function addVarrao(record) {
    const id = record.id || nextId('V', dataRef.current.varroes)
    updateOperationalState((current) => withHistory({
      ...current,
      varroes: [...current.varroes, { ...record, id, archived: false }],
    }, user, 'Varrão criado', 'varrao', id, record.name), 'Varrão cadastrado com sucesso.')
  }

  function updateVarrao(id, record) {
    const nextBoarId = record.id || id
    updateOperationalState((current) => withHistory({
      ...current,
      varroes: current.varroes.map((item) =>
        item.id === id ? { ...item, ...record, id: nextBoarId } : item,
      ),
      coberturas: current.coberturas.map((item) =>
        item.boarId === id ? { ...item, boarId: nextBoarId } : item,
      ),
    }, user, 'Varrão editado', 'varrao', nextBoarId, record.name), 'Varrão alterado com sucesso.')
  }

  function archiveVarrao(id) {
    updateOperationalState((current) => withHistory({
      ...current,
      varroes: current.varroes.map((item) =>
        item.id === id ? { ...item, archived: true, status: 'Inativo' } : item,
      ),
    }, user, 'Varrão arquivado', 'varrao', id), 'Varrão arquivado.')
  }

  function deleteVarrao(id) {
    updateOperationalState((current) => withHistory({
      ...current,
      varroes: current.varroes.filter((item) => item.id !== id),
    }, user, 'Varrão excluído', 'varrao', id), 'Varrão excluído com sucesso.')
  }

  function addCobertura(record) {
    updateOperationalState((current) => {
      const id = nextId('C', current.coberturas)
      const coverage = {
        ...record,
        id,
        status: record.status || 'Aguardando confirmação',
        expectedDate: expectedBirthDate(record.date),
      }
      return withHistory({
        ...current,
        coberturas: [coverage, ...current.coberturas],
        matrizes: current.matrizes.map((matrix) =>
          matrix.id === record.matrixId ? { ...matrix, status: 'Coberta' } : matrix,
        ),
      }, user, 'Cobertura registrada', 'cobertura', id, `Previsão ${coverage.expectedDate}`)
    }, 'Cobertura registrada e previsão calculada.')
  }

  function updateCobertura(id, record) {
    updateOperationalState((current) => {
      const previous = current.coberturas.find((item) => item.id === id)
      const coverage = {
        ...previous,
        ...record,
        id,
        expectedDate: expectedBirthDate(record.date || previous.date),
      }
      const changedMatrixIds = new Set([previous?.matrixId, coverage.matrixId].filter(Boolean))
      const next = {
        ...current,
        coberturas: current.coberturas.map((item) => item.id === id ? coverage : item),
      }
      next.matrizes = current.matrizes.map((matrix) => {
        if (!changedMatrixIds.has(matrix.id)) return matrix
        const status = matrix.id === coverage.matrixId
          ? coverage.status === 'Prenhez confirmada' ? 'Prenha' : 'Coberta'
          : matrixStatusAfterCoverageChange(next, matrix.id)
        return { ...matrix, status }
      })
      return withHistory(next, user, 'Cobertura editada', 'cobertura', id, `Previsão ${coverage.expectedDate}`)
    }, 'Cobertura alterada com sucesso.')
  }

  function setCoberturaStatus(id, status) {
    updateOperationalState((current) => {
      const coverage = current.coberturas.find((item) => item.id === id)
      if (!coverage) return current
      const matrixStatus = status === 'Prenhez confirmada'
        ? 'Prenha'
        : status === 'Falhou'
          ? 'Vazia'
          : status === 'Finalizada'
            ? 'Lactação'
            : 'Coberta'
      return withHistory({
        ...current,
        coberturas: current.coberturas.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
        matrizes: current.matrizes.map((item) =>
          item.id === coverage.matrixId ? { ...item, status: matrixStatus } : item,
        ),
      }, user, `Cobertura: ${status}`, 'cobertura', id, coverage.matrixId)
    }, status === 'Prenhez confirmada' ? 'Prenhez confirmada.' : 'Status da cobertura atualizado.')
  }

  function deleteCobertura(id) {
    updateOperationalState((current) => {
      const coverage = current.coberturas.find((item) => item.id === id)
      if (!coverage) return current
      const next = {
        ...current,
        coberturas: current.coberturas.filter((item) => item.id !== id),
        attachments: current.attachments.filter((item) => !(item.entityType === 'cobertura' && item.entityId === id)),
      }
      next.matrizes = current.matrizes.map((matrix) =>
        matrix.id === coverage.matrixId
          ? { ...matrix, status: matrixStatusAfterCoverageChange(next, matrix.id) }
          : matrix,
      )
      return withHistory(next, user, 'Cobertura excluída', 'cobertura', id, coverage.matrixId)
    }, 'Cobertura excluída com sucesso.')
  }

  function addParto(record) {
    updateOperationalState((current) => {
      const birthId = nextId('P', current.partos)
      const lotId = nextId('L', current.lotes)
      const activeCoverage = current.coberturas
        .filter((coverage) => coverage.matrixId === record.matrixId && !['Falhou', 'Finalizada'].includes(coverage.status))
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const birth = { ...record, id: birthId, lotId }
      const lot = {
        id: lotId,
        matrixId: record.matrixId,
        birthId,
        birthDate: record.date,
        alive: Number(record.alive),
        currentQuantity: Number(record.alive),
        weights: {
          PN: Number(record.birthWeight) || null,
          P07: null,
          P14: null,
          P21: null,
          PD: null,
        },
        responsible: record.responsible,
        notes: 'Ninhada criada automaticamente a partir do parto.',
        occurrences: record.occurrences,
        checklist: createChecklist(record.responsible, record.birthWeight, record.date),
      }
      return withHistory({
        ...current,
        partos: [birth, ...current.partos],
        lotes: [lot, ...current.lotes],
        coberturas: current.coberturas.map((coverage) =>
          coverage.id === activeCoverage?.id
            ? { ...coverage, status: 'Finalizada' }
            : coverage,
        ),
        matrizes: current.matrizes.map((matrix) =>
          matrix.id === record.matrixId ? { ...matrix, status: 'Lactação' } : matrix,
        ),
      }, user, 'Parto registrado', 'parto', birthId, `${record.alive} nascidos vivos`)
    }, 'Parto registrado e ninhada criada.')
  }

  function updateParto(id, record) {
    updateOperationalState((current) => {
      const previous = current.partos.find((item) => item.id === id)
      if (!previous) return current
      const birth = { ...previous, ...record, id }
      return withHistory({
        ...current,
        partos: current.partos.map((item) => item.id === id ? birth : item),
        lotes: current.lotes.map((lot) =>
          lot.id === previous.lotId
            ? {
                ...lot,
                matrixId: birth.matrixId,
                birthDate: birth.date,
                alive: Number(birth.alive),
                currentQuantity: Math.min(Number(lot.currentQuantity || birth.alive), Number(birth.alive)),
                responsible: birth.responsible,
                occurrences: birth.occurrences,
                weights: {
                  ...lot.weights,
                  PN: Number(birth.birthWeight) || lot.weights?.PN || null,
                },
              }
            : lot,
        ),
      }, user, 'Parto editado', 'parto', id, birth.matrixId)
    }, 'Parto alterado com sucesso.')
  }

  function deleteParto(id) {
    updateOperationalState((current) => {
      const birth = current.partos.find((item) => item.id === id)
      if (!birth) return current
      const coverageToRestore = current.coberturas
        .filter((coverage) => coverage.matrixId === birth.matrixId && coverage.status === 'Finalizada')
        .sort((a, b) => b.date.localeCompare(a.date))[0]
      const next = {
        ...current,
        partos: current.partos.filter((item) => item.id !== id),
        lotes: current.lotes.filter((item) => item.id !== birth.lotId),
        sanitario: current.sanitario.filter((item) => item.related !== birth.lotId),
        attachments: current.attachments.filter((item) => {
          if (item.entityType === 'parto' && item.entityId === id) return false
          if (item.entityType === 'lote' && item.entityId === birth.lotId) return false
          if (item.entityType === 'sanitario') {
            const sanitary = current.sanitario.find((record) => record.id === item.entityId)
            if (sanitary?.related === birth.lotId) return false
          }
          if (item.entityType === 'checklist' && item.entityId.startsWith(`${birth.lotId}:`)) return false
          return true
        }),
        coberturas: current.coberturas.map((coverage) =>
          coverage.id === coverageToRestore?.id
            ? { ...coverage, status: 'Prenhez confirmada' }
            : coverage,
        ),
      }
      next.matrizes = current.matrizes.map((matrix) =>
        matrix.id === birth.matrixId ? { ...matrix, status: 'Prenha' } : matrix,
      )
      return withHistory(next, user, 'Parto excluído', 'parto', id, birth.matrixId)
    }, 'Parto e ninhada vinculada excluídos.')
  }

  function updateLote(id, record) {
    updateOperationalState((current) => withHistory({
      ...current,
      lotes: current.lotes.map((lot) => lot.id === id ? { ...lot, ...record, id } : lot),
    }, user, 'Ninhada editada', 'lote', id), 'Ninhada alterada com sucesso.')
  }

  function deleteLote(id) {
    updateOperationalState((current) => {
      const sanitaryIds = current.sanitario.filter((item) => item.related === id).map((item) => item.id)
      return withHistory({
        ...current,
        lotes: current.lotes.filter((lot) => lot.id !== id),
        partos: current.partos.map((birth) =>
          birth.lotId === id ? { ...birth, lotId: '' } : birth,
        ),
        sanitario: current.sanitario.filter((item) => item.related !== id),
        attachments: current.attachments.filter((item) => (
          !(item.entityType === 'lote' && item.entityId === id)
          && !(item.entityType === 'checklist' && item.entityId.startsWith(`${id}:`))
          && !(item.entityType === 'sanitario' && sanitaryIds.includes(item.entityId))
        )),
      }, user, 'Ninhada excluída', 'lote', id)
    }, 'Ninhada e registros vinculados excluídos.')
  }

  function addPesagem(lotId, phase, weight, responsible = '') {
    const checklistByPhase = {
      PN: 'pesoNascimento',
      P07: 'pesoP07',
      P14: 'pesoP14',
      P21: 'pesoP21',
      PD: 'pesoDesmame',
    }
    updateOperationalState((current) => withHistory({
      ...current,
      lotes: current.lotes.map((lot) => {
        if (lot.id !== lotId) return lot
        const key = checklistByPhase[phase]
        return {
          ...lot,
          weights: { ...lot.weights, [phase]: Number(weight) },
          checklist: {
            ...lot.checklist,
            [key]: {
              completed: true,
              date: toISODate(),
              responsible: responsible || lot.responsible,
              notes: `Peso médio: ${Number(weight)} kg`,
            },
          },
        }
      }),
    }, user, `Pesagem ${phase} registrada`, 'lote', lotId, `${weight} kg`), 'Pesagem registrada com sucesso.')
  }

  function updateChecklistItem(lotId, key, record) {
    const item = CHECKLIST_ITEMS.find((entry) => entry.key === key)
    updateOperationalState((current) => withHistory({
      ...current,
      lotes: current.lotes.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              checklist: {
                ...lot.checklist,
                [key]: {
                  completed: true,
                  date: record.date || toISODate(),
                  responsible: record.responsible || lot.responsible,
                  notes: record.notes || '',
                },
              },
            }
          : lot,
      ),
    }, user, 'Checklist concluído', 'lote', lotId, item?.label || key), 'Checklist atualizado com data e responsável.')
  }

  function undoChecklistItem(lotId, key) {
    const item = CHECKLIST_ITEMS.find((entry) => entry.key === key)
    updateOperationalState((current) => withHistory({
      ...current,
      lotes: current.lotes.map((lot) =>
        lot.id === lotId
          ? {
              ...lot,
              checklist: {
                ...lot.checklist,
                [key]: checklistRecord(false),
              },
            }
          : lot,
      ),
    }, user, 'Conclusão desfeita', 'lote', lotId, item?.label || key), 'Conclusão removida do checklist.')
  }

  function addSanitario(record) {
    updateOperationalState((current) => {
      const id = nextId('S', current.sanitario)
      return withHistory({
        ...current,
        sanitario: [{ ...record, id }, ...current.sanitario],
      }, user, 'Registro sanitário criado', 'sanitario', id, record.product)
    }, 'Manejo sanitário registrado.')
  }

  function updateSanitario(id, record) {
    updateOperationalState((current) => withHistory({
      ...current,
      sanitario: current.sanitario.map((item) => item.id === id ? { ...item, ...record, id } : item),
    }, user, 'Registro sanitário editado', 'sanitario', id, record.product), 'Registro sanitário alterado.')
  }

  function deleteSanitario(id) {
    updateOperationalState((current) => withHistory({
      ...current,
      sanitario: current.sanitario.filter((item) => item.id !== id),
      attachments: current.attachments.filter((item) => !(item.entityType === 'sanitario' && item.entityId === id)),
    }, user, 'Registro sanitário excluído', 'sanitario', id), 'Registro sanitário excluído.')
  }

  function addAttachment(record) {
    if (!isValidHttpUrl(record.url)) {
      notify('Informe uma URL válida iniciada por http:// ou https://.')
      return false
    }
    const attachment = {
      id: generateId('ANX'),
      entityType: sanitizeInput(record.entityType, 40),
      entityId: sanitizeInput(record.entityId, 100),
      title: sanitizeInput(record.title, 120),
      type: ['Imagem', 'Vídeo', 'Documento'].includes(record.type) ? record.type : 'Documento',
      url: String(record.url).trim(),
      date: record.date || toISODate(),
      responsible: sanitizeInput(record.responsible, 120),
      notes: sanitizeInput(record.notes, 1000),
      createdAt: new Date().toISOString(),
    }
    updateOperationalState((current) => withHistory({
      ...current,
      attachments: [attachment, ...current.attachments],
    }, user, 'Anexo adicionado', attachment.entityType, attachment.entityId, attachment.title), 'Anexo salvo no histórico.')
    return attachment
  }

  function updateAttachment(id, record) {
    if (!isValidHttpUrl(record.url)) {
      notify('Informe uma URL válida iniciada por http:// ou https://.')
      return false
    }
    updateOperationalState((current) => withHistory({
      ...current,
      attachments: current.attachments.map((item) => item.id === id ? {
        ...item,
        title: sanitizeInput(record.title, 120),
        type: ['Imagem', 'Vídeo', 'Documento'].includes(record.type) ? record.type : 'Documento',
        url: String(record.url).trim(),
        date: record.date || item.date,
        responsible: sanitizeInput(record.responsible, 120),
        notes: sanitizeInput(record.notes, 1000),
      } : item),
    }, user, 'Anexo editado', record.entityType, record.entityId, record.title), 'Anexo atualizado.')
    return true
  }

  function deleteAttachment(id) {
    updateOperationalState((current) => {
      const attachment = current.attachments.find((item) => item.id === id)
      return withHistory({
        ...current,
        attachments: current.attachments.filter((item) => item.id !== id),
      }, user, 'Anexo excluído', attachment?.entityType || 'anexo', attachment?.entityId || id, attachment?.title)
    }, 'Anexo excluído.')
  }

  function updateSettings(record) {
    updateOperationalState((current) => withHistory({
      ...current,
      settings: {
        ...current.settings,
        systemName: sanitizeInput(record.systemName, 80),
        farmName: sanitizeInput(record.farmName, 120),
        teacherName: sanitizeInput(record.teacherName, 120),
        alertDays: Math.min(30, Math.max(1, Number(record.alertDays || 7))),
      },
    }, user, 'Configurações atualizadas', 'sistema', 'settings'), 'Configurações salvas.')
  }

  function resetSettings() {
    updateOperationalState((current) => withHistory({
      ...current,
      settings: { ...DEFAULT_SETTINGS },
    }, user, 'Configurações restauradas', 'sistema', 'settings'), 'Configurações padrão restauradas.')
  }

  function updatePermissions(record) {
    const permissions = Object.fromEntries(
      Object.entries(DEFAULT_PERMISSIONS).map(([role, defaults]) => [
        role,
        Object.fromEntries(
          Object.keys(defaults).map((key) => [key, role === 'teacher' ? true : Boolean(record?.[role]?.[key])]),
        ),
      ]),
    )
    updateOperationalState((current) => withHistory({
      ...current,
      permissions,
    }, user, 'Permissões operacionais atualizadas', 'sistema', 'permissions'), 'Permissões salvas com sucesso.')
  }

  function removeDemoData() {
    updateOperationalState((current) => {
      const next = {
        ...current,
        matrizes: current.matrizes.filter((item) => !DEMO_IDS.matrizes.has(item.id)),
        varroes: current.varroes.filter((item) => !DEMO_IDS.varroes.has(item.id)),
        coberturas: current.coberturas.filter((item) => !DEMO_IDS.coberturas.has(item.id)),
        partos: current.partos.filter((item) => !DEMO_IDS.partos.has(item.id)),
        lotes: current.lotes.filter((item) => !DEMO_IDS.lotes.has(item.id)),
        sanitario: current.sanitario.filter((item) => !DEMO_IDS.sanitario.has(item.id)),
        attachments: current.attachments.filter((item) => {
          if (item.entityType === 'matriz') return !DEMO_IDS.matrizes.has(item.entityId)
          if (item.entityType === 'cobertura') return !DEMO_IDS.coberturas.has(item.entityId)
          if (item.entityType === 'parto') return !DEMO_IDS.partos.has(item.entityId)
          if (item.entityType === 'lote') return !DEMO_IDS.lotes.has(item.entityId)
          if (item.entityType === 'sanitario') return !DEMO_IDS.sanitario.has(item.entityId)
          if (item.entityType === 'checklist') return ![...DEMO_IDS.lotes].some((id) => item.entityId.startsWith(`${id}:`))
          return true
        }),
      }
      return withHistory(next, user, 'Dados de demonstração removidos', 'sistema', 'main')
    }, 'Somente os registros de demonstração foram removidos.')
  }

  function restoreDemoData() {
    updateOperationalState(() => withHistory(
      normalizeState(createSeedData()),
      user,
      'Dados de demonstração restaurados',
      'sistema',
      'main',
    ), 'Dados de demonstração restaurados.')
  }

  function clearOperationalData() {
    updateOperationalState(() => withHistory(
      normalizeState(EMPTY_OPERATIONAL_DATA),
      user,
      'Todos os dados operacionais foram limpos',
      'sistema',
      'main',
    ), 'Todos os dados operacionais foram removidos.')
  }

  function importOperationalData(payload) {
    const requiredCollections = ['matrizes', 'varroes', 'coberturas', 'partos', 'lotes', 'sanitario']
    if (!payload || typeof payload !== 'object' || requiredCollections.some((key) => !Array.isArray(payload[key]))) {
      notify('Backup incompatível. Use um arquivo exportado pelo Ciclo 114.')
      return false
    }
    updateOperationalState(() => withHistory(
      normalizeState(payload),
      user,
      'Dados importados',
      'sistema',
      'main',
    ), 'Dados importados e sincronizados.')
    return true
  }

  async function createStudent(record) {
    const result = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    await refreshStudents()
    notify('Aluno cadastrado. O histórico ficará vinculado ao perfil.')
    return result.user
  }

  async function createClass(record) {
    const result = await apiRequest('/api/education/classes', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    await refreshEducation()
    notify('Turma criada. O link de convite já está disponível.')
    return result.class
  }

  async function updateStudent(id, record) {
    const result = await apiRequest(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(record),
    })
    await refreshStudents()
    notify('Perfil do aluno atualizado.')
    return result.user
  }

  async function archiveStudent(id) {
    const result = await apiRequest(`/api/users/${id}`, { method: 'DELETE' })
    await refreshStudents()
    notify(result.message)
  }

  async function addFeedPost(record) {
    const result = await apiRequest('/api/feed', {
      method: 'POST',
      body: JSON.stringify(record),
    })
    setFeedPosts((current) => [result.post, ...current])
    notify('Atividade publicada no mural.')
    if (user?.role === 'teacher') refreshStudents()
  }

  async function togglePostLike(postId) {
    const result = await apiRequest(`/api/feed/${postId}/like`, { method: 'POST' })
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: result.liked,
              likes: result.liked
                ? [...post.likes, { id: user.id, name: user.name }]
                : post.likes.filter((like) => like.id !== user.id),
            }
          : post,
      ),
    )
  }

  async function addPostComment(postId, text) {
    const result = await apiRequest(`/api/feed/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    })
    setFeedPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, result.comment] }
          : post,
      ),
    )
    notify('Comentário publicado.')
  }

  async function deletePost(postId) {
    await apiRequest(`/api/feed/${postId}`, { method: 'DELETE' })
    setFeedPosts((current) => current.filter((post) => post.id !== postId))
    notify('Publicação removida. O registro de auditoria foi preservado.')
  }

  const activeStudents = students.filter((student) => student.status !== 'archived')
  const alunos = activeStudents.map((student) => ({
    id: student.id,
    name: student.name,
    className: student.className,
    role: student.responsibility,
    notes: student.privateNotes || '',
    avatarPath: student.avatarPath,
    status: student.status,
  }))

  const value = useMemo(
    () => ({
      ...data,
      alunos,
      students,
      studentAnalytics,
      feedPosts,
      classes,
      educationTotals,
      loading,
      dataReady,
      syncStatus,
      addMatriz,
      updateMatriz,
      archiveMatriz,
      restoreMatriz,
      deleteMatriz,
      addVarrao,
      updateVarrao,
      archiveVarrao,
      deleteVarrao,
      addCobertura,
      updateCobertura,
      setCoberturaStatus,
      deleteCobertura,
      addParto,
      updateParto,
      deleteParto,
      updateLote,
      deleteLote,
      addPesagem,
      updateChecklistItem,
      undoChecklistItem,
      addSanitario,
      updateSanitario,
      deleteSanitario,
      addAttachment,
      updateAttachment,
      deleteAttachment,
      updateSettings,
      resetSettings,
      updatePermissions,
      removeDemoData,
      restoreDemoData,
      clearOperationalData,
      importOperationalData,
      createStudent,
      createClass,
      updateStudent,
      archiveStudent,
      addFeedPost,
      togglePostLike,
      addPostComment,
      deletePost,
      refreshData,
      refreshStudents,
      refreshEducation,
      notify,
    }),
    [
      data,
      alunos,
      students,
      studentAnalytics,
      feedPosts,
      classes,
      educationTotals,
      loading,
      dataReady,
      syncStatus,
    ],
  )

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-semibold text-white shadow-2xl lg:bottom-8">
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
