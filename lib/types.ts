export type Role = 'admin' | 'organiser' | 'customer'

export type User = {
  id: string
  email: string
  name: string
  passwordHash: string
  role: Role
  createdAt: string
}

export type SeatCategory = 'Premium' | 'Standard' | 'Economy'

export type VenueSeat = {
  id: string
  row: string
  number: number
  label: string
  category: SeatCategory
  x: number
  y: number
}

export type Venue = {
  id: string
  name: string
  city: string
  address: string
  image: string
  rows: number
  cols: number
  seats: VenueSeat[]
  createdBy: string
  createdAt: string
}

export type EventType = 'movie' | 'concert'

export type EventItem = {
  id: string
  title: string
  type: EventType
  description: string
  image: string
  venueId: string
  organiserId: string
  date: string
  time: string
  durationMinutes: number
  pricing: Record<SeatCategory, number>
  createdAt: string
  featured?: boolean
}

export type ShowSeatStatus = 'available' | 'held' | 'booked'

export type ShowSeat = {
  seatId: string
  row: string
  number: number
  label: string
  category: SeatCategory
  price: number
  status: ShowSeatStatus
  heldBy?: string
  heldUntil?: string
  bookedBy?: string
  holdId?: string
}

export type Show = {
  id: string
  eventId: string
  venueId: string
  date: string
  time: string
  seats: ShowSeat[]
  createdAt: string
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'held'

export type Booking = {
  id: string
  reference: string
  userId: string
  eventId: string
  showId: string
  seatIds: string[]
  seatLabels: string[]
  category: SeatCategory
  totalAmount: number
  status: BookingStatus
  qrDataUrl?: string
  createdAt: string
  cancelledAt?: string
}

export type WaitlistStatus = 'waiting' | 'offered' | 'expired' | 'converted' | 'cancelled'

export type WaitlistEntry = {
  id: string
  eventId: string
  showId: string
  category: SeatCategory
  userId: string
  email: string
  name: string
  position: number
  status: WaitlistStatus
  createdAt: string
  offeredAt?: string
  expiresAt?: string
  offerToken?: string
  seatIdOffered?: string
}

export type EmailLog = {
  id: string
  to: string
  subject: string
  html: string
  bookingReference?: string
  qrDataUrl?: string
  createdAt: string
  type: 'booking_confirmation' | 'waitlist_offer' | 'waitlist_expired' | 'cancellation'
}

export type DB = {
  users: User[]
  venues: Venue[]
  events: EventItem[]
  shows: Show[]
  bookings: Booking[]
  waitlist: WaitlistEntry[]
  emails: EmailLog[]
}
