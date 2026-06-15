import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { firstAllowedPath, hasModuleAccess } from './utils/access.js'

const AlunoDashboard = lazy(() => import('./pages/AlunoDashboard.jsx'))
const Alunos = lazy(() => import('./pages/Alunos.jsx'))
const Agenda = lazy(() => import('./pages/Agenda.jsx'))
const Atividades = lazy(() => import('./pages/Atividades.jsx'))
const Cadastro = lazy(() => import('./pages/Cadastro.jsx'))
const Coberturas = lazy(() => import('./pages/Coberturas.jsx'))
const Configuracoes = lazy(() => import('./pages/Configuracoes.jsx'))
const DadosDemonstracao = lazy(() => import('./pages/DadosDemonstracao.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Entrar = lazy(() => import('./pages/Entrar.jsx'))
const Gestacao = lazy(() => import('./pages/Gestacao.jsx'))
const Leitoes = lazy(() => import('./pages/Leitoes.jsx'))
const Matrizes = lazy(() => import('./pages/Matrizes.jsx'))
const MatrizDetalhe = lazy(() => import('./pages/MatrizDetalhe.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Partos = lazy(() => import('./pages/Partos.jsx'))
const Perfil = lazy(() => import('./pages/Perfil.jsx'))
const Permissoes = lazy(() => import('./pages/Permissoes.jsx'))
const RedeAcademica = lazy(() => import('./pages/RedeAcademica.jsx'))
const Relatorios = lazy(() => import('./pages/Relatorios.jsx'))
const Sanitario = lazy(() => import('./pages/Sanitario.jsx'))
const TurmaDetalhe = lazy(() => import('./pages/TurmaDetalhe.jsx'))
const Turmas = lazy(() => import('./pages/Turmas.jsx'))
const Varroes = lazy(() => import('./pages/Varroes.jsx'))

function LoadingScreen() {
  return (
    <div className="page-shell">
      <div className="surface-card flex min-h-72 items-center justify-center">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Carregando módulo...</p>
        </div>
      </div>
    </div>
  )
}

function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  return <Outlet />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={firstAllowedPath(user)} replace />
  return children
}

function RegistrationRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const hasInvitation = new URLSearchParams(location.search).has('convite')

  if (loading) return <LoadingScreen />
  if (user && !hasInvitation) return <Navigate to={firstAllowedPath(user)} replace />
  return children
}

function TeacherOnly({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'teacher') return <Navigate to={firstAllowedPath(user)} replace />
  return children
}

function ModuleOnly({ moduleKey, moduleKeys, children }) {
  const { user } = useAuth()
  const allowedModules = moduleKeys || [moduleKey]
  if (!allowedModules.some((key) => hasModuleAccess(user, key))) {
    return <Navigate to={firstAllowedPath(user)} replace />
  }
  return children
}

function HomeRoute() {
  const { user } = useAuth()
  return user.role === 'teacher'
    ? <Dashboard />
    : <Navigate to={firstAllowedPath(user)} replace />
}

export default function ZootecniaApp() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/entrar" element={<PublicOnly><Entrar /></PublicOnly>} />
        <Route path="/cadastro" element={<RegistrationRoute><Cadastro /></RegistrationRoute>} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/aluno" element={<ModuleOnly moduleKey="academic"><AlunoDashboard /></ModuleOnly>} />
            <Route path="/rede" element={<ModuleOnly moduleKey="academic"><RedeAcademica /></ModuleOnly>} />
            <Route path="/turmas" element={<ModuleOnly moduleKey="academic"><Turmas /></ModuleOnly>} />
            <Route path="/turmas/:id" element={<ModuleOnly moduleKey="academic"><TurmaDetalhe /></ModuleOnly>} />
            <Route path="/atividades" element={<ModuleOnly moduleKey="academic"><Atividades /></ModuleOnly>} />
            <Route path="/agenda" element={<ModuleOnly moduleKey="academic"><Agenda /></ModuleOnly>} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracoes" element={<TeacherOnly><Configuracoes /></TeacherOnly>} />

            <Route path="/matrizes" element={<ModuleOnly moduleKey="matrizes"><Matrizes /></ModuleOnly>} />
            <Route
              path="/matrizes/:id"
              element={(
                <ModuleOnly moduleKeys={['matrizes', 'gestacao', 'partos', 'coberturas', 'relatorios']}>
                  <MatrizDetalhe />
                </ModuleOnly>
              )}
            />
            <Route path="/varroes" element={<ModuleOnly moduleKey="varroes"><Varroes /></ModuleOnly>} />
            <Route path="/coberturas" element={<ModuleOnly moduleKey="coberturas"><Coberturas /></ModuleOnly>} />
            <Route path="/gestacao" element={<ModuleOnly moduleKey="gestacao"><Gestacao /></ModuleOnly>} />
            <Route path="/partos" element={<ModuleOnly moduleKey="partos"><Partos /></ModuleOnly>} />
            <Route path="/leitoes" element={<ModuleOnly moduleKey="leitoes"><Leitoes /></ModuleOnly>} />
            <Route path="/sanitario" element={<ModuleOnly moduleKey="sanitario"><Sanitario /></ModuleOnly>} />
            <Route path="/relatorios" element={<ModuleOnly moduleKey="relatorios"><Relatorios /></ModuleOnly>} />

            <Route path="/alunos" element={<TeacherOnly><Alunos /></TeacherOnly>} />
            <Route path="/permissoes" element={<TeacherOnly><Permissoes /></TeacherOnly>} />
            <Route path="/dados-demonstracao" element={<TeacherOnly><DadosDemonstracao /></TeacherOnly>} />
            <Route path="/dados" element={<TeacherOnly><DadosDemonstracao /></TeacherOnly>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
