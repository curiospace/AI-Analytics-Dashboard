export type Bar = { name: string; value: number; label: string }

type RankedBarsProps = { bars: Bar[]; highlightLast?: boolean }

export function RankedBars({ bars, highlightLast = false }: RankedBarsProps) {
  const max = Math.max(0, ...bars.map((b) => b.value)) || 1

  return (
    <ul className="flex flex-col gap-3.5">
      {bars.map((b, i) => {
        const color =
          i === 0 ? 'bg-accent' : highlightLast && i === bars.length - 1 && bars.length > 1 ? 'bg-alert' : 'bg-bar'
        return (
          <li key={b.name} className="flex items-center gap-3 text-sm">
            {/* long names are cut with an ellipsis; the full name stays readable on hover and to screen readers */}
            <span className="w-28 flex-none truncate" title={b.name}>
              {b.name}
            </span>
            <div className="h-2 min-w-6 flex-1 rounded bg-track" aria-hidden="true">
              <div className={`h-2 rounded ${color} transition-[width] duration-300 ease-arrive motion-reduce:transition-none`} style={{ width: `${Math.max(0, b.value / max) * 100}%` }} />
            </div>
            <span className="min-w-16 flex-none text-right font-mono text-data tabular-nums">{b.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
