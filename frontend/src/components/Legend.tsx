type LegendItem = { label: string; color: string; dashed?: boolean }

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex gap-4 text-sm text-muted">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2">
          <svg width="18" height="4" aria-hidden="true">
            <line x1="0" y1="2" x2="18" y2="2" stroke={item.color} strokeWidth="2.5" strokeDasharray={item.dashed ? '4 3' : undefined} />
          </svg>
          {item.label}
        </span>
      ))}
    </div>
  )
}
