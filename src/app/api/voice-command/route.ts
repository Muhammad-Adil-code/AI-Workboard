import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'
import Client from '@/models/Client'
import { parseIntent, Intent } from '@/lib/intentParser'

async function execute(intent: Intent): Promise<string> {
  await connectDB()

  if (intent.type === 'greet') {
    const tasks = await Task.find({ boardId: 'default' })
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    if (overdue > 0) return `Hey! You have ${tasks.length} tasks, ${inProgress} in progress, and ${overdue} overdue. Let's get to work!`
    return `Hey! You have ${tasks.length} tasks and ${inProgress} in progress. Everything looks good!`
  }

  if (intent.type === 'get_summary') {
    const tasks = await Task.find({ boardId: 'default' })
    const todo = tasks.filter(t => t.status === 'todo').length
    const inProg = tasks.filter(t => t.status === 'in-progress').length
    const review = tasks.filter(t => t.status === 'review').length
    const done = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    return `You have ${tasks.length} tasks total: ${todo} to do, ${inProg} in progress, ${review} in review, and ${done} done.${overdue > 0 ? ` Watch out — ${overdue} are overdue!` : ' No overdue tasks, great work!'}`
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
    await Task.create({
      title: intent.title,
      priority: intent.priority,
      tags: intent.tags,
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
  return `I heard "${raw}" but I'm not sure what to do. Try saying: "move the first task to in progress", "board summary", "what's overdue", or "add task: title here".`
}

export async function POST(req: NextRequest) {
  const { command } = await req.json()
  if (!command?.trim()) return NextResponse.json({ reply: 'I did not catch that. Please try again.' })

  const intent = parseIntent(command)
  const result = await execute(intent)
  const reply = intent.type === 'create_task' || intent.type === 'greet' ? result : result

  const actionTypes = ['create_task', 'update_status', 'update_status_positional', 'update_priority']
  const action = actionTypes.includes(intent.type) ? intent.type : null

  return NextResponse.json({ reply, action })
}
