import { Venue, EventItem, Show, VenueSeat } from './types'
import { v4 as uuid } from 'uuid'

export function generateVenueSeats(rows: number, cols: number): VenueSeat[] {
  const categories = (r: number, rows: number): import('./types').SeatCategory => {
    if (r < 2) return 'Premium'
    if (r < 5) return 'Standard'
    return 'Economy'
  }
  const seats: VenueSeat[] = []
  for (let r = 0; r < rows; r++) {
    const rowLabel = String.fromCharCode(65 + r)
    for (let c = 1; c <= cols; c++) {
      seats.push({
        id: `${rowLabel}${c}`,
        row: rowLabel,
        number: c,
        label: `${rowLabel}${c}`,
        category: categories(r, rows),
        x: c,
        y: r + 1,
      })
    }
  }
  return seats
}

export function seedVenues(adminId: string): Venue[] {
  return [
    {
      id: 'v1',
      name: 'Grand Rex Hall',
      city: 'Mumbai',
      address: 'Bandra Kurla Complex, Mumbai',
      image: 'https://images.unsplash.com/photo-1518834107812-67b0b288f498?w=800&q=80',
      rows: 8,
      cols: 12,
      seats: generateVenueSeats(8, 12),
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'v2',
      name: 'Symphony Arena',
      city: 'Bangalore',
      address: 'MG Road, Bangalore',
      image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
      rows: 10,
      cols: 14,
      seats: generateVenueSeats(10, 14),
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'v3',
      name: 'Curtain Studio Theatre',
      city: 'Delhi',
      address: 'Connaught Place, Delhi',
      image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
      rows: 6,
      cols: 10,
      seats: generateVenueSeats(6, 10),
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function seedEvents(organiserId: string, venues: Venue[]): EventItem[] {
  const now = new Date()
  const plusDays = (d: number) => {
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    return dt.toISOString().slice(0, 10)
  }
  return [
    {
      id: 'e1',
      title: 'Dune: Part Two - IMAX Premiere',
      type: 'movie',
      description: 'Experience Denis Villeneuve’s epic on the biggest screen. 4K IMAX with Dolby Atmos. Limited premiere night with filmmaker Q&A.',
      image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80',
      venueId: venues[0].id,
      organiserId,
      date: plusDays(2),
      time: '19:30',
      durationMinutes: 166,
      pricing: { Premium: 899, Standard: 549, Economy: 299 },
      createdAt: new Date().toISOString(),
      featured: true,
    },
    {
      id: 'e2',
      title: 'A. R. Rahman - Live in Concert',
      type: 'concert',
      description: 'An unforgettable night with the Mozart of Madras. Full orchestra, choir and surprise guests. 3 hours of timeless melodies.',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      venueId: venues[1].id,
      organiserId,
      date: plusDays(5),
      time: '20:00',
      durationMinutes: 180,
      pricing: { Premium: 2499, Standard: 1299, Economy: 699 },
      createdAt: new Date().toISOString(),
      featured: true,
    },
    {
      id: 'e3',
      title: 'The Midnight Atlas - Indie Night',
      type: 'concert',
      description: 'Intimate indie showcase featuring The Midnight Atlas, Paper Suns and guest DJ midnight set. General standing + seated Premium.',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      venueId: venues[2].id,
      organiserId,
      date: plusDays(3),
      time: '21:00',
      durationMinutes: 150,
      pricing: { Premium: 799, Standard: 449, Economy: 249 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e4',
      title: 'Spider-Verse: Beyond - Fan Screening',
      type: 'movie',
      description: 'First fan screening in India. Cosplay contest, limited poster, and post-credits surprise. English with subtitles.',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
      venueId: venues[0].id,
      organiserId,
      date: plusDays(1),
      time: '18:00',
      durationMinutes: 140,
      pricing: { Premium: 799, Standard: 499, Economy: 279 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e5',
      title: 'Nucleya - Bass Camp Festival',
      type: 'concert',
      description: 'Bass Camp returns. Nucleya headlines a night of heavy drops, lights and non-stop dance. 18+ only.',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
      venueId: venues[1].id,
      organiserId,
      date: plusDays(7),
      time: '22:00',
      durationMinutes: 240,
      pricing: { Premium: 1999, Standard: 999, Economy: 599 },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e6',
      title: 'Barbenheimer Double Feature',
      type: 'movie',
      description: 'Back-to-back 70mm run: Oppenheimer followed by Barbie. Includes intermission dinner voucher. One ticket, two legends.',
      image: 'https://images.unsplash.com/photo-1524712245354-2c4ba08e5d02?w=800&q=80',
      venueId: venues[2].id,
      organiserId,
      date: plusDays(4),
      time: '17:00',
      durationMinutes: 310,
      pricing: { Premium: 1099, Standard: 699, Economy: 399 },
      createdAt: new Date().toISOString(),
    },
  ]
}

export function showsFromEvents(events: EventItem[], venues: Venue[]): Show[] {
  return events.map((ev) => {
    const venue = venues.find((v) => v.id === ev.venueId)!
    const seats = venue.seats.map((vs) => ({
      seatId: vs.id,
      row: vs.row,
      number: vs.number,
      label: vs.label,
      category: vs.category,
      price: ev.pricing[vs.category],
      status: 'available' as const,
    }))
    return {
      id: `s-${ev.id}`,
      eventId: ev.id,
      venueId: venue.id,
      date: ev.date,
      time: ev.time,
      seats,
      createdAt: new Date().toISOString(),
    }
  })
}
