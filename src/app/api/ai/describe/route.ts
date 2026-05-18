import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, location, category } = await req.json()

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL ?? '',
      'X-Title': 'MyEventsMap',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-v4-flash',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'Write a concise, friendly 2–3 sentence event description for a community events app. Plain text only, no markdown.',
        },
        {
          role: 'user',
          content: `Event: "${title}" | Location: ${location || 'TBD'} | Category: ${category}`,
        },
      ],
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ text })
}