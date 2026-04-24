import { useState } from 'react'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivo } from '../hooks/useProyectoActivo'
import DocumentTable from './DocumentTable'

export default function DocumentsPage() {
  const { proyectoActivoId } = useProyectoActivo()
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
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#111827' }}>
        All Documents
      </h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">All Modules</option>
          <option value="EST">EST</option>
          <option value="HAB">HAB</option>
          <option value="MDS">MDS</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
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
          style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
        >
          <option value="">All Stages</option>
          <option value="CHK">CHK</option>
          <option value="R1">R1</option>
          <option value="R2">R2</option>
          <option value="R3">R3</option>
        </select>
      </div>

      {loading && <p style={{ color: '#6b7280' }}>Cargando documentos...</p>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        <DocumentTable documentos={documentos} />
      </div>
    </div>
  )
}