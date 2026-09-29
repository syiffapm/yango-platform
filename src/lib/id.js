let counters = {}
export function nextId(prefix) {
  counters[prefix] = (counters[prefix] || 0) + 1
  return `${prefix}-${Date.now().toString(36).slice(-5).toUpperCase()}${counters[prefix]}`
}
export function pnr() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)]
  return s
}
export function signedQr(payload) {
  const json = JSON.stringify(payload)
  let h = 0
  for (let i = 0; i < json.length; i++) h = (Math.imul(31, h) + json.charCodeAt(i)) | 0
  return `YG1.${btoa(json).replace(/=+$/, '').slice(0, 64)}.${(h >>> 0).toString(36).toUpperCase()}`
}
