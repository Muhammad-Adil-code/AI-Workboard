'use client'
import { useState } from 'react'
import { Sparkles, Loader2, X, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Task, Client } from '@/types'

interface Props {
  tasks: Task[]
  clients: Client[]
}

export default function AIDigest({ tasks, clients }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [digest, setDigest] = useState<any>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, clients }),
      })
      const data = await res.json()
      setDigest(data)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-all"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        📊 Weekly Digest
      </button>

      {open && digest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" /> 📊 Weekly Digest
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">{digest.completed}</p>
                  <p className="text-xs text-green-600">Done</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <TrendingUp size={20} className="text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-600">{digest.inProgress}</p>
                  <p className="text-xs text-blue-600">In Progress</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <AlertCircle size={20} className="text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{digest.overdue}</p>
                  <p className="text-xs text-red-600">Overdue</p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-sm text-indigo-800 font-medium">{digest.insight}</p>
              </div>

              {digest.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Suggestions</p>
                  <ul className="space-y-2">
                    {digest.suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-indigo-500 font-bold mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
