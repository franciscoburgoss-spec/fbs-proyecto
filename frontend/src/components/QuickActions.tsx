interface QuickActionsProps {
  onUpload: () => void
  onReport: () => void
}

export default function QuickActions({ onUpload, onReport }: QuickActionsProps) {
  return (
    <div style={{ padding: 20 }}>
      <h3
        style={{
          margin: '0 0 16px',
          fontSize: 13,
          fontWeight: 700,
          color: '#374151',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Quick Actions
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
          }}
        >
          <span>&#8593;</span>
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
          }}
        >
          <span>&#128202;</span>
          Generate Report
        </button>
      </div>
    </div>
  )
}
