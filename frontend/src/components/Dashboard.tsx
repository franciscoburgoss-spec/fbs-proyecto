import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivo } from '../hooks/useProyectoActivo'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import { useTraceability } from '../hooks/useTraceability'
import DocumentTable from './DocumentTable'
import ProjectTimeline from './ProjectTimeline'
import TraceabilitySummary from './TraceabilitySummary'
import QuickActions from './QuickActions'
import ExportButton from './ExportButton'
import { transicionarDocumento } from '../api'
import type { Documento } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { proyectoActivoId } = useProyectoActivo()
  const { detalle, cargarDetalle } = useProyectoDetail()
  const { documentos, loading, fetch } = useDocumentos({ proyecto_id: proyectoActivoId })
  const { porModulo, loading: loadingTrace } = useTraceability(proyectoActivoId)
  const [showModal, setShowModal] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [docSeleccionado, setDocSeleccionado] = useState<Documento | null>(null)

  useEffect(() => {
    cargarDetalle(proyectoActivoId)
  }, [proyectoActivoId, cargarDetalle])

  const proyecto = detalle?.proyecto

  const handleTransicionar = async (doc: Documento) => {
    setDocSeleccionado(doc)
    if (doc.estado === 'ING') {
      setObservacion('')
      setShowModal(true)
    } else {
      try {
        await transicionarDocumento(doc.id, 'siguiente', {})
        fetch()
      } catch (e: any) {
        alert(e.response?.data?.detail || e.message)
      }
    }
  }

  const handleConfirmarTransicion = async () => {
    if (!docSeleccionado) return
    try {
      await transicionarDocumento(docSeleccionado.id, 'siguiente', { observacion: observacion || undefined })
      setShowModal(false)
      setDocSeleccionado(null)
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message)
    }
  }

  return (
    <div>
      {/* Título y export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' }}>
            {proyecto?.nombre || 'Dashboard'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            {proyecto?.descripcion || 'Engineering Designs'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <ExportButton entidad="documentos" />
        </div>
      </div>

      {/* Tabla de documentos */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', marginBottom: 16 }}>
        {loading ? (
          <p style={{ padding: 24, color: '#6b7280', textAlign: 'center' }}>Cargando documentos...</p>
        ) : (
          <DocumentTable documentos={documentos} onTransicionar={handleTransicionar} />
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions
        onUpload={() => navigate('/documents')}
        onReport={() => navigate('/modules')}
      />

      {/* Sidebar widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        {/* Timeline */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
          {proyecto ? (
            <ProjectTimeline etapaActual={proyecto.etapa_actual} />
          ) : (
            <div style={{ padding: 16, color: '#6b7280' }}>Cargando timeline...</div>
          )}
        </div>

        {/* Traceability */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
          {loadingTrace ? (
            <div style={{ padding: 16, color: '#6b7280' }}>Cargando traceability...</div>
          ) : (
            <TraceabilitySummary porModulo={porModulo} />
          )}
        </div>
      </div>

      {/* Modal de observacion */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 12px' }}>Agregar Observacion</h3>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe la observacion..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 8,
                borderRadius: 4,
                border: '1px solid #d1d5db',
                marginBottom: 12,
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarTransicion}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
