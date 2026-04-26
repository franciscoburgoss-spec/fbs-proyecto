import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectoActivoContext } from '../context/ProyectoActivoContext'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import { useTraceability } from '../hooks/useTraceability'
import { useProyectos } from '../hooks/useProyectos'
import { useAuth } from '../hooks/useAuth'
import DocumentTable from './DocumentTable'
import ProjectTimeline from './ProjectTimeline'
import TraceabilitySummary from './TraceabilitySummary'
import QuickActions from './QuickActions'
import ExportButton from './ExportButton'
import TransitionModal from './TransitionModal'
import NuevoProyectoModal from './NuevoProyectoModal'
import NuevoDocumentoModal from './NuevoDocumentoModal'
import EditarProyectoModal from './EditarProyectoModal'
import EditarDocumentoModal from './EditarDocumentoModal'
import { transicionarDocumento, eliminarDocumento } from '../api'
import type { Documento } from '../types'
import { Plus } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { proyectoActivoId, showEditarProyecto, setShowEditarProyecto } = useProyectoActivoContext()
  const { detalle, cargarDetalle } = useProyectoDetail()
  const { documentos, loading, fetch } = useDocumentos({ proyecto_id: proyectoActivoId })
  const { porModulo, loading: loadingTrace } = useTraceability(proyectoActivoId)
  const { fetch: fetchProyectos, transicionar } = useProyectos()

  const puedeTransicionar = user?.rol === 'admin'

  const [docSeleccionado, setDocSeleccionado] = useState<Documento | null>(null)
  const [docEditar, setDocEditar] = useState<Documento | null>(null)
  const [docEliminar, setDocEliminar] = useState<Documento | null>(null)
  const [showNuevoProyecto, setShowNuevoProyecto] = useState(false)
  const [showNuevoDocumento, setShowNuevoDocumento] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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

  const handleDocumentoActualizado = () => {
    fetch()
    setToast('Document updated successfully')
    setTimeout(() => setToast(null), 3000)
  }

  const handleProyectoActualizado = () => {
    fetchProyectos()
    cargarDetalle(proyectoActivoId)
    setToast('Project updated successfully')
    setTimeout(() => setToast(null), 3000)
  }

  const handleEliminarDocumento = async () => {
    if (!docEliminar) return
    try {
      await eliminarDocumento(docEliminar.id)
      fetch()
      setToast('Document deleted successfully')
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast(err.response?.data?.detail || 'Error deleting document')
      setTimeout(() => setToast(null), 5000)
    } finally {
      setDocEliminar(null)
    }
  }

  const handleConfirmarTransicion = async (proyectoId: number, nuevaEtapa: string) => {
    try {
      await transicionar(proyectoId, nuevaEtapa)
      await cargarDetalle(proyectoActivoId)
      await fetch()
      setToast(`Project advanced to ${nuevaEtapa}`)
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast(err.response?.data?.detail || 'Error transitioning project')
      setTimeout(() => setToast(null), 5000)
      throw err
    }
  }

  return (
    <div className="flex gap-6 h-full relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-[70px] right-6 z-50 rounded-lg px-4 py-3 flex items-center gap-2 shadow-md animate-[slideIn_0.3s_ease] ${
          toast.includes('Error') || toast.includes('error')
            ? 'bg-[#fef2f2] border border-[#fecaca]'
            : 'bg-[#ecfdf5] border border-[#a7f3d0]'
        }`}>
          <span className={`w-[18px] h-[18px] rounded-full text-white flex items-center justify-center text-[10px] shrink-0 ${
            toast.includes('Error') || toast.includes('error') ? 'bg-[#ef4444]' : 'bg-[#10b981]'
          }`}>
            {toast.includes('Error') || toast.includes('error') ? '!' : '✓'}
          </span>
          <span className={`text-[13px] font-medium ${
            toast.includes('Error') || toast.includes('error') ? 'text-[#991b1b]' : 'text-[#065f46]'
          }`}>{toast}</span>
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
          <DocumentTable
            documentos={documentos}
            onAction={handleAction}
            onEdit={setDocEditar}
            onDelete={setDocEliminar}
          />
        )}
      </div>

      {/* Right sidebar */}
      <div className="w-80 shrink-0 flex flex-col gap-4">
        <div className="border border-[#e5e7eb] rounded-lg bg-white">
          {proyecto ? (
            <ProjectTimeline
              etapaActual={proyecto.etapa_actual}
              proyectoId={proyecto.id}
              onConfirmarTransicion={handleConfirmarTransicion}
              puedeTransicionar={puedeTransicionar}
            />
          ) : (
            <div className="p-4 text-[#9ca3af]">Loading timeline...</div>
          )}
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

      {/* Modals */}
      <TransitionModal
        doc={docSeleccionado}
        onClose={() => setDocSeleccionado(null)}
        onConfirm={handleConfirmTransition}
      />

      <NuevoProyectoModal
        open={showNuevoProyecto}
        onClose={() => setShowNuevoProyecto(false)}
        onCreated={handleProyectoCreado}
      />

      <NuevoDocumentoModal
        open={showNuevoDocumento}
        proyectoId={proyecto?.id || 0}
        proyectoNombre={proyecto?.nombre || ''}
        onClose={() => setShowNuevoDocumento(false)}
        onCreated={handleDocumentoCreado}
      />

      <EditarProyectoModal
        proyecto={proyecto ?? null}
        open={showEditarProyecto}
        onClose={() => setShowEditarProyecto(false)}
        onUpdated={handleProyectoActualizado}
      />

      <EditarDocumentoModal
        documento={docEditar}
        open={!!docEditar}
        onClose={() => setDocEditar(null)}
        onUpdated={handleDocumentoActualizado}
      />

      {/* Confirm Delete Document */}
      {docEliminar && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]" onClick={() => setDocEliminar(null)}>
          <div className="bg-white rounded-lg w-[400px] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-[#111827] mb-2">Delete Document</h3>
            <p className="text-sm text-[#6b7280] mb-6">
              Are you sure you want to delete <strong>{docEliminar.nombre}</strong>?<br />
              <span className="text-[#ef4444]">This action cannot be undone.</span>
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDocEliminar(null)}
                className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEliminarDocumento}
                className="px-4 py-2 rounded-md border border-[#ef4444] bg-[#ef4444] text-white text-[13px] font-medium hover:bg-[#dc2626] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
