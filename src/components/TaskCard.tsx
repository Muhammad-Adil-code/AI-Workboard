'use client'
import { Task } from '@/types'
import { PRIORITY_COLORS as PC } from '@/lib/utils'
import { Calendar, Clock, Trash2, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  task: Task
  onDelete: (id: string) => void
  onClick: (task: Task) => void
}

export default function TaskCard({ task, onDelete, onClick }: Props) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done'
  const doneSubtasks = task.subtasks.filter(s => s.done).length

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      onClick={() => onClick(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-slate-800 leading-snug flex-1">{task.title}</p>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task._id) }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase', PC[task.priority])}>
          {task.priority}
        </span>
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
      </div>

      {task.subtasks.length > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>Subtasks</span>
            <span>{doneSubtasks}/{task.subtasks.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div
              className="bg-indigo-500 h-1 rounded-full transition-all"
              style={{ width: `${task.subtasks.length ? (doneSubtasks / task.subtasks.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-semibold')}>
              <Calendar size={10} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {task.estimatedHours && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {task.estimatedHours}h
            </span>
          )}
        </div>
        {task.client && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: task.client.color }}
          >
            {task.client.name.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  )
}
