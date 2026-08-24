# Curtain — Ticket Booking for Movies & Concerts

High-demand ticketing with **visual seat map, 10-minute atomic holds, waitlist auto-assign and QR tickets**. Built with the AIOS design system — `Next.js 16.2.3`, `Tailwind 4`, `Radix`, `Motion`, `Firebase` (optional).

> **Live demo:** `app/page.tsx` → `LandingBackground` + `HeroLanding` (Curtain) → `/events` → `/shows/s-e1` → hold → book → QR email → waitlist claim.

---

## 1. Setup Guide

### Prerequisites
- `Node >=20.9`, `npm >=10`, `Git`
- Firebase project `qloset-5a167` (or your own) — only for `USE_FIRESTORE=true` / `firebase-admin`.

### Install
```bash
cd apps/AIOS
npm install          # installs next, react 19, tailwind 4, qrcode, bcryptjs, firebase, firebase-admin
```

### Env
```bash
cp .env.example .env
# edit .env — see Section 2
```

### Dev
```bash
npm run dev          # http://localhost:3000 — Landing → Events → Show → Book
npm run typecheck    # tsc --noEmit
npm run build        # next build (Turbopack, 24 routes, .env loaded)
npm start            # next start -p 3000
```

### Demo accounts (seeded `lib/db.ts:51` / `lib/db-firestore.ts:15`)
| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@curtain.in` | `admin123` |
| Organiser | `organiser@curtain.in` | `organiser123` |
| Customer | `customer@curtain.in` | `customer123` |
Seed: 3 venues (Grand Rex 8×12, Symphony 10×14, Curtain Studio 6×10), 6 events (movies + concerts), 1 show pre-booked 72/96 to demo waitlist.

### Production
```bash
# Vercel env: set JWT_SECRET (32+ chars), NEXT_PUBLIC_FIREBASE_*, USE_FIRESTORE, FIREBASE_SERVICE_ACCOUNT_JSON
npm run build && npm start
# or Vercel: `vercel --prod`
```

---

## 2. Environment — `.env.example`

```ini
# Firebase Web (client) — from console → Project settings → General → SDK
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=qloset-5a167.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=qloset-5a167
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=qloset-5a167.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=264462478792
NEXT_PUBLIC_FIREBASE_APP_ID=1:264462478792:web:307eab...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-W0EESNT6Q4

# Server auth — required in production, 32+ random hex
JWT_SECRET=11b2ade352f3f02606e046cf3d7d984b35d5cedd8589db51d15d0bc14042fa5a

# DB switch — false = file /tmp (demo), true = Firestore via Admin SDK
USE_FIRESTORE=false
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"qloset-5a167",...}
# FIREBASE_SERVICE_ACCOUNT_B64=base64(JSON)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json  # alternative
```

`lib/firebase.ts:8` reads `NEXT_PUBLIC_*`, `lib/firebase-admin.ts:1` reads `FIREBASE_SERVICE_ACCOUNT_*` or `applicationDefault()` + `projectId`. File DB fallback when `USE_FIRESTORE !== 'true'`.

---

## 3. API Docs

Base `http://localhost:3000/api` — JSON, `credentials: include` cookie `curtain_token` `httpOnly lax secure:isProd` `lib/auth.ts:28`. All mutating routes `updateDB` queued `lib/db.ts:108`.

### Auth
| Method | Route | Auth | Body / Response |
|--------|-------|------|-----------------|
| `POST` | `/api/auth/register` | - | `{name 2-80, email, password 8-128, role:customer|organiser}` → `403` if `admin`, `400` dup, `200 {user}` + `Set-Cookie`. Validates email `^[^\s@]+@[^\s@]+\.[^\s@]+$`, `role` whitelist, atomic `updateDBAsync`. |
| `POST` | `/api/auth/login` | - | `{email,password}` → `401` generic, `bcrypt.compare` + dummy `invalid...` timing-safe, `200 {user}` `Set-Cookie`. |
| `POST` | `/api/auth/firebase` | `idToken` (Firebase) | `{idToken, role?}` → verifies `adminAuth.verifyIdToken` `lib/auth.ts:36`, creates `firebaseUid` user if missing, `200 {user}` |
| `GET` | `/api/auth/me` | cookie/Bearer | → `{user}` or `{user:null}` 200 |
| `POST` | `/api/auth/logout` | cookie | clears `maxAge 0` |

### Venues (Admin)
| `GET` `/api/venues` | — | `200 {venues:Venue[]}` |
| `POST` `/api/venues` | `admin` | `{name 2-80,city 2-40,address,rows 4-20,cols 4-20,image https}` → `clamp` + `generateVenueSeats(rows,cols)` `lib/seed.ts:6` (Premium <2 rows, Standard <5, Economy rest). `escapeHtml`, `new URL` https, `updateDBAsync`. |

### Events
| `GET` `/api/events?type=movie|concert&city=Mumbai&search=&limit=20&page=1` | — | sanitizes `search` `city`, paginated `limit 20 cap 50`, returns `{events: (EventItem & {venue,showId,totalSeats,bookedCount,availableCount,isSoldOut})[]}` |
| `POST` `/api/events` | `organiser|admin` | `{title 3-100,type,description 0-2000,venueId,image https,date ISO,time HH:MM,duration 30-600,pricing:{Premium,Standard,Economy 50-10000}}` → creates `EventItem` + `Show` `venue.seats.map(price)` atomic |
| `GET` `/api/events/[id]` | — | `{event:{...venue,show,totalSeats,booked,available,held,isSoldOut}}` |
| `PATCH` `/api/events/[id]` | `organiser(owns)|admin` | validates, escapes, propagates `pricing/date/time` to `Show` only if no `booked` (else 409), `DELETE` blocks if confirmed bookings |

### Shows
| `GET` `/api/shows/[id]` | — | `{show,event,venue,stats:{total,available,held,booked}}` — **strips** `heldBy/bookedBy` `app/api/shows/[id]/route.ts:11` |
| `POST` `/api/shows/[id]/hold` | `customer` cookie | `{seatIds:string[] 1-6 dedup Set}` → `404` show/seat, `409` held/booked, `updateDBAsync` atomic, `heldBy=user.id heldUntil=now+10m holdId=uuid`, returns `{holdId,seatLabels,expiresAt,ttlMs}` |
| `DELETE` `/api/shows/[id]/hold?holdId=` | `customer` | releases own `holdId` seats → `available` |

### Bookings
| `GET` `/api/bookings?page=&limit=` | `customer` | own `bookings` + `event/venue/show`, paginated, `qrDataUrl→hasQr` strip |
| `POST` `/api/bookings` | `customer` | `{showId,seatIds,holdId?}` dedup `Set`, `category Set.size===1`, `HOLD_TTL` check, `totalAmount` server sum `NaN`-safe, `reference` `randomBytes CSPRNG` loop 5, `HMAC-SHA256(JWT_SECRET)` QR `lib/qr.ts:16` `CURTAIN:ref:showId:seats:expiry:hmac` → `qrcode.toDataURL`, `updateDBAsync`, `update waitlist converted`, email `booking_confirmation` |
| `GET` `/api/bookings/[id]` | owner/admin | `{booking:{event,venue,show}}` |
| `POST` `/api/bookings/[id]/cancel` | owner or `organiser(owns event)` or `admin` | `confirmed→cancelled`, frees `ShowSeat` `available`, auto-offers next waitlist per category `app/api/bookings/[id]/cancel/route.ts:58` (see §5), emails `waitlist_offer` + `cancellation` |

### Waitlist
| `GET` `/api/waitlist` | `customer` | own `waitlist` + `event/venue/show` |
| `POST` `/api/waitlist` | `customer` | `{eventId,showId,category:Premium|Standard|Economy}` validates `show.eventId===eventId`, `available===0` else `400 direct-book`, dedup `waiting|offered` per show+cat, atomic `position = max+1`, `updateDBAsync` |
| `DELETE` `/api/waitlist?id=` | owner/admin | `waiting|offered → cancelled` |
| `POST` `/api/waitlist/claim` | `customer` | `{offerToken}` or `?token=` → checks `offered`, `expiresAt`, `seat heldBy`, books single seat, `converted`, `generateSignedQRDataUrl`, `updateDBAsync` |
| `GET` `/api/waitlist/claim?token=` | `customer` (requires auth, checks `userId`) | `{entry:{expired},event,show,seat}` or `404` uniform |

### Organiser / Admin / Emails
| `GET` `/api/organiser/stats` | `organiser|admin` | `{stats:[{event,venue,showId,bookings,revenue,totalSeats,booked,held,available,occupancy,byCategory}],totalRevenue,totalBookings}` — `recentBookings` masked `hasQr`/`maskEmail` |
| `GET` `/api/emails` | any auth | **strict** own `to===email` only, `qr→hasQr`, `20` latest, sorted |
| `POST` `/api/admin/reset` | `admin` | clears all collections + reseeds `lib/db.ts:createSeeded` |

---

## 4. DB Schema `lib/types.ts:1` (`DB` `lib/db.ts:4` / Firestore collections)

| Collection | Key Fields | Notes |
|------------|------------|-------|
| `users` `User` | `id, email (lower), name, passwordHash, role: admin|organiser|customer, firebaseUid?, createdAt` | `email` unique (lower). `passwordHash` empty when Firebase-managed. |
| `venues` `Venue` | `id, name, city, address, image https, rows, cols, seats:VenueSeat[], createdBy, createdAt` | `VenueSeat {id label A1, row, number, category, x,y}` |
| `events` `EventItem` | `id, title, type:movie|concert, description, image https, venueId, organiserId, date ISO, time HH:MM, durationMinutes, pricing:{Premium,Standard,Economy}, featured?, createdAt` | |
| `shows` `Show` | `id=s-eventId, eventId, venueId, date, time, seats:ShowSeat[], createdAt` | `ShowSeat {seatId,label,row,number,category,price,status:available|held|booked, heldBy?, heldUntil ISO, bookedBy?, holdId?}` `price` denormalized from `pricing` |
| `bookings` `Booking` | `id, reference CURT-XXXX, userId, eventId, showId, seatIds[], seatLabels[], category, totalAmount, status:confirmed|cancelled, qrDataUrl, qrData HMAC, createdAt, cancelledAt?` | |
| `waitlist` `WaitlistEntry` | `id, eventId, showId, category, userId, email, name, position, status:waiting|offered|expired|converted|cancelled, createdAt, offeredAt?, expiresAt?, offerToken?, seatIdOffered?` | `position` per `show+category` |
| `emails` `EmailLog` | `id, to, subject, html (escaped), bookingReference?, qrDataUrl?, createdAt, type:booking_confirmation|waitlist_offer|cancellation` | Mock inbox `GET /api/emails` |
| `meta` (Firestore only) | `seeded {at,v}` | idempotence |

File DB `data/store.json` (`/tmp/curtain-store.json` in prod) single JSON `DB`; Firestore `7` collections `updateDbFirestore` batch `set/delete` `lib/db-firestore.ts:40`.

---

## 5. Seat Hold Logic `lib/db.ts:133` `app/api/shows/[id]/hold/route.ts:1`

```
Customer selects seats (≤6, dedup Set) → POST /api/shows/[id]/hold {seatIds}
  updateDBAsync atomic:
    for seat in seats: if status !== available → 409
    holdId = uuid, expiresAt = now + HOLD_TTL_MS (10*60*1000)
    seat.status=held, heldBy=user.id, heldUntil=expiresAt, holdId
  → 200 {holdId, seatLabels, expiresAt}
  UI HoldTimer role=timer 1000ms resync, polling shows 4s (paused document.hidden)

POST /api/bookings {showId,seatIds,holdId}
  updateDBAsync: verify holdId && heldBy===user && heldUntil>now else 409
  seat.status=booked, bookedBy=user.id, clear held*
  totalAmount = sum(seat.price) server, reference = randomBytes CSPRNG, qrData = HMAC-SHA256(JWT_SECRET, CURTAIN:ref:showId:seats:expiry)
  email booking_confirmation

Abandon → DELETE /api/shows/[id]/hold?holdId or timeout:
  cleanupHolds() each getDB(): if heldUntil <= now → available (lazy on every read)
  client HoldTimer onExpire clears selection, fetchShow()
  Server also cleans in updateDB before writes

Concurrency: updateDB writeQueue (file) or Firestore transaction (Firestore) ensures two POST hold same A1 → first wins, second 409. Booked check same.
```

---

## 6. Waitlist Logic `lib/db.ts:154` `app/api/waitlist/*` `app/api/bookings/[id]/cancel`

```
Sold out → POST /api/waitlist {showId,eventId,category}
  if available>0 → 400 "direct-book"
  if existing waiting|offered same show+cat → 400 dup
  position = max(waitlist[show+cat].position)+1, status=waiting, updateDBAsync

Cancel → POST /api/bookings/[id]/cancel
  booking → cancelled, seats → available
  for each freed seatId (up to waitlist length) in order:
    next = waitlist.filter(waiting, same show+cat).sort(position)[0]
    if next && seat still available:
      next.status=offered, offeredAt=now, expiresAt=now+10m, offerToken=uuid, seatIdOffered=seatId
      seat.status=held, heldBy=next.userId, heldUntil=expiresAt, holdId=wl-next.id
      email waitlist_offer to next.email + html escaped + encodeURIComponent(token) link /waitlist/claim?token=

Claim → GET /api/waitlist/claim?token (auth, userId check) → entry+seat+expired flag
       POST /api/waitlist/claim {offerToken} → verify offered, not expired, seat heldBy, then book single seat (converted), generateSignedQRDataUrl, email, updateDBAsync

Expiry → cleanupWaitlistOffers() on every getDB(): offered && expiresAt<=now → expired, then auto-promotes next waiting → same held+offerToken+email (collect expired first to avoid same-seat double-assign, picks first still-available seat per loop)
  If next misses 10m, next in line gets offer.

Queue per category: position per show+category, FIFO sort(position), FIFO promote.
```

---

## 7. Project Structure

```
apps/AIOS/
  app/
    page.tsx              # Ticket home (HeroLanding + TicketValue/Stats/How/Promo/Roles) — server + landing-nav client island
    layout.tsx            # ThemeProvider + AuthProvider + ToastProvider + globals.css
    globals.css           # oklch 0.646→0.488, tw-animate, @theme inline
    admin/page.tsx        # Admin venues + reset (admin only)
    organiser/page.tsx    # Create event (organiser) + stats revenue/occupancy
    events/ page.tsx + [id]/page.tsx  # FilterBar + EventCard grid + detail + progress
    shows/[id]/page.tsx    # SeatMap + HoldTimer + hold/book + waitlist per category
    bookings/page.tsx     # BookingTicket QR + cancel
    waitlist/ page.tsx + claim/page.tsx + claim-client.tsx
    auth/login|register/page.tsx
    api/ auth/*, venues, events, shows/[id]/hold, bookings, waitlist, organiser/stats, emails, admin/reset
  components/
    curtain/  event-card, filter-bar, seat-map, hold-timer, booking-ticket
    ticketing/ header (absolute p-4 like hero-1), landing-nav
    ui/ badge, button, card, dialog, hero-1, input, label, number-ticker, select, separator, shimmer-button, shine-border, toast
    landing-background.tsx 5 blobs, theme-provider.tsx
  lib/
    types.ts, seed.ts, db.ts (file + /tmp prod + atomicWrite), db-firestore.ts, firebase.ts (.env), firebase-admin.ts, auth.ts (JWT HS256 + bcrypt async + Firebase verify), auth-context.tsx (Firebase client fallback), qr.ts (HMAC), booking-reference.ts (CSPRNG), email.ts (mock), utils.ts
  public/logo.svg 6.5k white 3-fold C (invert dark:invert-0 h-14 sm:h-16)
  .env / .env.example  NEXT_PUBLIC_FIREBASE_* + JWT_SECRET + USE_FIRESTORE
  next.config.mjs  remotePatterns images.unsplash.com/file.garden, package.json 16.2.3 react 19
```

Production checklist: `JWT_SECRET 32+`, `USE_FIRESTORE=true` + `FIREBASE_SERVICE_ACCOUNT_JSON` for durability, `next build` `✓` 24 routes, `Header`/`LandingBackground` on all pages `pt-24 sm:pt-28` offset for `absolute` header, `EventCard` `bg-white text-zinc-900` bubbles, `next/image` `loading=lazy` on event/venue/QR/logo.
