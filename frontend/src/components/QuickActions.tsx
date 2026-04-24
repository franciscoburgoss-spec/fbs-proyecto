interface QuickActionsProps {
  onUpload: () => void
  onReport: () => void
}

export default function QuickActions({ onUpload, onReport }: QuickActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
      <button
        onClick={onUpload}
        style={{
          padding: '10px 20px',
          borderRadius: 6,
          border: 'none',
          background: '#3b82f6',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        Upload New Document
      </button>
      <button
        onClick={onReport}
        style={{
          padding: '10px 20px',
          borderRadius: 6,
          border: '1px solid #d1d5db',
          background: '#fff',
          color: '#374151',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Generate Report
      </button>
    </div>
  )
}
