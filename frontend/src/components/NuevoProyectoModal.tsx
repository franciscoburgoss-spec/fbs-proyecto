import { useState } from 'react'
import { X } from 'lucide-react'
import { crearProyecto } from '../api'

interface NuevoProyectoModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export default function NuevoProyectoModal({ open, onClose, onCreated }: NuevoProyectoModalProps) {
  const [nombre, setNombre] = useState('')
  const [acronimo, setAcronimo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [cliente, setCliente] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !acronimo.trim()) {
      setError('Nombre y acrónimo son obligatorios')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await crearProyecto({
        nombre: nombre.trim(),
        acronimo: acronimo.trim(),
        descripcion: descripcion.trim() || undefined,
        cliente: cliente.trim() || undefined,
        ubicacion: ubicacion.trim() || undefined,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear proyecto')
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
            <h3 className="text-base font-bold text-[#111827]">New Project</h3>
            <p className="text-sm text-[#6b7280] mt-1">Create a new project in the system</p>
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
                placeholder="e.g. Torres del Litoral"
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Acronym <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={acronimo}
                onChange={(e) => setAcronimo(e.target.value.toUpperCase())}
                placeholder="e.g. TDL-2025"
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                required
              />
              <p className="text-[11px] text-[#9ca3af] mt-1">Unique identifier, uppercase recommended</p>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Description</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Optional project description"
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Client</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="e.g. Client A"
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Location</label>
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  placeholder="e.g. Zona Norte"
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !nombre.trim() || !acronimo.trim()}
            className={`px-4 py-2 rounded-md border text-[13px] font-medium text-white transition-colors ${
              loading || !nombre.trim() || !acronimo.trim()
                ? 'border-[#9ca3af] bg-[#9ca3af] cursor-not-allowed'
                : 'border-[#111827] bg-[#111827] hover:bg-[#374151] cursor-pointer'
            }`}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}
