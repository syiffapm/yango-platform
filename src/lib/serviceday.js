/**
 * The service day.
 *
 * Buses run roughly 05:00–22:30. Anything a dashboard reports "today" has to
 * agree with that: at 01:35 nothing has run yet, so the honest answer is a
 * dash and the time the first bus leaves — not a full day's totals next to
 * zero trips.
 */
export const SERVICE_START_H = 5
export const SERVICE_END_H = 22.5

const hoursNow = (now = Date.now()) => {
  const d = new Date(now)
  return d.getHours() + d.getMinutes() / 60
}

/** How much of today's service day is already behind us, 0–1. */
export function serviceDayProgress(now = Date.now()) {
  const h = hoursNow(now)
  if (h <= SERVICE_START_H) return 0
  if (h >= SERVICE_END_H) return 1
  return (h - SERVICE_START_H) / (SERVICE_END_H - SERVICE_START_H)
}

/** True before the first bus and after the last one. */
export const outsideServiceHours = (now = Date.now()) => serviceDayProgress(now) === 0

/** A day total, scaled to the part of the day that has actually happened. */
export const soFarToday = (dayTotal, now = Date.now()) => Math.round((dayTotal || 0) * serviceDayProgress(now))

export const serviceStartLabel = () => `${String(SERVICE_START_H).padStart(2, '0')}:00`
