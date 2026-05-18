import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, location, category, description } = await req.json()

  const hasDraft = description && description.trim().length > 0

  const userContent = hasDraft
    ? `Event: "${title}" | Location: ${location || 'TBD'} | Category: ${category}\n\nThe organiser has already written this draft description:\n"${description.trim()}"\n\nImprove it — keep their intent and any specific details, but make it cleaner, friendlier, and more engaging.`
    : `Event: "${title}" | Location: ${location || 'TBD'} | Category: ${category}`

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
          content: hasDraft
            ? 'You are a friendly editor for a community events app. The user has written a draft description. Improve it: fix grammar, improve clarity and warmth, and keep all specific details the organiser mentioned. Return plain text only — no markdown, no bullet points, 2–3 sentences.'
            : 'Write a concise, friendly 2–3 sentence event description for a community events app. Plain text only, no markdown.',
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
    }),
  })

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ text })
}