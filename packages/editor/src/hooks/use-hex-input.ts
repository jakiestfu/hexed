import * as React from "react"

import { toAsciiString, toHexString } from "@hexed/file/formatter"
import { parseHexString } from "@hexed/file/search"

export interface UseHexInputOptions {
  /** Input mode: "hex" for byte-by-byte hex input, "text" for normal text input */
  mode: "hex" | "text"
  /** Setter function for mode */
  setMode: (mode: "hex" | "text") => void
  /** Initial value as a hex string (e.g., "AB CD") or text string */
  initialValue?: string
  /** Callback when the value changes */
  onChange?: (value: string, bytes: Uint8Array) => void
  /** Maximum number of bytes allowed */
  maxBytes?: number
}

export interface UseHexInputReturn {
  /** Formatted display value (hex string with spaces or text string) */
  value: string
  /** Raw bytes array */
  bytes: Uint8Array
  /** Current mode */
  mode: "hex" | "text"
  /** Handler for input onChange events */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** Handler for input onKeyDown events */
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Handler for input onPaste events */
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void
  /** Set the value programmatically */
  setValue: (value: string) => void
  /** Set the mode programmatically */
  setMode: (mode: "hex" | "text") => void
  /** Clear the input */
  clear: () => void
}

const HEX_RE = /^[0-9a-fA-F]$/
// Hoist regex to module level to avoid recreation on every call
const HEX_STRIP_RE = /[^0-9a-fA-F]/g

const stripToHexNibbles = (s: string) =>
  s.replace(HEX_STRIP_RE, "").toUpperCase()

const formatHexDisplayFromNibbles = (nibbles: string) => {
  if (!nibbles) return ""
  const out: string[] = []
  for (let i = 0; i < nibbles.length; i += 2) {
    const a = nibbles[i] ?? ""
    const b = nibbles[i + 1] ?? ""
    out.push((b ? `${a}${b}` : `0${a}`).toUpperCase())
  }
  return out.join(" ")
}

const nibbleIndexToDisplayPos = (nibbleIndex: number) => {
  // after every 2 nibbles, there's one space
  return nibbleIndex + Math.floor(nibbleIndex / 2)
}

const displayPosToNibbleIndex = (display: string, displayPos: number) => {
  // count hex chars (nibbles) before the caret
  let n = 0
  for (let i = 0; i < Math.min(displayPos, display.length); i++) {
    const ch = display[i]!
    if (ch !== " ") n++
  }
  return n
}

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n))

const truncateHexNibblesToMaxBytes = (nibbles: string, maxBytes?: number) => {
  if (maxBytes == null) return nibbles
  return nibbles.slice(0, maxBytes * 2)
}

const truncateTextToMaxBytes = (text: string, maxBytes?: number) => {
  if (maxBytes == null) return text
  const enc = new TextEncoder()
  const bytes = enc.encode(text)
  if (bytes.length <= maxBytes) return text

  // binary search max prefix that fits
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const b = enc.encode(text.slice(0, mid))
    if (b.length <= maxBytes) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo)
}

export const useHexInput = (options: UseHexInputOptions): UseHexInputReturn => {
  const { mode, maxBytes, onChange } = options

  // internal representation:
  // - hex mode: "nibbles" is a contiguous hex string without spaces (odd length allowed)
  // - text mode: "text" is the raw string
  const [hexNibbles, setHexNibbles] = React.useState<string>(() => {
    if (options.mode !== "hex") return ""
    const init = options.initialValue ?? ""
    return truncateHexNibblesToMaxBytes(stripToHexNibbles(init), maxBytes)
  })

  const [textValue, setTextValue] = React.useState<string>(() => {
    if (options.mode !== "text") return ""
    const init = options.initialValue ?? ""
    return truncateTextToMaxBytes(init, maxBytes)
  })

  const [bytes, setBytes] = React.useState<Uint8Array>(() => {
    try {
      if (options.mode === "hex") {
        const init = options.initialValue ?? ""
        const n = truncateHexNibblesToMaxBytes(
          stripToHexNibbles(init),
          maxBytes
        )
        return n
          ? parseHexString(formatHexDisplayFromNibbles(n))!
          : new Uint8Array()
      }
      const t = truncateTextToMaxBytes(options.initialValue ?? "", maxBytes)
      return new TextEncoder().encode(t)
    } catch {
      return new Uint8Array()
    }
  })

  // caret bookkeeping so we can setSelectionRange after state updates
  const pendingCaret = React.useRef<{
    el: HTMLInputElement
    pos: number
  } | null>(null)
  const scheduleCaret = (el: HTMLInputElement, pos: number) => {
    pendingCaret.current = { el, pos }
    // next paint
    requestAnimationFrame(() => {
      const p = pendingCaret.current
      if (!p) return
      pendingCaret.current = null
      try {
        p.el.setSelectionRange(p.pos, p.pos)
      } catch {
        // ignore
      }
    })
  }

  const notify = React.useCallback(
    (nextMode: "hex" | "text", nextValue: string, nextBytes: Uint8Array) => {
      setBytes(nextBytes)
      onChange?.(nextValue, nextBytes)
    },
    [onChange]
  )

  // keep representations in sync when mode changes
  React.useEffect(() => {
    if (mode === "hex") {
      // convert current bytes -> hex display -> nibbles
      const hex = bytes.length ? toHexString(bytes) : "" // e.g. "AB CD"
      const n = truncateHexNibblesToMaxBytes(stripToHexNibbles(hex), maxBytes)
      setHexNibbles(n)
      setTextValue("") // optional: clear text rep
      notify("hex", formatHexDisplayFromNibbles(n), bytes)
    } else {
      // convert current bytes -> ascii/text
      const text = bytes.length ? toAsciiString(bytes) : ""
      const t = truncateTextToMaxBytes(text, maxBytes)
      setTextValue(t)
      setHexNibbles("") // optional: clear hex rep
      notify("text", t, new TextEncoder().encode(t))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const value =
    mode === "hex" ? formatHexDisplayFromNibbles(hexNibbles) : textValue

  const setValue = React.useCallback(
    (next: string) => {
      if (mode === "hex") {
        const n = truncateHexNibblesToMaxBytes(
          stripToHexNibbles(next),
          maxBytes
        )
        setHexNibbles(n)
        const formatted = formatHexDisplayFromNibbles(n)
        const b = n ? parseHexString(formatted)! : new Uint8Array()
        notify("hex", formatted, b)
      } else {
        const t = truncateTextToMaxBytes(next, maxBytes)
        setTextValue(t)
        const b = new TextEncoder().encode(t)
        const bb = maxBytes != null ? b.slice(0, maxBytes) : b
        notify("text", t, bb)
      }
    },
    [mode, maxBytes, notify]
  )

  const clear = React.useCallback(() => {
    setHexNibbles("")
    setTextValue("")
    const b = new Uint8Array()
    notify(mode, "", b)
  }, [mode, notify])

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (mode !== "hex") {
        const nextText = truncateTextToMaxBytes(e.target.value, maxBytes)
        setTextValue(nextText)
        const b = new TextEncoder().encode(nextText)
        const bb = maxBytes != null ? b.slice(0, maxBytes) : b
        notify("text", nextText, bb)
        return
      }

      // hex mode: accept whatever the browser produced (IME/mobile),
      // normalize to nibbles, and preserve caret by counting nibbles before caret.
      const el = e.target
      const raw = el.value
      const caretDisplayPos = el.selectionStart ?? raw.length
      const nibblesBeforeCaret = displayPosToNibbleIndex(raw, caretDisplayPos)

      const n = truncateHexNibblesToMaxBytes(stripToHexNibbles(raw), maxBytes)
      setHexNibbles(n)

      const formatted = formatHexDisplayFromNibbles(n)
      const b = n ? parseHexString(formatted)! : new Uint8Array()
      notify("hex", formatted, b)

      const nextNibbleCaret = clamp(nibblesBeforeCaret, 0, n.length)
      const nextDisplayCaret = nibbleIndexToDisplayPos(nextNibbleCaret)
      scheduleCaret(el, nextDisplayCaret)
    },
    [mode, maxBytes, notify]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (mode !== "hex") return

      // allow shortcuts
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const el = e.currentTarget
      const display = el.value
      const selStart = el.selectionStart ?? display.length
      const selEnd = el.selectionEnd ?? display.length

      const startNib = displayPosToNibbleIndex(display, selStart)
      const endNib = displayPosToNibbleIndex(display, selEnd)

      const applyNibbles = (nextNibbles: string, nextNibbleCaret: number) => {
        const n = truncateHexNibblesToMaxBytes(
          nextNibbles.toUpperCase(),
          maxBytes
        )
        setHexNibbles(n)

        const formatted = formatHexDisplayFromNibbles(n)
        const b = n ? parseHexString(formatted)! : new Uint8Array()
        notify("hex", formatted, b)

        const caretNib = clamp(nextNibbleCaret, 0, n.length)
        scheduleCaret(el, nibbleIndexToDisplayPos(caretNib))
      }

      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault()
        if (startNib !== endNib) {
          applyNibbles(
            hexNibbles.slice(0, startNib) + hexNibbles.slice(endNib),
            startNib
          )
          return
        }
        if (startNib === 0) return
        applyNibbles(
          hexNibbles.slice(0, startNib - 1) + hexNibbles.slice(startNib),
          startNib - 1
        )
        return
      }

      // Delete
      if (e.key === "Delete") {
        e.preventDefault()
        if (startNib !== endNib) {
          applyNibbles(
            hexNibbles.slice(0, startNib) + hexNibbles.slice(endNib),
            startNib
          )
          return
        }
        if (startNib >= hexNibbles.length) return
        applyNibbles(
          hexNibbles.slice(0, startNib) + hexNibbles.slice(startNib + 1),
          startNib
        )
        return
      }

      // Space: ignore (spaces are formatting)
      if (e.key === " ") {
        e.preventDefault()
        return
      }

      // Hex digit insert/replace
      if (HEX_RE.test(e.key)) {
        e.preventDefault()
        const ch = e.key.toUpperCase()

        // replace selection (or insert at caret)
        const next =
          hexNibbles.slice(0, startNib) + ch + hexNibbles.slice(endNib)

        applyNibbles(next, startNib + 1)
        return
      }

      // let navigation keys through (arrows/home/end/tab/etc.)
    },
    [mode, maxBytes, hexNibbles, notify]
  )

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (mode !== "hex") return

      e.preventDefault()

      const el = e.currentTarget
      const display = el.value
      const selStart = el.selectionStart ?? display.length
      const selEnd = el.selectionEnd ?? display.length

      const startNib = displayPosToNibbleIndex(display, selStart)
      const endNib = displayPosToNibbleIndex(display, selEnd)

      const pasted = stripToHexNibbles(e.clipboardData.getData("text") || "")
      if (!pasted) return

      const next =
        hexNibbles.slice(0, startNib) + pasted + hexNibbles.slice(endNib)
      const n = truncateHexNibblesToMaxBytes(next, maxBytes)

      setHexNibbles(n)

      const formatted = formatHexDisplayFromNibbles(n)
      const b = n ? parseHexString(formatted)! : new Uint8Array()
      notify("hex", formatted, b)

      const caretNib = clamp(startNib + pasted.length, 0, n.length)
      scheduleCaret(el, nibbleIndexToDisplayPos(caretNib))
    },
    [mode, maxBytes, hexNibbles, notify]
  )

  return {
    value,
    bytes,
    mode,
    handleChange,
    handleKeyDown,
    handlePaste,
    setValue,
    setMode: options.setMode,
    clear
  }
}
