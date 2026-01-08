import type { HexCanvasColors } from "../hex-canvas";

// Helper function to read CSS variables from DOM element
export function getCSSVariable(element: HTMLElement, variable: string): string {
  return getComputedStyle(element).getPropertyValue(variable).trim();
}

// Helper function to add opacity to a color
// For oklch colors, we'll use CSS color-mix syntax which canvas supports
export function addOpacity(color: string, opacity: number): string {
  // If color is already in rgba format, extract RGB and apply new opacity
  if (color.startsWith("rgba") || color.startsWith("rgb")) {
    const match = color.match(/rgba?\(([^)]+)\)/);
    if (match) {
      const values = match[1].split(",").map((v) => v.trim());
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${opacity})`;
    }
  }
  // For hex colors, convert to rgba
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  // For oklch and other CSS colors, use color-mix (supported in modern browsers)
  // Fallback: append /opacity for oklch if browser supports it
  if (color.includes("oklch")) {
    // Try to extract oklch values and add opacity
    const match = color.match(/oklch\(([^)]+)\)/);
    if (match) {
      return `oklch(${match[1]} / ${opacity})`;
    }
  }
  // Fallback: return as-is (browser may handle it)
  return color;
}

// Create default colors from CSS variables
export function getDefaultColors(container: HTMLElement): HexCanvasColors {
  const background = getCSSVariable(container, "--background");
  const foreground = getCSSVariable(container, "--foreground");
  const mutedForeground = getCSSVariable(container, "--muted-foreground");
  const muted = getCSSVariable(container, "--muted");
  const border = getCSSVariable(container, "--border");
  const primary = getCSSVariable(container, "--primary");
  const ring = getCSSVariable(container, "--ring");
  const accent = getCSSVariable(container, "--accent");
  const destructive = getCSSVariable(container, "--destructive");

  // Try to get chart colors for diff, fallback to defaults
  const chart1 =
    getCSSVariable(container, "--chart-1") || "oklch(0.646 0.222 41.116)";
  const chart4 =
    getCSSVariable(container, "--chart-4") || "oklch(0.828 0.189 84.429)";

  const diffModified = {
    bg: addOpacity(chart4, 0.2),
    text: chart4,
  };

  const byteHover = {
    bg: diffModified.bg,
    border: diffModified.text,
  };

  return {
    background: background || "oklch(1 0 0)",
    addressText: mutedForeground || foreground || "oklch(0.556 0 0)",
    byteText: foreground || "oklch(0.145 0 0)",
    asciiText: mutedForeground || foreground || "oklch(0.556 0 0)",
    border: border || "oklch(0.922 0 0)",
    diffAdded: {
      bg: addOpacity(chart1, 0.2),
      text: chart1,
    },
    diffRemoved: {
      bg: addOpacity(destructive || "oklch(0.577 0.245 27.325)", 0.2),
      text: destructive || "oklch(0.577 0.245 27.325)",
    },
    diffModified,
    highlight: {
      bg: addOpacity(primary || ring || "oklch(0.708 0 0)", 0.2),
      border: primary || ring || "oklch(0.708 0 0)",
    },
    rowHover: addOpacity(muted || "oklch(0.97 0 0)", 0.5),
    byteHover,
    selection: {
      bg: byteHover.bg,
      border: byteHover.border,
    },
  };
}
