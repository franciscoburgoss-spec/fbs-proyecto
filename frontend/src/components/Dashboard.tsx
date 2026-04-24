import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import { useTraceability } from '../hooks/useTraceability'
import DocumentTable from './DocumentTable'
import ProjectTimeline from './ProjectTimeline'
import TraceabilitySummary from './TraceabilitySummary'
import QuickActions from './QuickActions'
import ExportButton from './ExportButton'
import { transicionarDocumento } from '../api'
import type { Documento } from '../types'

function getNextEstado(estado: string): string | null {
  const map: Record<string, string> = {
    ING: 'OBS',
    OBS: 'COR',
    COR: 'APB',
  }
  return map[estado] || null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { proyectoActivoId } = useProyectoActivoContext()
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

  const handleAction = async (doc: Documento) => {
    const siguiente = getNextEstado(doc.estado)
    if (!siguiente) {
      alert('No hay transicion disponible para este documento')
      return
    }

    setDocSeleccionado(doc)
    if (doc.estado === 'ING' && siguiente === 'OBS') {
      setObservacion('')
      setShowModal(true)
    } else {
      try {
        await transicionarDocumento(doc.id, siguiente, {})
        fetch()
      } catch (e: any) {
        alert(e.response?.data?.detail || e.message)
      }
    }
  }

  const handleConfirmar = async () => {
    if (!docSeleccionado) return
    try {
      await transicionarDocumento(docSeleccionado.id, 'OBS', { observacion: observacion || undefined })
      setShowModal(false)
      setDocSeleccionado(null)
      fetch()
    } catch (e: any) {
      alert(e.response?.data?.detail || e.message)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%' }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Subheader */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>
              {proyecto?.nombre || 'Dashboard'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
              Engineering Designs
            </p>
          </div>
          <ExportButton entidad="documentos" />
        </div>

        {loading ? (
          <p style={{ padding: 24, color: '#9ca3af', textAlign: 'center' }}>Loading documents...</p>
        ) : (
          <DocumentTable documentos={documentos} onAction={handleAction} />
        )}
      </div>

      {/* Right sidebar */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Timeline */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
          {proyecto ? (
            <ProjectTimeline etapaActual={proyecto.etapa_actual} />
          ) : (
            <div style={{ padding: 16, color: '#9ca3af' }}>Loading timeline...</div>
          )}
        </div>

        {/* Traceability */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
          {loadingTrace ? (
            <div style={{ padding: 16, color: '#9ca3af' }}>Loading traceability...</div>
          ) : (
            <TraceabilitySummary porModulo={porModulo} />
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
          <QuickActions
            onUpload={() => navigate('/documents')}
            onReport={() => navigate('/modules')}
          />
        </div>
      </div>

      {/* Modal observacion */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 400, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Add Observation</h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
              Document: <strong>{docSeleccionado?.nombre}</strong>
            </p>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Describe the observation..."
              style={{
                width: '100%',
                minHeight: 100,
                padding: 10,
                borderRadius: 6,
                border: '1px solid #d1d5db',
                marginBottom: 16,
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmar}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}