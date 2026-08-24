import QRCode from 'qrcode'

export async function generateQRDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, { margin: 1, width: 280, color: { dark: '#0a0a12', light: '#ffffff' } })
}
