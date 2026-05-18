export interface SpamResult {
  isSpam: boolean
  reason?: string
}

const referer = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

export async function checkEventSpam(data: {
  title: string
  description: string
  location: string
}): Promise<SpamResult> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': referer,
      'X-Title': 'MyEventsMap',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-v4-flash',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: `You are a spam detector for a community events platform.
Respond ONLY with valid JSON: {"isSpam": boolean, "reason": string | null}
Flag as spam if: fake/scam content, excessive caps/symbols, irrelevant ads,
nonsensical text, or clearly malicious intent.
Legitimate community events (sports, music, food, tech meetups, charity) should NOT be flagged.`,
        },
        {
          role: 'user',
          content: `Title: ${data.title}\nLocation: ${data.location}\nDescription: ${data.description}`,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  const result = await res.json()
  const text = result.choices?.[0]?.message?.content ?? '{}'

  try {
    return JSON.parse(text)
  } catch {
    return { isSpam: false }
  }
}