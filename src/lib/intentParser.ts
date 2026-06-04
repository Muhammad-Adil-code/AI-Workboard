export type Intent =
  | { type: 'create_task'; title: string; priority: string; tags: string[]; dueDays?: number }
  | { type: 'update_status'; keyword: string; status: string }
  | { type: 'update_priority'; keyword: string; priority: string }
  | { type: 'get_summary' }
  | { type: 'get_overdue' }
  | { type: 'get_in_progress' }
  | { type: 'get_client_tasks'; clientName: string }
  | { type: 'greet' }
  | { type: 'unknown' }

const STATUS_MAP: Record<string, string> = {
  'todo': 'todo', 'to do': 'todo', 'to-do': 'todo', 'backlog': 'todo',
  'in progress': 'in-progress', 'in-progress': 'in-progress', 'working': 'in-progress', 'started': 'in-progress',
  'review': 'review', 'testing': 'review', 'checking': 'review',
  'done': 'done', 'finished': 'done', 'complete': 'done', 'completed': 'done', 'closed': 'done',
}

const PRIORITY_MAP: Record<string, string> = {
  'urgent': 'urgent', 'critical': 'urgent', 'asap': 'urgent', 'emergency': 'urgent',
  'high': 'high', 'important': 'high',
  'medium': 'medium', 'normal': 'medium', 'moderate': 'medium',
  'low': 'low', 'minor': 'low', 'later': 'low',
}

function matchPriority(text: string): string {
  for (const [word, p] of Object.entries(PRIORITY_MAP)) {
    if (text.includes(word)) return p
  }
  return 'medium'
}

function matchStatus(text: string): string | null {
  for (const [word, s] of Object.entries(STATUS_MAP)) {
    if (text.includes(word)) return s
  }
  return null
}

function extractDueDays(text: string): number | undefined {
  if (text.includes('today')) return 0
  if (text.includes('tomorrow')) return 1
  const match = text.match(/in (\d+) days?/)
  if (match) return parseInt(match[1])
  if (text.includes('this week')) return 5
  if (text.includes('next week')) return 7
  return undefined
}

function extractTags(text: string): string[] {
  const tagWords = ['design', 'frontend', 'backend', 'bug', 'feature', 'api', 'ui', 'ux',
    'database', 'devops', 'testing', 'docs', 'mobile', 'performance', 'security', 'review']
  return tagWords.filter(t => text.includes(t))
}

export function parseIntent(raw: string): Intent {
  const text = raw.toLowerCase().trim()

  // Greet
  if (/^(hey|hi|hello|good morning|good evening|howdy|what'?s up|sup)/.test(text)) {
    return { type: 'greet' }
  }

  // Summary
  if (/(summary|overview|status|how many tasks|board update|update me|what do i have|my tasks)/.test(text)) {
    return { type: 'get_summary' }
  }

  // Overdue
  if (/(overdue|late|missed|past due|behind)/.test(text)) {
    return { type: 'get_overdue' }
  }

  // In progress
  if (/(in progress|working on|current|active|ongoing)/.test(text)) {
    return { type: 'get_in_progress' }
  }

  // Client tasks
  const clientMatch = text.match(/(?:tasks? for|what(?:'s| is) ([\w\s]+) (?:working on|doing)|show ([\w\s]+) tasks?)/)
  if (clientMatch) {
    const name = (clientMatch[1] || clientMatch[2] || '').trim()
    if (name) return { type: 'get_client_tasks', clientName: name }
  }

  // Move/update status: "move X to done", "mark X as in progress", "set X to review"
  const statusMatch = text.match(/(?:move|mark|set|put|change|update)\s+(?:the\s+)?(.+?)\s+(?:to|as)\s+(todo|to do|in progress|in-progress|review|done|finished|complete|completed|working)/)
  if (statusMatch) {
    const status = matchStatus(statusMatch[2])
    if (status) return { type: 'update_status', keyword: statusMatch[1].trim(), status }
  }

  // Update priority: "make X urgent", "set X to high priority"
  const priorityMatch = text.match(/(?:make|set|mark|change|update)\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(?:priority\s+)?(urgent|critical|high|important|medium|normal|low|minor)/)
  if (priorityMatch) {
    return {
      type: 'update_priority',
      keyword: priorityMatch[1].trim(),
      priority: PRIORITY_MAP[priorityMatch[2]] || 'medium',
    }
  }

  // Create task: "add task X", "create task X", "new task X"
  const createMatch = text.match(/(?:add|create|new|make)\s+(?:a\s+)?(?:new\s+)?task[:\s]+(.+)/)
  if (createMatch) {
    const rest = createMatch[1]
    const priority = matchPriority(rest)
    // Clean priority words from title
    const cleanTitle = rest
      .replace(/(urgent|critical|high|important|medium|normal|low|minor|priority)/g, '')
      .replace(/\s+/g, ' ').trim()
    return {
      type: 'create_task',
      title: cleanTitle,
      priority,
      tags: extractTags(rest),
      dueDays: extractDueDays(rest),
    }
  }

  // "add" without "task" keyword — still try to create
  const addMatch = text.match(/^(?:add|create|new)\s+(.{5,})/)
  if (addMatch) {
    const rest = addMatch[1]
    return {
      type: 'create_task',
      title: rest.replace(/(urgent|critical|high|important|medium|normal|low|minor|priority)/g, '').trim(),
      priority: matchPriority(rest),
      tags: extractTags(rest),
      dueDays: extractDueDays(rest),
    }
  }

  return { type: 'unknown' }
}

export function buildReply(intent: Intent, result: string): string {
  switch (intent.type) {
    case 'greet': return result
    case 'create_task': return `Done! I've added "${(intent as any).title}" as a ${(intent as any).priority} priority task.`
    case 'update_status': return `Got it. I moved the task to ${(intent as any).status}.`
    case 'update_priority': return `Done! Priority updated to ${(intent as any).priority}.`
    case 'get_summary': return result
    case 'get_overdue': return result
    case 'get_in_progress': return result
    case 'get_client_tasks': return result
    default: return result
  }
}
