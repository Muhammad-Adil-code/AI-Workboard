import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'
import Client from '@/models/Client'
import { openai } from '@/lib/openai'

const TOOLS: any[] = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task on the board',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          description: { type: 'string' },
          estimatedHours: { type: 'number' },
          tags: { type: 'array', items: { type: 'string' } },
          clientName: { type: 'string', description: 'Partial client name to match' },
          dueDays: { type: 'number', description: 'Due in how many days from now' },
        },
        required: ['title', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task_status',
      description: 'Move a task to a different status column',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: 'Word from the task title to identify it' },
          status: { type: 'string', enum: ['todo', 'in-progress', 'review', 'done'] },
        },
        required: ['keyword', 'status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task_priority',
      description: 'Change the priority of a task',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        },
        required: ['keyword', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_board_summary',
      description: 'Get a summary of all tasks on the board',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_tasks',
      description: 'Get all overdue tasks',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_client_tasks',
      description: 'Get all tasks for a specific client',
      parameters: {
        type: 'object',
        properties: {
          clientName: { type: 'string' },
        },
        required: ['clientName'],
      },
    },
  },
]

async function runTool(name: string, args: any) {
  await connectDB()

  if (name === 'create_task') {
    let clientId = undefined
    if (args.clientName) {
      const client = await Client.findOne({ name: new RegExp(args.clientName, 'i') })
      clientId = client?._id
    }
    const dueDate = args.dueDays ? new Date(Date.now() + args.dueDays * 86400000) : undefined
    const task = await Task.create({
      title: args.title,
      priority: args.priority || 'medium',
      description: args.description || '',
      estimatedHours: args.estimatedHours,
      tags: args.tags || [],
      clientId,
      dueDate,
      status: 'todo',
      subtasks: [],
      boardId: 'default',
      order: Date.now(),
    })
    return `Created task "${args.title}" with ${args.priority} priority.`
  }

  if (name === 'update_task_status') {
    const task = await Task.findOne({ title: new RegExp(args.keyword, 'i'), boardId: 'default' })
    if (!task) return `Could not find a task matching "${args.keyword}".`
    await Task.findByIdAndUpdate(task._id, { status: args.status })
    return `Moved "${task.title}" to ${args.status}.`
  }

  if (name === 'update_task_priority') {
    const task = await Task.findOne({ title: new RegExp(args.keyword, 'i'), boardId: 'default' })
    if (!task) return `Could not find a task matching "${args.keyword}".`
    await Task.findByIdAndUpdate(task._id, { priority: args.priority })
    return `Updated "${task.title}" priority to ${args.priority}.`
  }

  if (name === 'get_board_summary') {
    const tasks = await Task.find({ boardId: 'default' })
    const todo = tasks.filter(t => t.status === 'todo').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const review = tasks.filter(t => t.status === 'review').length
    const done = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    return `You have ${tasks.length} tasks total. ${todo} to do, ${inProgress} in progress, ${review} in review, ${done} done. ${overdue} tasks are overdue.`
  }

  if (name === 'get_overdue_tasks') {
    const tasks = await Task.find({ boardId: 'default', status: { $ne: 'done' } })
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
    if (!overdue.length) return 'Great news! You have no overdue tasks.'
    return `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}: ${overdue.map(t => t.title).join(', ')}.`
  }

  if (name === 'get_client_tasks') {
    const client = await Client.findOne({ name: new RegExp(args.clientName, 'i') })
    if (!client) return `Could not find client "${args.clientName}".`
    const tasks = await Task.find({ clientId: client._id })
    if (!tasks.length) return `No tasks found for ${client.name}.`
    return `${client.name} has ${tasks.length} tasks: ${tasks.map(t => `${t.title} (${t.status})`).join(', ')}.`
  }

  return 'Action completed.'
}

export async function POST(req: NextRequest) {
  const { command } = await req.json()
  if (!command) return NextResponse.json({ reply: 'I did not catch that.' })

  await connectDB()
  const tasks = await Task.find({ boardId: 'default' }).lean()
  const clients = await Client.find().lean()

  const taskSummary = tasks.map((t: any) => `"${t.title}" (${t.status}, ${t.priority})`).join(', ')
  const clientSummary = clients.map((c: any) => c.name).join(', ')

  const system = `You are a voice assistant for WorkBoard, a freelancer productivity app.
Current tasks: ${taskSummary || 'none'}
Current clients: ${clientSummary || 'none'}
Respond conversationally in 1-2 sentences max. Be friendly and concise — your response will be spoken aloud.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: command },
    ],
    tools: TOOLS,
    tool_choice: 'auto',
  })

  const msg = response.choices[0].message

  // If GPT called a tool
  if (msg.tool_calls?.length) {
    const call = msg.tool_calls[0] as any
    const args = JSON.parse(call.function.arguments)
    const result = await runTool(call.function.name, args)

    // Get a natural spoken response
    const followUp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a friendly voice assistant. Respond in 1-2 short sentences, conversationally. Your response will be spoken aloud.' },
        { role: 'user', content: command },
        { role: 'assistant', content: null, tool_calls: msg.tool_calls } as any,
        { role: 'tool', tool_call_id: call.id, content: result },
      ],
    })
    return NextResponse.json({ reply: followUp.choices[0].message.content || result, action: call.function.name })
  }

  return NextResponse.json({ reply: msg.content || "I'm here to help with your tasks." })
}
