import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { actualizarDocumento } from '../api'
import type { Documento } from '../types'

interface EditarDocumentoModalProps {
  documento: Documento | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export default function EditarDocumentoModal({ documento, open, onClose, onUpdated }: EditarDocumentoModalProps) {
  if (!open || !documento) return null
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('')
  const [tt, setTt] = useState('')
  const [nn, setNn] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (documento) {
      setNombre(documento.nombre)
      setTipo(documento.tipo)
      setTt(documento.tt)
      setNn(documento.nn)
    }
  }, [documento])

  if (!documento) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Document name is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const updates: Record<string, string> = {}
      if (nombre.trim() !== documento.nombre) updates.nombre = nombre.trim()
      if (tipo.trim().toUpperCase() !== documento.tipo) updates.tipo = tipo.trim().toUpperCase()
      if (tt.trim() !== documento.tt) updates.tt = tt.trim()
      if (nn.trim() !== documento.nn) updates.nn = nn.trim()

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      await actualizarDocumento(documento.id, updates)
      onUpdated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar documento')
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
            <h3 className="text-base font-bold text-[#111827]">Edit Document</h3>
            <p className="text-sm text-[#6b7280] mt-1">{documento.nombre}</p>
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
                Document Name <span className="text-[#ef4444]">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Type</label>
                <input
                  type="text"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">TT</label>
                <input
                  type="text"
                  value={tt}
                  onChange={(e) => setTt(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">NN</label>
                <input
                  type="text"
                  value={nn}
                  onChange={(e) => setNn(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                />
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#f9fafb] border border-[#e5e7eb]">
              <p className="text-[11px] text-[#9ca3af] font-mono">ID: {documento.modulo}-{documento.etapa}-{documento.tipo}-{documento.tt}-{documento.nn}</p>
              <p className="text-[11px] text-[#9ca3af] mt-1">Module and stage cannot be changed after creation</p>
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
