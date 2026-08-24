import { EmailLog } from './types'
import { v4 as uuid } from 'uuid'
import { getDB } from './db'

export async function sendEmail(opts: Omit<EmailLog,'id'|'createdAt'>) {
  const db = getDB()
  const email: EmailLog = { id: uuid(), createdAt: new Date().toISOString(), ...opts }
  db.emails.push(email)
  console.log(`[Curtain Email] to=${opts.to} subject=${opts.subject}`)
  return email
}
