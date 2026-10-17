// ECharts draws on a canvas and can't read Tailwind classes, so src/lib/theme.ts repeats the colour tokens.
// This fails the build when a copy drifts from the @theme block in src/index.css.
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const ts = readFileSync(new URL('../src/lib/theme.ts', import.meta.url), 'utf8')
const kebab = (key) => key.replace(/([a-z])([A-Z0-9])/g, '$1-$2').toLowerCase()

const drift = [...ts.matchAll(/(\w+): '(#[0-9a-f]{6})'/gi)].flatMap(([, key, hex]) => {
  const token = css.match(new RegExp(`--color-${kebab(key)}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
  return token?.toLowerCase() === hex.toLowerCase() ? [] : [`${key}: theme.ts ${hex}, index.css ${token ?? 'missing'}`]
})
if (drift.length) {
  console.error(`theme.ts is out of sync with index.css:\n  ${drift.join('\n  ')}`)
  process.exit(1)
}
