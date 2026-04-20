'use client'
import { useState } from 'react'
import { Client, Priority, Task } from '@/types'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  clients: Client[]
  onClose: () => void
  onAdd: (task: Partial<Task>) => void
  defaultStatus?: string
}

export default function AddTaskModal({ clients, onClose, onAdd, defaultStatus = 'todo' }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [clientId, setClientId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [estimatedHours, setEstimatedHours] = useState('')
  const [tags, setTags] = useState('')
  const [estimating, setEstimating] = useState(false)
  const [aiEstimate, setAiEstimate] = useState<any>(null)

  const handleEstimate = async () => {
    if (!title) return
    setEstimating(true)
    try {
      const res = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      const data = await res.json()
      setAiEstimate(data)
      setEstimatedHours(String(data.estimatedHours))
    } finally {
      setEstimating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title,
      description,
      priority,
      clientId: clientId || undefined,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      status: defaultStatus as any,
      subtasks: [],
      boardId: 'default',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">New Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Task title *"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <textarea
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            placeholder="Description (optional)"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Priority</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Client</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
              >
                <option value="">No client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Due Date</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Est. Hours</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="0"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={!title || estimating}
                  className="shrink-0 px-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-600 hover:bg-indigo-100 disabled:opacity-40"
                  title="AI estimate"
                >
                  {estimating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                </button>
              </div>
            </div>
          </div>

          {aiEstimate && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-700">
              <strong>AI:</strong> {aiEstimate.reasoning} ({aiEstimate.confidence} confidence)
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Tags (comma separated)</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="design, frontend, bug..."
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
