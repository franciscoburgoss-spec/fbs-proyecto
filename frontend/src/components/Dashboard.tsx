import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import { useTraceability } from '../hooks/useTraceability'
import { useProyectos } from '../hooks/useProyectos'
import DocumentTable from './DocumentTable'
import ProjectTimeline from './ProjectTimeline'
import TraceabilitySummary from './TraceabilitySummary'
import QuickActions from './QuickActions'
import ExportButton from './ExportButton'
import TransitionModal from './TransitionModal'
import NuevoProyectoModal from './NuevoProyectoModal'
import NuevoDocumentoModal from './NuevoDocumentoModal'
import { transicionarDocumento } from '../api'
import type { Documento } from '../types'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { proyectoActivoId } = useProyectoActivoContext()
  const { detalle, cargarDetalle } = useProyectoDetail()
  const { documentos, loading, fetch } = useDocumentos({ proyecto_id: proyectoActivoId })
  const { porModulo, loading: loadingTrace } = useTraceability(proyectoActivoId)
  const { fetch: fetchProyectos } = useProyectos()

  const [docSeleccionado, setDocSeleccionado] = useState<Documento | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showNuevoProyecto, setShowNuevoProyecto] = useState(false)
  const [showNuevoDocumento, setShowNuevoDocumento] = useState(false)

  useEffect(() => {
    cargarDetalle(proyectoActivoId)
  }, [proyectoActivoId, cargarDetalle])

  const proyecto = detalle?.proyecto

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

  const handleProyectoCreado = () => {
    fetchProyectos()
    setToast('Project created successfully')
    setTimeout(() => setToast(null), 3000)
  }

  const handleDocumentoCreado = () => {
    fetch()
    setToast('Document created successfully')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex gap-6 h-full relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-[70px] right-6 z-50 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg px-4 py-3 flex items-center gap-2 shadow-md animate-[slideIn_0.3s_ease]">
          <span className="w-[18px] h-[18px] rounded-full bg-[#10b981] text-white flex items-center justify-center text-[10px] shrink-0">
            &#10003;
          </span>
          <span className="text-[13px] font-medium text-[#065f46]">{toast}</span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">{proyecto?.nombre || 'Dashboard'}</h1>
            <p className="text-[13px] text-[#9ca3af] mt-1">Engineering Designs</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNuevoDocumento(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-[#e5e7eb] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              New Document
            </button>
            <ExportButton entidad="documentos" />
          </div>
        </div>

        {loading ? (
          <p className="p-6 text-center text-[#9ca3af]">Loading documents...</p>
        ) : (
          <DocumentTable documentos={documentos} onAction={handleAction} />
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <div className="border border-[#e5e7eb] rounded-lg bg-white">
          {proyecto ? <ProjectTimeline etapaActual={proyecto.etapa_actual} /> : <div className="p-4 text-[#9ca3af]">Loading timeline...</div>}
        </div>
        <div className="border border-[#e5e7eb] rounded-lg bg-white">
          {loadingTrace ? <div className="p-4 text-[#9ca3af]">Loading traceability...</div> : <TraceabilitySummary porModulo={porModulo} />}
        </div>
        <div className="border border-[#e5e7eb] rounded-lg bg-white">
          <QuickActions
            onUpload={() => setShowNuevoDocumento(true)}
            onReport={() => navigate('/modules')}
            onNewProject={() => setShowNuevoProyecto(true)}
          />
        </div>
      </div>

      {/* Transition Modal */}
      <TransitionModal
        doc={docSeleccionado}
        onClose={() => setDocSeleccionado(null)}
        onConfirm={handleConfirmTransition}
      />

      {/* New Project Modal */}
      {showNuevoProyecto && (
        <NuevoProyectoModal
          onClose={() => setShowNuevoProyecto(false)}
          onCreated={handleProyectoCreado}
        />
      )}

      {/* New Document Modal */}
      {showNuevoDocumento && proyecto && (
        <NuevoDocumentoModal
          proyectoId={proyecto.id}
          proyectoNombre={proyecto.nombre}
          onClose={() => setShowNuevoDocumento(false)}
          onCreated={handleDocumentoCreado}
        />
      )}
    </div>
  )
}
