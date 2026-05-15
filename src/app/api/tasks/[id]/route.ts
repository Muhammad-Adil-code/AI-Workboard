import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const body = await req.json()
  const task = await Task.findByIdAndUpdate(id, body, { new: true }).populate('clientId')
  if (!task) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

  const io = (global as any).io
  if (io) io.to(task.boardId).emit('task-updated', task)

  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB()
  const { id } = await params
  const task = await Task.findByIdAndDelete(id)
  if (!task) return NextResponse.json({ error: 'Resource not found' }, { status: 404 })

  const io = (global as any).io
  if (io) io.to(task.boardId).emit('task-deleted', { _id: id })

  return NextResponse.json({ success: true })
}
