import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProyectoList from './components/ProyectoList'
import DocumentoList from './components/DocumentoList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/proyectos" element={<ProyectoList />} />
          <Route path="/documentos" element={<DocumentoList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
