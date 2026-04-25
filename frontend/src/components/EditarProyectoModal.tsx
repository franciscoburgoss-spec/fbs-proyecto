import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { actualizarProyecto } from '../api'
import type { Proyecto } from '../types'

interface EditarProyectoModalProps {
  proyecto: Proyecto | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EditarProyectoModal({ proyecto, open, onClose, onUpdated }: EditarProyectoModalProps) {
  if (!open || !proyecto) return null
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cliente, setCliente] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (proyecto) {
      setNombre(proyecto.nombre)
      setDescripcion(proyecto.descripcion || '')
      setCliente(proyecto.cliente || '')
      setUbicacion(proyecto.ubicacion || '')
    }
  }, [proyecto])

  if (!proyecto) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Project name is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updates: Record<string, string> = {}
      if (nombre.trim() !== proyecto.nombre) updates.nombre = nombre.trim()
      if (descripcion.trim() !== (proyecto.descripcion || '')) updates.descripcion = descripcion.trim() || undefined as unknown as string
      if (cliente.trim() !== (proyecto.cliente || '')) updates.cliente = cliente.trim() || undefined as unknown as string
      if (ubicacion.trim() !== (proyecto.ubicacion || '')) updates.ubicacion = ubicacion.trim() || undefined as unknown as string

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      await actualizarProyecto(proyecto.id, updates)
      onUpdated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar proyecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-lg min-w-[420px] max-w-[480px] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e7eb] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Edit Project</h3>
            <p className="text-sm text-[#6b7280] mt-1">{proyecto.acronimo}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-[#9ca3af] hover:text-[#6b7280] transition-colors">
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Project Name <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Description</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Client</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Location</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !nombre.trim()}
            className={`px-4 py-2 rounded-md border text-[13px] font-medium text-white transition-colors ${
              loading || !nombre.trim()
                ? 'border-[#9ca3af] bg-[#9ca3af] cursor-not-allowed'
                : 'border-[#111827] bg-[#111827] hover:bg-[#374151] cursor-pointer'
            }`}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
