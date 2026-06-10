import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import { useAuth } from './context/AuthContext.jsx'

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
  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={user.role === 'teacher' ? '/' : '/aluno'} replace />
  return children
}

function TeacherOnly({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'teacher') return <Navigate to="/aluno" replace />
  return children
}

function StudentOnly({ children }) {
  const { user } = useAuth()
  if (user?.role !== 'student') return <Navigate to="/" replace />
  return children
}

function HomeRoute() {
  const { user } = useAuth()
  return user.role === 'teacher' ? <Dashboard /> : <Navigate to="/aluno" replace />
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          path="/entrar"
          element={<PublicOnly><Entrar /></PublicOnly>}
        />
        <Route
          path="/cadastro"
          element={<PublicOnly><Cadastro /></PublicOnly>}
        />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/aluno" element={<StudentOnly><AlunoDashboard /></StudentOnly>} />
            <Route path="/rede" element={<RedeAcademica />} />
            <Route path="/turmas" element={<Turmas />} />
            <Route path="/turmas/:id" element={<TurmaDetalhe />} />
            <Route path="/atividades" element={<Atividades />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/configuracoes" element={<TeacherOnly><Configuracoes /></TeacherOnly>} />

            <Route path="/matrizes" element={<TeacherOnly><Matrizes /></TeacherOnly>} />
            <Route path="/matrizes/:id" element={<TeacherOnly><MatrizDetalhe /></TeacherOnly>} />
            <Route path="/varroes" element={<TeacherOnly><Varroes /></TeacherOnly>} />
            <Route path="/coberturas" element={<TeacherOnly><Coberturas /></TeacherOnly>} />
            <Route path="/gestacao" element={<TeacherOnly><Gestacao /></TeacherOnly>} />
            <Route path="/partos" element={<TeacherOnly><Partos /></TeacherOnly>} />
            <Route path="/leitoes" element={<TeacherOnly><Leitoes /></TeacherOnly>} />
            <Route path="/sanitario" element={<TeacherOnly><Sanitario /></TeacherOnly>} />
            <Route path="/alunos" element={<TeacherOnly><Alunos /></TeacherOnly>} />
            <Route path="/relatorios" element={<TeacherOnly><Relatorios /></TeacherOnly>} />
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
