import { UploadIcon, BarChartIcon } from './Icons'

interface QuickActionsProps {
  onUpload: () => void
  onReport: () => void
}

export default function QuickActions({ onUpload, onReport }: QuickActionsProps) {
  return (
    <div style={{ padding: '16px 20px 20px' }}>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontFamily: 'inherit',
        }}
      >
        Quick Actions
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={onUpload}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
            lineHeight: '18px',
          }}
        >
          <UploadIcon size={14} color="#6b7280" />
          Upload New Document
        </button>
        <button
          onClick={onReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 6,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#374151',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'inherit',
            lineHeight: '18px',
          }}
        >
          <BarChartIcon size={14} color="#6b7280" />
          Generate Report
        </button>
      </div>
    </div>
  )
}
