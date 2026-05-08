'use client'
import { useState } from 'react'
import { Client } from '@/types'
import { X, Plus, DollarSign, Trash2 } from 'lucide-react'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

interface Props {
  clients: Client[]
  onAdd: (client: Partial<Client>) => void
  onUpdate: (id: string, data: Partial<Client>) => void
  onDelete: (id: string) => void
}

export default function ClientPanel({ clients, onAdd, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [color, setColor] = useState(COLORS[0])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name, email, company, color, invoiceStatus: 'unpaid', totalEarned: 0 })
    setName(''); setEmail(''); setCompany('')
    setOpen(false)
  }

  const invoiceBadge: Record<string, string> = {
    unpaid: 'bg-slate-100 text-slate-600',
    sent: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
  }

  return (
    <div className="bg-white border-l border-slate-200 w-72 flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">Clients</h2>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {clients.length === 0 && (
          <p className="text-xs text-slate-400 text-center mt-8">No clients yet.</p>
        )}
        {clients.map(c => (
          <div key={c._id} className="border border-slate-100 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: c.color }}>
                {c.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                {c.company && <p className="text-xs text-slate-400 truncate">{c.company}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <select
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border-0 cursor-pointer ${invoiceBadge[c.invoiceStatus]}`}
                value={c.invoiceStatus}
                onChange={e => onUpdate(c._id, { invoiceStatus: e.target.value as any })}
              >
                {['unpaid','sent','paid','overdue'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-xs text-slate-500 font-semibold">
                  <DollarSign size={10} />{c.totalEarned.toLocaleString()}
                </span>
                <button
                  onClick={() => onDelete(c._id)}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                  title="Delete client"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-slate-800">New Client</h2>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <input className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Name *" value={name} onChange={e => setName(e.target.value)} required />
              <input className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
              <input className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Color</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700">Add Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
