'use client'
import { useState, useEffect } from 'react'
import { X, TrendingUp, CheckCircle2, AlertCircle, Clock, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Period = 'day' | '3days' | 'week' | 'month'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: '3days', label: '3 Days' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

interface Props {
  onClose: () => void
}

export default function InsightsModal({ onClose }: Props) {
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/insights?period=${period}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [period])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart2 size={16} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Insights</h2>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
              {PERIODS.map(p => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    period === p.key
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { icon: <BarChart2 size={16} />, label: 'Total Tasks', value: data.summary.total, color: 'bg-slate-50 text-slate-600' },
                { icon: <CheckCircle2 size={16} />, label: 'Completed', value: data.summary.done, color: 'bg-green-50 text-green-600' },
                { icon: <AlertCircle size={16} />, label: 'Overdue', value: data.summary.overdue, color: 'bg-red-50 text-red-600' },
                { icon: <TrendingUp size={16} />, label: 'Completion', value: `${data.summary.completionRate}%`, color: 'bg-indigo-50 text-indigo-600' },
                { icon: <Clock size={16} />, label: 'Hours Logged', value: `${data.summary.totalActual}h`, color: 'bg-amber-50 text-amber-600' },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-4 ${stat.color}`}>
                  <div className="flex items-center gap-2 mb-1 opacity-70">{stat.icon}<span className="text-xs font-semibold">{stat.label}</span></div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Activity chart */}
            <div className="bg-slate-50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Task Activity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="created" name="Created" stroke="#818cf8" strokeWidth={2} fill="url(#gradCreated)" />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#34d399" strokeWidth={2} fill="url(#gradCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status + Priority side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Status donut */}
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">By Status</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data.statusBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {data.statusBreakdown.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Priority bar */}
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">By Priority</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.priorityBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                      {data.priorityBreakdown.map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Hours: estimated vs actual */}
            {data.hoursData?.length > 0 && (
              <div className="bg-slate-50 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">Estimated vs Actual Hours</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.hoursData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 11 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="estimated" name="Estimated" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
