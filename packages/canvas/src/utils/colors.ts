// Helper function to read CSS variables from DOM element
export function getCSSVariable(element: HTMLElement, variable: string): string {
  return getComputedStyle(element).getPropertyValue(variable).trim()
}

// Helper function to add opacity to a color
// For oklch colors, we'll use CSS color-mix syntax which canvas supports
export function addOpacity(color: string, opacity: number): string {
  // If color is already in rgba format, extract RGB and apply new opacity
  if (color.startsWith("rgba") || color.startsWith("rgb")) {
    const match = color.match(/rgba?\(([^)]+)\)/)
    if (match) {
      const values = match[1].split(",").map((v) => v.trim())
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`
    }
  }
  // For hex colors, convert to rgba
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  // For oklch and other CSS colors, use color-mix (supported in modern browsers)
  // Fallback: append /opacity for oklch if browser supports it
  if (color.includes("oklch")) {
    // Try to extract oklch values and add opacity
    const match = color.match(/oklch\(([^)]+)\)/)
    if (match) {
      return `oklch(${match[1]} / ${opacity})`
    }
  }
  // Fallback: return as-is (browser may handle it)
  return color
}

export type HexCanvasColors = ReturnType<typeof getDefaultColors>

// Create default colors from CSS variables
export function getDefaultColors(container: HTMLElement) {
  const background = getCSSVariable(container, "--background")
  const foreground = getCSSVariable(container, "--foreground")
  const mutedForeground = getCSSVariable(container, "--muted-foreground")
  const muted = getCSSVariable(container, "--muted")
  const border = getCSSVariable(container, "--border")
  const primary = getCSSVariable(container, "--primary")
  const ring = getCSSVariable(container, "--ring")
  const accent = getCSSVariable(container, "--accent")
  const destructive = getCSSVariable(container, "--destructive")

  // Try to get chart colors, fallback to defaults
  const chart4 = getCSSVariable(container, "--chart-4")

  const selectionColor = {
    bg: addOpacity(chart4, 0.2),
    text: chart4
  }

  const scrollbarThumb = mutedForeground
  const scrollbarTrack = muted

  return {
    background,
    addressText: mutedForeground,
    byteText: foreground,
    asciiText: mutedForeground,
    border: border,
    highlight: {
      bg: addOpacity(primary, 0.2),
      border: primary
    },
    rowHover: addOpacity(muted, 0.5),
    byteHover: {
      bg: selectionColor.bg,
      border: selectionColor.bg
    },
    selection: {
      bg: selectionColor.bg,
      border: selectionColor.text
    },
    scrollbarThumb,
    scrollbarTrack
  }
}
