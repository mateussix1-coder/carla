import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'

const Alunos = lazy(() => import('./pages/Alunos.jsx'))
const Coberturas = lazy(() => import('./pages/Coberturas.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Gestacao = lazy(() => import('./pages/Gestacao.jsx'))
const Leitoes = lazy(() => import('./pages/Leitoes.jsx'))
const Matrizes = lazy(() => import('./pages/Matrizes.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Partos = lazy(() => import('./pages/Partos.jsx'))
const Relatorios = lazy(() => import('./pages/Relatorios.jsx'))
const Sanitario = lazy(() => import('./pages/Sanitario.jsx'))
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

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matrizes" element={<Matrizes />} />
          <Route path="/varroes" element={<Varroes />} />
          <Route path="/coberturas" element={<Coberturas />} />
          <Route path="/gestacao" element={<Gestacao />} />
          <Route path="/partos" element={<Partos />} />
          <Route path="/leitoes" element={<Leitoes />} />
          <Route path="/sanitario" element={<Sanitario />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
