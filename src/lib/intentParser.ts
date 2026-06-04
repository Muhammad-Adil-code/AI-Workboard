export type Intent =
  | { type: 'create_task'; title: string; priority: string; tags: string[]; dueDays?: number }
  | { type: 'update_status'; keyword: string; status: string }
  | { type: 'update_status_positional'; position: number; fromStatus: string | null; toStatus: string }
  | { type: 'update_priority'; keyword: string; priority: string }
  | { type: 'get_summary' }
  | { type: 'get_overdue' }
  | { type: 'get_in_progress' }
  | { type: 'get_client_tasks'; clientName: string }
  | { type: 'greet' }
  | { type: 'how_are_you' }
  | { type: 'what_can_you_do' }
  | { type: 'who_are_you' }
  | { type: 'thank_you' }
  | { type: 'good_job' }
  | { type: 'confused' }
  | { type: 'joke' }
  | { type: 'unknown'; raw: string }

export const STATUS_MAP: Record<string, string> = {
  'todo': 'todo', 'to do': 'todo', 'to-do': 'todo', 'backlog': 'todo', 'to do column': 'todo',
  'in progress': 'in-progress', 'in-progress': 'in-progress', 'progress': 'in-progress',
  'progress column': 'in-progress', 'in progress column': 'in-progress',
  'working': 'in-progress', 'started': 'in-progress', 'the progress': 'in-progress',
  'review': 'review', 'testing': 'review', 'checking': 'review', 'review column': 'review',
  'done': 'done', 'finished': 'done', 'complete': 'done', 'completed': 'done',
  'closed': 'done', 'done column': 'done',
}

export const PRIORITY_MAP: Record<string, string> = {
  'urgent': 'urgent', 'critical': 'urgent', 'asap': 'urgent', 'emergency': 'urgent',
  'high': 'high', 'important': 'high',
  'medium': 'medium', 'normal': 'medium', 'moderate': 'medium',
  'low': 'low', 'minor': 'low', 'later': 'low',
}

const POSITION_MAP: Record<string, number> = {
  'first': 0, '1st': 0, 'one': 0, 'second': 1, '2nd': 1, 'two': 1,
  'third': 2, '3rd': 2, 'three': 2, 'fourth': 3, '4th': 3,
  'last': -1, 'bottom': -1,
}

export function matchStatus(text: string): string | null {
  // Try longest match first
  const sorted = Object.keys(STATUS_MAP).sort((a, b) => b.length - a.length)
  for (const word of sorted) {
    if (text.includes(word)) return STATUS_MAP[word]
  }
  return null
}

export function matchPriority(text: string): string {
  for (const [word, p] of Object.entries(PRIORITY_MAP)) {
    if (text.includes(word)) return p
  }
  return 'medium'
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
    'database', 'devops', 'testing', 'docs', 'mobile', 'performance', 'security']
  return tagWords.filter(t => text.includes(t))
}

export function parseIntent(raw: string): Intent {
  // Strip filler/polite words from the beginning
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/^(hey|hi|hello|okay|ok|please|can you|could you|i want you to|i say|i said|would you|i need you to)[,\s]+/g, '')
    .trim()

  const text = cleaned

  // Greet — only if nothing meaningful follows
  if (/^(hey|hi|hello|good morning|good evening|howdy|what'?s up|sup)\s*[!.?]?\s*$/.test(raw.toLowerCase().trim())) {
    return { type: 'greet' }
  }

  // How are you
  if (/(how are you|how('?re| are) you doing|you good|how('?s| is) it going|you okay|are you okay|how do you feel)/.test(text)) {
    return { type: 'how_are_you' }
  }

  // What can you do / help
  if (/(what can you do|what are you capable|help me|what do you do|how do you work|what('?s| is) your purpose|what can i (say|ask)|what (commands|can i say))/.test(text)) {
    return { type: 'what_can_you_do' }
  }

  // Who are you / what is this
  if (/(who are you|what (is|are) you|what('?s| is) this|tell me about yourself|introduce yourself|what am i (talking|speaking) to)/.test(text)) {
    return { type: 'who_are_you' }
  }

  // Thank you
  if (/(thank|thanks|thank you|cheers|appreciate|good job|well done|nice|great|perfect|awesome|excellent|amazing|brilliant)/.test(text)) {
    return { type: 'thank_you' }
  }

  // Joke
  if (/(tell me a joke|say something funny|make me laugh|joke|funny)/.test(text)) {
    return { type: 'joke' }
  }

  // Confused / doesn't understand
  if (/(i don'?t understand|what do you mean|confused|i'?m lost|what|huh|pardon|say that again|repeat|what did you say)/.test(text)) {
    return { type: 'confused' }
  }

  // Weekly digest
  if (/(weekly digest|week digest|this week|weekly update|week summary|weekly report|how was my week|how did i do this week)/.test(text)) {
    return { type: 'get_summary' }
  }

  // Summary
  if (/(summary|overview|how many tasks|board update|update me|what do i have|my tasks|board status)/.test(text)) {
    return { type: 'get_summary' }
  }

  // Overdue
  if (/(overdue|late|missed|past due|behind schedule)/.test(text)) {
    return { type: 'get_overdue' }
  }

  // In progress — only if NOT a move command
  if (/(what(?:'s| is) in progress|show.*in progress|what am i working on)/.test(text)) {
    return { type: 'get_in_progress' }
  }

  // Client tasks
  const clientMatch = text.match(/tasks? for ([\w\s]+?)(?:\s*$|\s+task|\s+work)/)
  if (clientMatch) {
    const name = clientMatch[1].trim()
    if (name && name.length > 1) return { type: 'get_client_tasks', clientName: name }
  }

  // Normalize "into" → "to", "the progress column" → "in progress"
  const normalized = text
    .replace(/\binto\b/g, 'to')
    .replace(/\bthe progress column\b/g, 'in progress')
    .replace(/\bprogress column\b/g, 'in progress')
    .replace(/\bto do column\b/g, 'todo')
    .replace(/\breview column\b/g, 'review')
    .replace(/\bdone column\b/g, 'done')
    .replace(/\bthe in progress\b/g, 'in progress')

  // ── Positional move: "move the first task to in progress"
  const posKeys = Object.keys(POSITION_MAP).join('|')
  const positionalReg = new RegExp(
    `(?:move|put|send|take)\\s+(?:the\\s+)?(${posKeys})\\s+(?:task|one)?(?:[\\w\\s,]+?)?\\s+(?:to|into)\\s+(?:the\\s+)?(.+)`
  )
  const posMatch = normalized.match(positionalReg)
  if (posMatch) {
    const position = POSITION_MAP[posMatch[1]]
    const toText = posMatch[2].trim()
    const toStatus = matchStatus(toText)
    const fromStatus = matchStatus(normalized.replace(posMatch[2], ''))
    if (toStatus !== null) {
      return { type: 'update_status_positional', position, fromStatus: fromStatus !== toStatus ? fromStatus : null, toStatus }
    }
  }

  // ── Named move: "move the ShopZen task to done"
  const statusWords = Object.keys(STATUS_MAP).join('|')
  const namedMoveReg = new RegExp(
    `(?:move|mark|set|put|change|update|send|take)\\s+(?:the\\s+)?(?:task\\s+)?(.+?)\\s+(?:to|as|into|from\\s+\\w+\\s+to)\\s+(?:the\\s+)?(${statusWords})`
  )
  const namedMatch = normalized.match(namedMoveReg)
  if (namedMatch) {
    let keyword = namedMatch[1]
      .replace(/\b(column|task|in the|from the|from|the|that|name|have|a|an)\b/g, '')
      .replace(new RegExp(`\\b(${statusWords})\\b`, 'g'), '')
      .replace(/\s+/g, ' ').trim()
    const status = STATUS_MAP[namedMatch[2]]
    if (status && keyword.length > 1) {
      return { type: 'update_status', keyword, status }
    }
  }

  // Update priority: "make X urgent", "set X to high priority"
  const priorityMatch = text.match(/(?:make|set|mark|change|update)\s+(?:the\s+)?(.+?)\s+(?:to\s+)?(?:priority\s+)?(urgent|critical|high|important|medium|normal|low|minor)/)
  if (priorityMatch) {
    const keyword = priorityMatch[1].replace(/\b(task|the)\b/g, '').trim()
    return { type: 'update_priority', keyword, priority: PRIORITY_MAP[priorityMatch[2]] || 'medium' }
  }

  // Create task
  const createMatch = text.match(/(?:add|create|new|make)\s+(?:a\s+)?(?:new\s+)?task[:\s]+(.+)/)
  if (createMatch) {
    const rest = createMatch[1]
    const cleanTitle = rest
      .replace(/(urgent|critical|high|important|medium|normal|low|minor|priority)/g, '')
      .replace(/\s+/g, ' ').trim()
    return { type: 'create_task', title: cleanTitle, priority: matchPriority(rest), tags: extractTags(rest), dueDays: extractDueDays(rest) }
  }

  const addMatch = text.match(/^(?:add|create|new)\s+(.{5,})/)
  if (addMatch) {
    const rest = addMatch[1]
    return {
      type: 'create_task',
      title: rest.replace(/(urgent|critical|high|important|medium|normal|low|minor|priority)/g, '').trim(),
      priority: matchPriority(rest), tags: extractTags(rest), dueDays: extractDueDays(rest),
    }
  }

  return { type: 'unknown', raw }
}
