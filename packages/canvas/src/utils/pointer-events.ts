/**
 * Pointer event abstraction utilities
 * Normalizes mouse and touch events to a common interface
 */

export type PointerEventData = {
  x: number
  y: number
  clientX: number
  clientY: number
  button: number
  shiftKey: boolean
  preventDefault: () => void
  type: "mouse" | "touch"
}

/**
 * Check if an event is a TouchEvent
 */
export function isTouchEvent(event: Event): event is TouchEvent {
  return event.type.startsWith("touch")
}

/**
 * Get coordinates from a mouse or touch event relative to an element
 */
export function getCoordinatesFromEvent(
  event: MouseEvent | TouchEvent,
  element: HTMLElement
): { x: number; y: number; clientX: number; clientY: number } | null {
  const rect = element.getBoundingClientRect()

  if (isTouchEvent(event)) {
    // Use the first touch point (ignore multi-touch)
    const touch = event.touches[0] || event.changedTouches[0]
    if (!touch) return null

    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      clientX: touch.clientX,
      clientY: touch.clientY
    }
  } else {
    // Mouse event
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      clientX: event.clientX,
      clientY: event.clientY
    }
  }
}

/**
 * Normalize a mouse or touch event to a common PointerEventData interface
 */
export function getPointerEventData(
  event: MouseEvent | TouchEvent,
  element: HTMLElement
): PointerEventData | null {
  const coords = getCoordinatesFromEvent(event, element)
  if (!coords) return null

  const isTouch = isTouchEvent(event)

  return {
    x: coords.x,
    y: coords.y,
    clientX: coords.clientX,
    clientY: coords.clientY,
    button: isTouch ? 0 : (event as MouseEvent).button,
    shiftKey: isTouch ? false : (event as MouseEvent).shiftKey,
    preventDefault: () => {
      event.preventDefault()
    },
    type: isTouch ? "touch" : "mouse"
  }
}

/**
 * Calculate the distance between two points
 */
export function getDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}
