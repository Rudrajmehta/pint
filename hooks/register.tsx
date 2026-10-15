import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// Your context window, drawn as a pint of stout above the prompt.
// The glass fills with the context window. The head is what is left.
// At 85% the barman calls last orders (that is also when autocompact tends to fire).

const percent = atom({ plugin: 'pint', key: 'percent' } as const, null)
const isHidden = atom({ plugin: 'pint', key: 'isHidden' } as const, false)
const pours = atom({ plugin: 'pint', key: 'pours' } as const, 0)

const GLASS = 24 // characters wide
const LAST_ORDERS = 85
const TIME_PLEASE = 95

function glassOf(p: number): { stout: string; head: string } {
  const full = Math.max(0, Math.min(GLASS, Math.round((p / 100) * GLASS)))
  return { stout: '█'.repeat(full), head: '░'.repeat(GLASS - full) }
}

function lineOf(p: number): string {
  if (p >= TIME_PLEASE) return 'time, please. /compact or /clear before the glass overflows'
  if (p >= LAST_ORDERS) return 'last orders. autocompact is near, save what matters'
  if (p >= 60) return 'settling nicely'
  if (p >= 30) return 'a good start'
  return 'fresh pour'
}

async function refresh($: EngineInterface): Promise<void> {
  try {
    const u = await $.session.usage()
    const p = u.context.percent ?? null
    await update($, percent, () => p)
  } catch {
    // usage is absent until the first response of a window; leave the last value
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'pint', description: 'Show or hide the pint (context window) above the prompt' })
    await refresh($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const before = await read($, percent)
    await refresh($)
    const after = await read($, percent)
    if (before !== null && after !== null && before < LAST_ORDERS && after >= LAST_ORDERS) {
      $.ui.toast('pint: last orders. context at ' + after + '%')
    }
    if (before !== null && after !== null && after < before - 30) {
      // a compaction or /clear poured a fresh one
      await update($, pours, n => n + 1)
    }
    return next(e)
  })

  on('command.run', { command: 'pint' }, async ($, e) => {
    const hidden = await read($, isHidden)
    await update($, isHidden, () => !hidden)
    const p = await read($, percent)
    return { text: hidden ? 'pint is back on the bar' : `pint hidden (context at ${p ?? '?'}%). /pint to bring it back` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const p = await read($, percent)
    const hidden = await read($, isHidden)
    if (hidden || p === null || e.props.hasSurvey) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const g = glassOf(p)
    const n = await read($, pours)
    const warn = p >= LAST_ORDERS
    return (
      <Box>
        <Text dimColor>pint </Text>
        <Text color={warn ? 'warning' : 'text'}>▕</Text>
        <Text color="#3b2a20">{g.stout}</Text>
        <Text color="#f3e9d2">{g.head}</Text>
        <Text color={warn ? 'warning' : 'text'}>▏ </Text>
        <Text bold color={warn ? 'warning' : 'text'}>{p}%</Text>
        <Text dimColor>  {lineOf(p)}{n > 0 ? `  · round ${n + 1}` : ''}</Text>
      </Box>
    )
  })
}
