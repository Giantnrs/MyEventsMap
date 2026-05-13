'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Category } from '@prisma/client'
import * as cheerio from 'cheerio'

const BASE_URL = 'https://hamiltonlibraries.co.nz'
const CALENDAR_URL = `${BASE_URL}/whats-on/event-calendar`

// ─── Geocoding via Mapbox ─────────────────────────────────────────────────────
// Cache results within a single scrape run to avoid re-hitting the API
// for the same branch name (many events share the same branch).
const geocodeCache = new Map<string, { lat: number; lng: number }>()

async function geocodeLocation(locationText: string): Promise<{ lat: number; lng: number }> {
  const fallback = { lat: -37.7870, lng: 175.2793 } // Central Library fallback

  if (!locationText) return fallback

  // Normalise: strip Māori subtitles e.g. "Rototuna Library - Te Kete Aronui" → "Rototuna Library"
  // and append "Hamilton NZ" so Mapbox doesn't find a town in another country
  const cleaned = locationText
    .replace(/\s*[-–]\s*Te [A-ZĀĒĪŌŪa-zāēīōū ]+$/, '') // strip Māori subtitle after dash
    .replace(/\s+/g, ' ')
    .trim()
  const query = `${cleaned}, Hamilton, New Zealand`

  if (geocodeCache.has(query)) return geocodeCache.get(query)!

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return fallback

    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${token}&limit=1&country=NZ&proximity=175.2793,-37.7870`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return fallback

    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return fallback

    const [lng, lat] = feature.center as [number, number]
    const coords = { lat, lng }
    geocodeCache.set(query, coords)
    return coords
  } catch {
    return fallback
  }
}

// ─── Category guesser ─────────────────────────────────────────────────────────
function guessCategory(title: string, description: string): Category {
  const t = `${title} ${description}`.toLowerCase()
  if (/3d print|tech|digit|code|computer|coding|laser/.test(t))             return 'TECH'
  if (/craft|art|draw|paint|creat|knit|sew|makerspace|exhibition/.test(t))  return 'ARTS'
  if (/book club|author|read|literature|poetry|storytime|rhyme/.test(t))    return 'OTHER'
  if (/music|sing|choir|concert|instrument|wriggle/.test(t))                return 'MUSIC'
  if (/hike|outdoor|garden|nature|lake/.test(t))                            return 'OUTDOOR'
  if (/food|cook|bake/.test(t))                                             return 'FOOD'
  if (/sport|fitness|yoga|exercise/.test(t))                                return 'SPORTS'
  if (/community|volunteer|charity|justice|support|sign language/.test(t))  return 'CHARITY'
  return 'OTHER'
}

// ─── Date / time parsing (NZ timezone-aware) ─────────────────────────────────
//
// Two bugs in the original approach:
//   1. new Date("8 May 2025 11:00am") — Node doesn't reliably parse "11:00am"
//      (needs a space before AM/PM). We parse components manually instead.
//   2. Dates constructed without a timezone are treated as UTC on the server,
//      shifting NZ events by ±12 h. We build ISO-8601 strings with "+12:00"
//      so the stored UTC value is correct for NZST.

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

/** Parse "11:00am" or "3:30pm" → 24-h { h, m }, or null. */
function parseTime12(raw: string): { h: number; m: number } | null {
  const m = raw.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i)
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  const ampm = m[3].toLowerCase()
  if (ampm === 'pm' && h !== 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return { h, m: min }
}

/** Build a Date in NZ Standard Time (UTC+12) from components. */
function nzDate(
  day: string,
  month: string,
  year: string | number,
  time?: { h: number; m: number },
): Date {
  const mm = MONTH_MAP[month.toLowerCase().slice(0, 3)]
  if (!mm) return new Date(NaN)
  const dd  = String(day).padStart(2, '0')
  const hh  = time ? String(time.h).padStart(2, '0') : '00'
  const min = time ? String(time.m).padStart(2, '0') : '00'
  // "+12:00" tells JS this is NZ local time so it stores the correct UTC value
  return new Date(`${year}-${mm}-${dd}T${hh}:${min}:00+12:00`)
}

function parseEventDate(
  dateText: string,
  timeText: string,
): { startTime: Date; endTime?: Date } | null {
  const now = new Date()
  const currentYear = now.getFullYear()

  const clean = (s: string) => s.replace(/[\u2013\u2014-]/g, '-').replace(/\s+/g, ' ').trim()

  // Merge both strings — the site sometimes puts date+time in one element
  const combined = clean(`${dateText} ${timeText}`)

  // "Until Thursday 30 July [2025]"
  const untilMatch = combined.match(/until\s+(?:\w+\s+)?(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/i)
  if (untilMatch) {
    const [, day, month, year] = untilMatch
    const endTime = nzDate(day, month, year ?? currentYear)
    if (!isNaN(endTime.getTime())) return { startTime: now, endTime }
  }

  // Extract date: "8 May [2025]"
  const dateMatch = combined.match(/(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/)
  if (!dateMatch) return null

  const [, day, month, yearStr] = dateMatch
  const year = yearStr ?? currentYear

  // Extract all time tokens e.g. "11:00am", "12:00pm"
  const allTimes = [...combined.matchAll(/(\d{1,2}:\d{2}\s*(?:am|pm))/gi)].map(m => m[1])
  const t0 = allTimes[0] ? parseTime12(allTimes[0]) : null
  const t1 = allTimes[1] ? parseTime12(allTimes[1]) : null

  const startTime = nzDate(day, month, year, t0 ?? undefined)
  if (isNaN(startTime.getTime())) return null

  const endTime = t1 ? nzDate(day, month, year, t1) : undefined
  return { startTime, endTime }
}


// ─── Fetch a single event detail page ────────────────────────────────────────
async function fetchEventDetail(url: string): Promise<{
  title: string
  description: string
  imageUrl?: string
  occurrences: Array<{ dateText: string; timeText: string; location: string }>
} | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyEventsMap/1.0)' },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const html = await res.text()
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr('content')
        ?.replace(/\s*[–|-]\s*Hamilton Libraries.*$/i, '').trim() ||
      $('h1').first().text().trim() || ''

    const description =
      $('.event-detail__content p, .content-body p, .typography p, article p, .cms-content p')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .join(' ')
        .slice(0, 800) ||
      $('meta[name="description"]').attr('content')?.trim() || ''

    const ogImage = $('meta[property="og:image"]').attr('content')
    const imgSrc  = $('img.event-image, .event-detail img, article img').first().attr('src')
    const imageUrl = ogImage
      || (imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}${imgSrc}`) : undefined)

    const occurrences: Array<{ dateText: string; timeText: string; location: string }> = []
    const seen = new Set<string>()

    $('*').each((_, el) => {
      const text = $(el).text().trim()
      if (
        text.length > 120 ||
        !/(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|until)/i.test(text)
      ) return
      if (seen.has(text)) return
      seen.add(text)

      const parent = $(el).parent()
      let timeText = ''
      parent.find('*').each((_, child) => {
        const ct = $(child).text().trim()
        if (!timeText && /\d{1,2}:\d{2}(?:am|pm)/i.test(ct) && ct.length < 30) timeText = ct
      })

      let location = ''
      parent.find('a').each((_, a) => {
        const lt = $(a).text().trim()
        if (/library|kete|online|digital/i.test(lt)) { location = lt; return false }
      })
      if (!location) {
        $(el).closest('tr, li, [class*="row"], [class*="session"]').find('a').each((_, a) => {
          const lt = $(a).text().trim()
          if (/library|kete|online|digital/i.test(lt)) { location = lt; return false }
        })
      }

      occurrences.push({ dateText: text, timeText, location })
    })

    return { title, description, imageUrl, occurrences }
  } catch (err) {
    console.error('Detail fetch failed:', url, err)
    return null
  }
}

// ─── Public types ─────────────────────────────────────────────────────────────
export interface ScrapedEvent {
  title: string
  description: string
  location: string
  lat: number
  lng: number
  startTime: Date
  endTime?: Date
  category: Category
  imageUrl?: string
  sourceUrl: string
}

// ─── Main scrape ───────────────────────────────────────────────────────────────
export async function scrapeHamiltonLibraries(): Promise<{
  previews: ScrapedEvent[]
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')
  const userId = session.user.id as string // eslint-disable-line

  // Clear geocode cache for each fresh scrape run
  geocodeCache.clear()

  try {
    const res = await fetch(CALENDAR_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyEventsMap/1.0)' },
      cache: 'no-store',
    })
    if (!res.ok) return { previews: [], error: `HTTP ${res.status} fetching calendar` }

    const html = await res.text()
    const $ = cheerio.load(html)

    // ── Step 1: collect event links + inline card data ────────────────────────
    const eventLinks = new Set<string>()
    type CardInline = { dateText: string; timeText: string; location: string; imageUrl?: string }
    const cardData = new Map<string, CardInline>()

    $('a[href]').each((_, anchor) => {
      const href = $(anchor).attr('href') ?? ''
      if (!/\/whats-on\/event-calendar\/[^/?#\s]+/.test(href)) return
      const full = href.startsWith('http') ? href : `${BASE_URL}${href}`
      eventLinks.add(full)
      if (cardData.has(full)) return

      const card = $(anchor).closest('article, li, [class*="card"], [class*="item"], [class*="event"]')
      const imgSrc = card.find('img').first().attr('src')
      const imageUrl = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${BASE_URL}${imgSrc}`) : undefined

      let dateText = ''
      let timeText = ''
      card.find('p, span, div, td, time').each((_, el) => {
        const t = $(el).text().trim()
        if (!dateText && /(?:until|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\s+\w+)/i.test(t) && t.length < 80) dateText = t
        if (!timeText && /\d{1,2}:\d{2}(?:am|pm)/i.test(t)) timeText = t
      })

      let location = ''
      card.find('a').each((_, a) => {
        const lt = $(a).text().trim()
        if (/library|kete|online|digital/i.test(lt)) { location = lt; return false }
      })

      cardData.set(full, { dateText, timeText, location, imageUrl })
    })

    if (eventLinks.size === 0) {
      return {
        previews: [],
        error:
          'Found 0 event links. The site may render events via JavaScript. ' +
          'Open DevTools → Network → Fetch/XHR, reload and look for a JSON endpoint.',
      }
    }

    // ── Step 2: fetch detail pages + geocode locations ────────────────────────
    const scraped: ScrapedEvent[] = []

    for (const url of eventLinks) {
      const detail = await fetchEventDetail(url)
      const inline = cardData.get(url)

      const title = detail?.title || ''
      if (!title) continue

      const description = detail?.description || ''
      const imageUrl    = detail?.imageUrl || inline?.imageUrl
      const category    = guessCategory(title, description)

      const occurrences =
        detail?.occurrences && detail.occurrences.length > 0
          ? detail.occurrences
          : [{ dateText: inline?.dateText ?? '', timeText: inline?.timeText ?? '', location: inline?.location ?? '' }]

      let addedAny = false
      for (const { dateText, timeText, location: occLoc } of occurrences) {
        const locationText = occLoc || inline?.location || 'Hamilton City Libraries'
        const parsed = parseEventDate(dateText, timeText)
        if (!parsed) continue

        // ← Proper Mapbox geocoding instead of hardcoded coords
        const coords = await geocodeLocation(locationText)

        scraped.push({
          title,
          description,
          location: locationText,
          lat: coords.lat,
          lng: coords.lng,
          startTime: parsed.startTime,
          endTime:   parsed.endTime,
          category,
          imageUrl,
          sourceUrl: url,
        })
        addedAny = true
      }

      // Unparseable date — still surface in preview with geocoded location
      if (!addedAny) {
        const locationText = inline?.location || 'Hamilton City Libraries'
        const coords = await geocodeLocation(locationText)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        scraped.push({
          title,
          description,
          location: locationText,
          lat: coords.lat,
          lng: coords.lng,
          startTime: tomorrow,
          category,
          imageUrl,
          sourceUrl: url,
        })
      }
    }

    return { previews: scraped }
  } catch (err) {
    console.error('Scrape error:', err)
    return { previews: [], error: String(err) }
  }
}

// ─── Commit to DB (selective rewrite) ────────────────────────────────────────
// Only removes existing events whose titles match the incoming scraped set.
// Manually-created events with different titles are left completely untouched.
export async function importScrapedEvents(events: ScrapedEvent[]): Promise<{
  created: number
  deleted: number
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  // Extract and assert userId — TypeScript can't narrow past redirect()
  const userId = session.user.id as string

  // Collect the unique set of titles we're about to import
  const incomingTitles = [...new Set(events.map(ev => ev.title))]

  // Delete only the user's events whose titles overlap with the scraped set
  const { count: deleted } = await prisma.event.deleteMany({
    where: {
      authorId: userId,
      title: { in: incomingTitles },
    },
  })

  // Bulk-insert the fresh scraped events
  await prisma.event.createMany({
    data: events.map(ev => ({
      title:       ev.title,
      description: ev.description || ev.title,
      location:    ev.location,
      lat:         ev.lat,
      lng:         ev.lng,
      startTime:   ev.startTime,
      endTime:     ev.endTime ?? null,
      category:    ev.category,
      imageUrl:    ev.imageUrl
        ?? 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
      authorId:    userId,
    })),
  })

  return { created: events.length, deleted }
}