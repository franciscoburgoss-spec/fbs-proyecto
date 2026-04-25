import { useState } from 'react'
import { X } from 'lucide-react'
import { crearDocumento } from '../api'
import type { DocumentoIn } from '../types'

interface NuevoDocumentoModalProps {
  proyectoId: number
  proyectoNombre: string
  onClose: () => void
  onCreated: () => void
}

const MODULOS = [
  { value: 'EST' as const, label: 'EST — Estructural' },
  { value: 'HAB' as const, label: 'HAB — Habilitación' },
  { value: 'MDS' as const, label: 'MDS — Memoria Descriptiva' },
]

export default function NuevoDocumentoModal({ proyectoId, proyectoNombre, onClose, onCreated }: NuevoDocumentoModalProps) {
  const [nombre, setNombre] = useState('')
  const [modulo, setModulo] = useState<'EST' | 'HAB' | 'MDS'>('EST')
  const [tipo, setTipo] = useState('PDF')
  const [tt, setTt] = useState('01')
  const [nn, setNn] = useState('01')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('Document name is required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data: DocumentoIn = {
        nombre: nombre.trim(),
        modulo,
        tipo: tipo.trim().toUpperCase(),
        tt: tt.trim(),
        nn: nn.trim(),
      }
      await crearDocumento(proyectoId, data)
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear documento')
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
            <h3 className="text-base font-bold text-[#111827]">New Document</h3>
            <p className="text-sm text-[#6b7280] mt-1">Project: {proyectoNombre}</p>
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
                placeholder="e.g. Plan de Manejo Ambiental"
                className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Module <span className="text-[#ef4444]">*</span>
                </label>
                <select
                  value={modulo}
                  onChange={(e) => setModulo(e.target.value as 'EST' | 'HAB' | 'MDS')}
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] bg-white focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                >
                  {MODULOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Type <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value.toUpperCase())}
                  placeholder="e.g. PDF, DWG"
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  TT <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={tt}
                  onChange={(e) => setTt(e.target.value)}
                  placeholder="01"
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                  required
                />
                <p className="text-[11px] text-[#9ca3af] mt-1">Type number</p>
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  NN <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="text"
                  value={nn}
                  onChange={(e) => setNn(e.target.value)}
                  placeholder="01"
                  className="w-full px-3 py-2 rounded-md border border-[#e5e7eb] text-[13px] text-[#374151] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                  required
                />
                <p className="text-[11px] text-[#9ca3af] mt-1">Sequence number</p>
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
            disabled={loading || !nombre.trim()}
            className={`px-4 py-2 rounded-md border text-[13px] font-medium text-white transition-colors ${
              loading || !nombre.trim()
                ? 'border-[#9ca3af] bg-[#9ca3af] cursor-not-allowed'
                : 'border-[#111827] bg-[#111827] hover:bg-[#374151] cursor-pointer'
            }`}
          >
            {loading ? 'Creating...' : 'Create Document'}
          </button>
        </div>
      </div>
    </div>
  )
}
