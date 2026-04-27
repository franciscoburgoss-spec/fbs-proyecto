import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDocumentos } from '../hooks/useDocumentos'
import { useProyectos } from '../hooks/useProyectos'
import type { DocumentoIn } from '../types'

const ESTADOS = ['ING', 'OBS', 'COR', 'APB'] as const
const ESTADO_NEXT: Record<string, string> = { ING: 'OBS', OBS: 'COR', COR: 'APB' }

export default function DocumentoList() {
  const [searchParams] = useSearchParams()
  const proyecto_id = searchParams.get('proyecto_id')
  const [filtros, setFiltros] = useState<{ proyecto_id?: number; etapa?: string; estado?: string; modulo?: string }>(
    proyecto_id ? { proyecto_id: Number(proyecto_id) } : {}
  )
  const { documentos, loading, fetch, crear, eliminar, transicionar } = useDocumentos(filtros)
  const { proyectos } = useProyectos()

  const [form, setForm] = useState<Partial<DocumentoIn & { proyecto_id: number }>>({ proyecto_id: 1 })
  const [showForm, setShowForm] = useState(false)
  const [observacion, setObservacion] = useState('')
  const [transId, setTransId] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.proyecto_id) return
    await crear(form.proyecto_id, form as DocumentoIn)
    setForm({ proyecto_id: 1 })
    setShowForm(false)
    fetch()
  }

  const handleTransicion = async (docId: number, a: string) => {
    const payload = a === 'OBS' && observacion ? { observacion } : undefined
    await transicionar(docId, a, payload)
    setTransId(null)
    setObservacion('')
    fetch()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Documentos</h1>
        <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancelar' : '+ Nuevo'}</button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={filtros.proyecto_id || ''} onChange={e => setFiltros(f => ({ ...f, proyecto_id: e.target.value ? Number(e.target.value) : undefined }))}>
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
        <select value={filtros.etapa || ''} onChange={e => setFiltros(f => ({ ...f, etapa: e.target.value || undefined }))}>
          <option value="">Todas las etapas</option>
          {['CHK', 'R1', 'R2', 'R3'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtros.estado || ''} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value || undefined }))}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={filtros.modulo || ''} onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value || undefined }))}>
          <option value="">Todos los modulos</option>
          {['EST', 'HAB', 'MDS'].map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <button onClick={fetch}>Refrescar</button>
      </div>

      {/* Form crear */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <input placeholder="Nombre*" value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          <select value={form.proyecto_id || ''} onChange={e => setForm(f => ({ ...f, proyecto_id: Number(e.target.value) }))}>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.acronimo}</option>)}
          </select>
          <select value={form.modulo || ''} onChange={e => setForm(f => ({ ...f, modulo: e.target.value as 'EST' | 'HAB' | 'MDS' }))}>
            <option value="">Modulo</option>
            <option value="EST">EST</option>
            <option value="HAB">HAB</option>
            <option value="MDS">MDS</option>
          </select>
          <input placeholder="Tipo (PDF/DWG)" value={form.tipo || ''} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
          <input placeholder="TT" value={form.tt || ''} onChange={e => setForm(f => ({ ...f, tt: e.target.value }))} />
          <input placeholder="NN" value={form.nn || ''} onChange={e => setForm(f => ({ ...f, nn: e.target.value }))} />
          <button type="submit">Crear</button>
        </form>
      )}

      {loading && documentos.length === 0 ? <p>Cargando...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Mod</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Etapa</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Estado</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Observacion</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{d.id}</td>
                <td style={{ padding: 8 }}>{d.nombre}</td>
                <td style={{ padding: 8 }}><code>{d.modulo}</code></td>
                <td style={{ padding: 8 }}>{d.etapa}</td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 12,
                    background: d.estado === 'APB' ? '#dcfce7' : d.estado === 'ING' ? '#fef3c7' : d.estado === 'OBS' ? '#fee2e2' : '#dbeafe'
                  }}>{d.estado}</span>
                </td>
                <td style={{ padding: 8, fontSize: 12, color: '#666' }}>{d.observacion || '—'}</td>
                <td style={{ padding: 8 }}>
                  {ESTADO_NEXT[d.estado] && (
                    <>
                      {transId === d.id ? (
                        <>
                          {ESTADO_NEXT[d.estado] === 'OBS' && (
                            <input placeholder="Observacion" value={observacion} onChange={e => setObservacion(e.target.value)} style={{ marginRight: 4 }} />
                          )}
                          <button onClick={() => handleTransicion(d.id, ESTADO_NEXT[d.estado])}>Confirmar</button>
                          <button onClick={() => setTransId(null)}>X</button>
                        </>
                      ) : (
                        <button onClick={() => setTransId(d.id)}>→ {ESTADO_NEXT[d.estado]}</button>
                      )}
                    </>
                  )}
                  {' '}
                  <button onClick={() => { if (confirm('Eliminar?')) eliminar(d.id).then(fetch) }} style={{ color: '#dc2626' }}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
