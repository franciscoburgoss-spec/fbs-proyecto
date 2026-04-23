import axios from 'axios'
import type { Proyecto, ProyectoIn, Documento, DocumentoIn, Usuario, LoginIn, RegisterIn, Token, PasswordChangeIn, PerfilUpdate, Evento, ReporteProyectos, ReporteDocumentos, ReporteGeneral } from './types'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// --- Interceptor: agregar JWT desde localStorage ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fbs_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Auth ---
export const login = (data: LoginIn) =>
  api.post<Token>('/auth/login', data).then(r => r.data)

export const register = (data: RegisterIn) =>
  api.post<Usuario>('/auth/register', data).then(r => r.data)

export const obtenerPerfil = () =>
  api.get<Usuario>('/auth/me').then(r => r.data)

// --- Admin (requiere rol admin) ---
export const listarUsuarios = () =>
  api.get<Usuario[]>('/auth/users').then(r => r.data)

export const cambiarRol = (id: number, rol: 'admin' | 'user') =>
  api.patch<Usuario>(`/auth/users/${id}/rol`, { rol }).then(r => r.data)

export const toggleActivo = (id: number) =>
  api.patch<Usuario>(`/auth/users/${id}/activar`).then(r => r.data)

// --- Perfil propio ---
export const actualizarPerfil = (data: PerfilUpdate) =>
  api.patch<Usuario>('/auth/me', data).then(r => r.data)

export const cambiarPassword = (data: PasswordChangeIn) =>
  api.post('/auth/me/password', data).then(r => r.data)

// --- Auditoria (requiere rol admin) ---
export const listarEventos = (params?: { event?: string; usuario_id?: number; desde?: string; hasta?: string; limit?: number; offset?: number }) =>
  api.get<Evento[]>('/eventos', { params }).then(r => r.data)

export const obtenerStatsEventos = (params?: { desde?: string; hasta?: string }) =>
  api.get<{ total: number; por_tipo: { event: string; count: number }[] }>('/eventos/stats', { params }).then(r => r.data)

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

// --- Reportes ---
export const obtenerReporteGeneral = () =>
  api.get<ReporteGeneral>('/reportes/general').then(r => r.data)

export const obtenerReporteProyectos = () =>
  api.get<ReporteProyectos>('/reportes/proyectos').then(r => r.data)

export const obtenerReporteDocumentos = (proyecto_id?: number) =>
  api.get<ReporteDocumentos>('/reportes/documentos', { params: proyecto_id ? { proyecto_id } : undefined }).then(r => r.data)

export const exportarCSV = (entidad: 'proyectos' | 'documentos') =>
  api.get(`/reportes/export/csv?entidad=${entidad}`, { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${entidad}_export.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  })

export default api
