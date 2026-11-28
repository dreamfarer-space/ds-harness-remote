// Harness can run this package's script in a same-origin iframe. The Remote
// controls are rendered into the Harness page by the shared React renderer.
// Browser bundles use that same page for DOM operations and page-wide hooks.
function harnessPage(): Window & typeof globalThis {
  const parent = window.parent as Window & typeof globalThis | undefined
  try {
    if (parent !== undefined && parent !== window && window.__ModuleLoader__ !== undefined
      && parent.__ModuleLoader__ === window.__ModuleLoader__) return parent
  } catch {
    // A Web client embedded by another origin has its own page and loader.
  }
  return window
}

const page = harnessPage()
const pageDocument = page.document ?? (typeof document === 'undefined' ? undefined : document)

export { page as window, pageDocument as document }
export const Element = page.Element
export const KeyboardEvent = page.KeyboardEvent
export const EventSource = page.EventSource
export const CustomEvent = page.CustomEvent
export const MutationObserver = page.MutationObserver
export const ResizeObserver = page.ResizeObserver
export const Request = page.Request
export const Response = page.Response
export const ReadableStream = page.ReadableStream
export const Error = page.Error ?? globalThis.Error
