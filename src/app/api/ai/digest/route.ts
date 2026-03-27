import { NextRequest, NextResponse } from 'next/server'
import { askGPT } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { tasks, clients } = await req.json()

  const done = tasks.filter((t: any) => t.status === 'done').length
  const inProgress = tasks.filter((t: any) => t.status === 'in-progress').length
  const now = new Date()
  const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length

  const prompt = `You are a productivity coach for a freelancer. Write a brief weekly digest.

Stats this week:
- Completed tasks: ${done}
- In progress: ${inProgress}
- Overdue: ${overdue}
- Total clients: ${clients?.length || 0}

Tasks summary: ${tasks.slice(0, 10).map((t: any) => `"${t.title}" (${t.status})`).join(', ')}

Return JSON with this shape:
{
  "completed": ${done},
  "inProgress": ${inProgress},
  "overdue": ${overdue},
  "insight": "One motivating sentence about their week",
  "suggestions": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}

Return only JSON.`

  const raw = await askGPT(prompt)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return NextResponse.json({ completed: done, inProgress, overdue, insight: 'Keep going!', suggestions: [] })

  try {
    return NextResponse.json(JSON.parse(match[0]))
  } catch {
    return NextResponse.json({ completed: done, inProgress, overdue, insight: 'Keep going!', suggestions: [] })
  }
}
