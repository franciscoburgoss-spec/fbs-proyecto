import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProyectoList from './components/ProyectoList'
import DocumentoList from './components/DocumentoList'
import LoginPage from './components/LoginPage'
import AdminPage from './components/AdminPage'
import PerfilPage from './components/PerfilPage'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ textAlign: 'center', marginTop: 100 }}>Cargando...</p>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/proyectos" element={<ProyectoList />} />
        <Route path="/documentos" element={<DocumentoList />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
