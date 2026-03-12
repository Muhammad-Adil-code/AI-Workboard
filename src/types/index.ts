export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface Client {
  _id: string
  name: string
  email: string
  company?: string
  color: string
  invoiceStatus: 'unpaid' | 'sent' | 'paid' | 'overdue'
  totalEarned: number
  createdAt: string
}

export interface Task {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  clientId?: string
  client?: Client
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  subtasks: Subtask[]
  boardId: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface Column {
  id: TaskStatus
  title: string
  color: string
  tasks: Task[]
}

export interface AIEstimate {
  estimatedHours: number
  confidence: 'low' | 'medium' | 'high'
  reasoning: string
}

export interface WeeklyDigest {
  completed: number
  inProgress: number
  overdue: number
  topClients: string[]
  insight: string
  suggestions: string[]
}
