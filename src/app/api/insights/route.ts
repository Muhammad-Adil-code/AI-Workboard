import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'
import { subDays, startOfDay, format, eachDayOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || 'week' // day | 3days | week | month

  const daysMap: Record<string, number> = { day: 1, '3days': 3, week: 7, month: 30 }
  const days = daysMap[period] || 7

  const from = startOfDay(subDays(new Date(), days - 1))
  const allTasks = await Task.find({ boardId: 'default' }).lean()

  // Tasks created per day within period
  const dateRange = eachDayOfInterval({ start: from, end: new Date() })
  const createdPerDay = dateRange.map(date => {
    const label = format(date, days <= 1 ? 'HH:mm' : 'MMM d')
    const count = allTasks.filter(t => {
      const d = new Date(t.createdAt as string)
      return format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    }).length
    return { date: label, created: count }
  })

  // Tasks completed per day within period
  const completedPerDay = dateRange.map(date => {
    const label = format(date, days <= 1 ? 'HH:mm' : 'MMM d')
    const count = allTasks.filter(t => {
      if (t.status !== 'done') return false
      const d = new Date(t.updatedAt as string)
      return format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    }).length
    return { date: label, completed: count }
  })

  // Merge created + completed per day
  const activityData = dateRange.map((date, i) => ({
    date: format(date, days <= 1 ? 'HH:mm' : 'MMM d'),
    created: createdPerDay[i].created,
    completed: completedPerDay[i].completed,
  }))

  // Status breakdown
  const statusBreakdown = [
    { name: 'To Do', value: allTasks.filter(t => t.status === 'todo').length, color: '#94a3b8' },
    { name: 'In Progress', value: allTasks.filter(t => t.status === 'in-progress').length, color: '#60a5fa' },
    { name: 'Review', value: allTasks.filter(t => t.status === 'review').length, color: '#fbbf24' },
    { name: 'Done', value: allTasks.filter(t => t.status === 'done').length, color: '#34d399' },
  ]

  // Priority breakdown
  const priorityBreakdown = [
    { name: 'Urgent', value: allTasks.filter(t => t.priority === 'urgent').length, color: '#f87171' },
    { name: 'High', value: allTasks.filter(t => t.priority === 'high').length, color: '#fb923c' },
    { name: 'Medium', value: allTasks.filter(t => t.priority === 'medium').length, color: '#60a5fa' },
    { name: 'Low', value: allTasks.filter(t => t.priority === 'low').length, color: '#94a3b8' },
  ]

  // Hours: estimated vs actual
  const withHours = allTasks.filter(t => t.estimatedHours || t.actualHours)
  const hoursData = withHours.slice(0, 10).map(t => ({
    name: (t.title as string).slice(0, 20),
    estimated: t.estimatedHours || 0,
    actual: t.actualHours || 0,
  }))

  // Summary stats
  const total = allTasks.length
  const done = allTasks.filter(t => t.status === 'done').length
  const overdue = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'done') return false
    return new Date(t.dueDate as string) < new Date()
  }).length
  const totalEstimated = allTasks.reduce((s, t) => s + (t.estimatedHours as number || 0), 0)
  const totalActual = allTasks.reduce((s, t) => s + (t.actualHours as number || 0), 0)

  return NextResponse.json({
    activityData,
    statusBreakdown,
    priorityBreakdown,
    hoursData,
    summary: { total, done, overdue, totalEstimated, totalActual, completionRate: total ? Math.round((done / total) * 100) : 0 },
  })
}
