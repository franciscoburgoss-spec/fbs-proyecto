import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ProyectoActivoContextType {
  proyectoActivoId: number
  cambiarProyecto: (id: number) => void
  showEditarProyecto: boolean
  setShowEditarProyecto: (show: boolean) => void
}

const ProyectoActivoContext = createContext<ProyectoActivoContextType>({
  proyectoActivoId: 1,
  cambiarProyecto: () => {},
  showEditarProyecto: false,
  setShowEditarProyecto: () => {},
})

export function ProyectoActivoProvider({ children }: { children: ReactNode }) {
  const [proyectoActivoId, setProyectoActivoId] = useState<number>(() => {
    const stored = localStorage.getItem('fbs_proyecto_activo')
    return stored ? parseInt(stored, 10) : 1
  })
  const [showEditarProyecto, setShowEditarProyecto] = useState(false)

  const cambiarProyecto = useCallback((id: number) => {
    localStorage.setItem('fbs_proyecto_activo', String(id))
    setProyectoActivoId(id)
  }, [])

  return (
    <ProyectoActivoContext.Provider value={{ proyectoActivoId, cambiarProyecto, showEditarProyecto, setShowEditarProyecto }}>
      {children}
    </ProyectoActivoContext.Provider>
  )
}

export function useProyectoActivoContext() {
  return useContext(ProyectoActivoContext)
}
