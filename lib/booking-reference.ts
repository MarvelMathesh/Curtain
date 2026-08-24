import { randomBytes } from 'crypto'

export function makeReference(): string {
  // CSPRNG: 5 bytes ~ 40 bits, base36 7 chars + 3 digits
  const bytes = randomBytes(6)
  const rand = bytes.readUIntBE(0, 5).toString(36).toUpperCase().padStart(7, '0').slice(0, 5)
  const num = (bytes.readUInt16BE(4) % 900 + 100).toString()
  return `CURT-${rand}${num}`
}

export function makeSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}
