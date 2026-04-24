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
import TransitionModal from './TransitionModal'
import { transicionarDocumento } from '../api'
import type { Documento } from '../types'

export default function Dashboard() {
  const navigate = useNavigate()
  const { proyectoActivoId } = useProyectoActivoContext()
  const { detalle, cargarDetalle } = useProyectoDetail()
  const { documentos, loading, fetch } = useDocumentos({ proyecto_id: proyectoActivoId })
  const { porModulo, loading: loadingTrace } = useTraceability(proyectoActivoId)

  const [docSeleccionado, setDocSeleccionado] = useState<Documento | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    cargarDetalle(proyectoActivoId)
  }, [proyectoActivoId, cargarDetalle])

  const proyecto = detalle?.proyecto

  // Toast al cargar proyecto
  useEffect(() => {
    if (proyecto) {
      setToast(`Project loaded: ${proyecto.nombre}`)
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [proyecto?.id])

  const handleAction = (doc: Documento) => {
    setDocSeleccionado(doc)
  }

  const handleConfirmTransition = async (
    docId: number,
    nuevoEstado: string,
    observacion?: string
  ) => {
    const payload: Record<string, string> = {}
    if (observacion) payload.observacion = observacion
    await transicionarDocumento(docId, nuevoEstado, payload)
    fetch()
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', position: 'relative' }}>
      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 24,
            zIndex: 2000,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 8,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.3s ease',
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#10b981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              flexShrink: 0,
            }}
          >
            &#10003;
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#065f46' }}>{toast}</span>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Subheader */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: '#111827',
              }}
            >
              {proyecto?.nombre || 'Dashboard'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>
              Engineering Designs
            </p>
          </div>
          <ExportButton entidad="documentos" />
        </div>

        {loading ? (
          <p style={{ padding: 24, color: '#9ca3af', textAlign: 'center' }}>
            Loading documents...
          </p>
        ) : (
          <DocumentTable documentos={documentos} onAction={handleAction} />
        )}
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Timeline */}
        <div
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
        >
          {proyecto ? (
            <ProjectTimeline etapaActual={proyecto.etapa_actual} />
          ) : (
            <div style={{ padding: 16, color: '#9ca3af' }}>Loading timeline...</div>
          )}
        </div>

        {/* Traceability */}
        <div
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
        >
          {loadingTrace ? (
            <div style={{ padding: 16, color: '#9ca3af' }}>Loading traceability...</div>
          ) : (
            <TraceabilitySummary porModulo={porModulo} />
          )}
        </div>

        {/* Quick Actions */}
        <div
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
        >
          <QuickActions
            onUpload={() => navigate('/documents')}
            onReport={() => navigate('/modules')}
          />
        </div>
      </div>

      {/* Transition Modal */}
      <TransitionModal
        doc={docSeleccionado}
        onClose={() => {
          setDocSeleccionado(null)
        }}
        onConfirm={handleConfirmTransition}
      />
    </div>
  )
}
