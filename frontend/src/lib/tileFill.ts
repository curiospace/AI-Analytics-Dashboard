import { createContext } from 'react'

// true inside a dashboard panel the manager has given a height: its chart then grows or shrinks to fill the
// panel instead of keeping its fixed height. Elsewhere (the chat) charts keep the height they are given.
export const TileFillContext = createContext(false)

// a chart never shrinks below this, however small the panel is dragged
export const MIN_CHART_HEIGHT = 160
