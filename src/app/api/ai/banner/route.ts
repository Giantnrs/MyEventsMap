// src/app/api/ai/banner/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(source: Buffer | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const opts = { folder: 'events/ai-banners', resource_type: 'image' as const }
    if (typeof source === 'string') {
      cloudinary.uploader.upload(source, opts, (err, res) =>
        err ? reject(err) : resolve(res!.secure_url)
      )
    } else {
      cloudinary.uploader
        .upload_stream(opts, (err, res) =>
          err ? reject(err) : resolve(res!.secure_url)
        )
        .end(source)
    }
  })
}

function isRawBase64Image(s: string): boolean {
  if (s.startsWith('iVBORw') || s.startsWith('/9j/')) return true
  return s.length > 500 && /^[A-Za-z0-9+/]+=*$/.test(s.slice(0, 200))
}

function base64MimeType(s: string): string {
  if (s.startsWith('/9j/'))   return 'image/jpeg'
  if (s.startsWith('iVBORw')) return 'image/png'
  return 'image/png'
}

function findImageAnywhere(obj: any, depth = 0): string | null {
  if (depth > 6 || !obj || typeof obj !== 'object') return null
  for (const val of Object.values(obj)) {
    if (typeof val === 'string') {
      const s = val.trim()
      if (!s) continue
      if (s.startsWith('data:image'))                            return s
      if (s.startsWith('http://') || s.startsWith('https://'))  return s
      if (isRawBase64Image(s)) return `data:${base64MimeType(s)};base64,${s}`
    } else if (typeof val === 'object' && val !== null) {
      const found = findImageAnywhere(val, depth + 1)
      if (found) return found
    }
  }
  return null
}

// ── Prompt builder ────────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, string> = {
  OUTDOOR: 'lush natural landscape, golden-hour sunlight, misty mountains or forest trail, wide open skies',
  MUSIC:   'electric concert atmosphere, dramatic stage lighting, bokeh light trails, euphoric crowd silhouettes',
  SPORTS:  'high-energy athletic action, motion blur, dramatic stadium or arena lighting, competitive intensity',
  FOOD:    'richly styled food photography, warm candlelight, rustic timber surfaces, steam and colour',
  TECH:    'sleek dark environment, cool blue-white neon accents, holographic data visuals, modern minimalist',
  ARTS:    'vibrant paint splashes, gallery soft-box lighting, creative studio atmosphere, bold colours',
  CHARITY: 'warm community gathering, soft natural light, hopeful and uplifting mood, diverse smiling faces',
  OTHER:   'lively community celebration, colourful decorations, joyful crowd, soft bokeh background',
}

function buildPrompt(params: {
  title: string
  location: string
  category: string
  description: string
}): string {
  const { title, location, category, description } = params

  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.OTHER
  const loc   = location && location.toLowerCase() !== 'tbd' ? location : null

  // Pull meaningful keywords from description (strip common stop words, cap at ~12 words)
  const descKeywords = description
    ? description
        .replace(/[^a-zA-Z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4)
        .slice(0, 12)
        .join(', ')
    : ''

  const parts = [
    // Subject
    `Professional wide-format event banner photograph`,
    `Theme: "${title}"`,
    loc ? `Setting: ${loc}` : null,

    // Mood / keywords from description
    descKeywords ? `Mood and context: ${descKeywords}` : null,

    // Category visual style
    style,

    // Technical quality directives
    `Cinematic 16:6 wide-banner composition`,
    `Ultra-high resolution, sharp focus, rich colours, professional DSLR quality`,
    `Dramatic natural or artificial lighting that fits the mood`,

    // Hard negatives
    `Absolutely no text, no words, no letters, no logos, no watermarks, no UI elements`,
  ]
    .filter(Boolean)
    .join('. ')

  return parts
}

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { title, location, category, description } = await req.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const prompt = buildPrompt({
      title,
      location: location ?? '',
      category:  category ?? 'OTHER',
      description: description ?? '',
    })

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer':  process.env.NEXT_PUBLIC_BASE_URL ?? '',
        'X-Title':       'MyEventsMap',
      },
      body: JSON.stringify({
        model:    'bytedance-seed/seedream-4.5',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const raw = await res.text()

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenRouter error ${res.status}`, detail: raw },
        { status: 502 }
      )
    }

    let data: any
    try { data = JSON.parse(raw) }
    catch { return NextResponse.json({ error: 'Non-JSON from OpenRouter', raw }, { status: 502 }) }

    const imageSource = findImageAnywhere(data)

    if (!imageSource) {
      const safeData = JSON.parse(JSON.stringify(data, (_, v) =>
        typeof v === 'string' && v.length > 120 ? v.slice(0, 120) + '…' : v
      ))
      return NextResponse.json(
        { error: 'No image found in response', structure: safeData },
        { status: 502 }
      )
    }

    let cloudinaryUrl: string
    if (imageSource.startsWith('http')) {
      const imgRes = await fetch(imageSource)
      if (!imgRes.ok) return NextResponse.json({ error: 'Could not fetch image URL' }, { status: 502 })
      cloudinaryUrl = await uploadToCloudinary(Buffer.from(await imgRes.arrayBuffer()))
    } else {
      cloudinaryUrl = await uploadToCloudinary(imageSource)
    }

    return NextResponse.json({ url: cloudinaryUrl })
  } catch (err) {
    console.error('[banner] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}