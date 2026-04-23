import { useState } from 'react'
import { exportarCSV } from '../api'

interface ExportButtonProps {
  entidad: 'proyectos' | 'documentos'
  label?: string
}

export default function ExportButton({ entidad, label }: ExportButtonProps) {
  const [exportando, setExportando] = useState(false)

  const handleExport = async () => {
    setExportando(true)
    try {
      await exportarCSV(entidad)
    } catch (e) {
      alert('Error al exportar')
    } finally {
      setExportando(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exportando}
      style={{
        padding: '8px 16px',
        borderRadius: 6,
        border: '1px solid #d1d5db',
        background: '#fff',
        cursor: exportando ? 'not-allowed' : 'pointer',
        fontSize: 13,
        opacity: exportando ? 0.6 : 1,
      }}
    >
      {exportando ? 'Exportando...' : (label || `Exportar ${entidad} CSV`)}
    </button>
  )
}
