import { NextRequest, NextResponse } from 'next/server'
import { askGPT } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { title, description } = await req.json()

  const prompt = `Break down this freelance task into clear, actionable subtasks.

Task: "${title}"
${description ? `Description: ${description}` : ''}

Return a JSON array of subtask objects with this exact shape:
[{"id":"1","title":"subtask title","done":false}, ...]

Return only the JSON array, no explanation.`

  const raw = await askGPT(prompt)

  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) return NextResponse.json({ subtasks: [] })

  try {
    const subtasks = JSON.parse(match[0])
    return NextResponse.json({ subtasks })
  } catch {
    return NextResponse.json({ subtasks: [] })
  }
}
