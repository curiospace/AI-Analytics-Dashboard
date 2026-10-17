type Tone = 'default' | 'accent' | 'alert'

const toneClass: Record<Tone, string> = {
  default: 'text-ink',
  accent: 'text-accent',
  alert: 'text-alert',
}

type KpiCardProps = { label: string; value: string; sub: string; tone?: Tone }

export function KpiCard({ label, value, sub, tone = 'default' }: KpiCardProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-panel border border-line bg-panel px-4 py-4 @2xl:px-5 @2xl:py-4.5">
      <div className="eyebrow">{label}</div>
      <div className={`text-2xl font-bold leading-none tracking-tight tabular-nums @2xl:text-3xl ${toneClass[tone]}`}>{value}</div>
      <div className="text-sm text-muted">{sub}</div>
    </div>
  )
}
