// run with: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fillRows } from '../src/lib/layout.ts'

// the default dashboard: orders (2/3), revenue (1/3), on-time (full), then three compact panels
const defaults = [2, 1, 3, 1, 1, 1]

test('three columns keep the default widths', () => {
  assert.deepEqual(fillRows(defaults, 3), [2, 1, 3, 1, 1, 1])
})

test('two columns stretch whatever would sit alone in a row', () => {
  // revenue cannot share a row with the full-width on-time chart, and the last compact panel is alone
  assert.deepEqual(fillRows(defaults, 2), [2, 2, 2, 1, 1, 2])
})

test('one column makes every tile full width', () => {
  assert.deepEqual(fillRows(defaults, 1), [1, 1, 1, 1, 1, 1])
})

test('a short last row is filled', () => {
  assert.deepEqual(fillRows([1, 1, 1, 1], 3), [1, 1, 1, 3])
  assert.deepEqual(fillRows([1, 2, 2], 3), [1, 2, 3])
})

test('every row adds up to the column count', () => {
  for (const widths of [[1], [3, 1], [2, 2, 2], [1, 3, 1, 2, 1], defaults]) {
    for (const cols of [1, 2, 3]) {
      const total = fillRows(widths, cols).reduce((a, b) => a + b, 0)
      assert.equal(total % cols, 0, `${widths} at ${cols} columns`)
    }
  }
})
