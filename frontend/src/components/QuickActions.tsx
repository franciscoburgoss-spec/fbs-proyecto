import { Upload, BarChart3, Plus } from 'lucide-react'

interface QuickActionsProps {
  onUpload: () => void
  onReport: () => void
  onNewProject: () => void
}

export default function QuickActions({ onUpload, onReport, onNewProject }: QuickActionsProps) {
  return (
    <div className="px-5 pt-4 pb-5">
      <h3 className="text-[13px] font-bold text-[#374151] uppercase tracking-[0.5px] mb-4">
        Quick Actions
      </h3>

      <div className="flex flex-col gap-2">
        <button
          onClick={onUpload}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors leading-[18px]"
        >
          <Upload className="w-3.5 h-3.5 text-[#6b7280]" strokeWidth={2} />
          Upload New Document
        </button>
        <button
          onClick={onReport}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors leading-[18px]"
        >
          <BarChart3 className="w-3.5 h-3.5 text-[#6b7280]" strokeWidth={2} />
          Generate Report
        </button>
        <button
          onClick={onNewProject}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#e5e7eb] bg-white text-[#374151] text-[13px] font-medium hover:bg-[#f9fafb] transition-colors leading-[18px]"
        >
          <Plus className="w-3.5 h-3.5 text-[#6b7280]" strokeWidth={2} />
          New Project
        </button>
      </div>
    </div>
  )
}
