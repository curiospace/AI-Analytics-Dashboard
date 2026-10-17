import { useFilters } from '../lib/filters'

// the frame carries the focus outline, so the inner control turns its own off
const field =
  'flex min-h-11 grow items-center gap-2 rounded-control border border-control-line bg-panel px-3.5 text-sm text-muted focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent sm:grow-0'
const input = 'min-w-0 flex-1 bg-transparent text-base font-semibold text-ink outline-none sm:text-sm'

export function FilterBar() {
  const { meta, ranges, rangeId, setRangeId, custom, setCustom, product, setProduct } = useFilters()
  const backwards = rangeId === 'custom' && custom.from && custom.to && custom.from > custom.to

  return (
    <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
      <label className={field}>
        Range
        <select
          className={input}
          value={rangeId}
          onChange={(e) => {
            setRangeId(e.target.value)
            // start the custom range as the full range so both boxes have a valid value
            if (e.target.value === 'custom' && meta && !custom.from) setCustom({ from: meta.date_min, to: meta.date_max })
          }}
        >
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
          <option value="custom">Custom range…</option>
        </select>
      </label>

      {rangeId === 'custom' && meta && (
        <>
          <label className={field}>
            From
            <input type="date" className={input} min={meta.date_min} max={custom.to || meta.date_max} value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
          </label>
          <label className={field}>
            To
            <input type="date" className={input} min={custom.from || meta.date_min} max={meta.date_max} value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </label>
        </>
      )}

      {backwards && (
        <p role="alert" className="w-full text-sm text-alert">
          The start date is after the end date, so the full range is shown. Pick an earlier start date.
        </p>
      )}

      <label className={field}>
        Product
        <select className={input} value={product} onChange={(e) => setProduct(e.target.value)}>
          <option value="">All products</option>
          {meta?.products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
