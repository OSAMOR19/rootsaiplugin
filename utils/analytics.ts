export async function trackEvent(
  eventType: 'play' | 'download',
  itemType: 'sample' | 'pack',
  itemId: string,
  packId?: string
) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        item_type: itemType,
        item_id: itemId,
        pack_id: packId,
      }),
    })
  } catch (error) {
    // Silently fail if telemetry fails
    console.error('Telemetry tracking failed:', error)
  }
}
