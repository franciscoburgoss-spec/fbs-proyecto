interface QuickActionsProps {
  onUpload: () => void
  onReport: () => void
}

export default function QuickActions({ onUpload, onReport }: QuickActionsProps) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
      <button
        onClick={onUpload}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#fff',
          color: '#374151',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <span>↑</span>
        Upload New Document
      </button>
      <button
        onClick={onReport}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          borderRadius: 6,
          border: '1px solid #e5e7eb',
          background: '#fff',
          color: '#374151',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        <span>📊</span>
        Generate Report
      </button>
    </div>
  )
}