/**
 * Pure quote helpers and Markdown blockquote grammar.
 * Conforms to upstream deepseek-harness v0.2.2-alpha.2 contracts:
 * - packages/session/message-quotes/src/client/quote-text.ts
 * - packages/client/ui-primitives/src/markdown/quote-text.ts
 */

/**
 * Remove one blockquote marker from each explicitly quoted line.
 * Upstream deepseek-harness: packages/session/message-quotes/src/client/quote-text.ts
 */
export function quoteTextOf(text: string): string {
  return text.replace(/\r\n?/gu, '\n').replace(/^ {0,3}>[ \t]?/gmu, '')
}

/** One blockquote span in original UTF-16 text. */
export interface MessageQuoteRange {
  readonly start: number
  readonly end: number
}

/**
 * Recognize consecutive explicitly marked Markdown blockquote lines.
 * Upstream deepseek-harness: packages/session/message-quotes/src/client/quote-text.ts
 */
export function messageQuoteRanges(text: string): readonly MessageQuoteRange[] {
  const ranges: MessageQuoteRange[] = []
  for (const match of text.matchAll(/^ {0,3}>[^\r\n]*(?:\r?\n {0,3}>[^\r\n]*)*/gmu)) {
    if (quoteTextOf(match[0]).trim() !== '') {
      ranges.push({ start: match.index, end: match.index + match[0].length })
    }
  }
  return ranges
}

/**
 * Project selected visible text as an ordinary Markdown blockquote.
 * Upstream deepseek-harness: packages/client/ui-primitives/src/markdown/quote-text.ts
 */
export function formatQuoteText(text: string): string {
  return text.replace(/\r\n?/gu, '\n').split('\n').map(line => `> ${line}`).join('\n')
}

export interface ParsedMessageQuotes {
  readonly quotes: readonly string[]
  readonly body: string
}

/**
 * Separate leading Markdown blockquotes into compact quotes and remaining message body.
 */
export function parseMessageQuotes(text: string): ParsedMessageQuotes {
  const ranges = messageQuoteRanges(text)
  if (ranges.length === 0) return { quotes: [], body: text }

  const leadingWhitespace = text.match(/^\s*/)?.[0]?.length ?? 0
  if (ranges[0]!.start !== leadingWhitespace) {
    return { quotes: [], body: text }
  }

  const quotes: string[] = []
  let lastEnd = leadingWhitespace
  for (const range of ranges) {
    const gap = text.slice(lastEnd, range.start)
    if (lastEnd > leadingWhitespace && !/^\s*$/.test(gap)) {
      break
    }
    const rawQuote = text.slice(range.start, range.end)
    const decoded = quoteTextOf(rawQuote).trim()
    if (decoded.length > 0) {
      quotes.push(decoded)
    }
    lastEnd = range.end
  }

  const body = text.slice(lastEnd).trimStart()
  return { quotes, body }
}
