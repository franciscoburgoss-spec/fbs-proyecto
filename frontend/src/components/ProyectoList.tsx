import { useState } from 'react'
import { useProyectos } from '../hooks/useProyectos'
import type { ProyectoIn } from '../types'

const ETAPAS = ['CHK', 'R1', 'R2', 'R3', 'APB'] as const

export default function ProyectoList() {
  const { proyectos, loading, error, fetch, crear, actualizar, eliminar, transicionar } = useProyectos()
  const [form, setForm] = useState<Partial<ProyectoIn>>({})
  const [editId, setEditId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre) return
    if (editId) {
      await actualizar(editId, form)
      setEditId(null)
    } else {
      if (!form.acronimo) return
      await crear(form as ProyectoIn)
    }
    setForm({})
    setShowForm(false)
    fetch()
  }

  const startEdit = (p: any) => {
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '', cliente: p.cliente || '', ubicacion: p.ubicacion || '' })
    setEditId(p.id)
    setShowForm(true)
  }

  const etapaIndex = (etapa: string) => ETAPAS.indexOf(etapa as any)
  const nextEtapa = (etapa: string) => {
    const idx = etapaIndex(etapa)
    return idx < ETAPAS.length - 1 ? ETAPAS[idx + 1] : null
  }

  if (loading && proyectos.length === 0) return <p>Cargando proyectos...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Proyectos</h1>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({}) }}>
          {showForm ? 'Cancelar' : '+ Nuevo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
          <input placeholder="Nombre*" value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
          {!editId && <input placeholder="Acronimo*" value={form.acronimo || ''} onChange={e => setForm(f => ({ ...f, acronimo: e.target.value }))} required />}
          <input placeholder="Descripcion" value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
          <input placeholder="Cliente" value={form.cliente || ''} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
          <input placeholder="Ubicacion" value={form.ubicacion || ''} onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))} />
          <button type="submit">{editId ? 'Guardar' : 'Crear'}</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Nombre</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Acronimo</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Etapa</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proyectos.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{p.id}</td>
              <td style={{ padding: 8 }}>{p.nombre}</td>
              <td style={{ padding: 8 }}><code>{p.acronimo}</code></td>
              <td style={{ padding: 8 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 12, fontSize: 12,
                  background: p.etapa_actual === 'APB' ? '#dcfce7' : p.etapa_actual === 'CHK' ? '#fef3c7' : '#dbeafe'
                }}>{p.etapa_actual}</span>
              </td>
              <td style={{ padding: 8 }}>{p.cliente || '—'}</td>
              <td style={{ padding: 8 }}>
                <button onClick={() => startEdit(p)}>Editar</button>{' '}
                {nextEtapa(p.etapa_actual) && (
                  <button onClick={() => transicionar(p.id, nextEtapa(p.etapa_actual)!).then(fetch)}>
                    → {nextEtapa(p.etapa_actual)}
                  </button>
                )}{' '}
                <button onClick={() => { if (confirm('Eliminar?')) eliminar(p.id).then(fetch) }} style={{ color: '#dc2626' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
