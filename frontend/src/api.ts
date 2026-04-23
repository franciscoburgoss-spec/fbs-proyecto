import axios from 'axios'
import type { Proyecto, ProyectoIn, Documento, DocumentoIn } from './types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// --- Proyectos ---
export const listarProyectos = () => api.get<Proyecto[]>('/proyectos').then(r => r.data)
export const obtenerProyecto = (id: number) => api.get<Proyecto>(`/proyectos/${id}`).then(r => r.data)
export const crearProyecto = (data: ProyectoIn) => api.post<Proyecto>('/proyectos', data).then(r => r.data)
export const actualizarProyecto = (id: number, data: Partial<ProyectoIn>) =>
  api.patch<Proyecto>(`/proyectos/${id}`, data).then(r => r.data)
export const eliminarProyecto = (id: number) => api.delete(`/proyectos/${id}`)
export const transicionarProyecto = (id: number, a: string) =>
  api.post<Proyecto>(`/proyectos/${id}/transicion`, { a }).then(r => r.data)

// --- Documentos ---
export const listarDocumentos = (params?: { proyecto_id?: number; etapa?: string; estado?: string; modulo?: string }) =>
  api.get<Documento[]>('/documentos', { params }).then(r => r.data)
export const obtenerDocumento = (id: number) => api.get<Documento>(`/documentos/${id}`).then(r => r.data)
export const crearDocumento = (proyecto_id: number, data: DocumentoIn) =>
  api.post<Documento>('/documentos', data, { params: { proyecto_id } }).then(r => r.data)
export const actualizarDocumento = (id: number, data: Partial<DocumentoIn>) =>
  api.patch<Documento>(`/documentos/${id}`, data).then(r => r.data)
export const eliminarDocumento = (id: number) => api.delete(`/documentos/${id}`)
export const transicionarDocumento = (id: number, a: string, payload?: Record<string, unknown>) =>
  api.post<Documento>(`/documentos/${id}/transicion`, { a, payload }).then(r => r.data)

// --- Stats (calculado en frontend) ---
export const obtenerStats = async (): Promise<{
  total_proyectos: number
  total_documentos: number
  por_etapa: Record<string, number>
  por_estado: Record<string, number>
}> => {
  const [proyectos, documentos] = await Promise.all([listarProyectos(), listarDocumentos()])
  const por_etapa: Record<string, number> = {}
  const por_estado: Record<string, number> = {}
  for (const d of documentos) {
    por_etapa[d.etapa] = (por_etapa[d.etapa] || 0) + 1
    por_estado[d.estado] = (por_estado[d.estado] || 0) + 1
  }
  return { total_proyectos: proyectos.length, total_documentos: documentos.length, por_etapa, por_estado }
}

export default api
