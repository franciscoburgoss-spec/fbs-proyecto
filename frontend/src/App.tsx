import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProyectoActivoProvider } from './context/ProyectoActivoContext'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import DocumentsPage from './components/DocumentsPage'
import ModulesPage from './components/ModulesPage'
import TasksPage from './components/TasksPage'
import UsersRolesPage from './components/UsersRolesPage'
import SettingsPage from './components/SettingsPage'
import LoginPage from './components/LoginPage'

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ textAlign: 'center', marginTop: 100 }}>Cargando...</p>
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/modules" element={<ModulesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/users" element={<UsersRolesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProyectoActivoProvider>
          <AppRoutes />
        </ProyectoActivoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
