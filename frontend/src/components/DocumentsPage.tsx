import { useState } from 'react'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import DocumentTable from './DocumentTable'

export default function DocumentsPage() {
  const { proyectoActivoId } = useProyectoActivoContext()
  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroEtapa, setFiltroEtapa] = useState('')

  const { documentos, loading } = useDocumentos({
    proyecto_id: proyectoActivoId,
    modulo: filtroModulo || undefined,
    estado: filtroEstado || undefined,
    etapa: filtroEtapa || undefined,
  })

  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#111827' }}>
        All Documents
      </h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff' }}
        >
          <option value="">All Modules</option>
          <option value="EST">EST</option>
          <option value="HAB">HAB</option>
          <option value="MDS">MDS</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff' }}
        >
          <option value="">All Status</option>
          <option value="ING">ING</option>
          <option value="OBS">OBS</option>
          <option value="COR">COR</option>
          <option value="APB">APB</option>
        </select>
        <select
          value={filtroEtapa}
          onChange={(e) => setFiltroEtapa(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, background: '#fff' }}
        >
          <option value="">All Stages</option>
          <option value="CHK">CHK</option>
          <option value="R1">R1</option>
          <option value="R2">R2</option>
          <option value="R3">R3</option>
        </select>
      </div>

      {loading && <p style={{ color: '#9ca3af' }}>Loading documents...</p>}

      <DocumentTable documentos={documentos} />
    </div>
  )
}