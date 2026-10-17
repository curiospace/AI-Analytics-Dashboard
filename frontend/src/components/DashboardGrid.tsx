import { useLayoutEffect, useRef, useState, type ComponentType, type KeyboardEvent, type PointerEvent } from 'react'
import { useDashboard, type Width } from '../lib/dashboard'
import { fillRows } from '../lib/layout'
import { TileFillContext } from '../lib/tileFill'
import { Boundary } from './Boundary'
import { secondaryButton } from './buttons'
import { HoursPanel } from './HoursPanel'
import { OnTimePanel } from './OnTimePanel'
import { OrdersTrendPanel } from './OrdersTrendPanel'
import { PinnedPanel } from './PinnedPanel'
import { ProductPanel } from './ProductPanel'
import { ProfitPanel } from './ProfitPanel'
import { RevenueCostPanel } from './RevenueCostPanel'

const BUILT_IN: Record<string, ComponentType> = {
  orders: OrdersTrendPanel,
  revenue: RevenueCostPanel,
  ontime: OnTimePanel,
  hours: HoursPanel,
  profit: ProfitPanel,
  products: ProductPanel,
}

// column spans per container width: one column below 42rem, two from 42rem, three from 64rem
const AT2: Record<number, string> = { 1: '', 2: '@2xl:col-span-2' }
const AT3: Record<number, string> = { 1: '@5xl:col-span-1', 2: '@5xl:col-span-2', 3: '@5xl:col-span-3' }
const WIDTH_NAMES: Record<Width, string> = { 1: 'narrow', 2: 'wide', 3: 'full width' }

const DRAG_THRESHOLD = 5 // px a press must travel before it becomes a drag, so a plain click stays a click
const MIN_HEIGHT = 220
const HEIGHT_STEP = 40 // arrow keys
const SNAP = 8 // dragged heights land on an 8px grid
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)' // --ease-arrive
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Drag = {
  id: string
  pointerId: number
  wrapper: HTMLElement
  card: HTMLElement
  startX: number
  startY: number
  grabX: number // where in the card it was picked up
  grabY: number
  x: number
  y: number
  active: boolean
  lastTarget: string | null // the panel it last swapped with; it must leave that panel before swapping again
}

type Resize = {
  id: string
  pointerId: number
  axis: 'x' | 'y' | 'xy'
  left: number
  startY: number
  startHeight: number
  cols: number
  gap: number
  colWidth: number
  width: Width // the latest values, for the announcement (state may not have re-rendered yet)
  height: number | undefined
}

// The panels below Signals: built-in charts and charts pinned from the chat. Always editable, no mode:
// drag a panel by its title bar (or the grip on its top edge) to move it; the others slide out of the way.
// Drag its right edge, bottom edge or corner to resize it; neighbours reflow. The grip and the corner are
// also buttons: arrow keys move and resize, so neither needs a mouse (WCAG 2.5.7).
export function DashboardGrid() {
  const { order, pins, customised, titleOf, widthOf, heightOf, setWidth, setHeight, move, reset } = useDashboard()
  const grid = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const resize = useRef<Resize | null>(null)
  const scrollLoop = useRef(0)
  const orderRef = useRef(order)
  const [dragId, setDragId] = useState<string | null>(null)
  const [resizing, setResizing] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const tiles = order.filter((id) => BUILT_IN[id] || pins.some((p) => p.id === id))
  const widths = tiles.map(widthOf)
  // each panel keeps its place; the last panel of an unfinished row widens so no row has a hole.
  // While a panel is being resized it shows exactly the chosen width; the row fills once it is let go.
  const at2 = resizing ? widths.map((w) => (w >= 2 ? 2 : 1)) : fillRows(widths.map((w) => (w >= 2 ? 2 : 1)), 2)
  const at3 = resizing ? widths : fillRows(widths, 3)

  // the dragged card follows the pointer, measured from its slot (which moves as the order changes)
  const follow = () => {
    const d = drag.current
    if (!d?.active || !grid.current) return
    const g = grid.current.getBoundingClientRect()
    d.card.style.transform = `translate(${d.x - d.grabX - (g.left + d.wrapper.offsetLeft)}px, ${d.y - d.grabY - (g.top + d.wrapper.offsetTop)}px)`
  }

  // when the pointer enters another panel, the dragged one takes that panel's place
  const hitTest = () => {
    const d = drag.current
    if (!d?.active || !grid.current) return
    const g = grid.current.getBoundingClientRect()
    let over: string | null = null
    for (const el of grid.current.querySelectorAll<HTMLElement>('[data-tile]')) {
      if (el === d.wrapper) continue
      const left = g.left + el.offsetLeft
      const top = g.top + el.offsetTop
      if (d.x >= left && d.x <= left + el.offsetWidth && d.y >= top && d.y <= top + el.offsetHeight) over = el.dataset.tile ?? null
    }
    if (over === null) d.lastTarget = null
    if (over === null || over === d.lastTarget) return
    d.lastTarget = over
    const to = orderRef.current.indexOf(over)
    move(d.id, to)
    // keep the ref in step now: the pointer can be released before React re-renders
    const next = orderRef.current.filter((x) => x !== d.id)
    next.splice(to, 0, d.id)
    orderRef.current = next
  }

  // Panels that moved because of a reorder or a width change glide from where they were (FLIP).
  // Only those changes animate: content loading, filters and height drags move panels without it.
  const rects = useRef(new Map<string, { x: number; y: number }>())
  const arrangement = `${tiles.join()}|${at2.join()}|${at3.join()}`
  const lastArrangement = useRef(arrangement)
  useLayoutEffect(() => {
    orderRef.current = order
    if (!grid.current) return
    const rearranged = arrangement !== lastArrangement.current
    lastArrangement.current = arrangement
    for (const el of grid.current.querySelectorAll<HTMLElement>('[data-tile]')) {
      const id = el.dataset.tile!
      const now = { x: el.offsetLeft, y: el.offsetTop }
      const before = rects.current.get(id)
      rects.current.set(id, now)
      if (!before || !rearranged || still() || resizing || id === drag.current?.id) continue
      const dx = before.x - now.x
      const dy = before.y - now.y
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 240, easing: EASE })
    }
    follow()
  })

  // dragging near the top or bottom of the window scrolls the page
  const autoScroll = () => {
    const d = drag.current
    if (!d?.active) return
    const edge = 72
    const speed = d.y < edge ? -(edge - d.y) / 3 : d.y > window.innerHeight - edge ? (d.y - (window.innerHeight - edge)) / 3 : 0
    if (speed) {
      window.scrollBy(0, speed)
      follow()
      hitTest()
    }
    scrollLoop.current = requestAnimationFrame(autoScroll)
  }

  const startDrag = (e: PointerEvent<HTMLDivElement>, id: string) => {
    if (e.button !== 0 || drag.current || resize.current) return
    const target = e.target as HTMLElement
    const onGrip = !!target.closest('[data-grip]')
    const onTitleBar = !!target.closest('section > header') && !target.closest('button, a, input, select, textarea')
    if (!onGrip && !onTitleBar) return
    const card = e.currentTarget.querySelector<HTMLElement>(':scope > section')
    if (!card) return
    e.preventDefault() // no text selection while dragging
    const r = card.getBoundingClientRect()
    drag.current = {
      id,
      pointerId: e.pointerId,
      wrapper: e.currentTarget,
      card,
      startX: e.clientX,
      startY: e.clientY,
      grabX: e.clientX - r.left,
      grabY: e.clientY - r.top,
      x: e.clientX,
      y: e.clientY,
      active: false,
      lastTarget: null,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const dragMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.pointerId !== e.pointerId) return
    d.x = e.clientX
    d.y = e.clientY
    if (!d.active) {
      if (Math.hypot(d.x - d.startX, d.y - d.startY) < DRAG_THRESHOLD) return
      d.active = true
      setDragId(d.id)
      document.body.style.cursor = 'grabbing'
      scrollLoop.current = requestAnimationFrame(autoScroll)
    }
    follow()
    hitTest()
  }

  const endDrag = () => {
    const d = drag.current
    drag.current = null
    cancelAnimationFrame(scrollLoop.current)
    document.body.style.cursor = ''
    if (!d?.active) return
    // the card glides from the pointer into its slot
    const from = d.card.style.transform
    d.card.style.transform = ''
    if (from && !still()) d.card.animate([{ transform: from }, { transform: 'none' }], { duration: 220, easing: EASE })
    setDragId(null)
    const at = orderRef.current.indexOf(d.id)
    setAnnouncement(`${titleOf(d.id)} moved to position ${at + 1} of ${tiles.length}.`)
  }

  const startResize = (e: PointerEvent<HTMLElement>, id: string, axis: Resize['axis']) => {
    if (e.button !== 0 || drag.current || !grid.current) return
    e.preventDefault()
    e.stopPropagation() // not a drag of the panel
    const wrapper = e.currentTarget.closest<HTMLElement>('[data-tile]')!
    const style = getComputedStyle(grid.current)
    const cols = style.gridTemplateColumns.split(' ').length
    const gap = parseFloat(style.columnGap) || 16
    resize.current = {
      id,
      pointerId: e.pointerId,
      axis,
      left: grid.current.getBoundingClientRect().left + wrapper.offsetLeft,
      startY: e.clientY,
      startHeight: wrapper.offsetHeight,
      cols,
      gap,
      colWidth: (grid.current.clientWidth - gap * (cols - 1)) / cols,
      width: widthOf(id),
      height: heightOf(id),
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.cursor = getComputedStyle(e.currentTarget).cursor
    setResizing(id)
  }

  const resizeMove = (e: PointerEvent<HTMLElement>) => {
    const r = resize.current
    if (!r || r.pointerId !== e.pointerId) return
    if (r.axis !== 'y' && r.cols > 1) {
      // how many columns the panel now spans, from its left edge to the pointer
      const span = Math.max(1, Math.min(r.cols, Math.round((e.clientX - r.left + r.gap) / (r.colWidth + r.gap))))
      const width: Width = r.cols === 3 ? (span as Width) : span === 2 ? 3 : 1
      if (width !== r.width) setWidth(r.id, width)
      r.width = width
    }
    if (r.axis !== 'x') {
      r.height = Math.max(MIN_HEIGHT, Math.round((r.startHeight + e.clientY - r.startY) / SNAP) * SNAP)
      setHeight(r.id, r.height)
    }
  }

  const endResize = () => {
    const r = resize.current
    resize.current = null
    document.body.style.cursor = ''
    if (!r) return
    setResizing(null)
    setAnnouncement(`${titleOf(r.id)} is ${WIDTH_NAMES[r.width]}${r.height ? `, ${r.height} pixels tall` : ''}.`)
  }

  // keyboard: the grip moves the panel, the corner resizes it
  const gripKeys = (e: KeyboardEvent, id: string) => {
    const i = order.indexOf(id)
    const to = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? i - 1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? i + 1 : null
    if (to === null) return
    e.preventDefault()
    if (to < 0 || to >= order.length) return
    move(id, to)
    setAnnouncement(`${titleOf(id)} moved to position ${to + 1} of ${tiles.length}.`)
  }
  const cornerKeys = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const w = widthOf(id)
    const tile = e.currentTarget.closest<HTMLElement>('[data-tile]')!
    const h = heightOf(id) ?? tile.offsetHeight
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const next = Math.max(1, Math.min(3, w + (e.key === 'ArrowRight' ? 1 : -1))) as Width
      setWidth(id, next)
      setAnnouncement(`${titleOf(id)} is ${WIDTH_NAMES[next]}.`)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const next = Math.max(MIN_HEIGHT, h + (e.key === 'ArrowDown' ? HEIGHT_STEP : -HEIGHT_STEP))
      setHeight(id, next)
      setAnnouncement(`${titleOf(id)} is ${next} pixels tall.`)
    } else return
    e.preventDefault()
  }

  return (
    <>
      <div ref={grid} className="relative mt-4 grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {tiles.map((id, i) => {
          const pin = pins.find((p) => p.id === id)
          const Built = BUILT_IN[id]
          const title = titleOf(id)
          const height = heightOf(id)
          const dragged = dragId === id
          return (
            <div
              key={id}
              data-tile={id}
              style={height ? { minHeight: height } : undefined}
              onPointerDown={(e) => startDrag(e, id)}
              onPointerMove={dragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={`group relative flex min-w-0 flex-col rounded-panel [&>section]:flex-1 [&>section>header]:cursor-grab ${pin ? 'motion-safe:animate-fade-in' : ''} ${AT2[at2[i]]} ${AT3[at3[i]]} ${
                dragged
                  ? 'bg-track outline-2 -outline-offset-2 outline-dashed outline-control-line [&>section]:relative [&>section]:z-30 [&>section]:opacity-95 [&>section]:outline-2 [&>section]:outline-accent'
                  : ''
              } ${resizing === id ? '[&>section]:outline-2 [&>section]:outline-accent' : ''}`}
            >
              <TileFillContext.Provider value={height !== undefined}>
                <Boundary name={title}>{pin ? <PinnedPanel pin={pin} /> : <Built />}</Boundary>
              </TileFillContext.Provider>

              {/* the grip: a drag handle on the top edge, and a keyboard control */}
              <button
                type="button"
                data-grip
                aria-label={`Move ${title}`}
                aria-describedby="tile-help"
                onKeyDown={(e) => gripKeys(e, id)}
                className={`absolute left-1/2 top-1 z-20 grid h-5 w-12 -translate-x-1/2 cursor-grab touch-none place-items-center rounded-full text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-track hover:text-ink focus-visible:opacity-100 pointer-coarse:h-7 pointer-coarse:opacity-100 ${dragged ? 'invisible' : ''}`}
              >
                <svg width="20" height="8" viewBox="0 0 20 8" fill="currentColor" aria-hidden="true">
                  <circle cx="4" cy="2" r="1.4" />
                  <circle cx="10" cy="2" r="1.4" />
                  <circle cx="16" cy="2" r="1.4" />
                  <circle cx="4" cy="6" r="1.4" />
                  <circle cx="10" cy="6" r="1.4" />
                  <circle cx="16" cy="6" r="1.4" />
                </svg>
              </button>

              {!dragged && (
                <>
                  {/* right edge: width (hidden in the one-column layout, where width means nothing) */}
                  <div
                    aria-hidden="true"
                    onPointerDown={(e) => startResize(e, id, 'x')}
                    onPointerMove={resizeMove}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                    className="absolute -right-2 bottom-6 top-6 z-20 hidden w-3 cursor-col-resize touch-none @2xl:block"
                  />
                  {/* bottom edge: height */}
                  <div
                    aria-hidden="true"
                    onPointerDown={(e) => startResize(e, id, 'y')}
                    onPointerMove={resizeMove}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                    className="absolute -bottom-2 left-6 right-6 z-20 h-3 cursor-row-resize touch-none"
                  />
                  {/* corner: both, and the keyboard control for size */}
                  <button
                    type="button"
                    aria-label={`Resize ${title}`}
                    aria-describedby="tile-help"
                    onPointerDown={(e) => startResize(e, id, 'xy')}
                    onPointerMove={resizeMove}
                    onPointerUp={endResize}
                    onPointerCancel={endResize}
                    onKeyDown={(e) => cornerKeys(e, id)}
                    className="absolute bottom-0.5 right-0.5 z-20 grid size-6 cursor-nwse-resize touch-none place-items-center rounded-md text-muted opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 pointer-coarse:size-9 pointer-coarse:opacity-100"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                      <path d="M11 4L4 11M11 8L8 11" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p id="tile-help" className="text-sm text-muted">
          Drag a panel by its title to move it, or drag its edge to resize it. With the keyboard, focus its grip or corner and use the arrow keys.
        </p>
        {customised && (
          <button type="button" className={secondaryButton} onClick={reset}>
            Reset layout
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  )
}
