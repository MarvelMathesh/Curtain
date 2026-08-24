export function makeReference(): string {
  const a = 'CURT'
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  const num = Math.floor(100 + Math.random()*900)
  return `${a}-${rand}${num}`
}
