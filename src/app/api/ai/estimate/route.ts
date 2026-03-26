import { NextRequest, NextResponse } from 'next/server'
import { askGPT } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { title, description, pastTasks } = await req.json()

  const prompt = `You are a freelance productivity assistant. Estimate how many hours this task will take.

New Task: "${title}"
${description ? `Description: ${description}` : ''}

${pastTasks?.length ? `Past completed tasks for reference:\n${pastTasks.map((t: any) => `- "${t.title}" took ${t.actualHours}h`).join('\n')}` : ''}

Return JSON only with this shape:
{"estimatedHours": 2.5, "confidence": "medium", "reasoning": "one sentence reason"}

Confidence is "low", "medium", or "high". Return only the JSON.`

  const raw = await askGPT(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ estimatedHours: 2, confidence: 'low', reasoning: 'Could not estimate.' })

  try {
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ estimatedHours: 2, confidence: 'low', reasoning: 'Could not estimate.' })
  }
}
