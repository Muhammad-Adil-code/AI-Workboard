import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'
import Client from '@/models/Client'
import { parseIntent, Intent } from '@/lib/intentParser'

async function execute(intent: Intent): Promise<string> {
  await connectDB()

  if (intent.type === 'greet') {
    const tasks = await Task.find({ boardId: 'default' })
    const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done')
    const inProgress = tasks.filter((t: any) => t.status === 'in-progress')
    const urgent = tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'done')
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    let msg = `${greeting}! You have ${tasks.length} tasks total. `
    if (inProgress.length > 0) msg += `${inProgress.length} in progress right now. `
    if (overdue.length > 0) msg += `Heads up — ${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue. `
    if (urgent.length > 0) msg += `${urgent.length} urgent task${urgent.length > 1 ? 's need' : ' needs'} your attention. `
    if (overdue.length === 0 && urgent.length === 0) msg += `Everything is on track. `
    msg += `How can I help you today?`
    return msg
  }

  if (intent.type === 'how_are_you') {
    const tasks = await Task.find({ boardId: 'default' })
    const done = tasks.filter((t: any) => t.status === 'done').length
    const replies = [
      `I'm doing great, thanks for asking! I've been helping you track ${tasks.length} tasks and ${done} are already done. How about you?`,
      `All good on my end! Your board is looking active with ${tasks.length} tasks. I'm ready to help whenever you need me.`,
      `Feeling productive! You have ${tasks.length} tasks on your board. Ready to crush some of them today?`,
    ]
    return replies[Math.floor(tasks.length % replies.length)]
  }

  if (intent.type === 'who_are_you') {
    return `I'm your WorkBoard voice assistant — a fully local AI built into this app. I help you manage your freelance tasks, clients, and projects using just your voice. No internet needed, no API keys, completely private.`
  }

  if (intent.type === 'what_can_you_do') {
    return `I can do quite a lot! You can say things like: board summary, what's overdue, what's in progress, move the first task to done, add task with high priority, or tasks for a specific client. I also understand casual conversation, so just talk to me naturally!`
  }

  if (intent.type === 'thank_you') {
    const replies = [
      `You're welcome! Is there anything else I can help you with?`,
      `Happy to help! Just say the word whenever you need me.`,
      `Anytime! Your productivity is my priority.`,
      `Of course! Keep up the great work on your projects!`,
    ]
    const tasks = await Task.find({ boardId: 'default' })
    return replies[tasks.length % replies.length]
  }

  if (intent.type === 'joke') {
    const jokes = [
      `Why do programmers prefer dark mode? Because light attracts bugs! Speaking of bugs, do you have any in your task list?`,
      `Why did the developer go broke? Because he used up all his cache! Anyway, how can I help you today?`,
      `A task walks into a bar and says "I'll never get done". The bartender says "sounds like you need to be moved to in-progress". Want me to check your tasks?`,
    ]
    const tasks = await Task.find({ boardId: 'default' })
    return jokes[tasks.length % jokes.length]
  }

  if (intent.type === 'confused') {
    return `No worries! Here are some things you can ask me: say "board summary" to get an overview, "what's overdue" to check late tasks, "move the first task to done", or "add task: your task name here". Just speak naturally and I'll do my best!`
  }

  if (intent.type === 'get_summary') {
    const tasks = await Task.find({ boardId: 'default' }).populate('clientId')
    const clients = await Client.find()
    const todo = tasks.filter((t: any) => t.status === 'todo')
    const inProg = tasks.filter((t: any) => t.status === 'in-progress')
    const review = tasks.filter((t: any) => t.status === 'review')
    const done = tasks.filter((t: any) => t.status === 'done')
    const overdue = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done')
    const urgent = tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'done')

    let summary = `Here's your board summary. You have ${tasks.length} tasks across ${clients.length} clients. `
    summary += `${todo.length} to do, ${inProg.length} in progress, ${review.length} in review, and ${done.length} completed. `

    if (inProg.length > 0) {
      summary += `You're currently working on: ${inProg.map((t: any) => t.title).join(', ')}. `
    }
    if (urgent.length > 0) {
      summary += `You have ${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} that need attention: ${urgent.map((t: any) => t.title).join(', ')}. `
    }
    if (overdue.length > 0) {
      summary += `Warning — ${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} overdue: ${overdue.map((t: any) => t.title).join(', ')}.`
    } else {
      summary += `Great news — no overdue tasks!`
    }
    return summary
  }

  if (intent.type === 'get_overdue') {
    const tasks = await Task.find({ boardId: 'default', status: { $ne: 'done' } })
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
    if (!overdue.length) return 'Great news! You have no overdue tasks right now.'
    return `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${overdue.map(t => t.title).join(', ')}.`
  }

  if (intent.type === 'get_in_progress') {
    const tasks = await Task.find({ boardId: 'default', status: 'in-progress' })
    if (!tasks.length) return 'No tasks are currently in progress.'
    return `You are working on ${tasks.length} task${tasks.length > 1 ? 's' : ''}: ${tasks.map(t => t.title).join(', ')}.`
  }

  if (intent.type === 'get_client_tasks') {
    const client = await Client.findOne({ name: new RegExp(intent.clientName, 'i') })
    if (!client) return `I could not find a client named ${intent.clientName}.`
    const tasks = await Task.find({ clientId: client._id })
    if (!tasks.length) return `No tasks found for ${client.name}.`
    return `${client.name} has ${tasks.length} task${tasks.length > 1 ? 's' : ''}: ${tasks.map(t => `${t.title} which is ${t.status}`).join(', ')}.`
  }

  if (intent.type === 'create_task') {
    let clientId = undefined
    if ((intent as any).clientName) {
      const client = await Client.findOne({ name: new RegExp((intent as any).clientName, 'i') })
      clientId = client?._id
    }
    await Task.create({
      title: intent.title,
      priority: intent.priority,
      tags: intent.tags,
      clientId,
      dueDate: intent.dueDays !== undefined ? new Date(Date.now() + intent.dueDays * 86400000) : undefined,
      status: 'todo',
      subtasks: [],
      boardId: 'default',
      order: Date.now(),
    })
    return `Done! I've added "${intent.title}" as a ${intent.priority} priority task.`
  }

  if (intent.type === 'update_status') {
    const task = await Task.findOne({ title: new RegExp(intent.keyword, 'i'), boardId: 'default' })
    if (!task) return `I could not find a task matching "${intent.keyword}". Try saying a word from the task title.`
    await Task.findByIdAndUpdate(task._id, { status: intent.status })
    return `Done! I moved "${task.title}" to ${intent.status}.`
  }

  if (intent.type === 'update_status_positional') {
    const query: any = { boardId: 'default' }
    if (intent.fromStatus) query.status = intent.fromStatus
    else query.status = { $ne: 'done' }

    const tasks = await Task.find(query).sort({ order: 1, createdAt: 1 })
    if (!tasks.length) return `I could not find any tasks in that column.`

    const idx = intent.position === -1 ? tasks.length - 1 : intent.position
    const task = tasks[idx] || tasks[0]
    await Task.findByIdAndUpdate(task._id, { status: intent.toStatus })
    return `Done! I moved "${task.title}" to ${intent.toStatus}.`
  }

  if (intent.type === 'update_priority') {
    const task = await Task.findOne({ title: new RegExp(intent.keyword, 'i'), boardId: 'default' })
    if (!task) return `I could not find a task matching "${intent.keyword}".`
    await Task.findByIdAndUpdate(task._id, { priority: intent.priority })
    return `Done! "${task.title}" is now ${intent.priority} priority.`
  }

  const raw = (intent as any).raw || ''
  const suggestions = [
    `I heard you say "${raw}" but I'm not sure how to help with that. Try saying "board summary", "what's overdue", or "add task" followed by your task name.`,
    `Hmm, I didn't quite catch what you need. You can ask me things like "what's in progress", "move a task", or "add a new task". What would you like to do?`,
    `I heard "${raw}" — that's a bit outside what I know how to do right now. Try asking about your tasks or say "what can you do" to hear my full capabilities.`,
  ]
  const tasks = await Task.find({ boardId: 'default' }).limit(1)
  return suggestions[tasks.length % suggestions.length]
}

function parsePriority(text: string): string | null {
  const t = text.toLowerCase()
  if (/(urgent|critical|asap)/.test(t)) return 'urgent'
  if (/(high|important)/.test(t)) return 'high'
  if (/(medium|normal|moderate)/.test(t)) return 'medium'
  if (/(low|minor|later)/.test(t)) return 'low'
  return null
}

function parseDueDays(text: string): number | undefined {
  const t = text.toLowerCase()
  if (t.includes('today')) return 0
  if (t.includes('tomorrow')) return 1
  if (t.includes('next week')) return 7
  if (t.includes('this week')) return 4
  const m = t.match(/(\d+)\s*days?/)
  if (m) return parseInt(m[1])
  return undefined
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { command, gather } = body
  if (!command?.trim()) return NextResponse.json({ reply: 'I did not catch that. Please try again.' })

  await connectDB()
  const clients = await Client.find()

  // ── Multi-turn task creation flow ──
  if (gather) {
    const text = command.toLowerCase().trim()

    // Step: collecting title
    if (gather.step === 'title') {
      const title = command.trim()
      return NextResponse.json({
        needsMore: true,
        question: `Got it — "${title}". What priority should this be? Low, medium, high, or urgent?`,
        gather: { step: 'priority', title },
      })
    }

    // Step: collecting priority
    if (gather.step === 'priority') {
      const priority = parsePriority(text) || 'medium'
      const clientNames = clients.map((c: any) => c.name.split(' ')[0]).join(', ')
      return NextResponse.json({
        needsMore: true,
        question: `Priority set to ${priority}. Which client is this for?${clientNames ? ` You have: ${clientNames}.` : ''} Say "no client" to skip.`,
        gather: { step: 'client', title: gather.title, priority },
      })
    }

    // Step: collecting client
    if (gather.step === 'client') {
      let clientName: string | null = null
      if (!/(no client|skip|none|no one|nobody)/.test(text)) {
        const matched = clients.find((c: any) =>
          text.includes(c.name.toLowerCase().split(' ')[0])
        )
        if (matched) clientName = (matched as any).name
      }
      return NextResponse.json({
        needsMore: true,
        question: clientName
          ? `Got it, ${clientName}. When is this due? You can say "tomorrow", "next week", or "no due date".`
          : `No client set. When is this due? Say "tomorrow", "next week", or "no due date".`,
        gather: { step: 'due', title: gather.title, priority: gather.priority, clientName },
      })
    }

    // Step: collecting due date — now create the task
    if (gather.step === 'due') {
      const dueDays = /(no due|no date|skip|none)/.test(text) ? undefined : parseDueDays(text)
      let clientId = undefined
      if (gather.clientName) {
        const client = await Client.findOne({ name: new RegExp(gather.clientName, 'i') })
        clientId = client?._id
      }
      await Task.create({
        title: gather.title,
        priority: gather.priority || 'medium',
        clientId,
        dueDate: dueDays !== undefined ? new Date(Date.now() + dueDays * 86400000) : undefined,
        status: 'todo',
        subtasks: [],
        tags: [],
        boardId: 'default',
        order: Date.now(),
      })
      return NextResponse.json({
        reply: `Done! I've added "${gather.title}" as a ${gather.priority} priority task${gather.clientName ? ` for ${gather.clientName}` : ''}. You can find it in the To Do column.`,
        action: 'create_task',
      })
    }
  }

  // ── Check if user wants to create a task (trigger multi-turn) ──
  const intent = parseIntent(command)

  if (intent.type === 'create_task') {
    // If they gave full details in one shot (e.g. "add task: fix login bug, high priority") — create directly
    if (intent.title && intent.title.length > 3) {
      const result = await execute(intent)
      return NextResponse.json({ reply: result, action: 'create_task' })
    }
    // Otherwise start the gathering flow
    return NextResponse.json({
      needsMore: true,
      question: `Sure! What's the title of the new task?`,
      gather: { step: 'title' },
    })
  }

  // Vague "add task" / "new task" / "create task" without details
  if (/(add|create|new|make)\s+(a\s+)?(new\s+)?task\s*$/.test(command.toLowerCase().trim())) {
    return NextResponse.json({
      needsMore: true,
      question: `Of course! What's the title of the task?`,
      gather: { step: 'title' },
    })
  }

  const result = await execute(intent)
  const actionTypes = ['update_status', 'update_status_positional', 'update_priority']
  const action = actionTypes.includes(intent.type) ? intent.type : null
  return NextResponse.json({ reply: result, action })
}
