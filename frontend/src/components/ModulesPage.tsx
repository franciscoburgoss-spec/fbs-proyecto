import { useEffect } from 'react'
import { useProyectoActivo } from '../hooks/useProyectoActivo'
import { useTraceability } from '../hooks/useTraceability'
import { useProyectoDetail } from '../hooks/useProyectoDetail'
import ProjectTimeline from './ProjectTimeline'

export default function ModulesPage() {
  const { proyectoActivoId } = useProyectoActivo()
  const { reporte, porModulo, globalProgress, loading } = useTraceability(proyectoActivoId)
  const { detalle, cargarDetalle } = useProyectoDetail()

  useEffect(() => {
    cargarDetalle(proyectoActivoId)
  }, [proyectoActivoId, cargarDetalle])

  const proyecto = detalle?.proyecto

  return (
    <div>
      <h1 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 600, color: '#111827' }}>
        Project Traceability
      </h1>

      {loading && <p style={{ color: '#6b7280' }}>Cargando datos...</p>}

      {proyecto && (
        <div style={{ marginBottom: 24 }}>
          <ProjectTimeline etapaActual={proyecto.etapa_actual} />
        </div>
      )}

      {/* Global Progress */}
      <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
          Global Progress
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{globalProgress}%</div>
          <div style={{ flex: 1, height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${globalProgress}%`,
                background: globalProgress >= 80 ? '#10b981' : globalProgress >= 50 ? '#3b82f6' : '#f59e0b',
                borderRadius: 6,
                transition: 'width 0.5s',
              }}
            />
          </div>
        </div>
      </div>

      {/* By Module */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
          By Module
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {porModulo.map((m) => (
            <div key={m.modulo} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                {m.modulo}
              </div>
              <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${m.total > 0 ? (m.aprobados / m.total) * 100 : 0}%`,
                    background: '#3b82f6',
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#10b981' }}>Approved: {m.aprobados}/{m.total}</span>
                <span style={{ color: '#f59e0b' }}>Pending: {m.pendientes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Stage */}
      {reporte && (
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#374151' }}>
            By Stage
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {reporte.por_etapa.map((e) => (
              <div key={e.etapa} style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{e.count}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{e.etapa}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
