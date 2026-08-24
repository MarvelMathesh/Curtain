import QRCode from 'qrcode'
import crypto from 'crypto'

function getQrSecret(): string {
  const s = process.env.JWT_SECRET
  if (s && s.length >= 16) return s
  // dev fallback must match lib/auth.ts fallback
  return 'curtain_dev_secret_2026_dev_only_not_for_prod'
}

/**
 * Generate QR payload that is HMAC-signed and includes expiry to prevent forgery.
 * Format: CURTAIN:<reference>:<showId>:<seatIds csv>:<expiry epoch ms>:<hmac>
 * HMAC = HMAC-SHA256(secret, "CURTAIN:<reference>:<showId>:<seatIds>:<expiry>")
 */
export function buildSignedQrData(reference: string, showId: string, seatIds: string[], ttlMs = 24 * 60 * 60 * 1000): string {
  const expiry = Date.now() + ttlMs
  const payload = `CURTAIN:${reference}:${showId}:${seatIds.join(',')}:${expiry}`
  const hmac = crypto.createHmac('sha256', getQrSecret()).update(payload).digest('hex')
  return `${payload}:${hmac}`
}

/** Verify signed QR payload; returns parsed data if valid, null otherwise */
export function verifySignedQrData(qrText: string): { reference: string; showId: string; seatIds: string[]; expiry: number } | null {
  const parts = qrText.split(':')
  // expected: CURTAIN, ref, showId, seats, expiry, hmac
  if (parts.length < 6) return null
  if (parts[0] !== 'CURTAIN') return null
  const hmac = parts[parts.length - 1]
  const payload = parts.slice(0, -1).join(':')
  const expected = crypto.createHmac('sha256', getQrSecret()).update(payload).digest('hex')
  // timing-safe compare
  try {
    if (hmac.length !== expected.length) return null
    if (!crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) return null
  } catch {
    // hex parse failure -> invalid
    return null
  }
  const expiry = Number(parts[parts.length - 2])
  if (!Number.isFinite(expiry)) return null
  // payload interior: CURTAIN:ref:showId:seatsCsv:expiry
  // seatsCsv is at index 3
  const seatCsv = parts[3] || ''
  return {
    reference: parts[1],
    showId: parts[2],
    seatIds: seatCsv ? seatCsv.split(',').filter(Boolean) : [],
    expiry,
  }
}

export async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 280, color: { dark: '#0a0a12', light: '#ffffff' } })
}

/** Helper to generate HMAC-signed QR and return data URL */
export async function generateSignedQRDataUrl(reference: string, showId: string, seatIds: string[]): Promise<{ qrData: string; qrDataUrl: string }> {
  const qrData = buildSignedQrData(reference, showId, seatIds)
  const qrDataUrl = await generateQRDataUrl(qrData)
  return { qrData, qrDataUrl }
}
