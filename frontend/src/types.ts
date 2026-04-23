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
