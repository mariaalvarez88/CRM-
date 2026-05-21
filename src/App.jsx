import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Centers from '@/pages/Centers'
import CenterDetail from '@/pages/CenterDetail'
import ClientDetail from '@/pages/ClientDetail'
import AllClients from '@/pages/AllClients'
import ConsentForm from '@/pages/ConsentForm'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
})

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50">
      <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-500 rounded-full animate-spin" style={{ borderWidth: 3 }} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      {/* Ruta pública — formulario de consentimiento para la clienta */}
      <Route path="/consent/:token" element={<ConsentForm />} />

      {/* Ruta de login */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Rutas protegidas */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Centers />} />
        <Route path="/center/:id" element={<CenterDetail />} />
        <Route path="/client/:id" element={<ClientDetail />} />
        <Route path="/clients" element={<AllClients />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" closeButton />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}
