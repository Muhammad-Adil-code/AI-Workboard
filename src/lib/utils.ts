import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-600',
  urgent: 'bg-red-100 text-red-600',
}

export const STATUS_CONFIG = {
  'todo': { title: 'To Do', color: 'border-slate-300', bg: 'bg-slate-50' },
  'in-progress': { title: 'In Progress', color: 'border-blue-400', bg: 'bg-blue-50' },
  'review': { title: 'Review', color: 'border-yellow-400', bg: 'bg-yellow-50' },
  'done': { title: 'Done', color: 'border-green-400', bg: 'bg-green-50' },
}
