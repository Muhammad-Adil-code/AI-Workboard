'use client'
import { useState } from 'react'
import { Task } from '@/types'
import { X, Sparkles, Loader2, CheckSquare, Square } from 'lucide-react'

interface Props {
  task: Task
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => void
}

export default function TaskDetailModal({ task, onClose, onUpdate }: Props) {
  const [subtasks, setSubtasks] = useState(task.subtasks || [])
  const [breaking, setBreaking] = useState(false)
  const [actualHours, setActualHours] = useState(String(task.actualHours || ''))

  const handleBreakdown = async () => {
    setBreaking(true)
    try {
      const res = await fetch('/api/ai/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: task.title, description: task.description }),
      })
      const data = await res.json()
      const newSubtasks = data.subtasks
      setSubtasks(newSubtasks)
      onUpdate(task._id, { subtasks: newSubtasks })
    } finally {
      setBreaking(false)
    }
  }

  const toggleSubtask = (id: string) => {
    const updated = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s)
    setSubtasks(updated)
    onUpdate(task._id, { subtasks: updated })
  }

  const saveActualHours = () => {
    if (actualHours) onUpdate(task._id, { actualHours: parseFloat(actualHours) })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <h2 className="text-base font-bold text-slate-800 flex-1 pr-4">{task.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {task.description && (
            <p className="text-sm text-slate-600">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Priority</span>
              <p className="font-semibold text-slate-700 capitalize">{task.priority}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Status</span>
              <p className="font-semibold text-slate-700 capitalize">{task.status}</p>
            </div>
            {task.estimatedHours && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Est. Hours</span>
                <p className="font-semibold text-slate-700">{task.estimatedHours}h</p>
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase">Actual Hours</span>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  step="0.5"
                  className="w-20 border border-slate-200 rounded px-2 py-1 text-sm"
                  value={actualHours}
                  onChange={e => setActualHours(e.target.value)}
                  onBlur={saveActualHours}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-slate-700">Subtasks</span>
              <button
                onClick={handleBreakdown}
                disabled={breaking}
                className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-100 font-semibold disabled:opacity-50"
              >
                {breaking ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Breakdown
              </button>
            </div>

            {subtasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No subtasks yet. Click &quot;AI Breakdown&quot; to generate them.</p>
            ) : (
              <div className="space-y-2">
                {subtasks.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSubtask(s.id)}
                    className="w-full flex items-center gap-3 text-left hover:bg-slate-50 rounded-lg p-2 transition-colors"
                  >
                    {s.done
                      ? <CheckSquare size={16} className="text-indigo-500 shrink-0" />
                      : <Square size={16} className="text-slate-300 shrink-0" />
                    }
                    <span className={`text-sm ${s.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
