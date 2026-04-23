export interface Proyecto {
  id: number
  nombre: string
  acronimo: string
  etapa_actual: 'CHK' | 'R1' | 'R2' | 'R3' | 'APB'
  descripcion: string | null
  cliente: string | null
  ubicacion: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export interface ProyectoIn {
  nombre: string
  acronimo: string
  descripcion?: string
  cliente?: string
  ubicacion?: string
}

export interface Documento {
  id: number
  proyecto_id: number
  nombre: string
  modulo: 'EST' | 'HAB' | 'MDS'
  etapa: 'CHK' | 'R1' | 'R2' | 'R3'
  estado: 'ING' | 'OBS' | 'COR' | 'APB'
  tipo: string
  tt: string
  nn: string
  observacion: string | null
  fecha_creacion: string
  fecha_modificacion: string
}

export interface DocumentoIn {
  nombre: string
  modulo: 'EST' | 'HAB' | 'MDS'
  tipo: string
  tt: string
  nn: string
}

export interface Stats {
  total_proyectos: number
  total_documentos: number
  por_etapa: Record<string, number>
  por_estado: Record<string, number>
}

export interface Usuario {
  id: number
  username: string
  email: string
  rol: 'admin' | 'user'
  activo: boolean
  fecha_creacion: string
}

export interface LoginIn {
  username: string
  password: string
}

export interface RegisterIn {
  username: string
  email: string
  password: string
  rol?: 'admin' | 'user'
}

export interface Token {
  access_token: string
  token_type: string
}

export interface PasswordChangeIn {
  current_password: string
  new_password: string
}

export interface PerfilUpdate {
  email?: string
}

export interface Evento {
  id: number
  timestamp: string
  event: string
  usuario_id: number | null
  username: string | null
  detalle: string | null
  fecha_creacion: string
}

export interface ReporteProyectos {
  total: number
  por_etapa: { etapa_actual: string; count: number }[]
  por_cliente: { cliente: string; count: number }[]
  recientes: { id: number; nombre: string; acronimo: string; etapa_actual: string; fecha_creacion: string }[]
}

export interface ReporteDocumentos {
  total: number
  por_estado: { estado: string; count: number }[]
  por_modulo: { modulo: string; count: number }[]
  por_etapa: { etapa: string; count: number }[]
  observaciones_pendientes: { id: number; nombre: string; modulo: string; etapa: string; observacion: string; acronimo: string }[]
}

export interface ReporteGeneral {
  totales: { proyectos: number; documentos: number; usuarios: number; eventos: number }
  documentos_por_estado: { estado: string; count: number }[]
  proyectos_por_etapa: { etapa_actual: string; count: number }[]
  evolucion_proyectos: { mes: string; count: number }[]
}
