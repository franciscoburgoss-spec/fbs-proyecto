import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ProyectoActivoContextType {
  proyectoActivoId: number
  cambiarProyecto: (id: number) => void
}

const ProyectoActivoContext = createContext<ProyectoActivoContextType>({
  proyectoActivoId: 1,
  cambiarProyecto: () => {},
})

export function ProyectoActivoProvider({ children }: { children: ReactNode }) {
  const [proyectoActivoId, setProyectoActivoId] = useState<number>(() => {
    const stored = localStorage.getItem('fbs_proyecto_activo')
    return stored ? parseInt(stored, 10) : 1
  })

  const cambiarProyecto = useCallback((id: number) => {
    localStorage.setItem('fbs_proyecto_activo', String(id))
    setProyectoActivoId(id)
  }, [])

  return (
    <ProyectoActivoContext.Provider value={{ proyectoActivoId, cambiarProyecto }}>
      {children}
    </ProyectoActivoContext.Provider>
  )
}

export function useProyectoActivoContext() {
  return useContext(ProyectoActivoContext)
}
