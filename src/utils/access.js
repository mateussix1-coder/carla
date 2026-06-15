export const ACCESS_MODULES = [
  { key: 'academic', label: 'Turmas, atividades, agenda e mural', path: '/aluno' },
  { key: 'matrizes', label: 'Matrizes', path: '/matrizes' },
  { key: 'gestacao', label: 'Gestação', path: '/gestacao' },
  { key: 'partos', label: 'Partos e maternidade', path: '/partos' },
  { key: 'leitoes', label: 'Leitões do nascimento ao desmame', path: '/leitoes' },
  { key: 'varroes', label: 'Varrões', path: '/varroes' },
  { key: 'coberturas', label: 'Coberturas e reprodução', path: '/coberturas' },
  { key: 'sanitario', label: 'Manejo sanitário', path: '/sanitario' },
  { key: 'relatorios', label: 'Relatórios', path: '/relatorios' },
]

export const ACCESS_MODULE_KEYS = ACCESS_MODULES.map((item) => item.key)
export const DEFAULT_STUDENT_MODULES = ['academic']
export const DEFAULT_MONITOR_MODULES = [...ACCESS_MODULE_KEYS]

export function normalizeAccessModules(value, fallback = DEFAULT_STUDENT_MODULES) {
  let items = value
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items)
    } catch {
      items = []
    }
  }
  if (!Array.isArray(items)) items = []
  const allowed = new Set(ACCESS_MODULE_KEYS)
  const normalized = [...new Set(items.filter((item) => allowed.has(item)))]
  return normalized.length ? normalized : [...fallback]
}

export function accessModulesForRole(value, role = 'student') {
  return normalizeAccessModules(
    value,
    role === 'monitor' ? DEFAULT_MONITOR_MODULES : DEFAULT_STUDENT_MODULES,
  )
}

export function hasModuleAccess(user, moduleKey) {
  if (user?.role === 'teacher') return true
  return normalizeAccessModules(user?.accessModules).includes(moduleKey)
}

export function firstAllowedPath(user) {
  if (user?.role === 'teacher') return '/'
  const modules = normalizeAccessModules(user?.accessModules)
  const first = ACCESS_MODULES.find((item) => modules.includes(item.key))
  return first?.path || '/aluno'
}
