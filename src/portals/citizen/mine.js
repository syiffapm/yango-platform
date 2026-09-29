/**
 * Whose ticket is it?
 *
 * The seeded database also carries the tickets of the other people travelling
 * on today's departures — the terminal gate and the conductor console need
 * them. The citizen app must never show those: "My tickets" means the tickets
 * bought with this phone number.
 */
const digits = (s) => String(s || '').replace(/\D/g, '')

export const ownsTicket = (ticket, session) => {
  const mine = digits(session?.phone)
  if (!mine) return false
  if (digits(ticket.phone) === mine) return true
  return (ticket.passengers || []).some((p) => digits(p.phone) === mine)
}

export const myTickets = (db, session) => (db.tickets || []).filter((t) => ownsTicket(t, session))
