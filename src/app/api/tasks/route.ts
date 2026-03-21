import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Task from '@/models/Task'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get('boardId') || 'default'
  const tasks = await Task.find({ boardId }).populate('clientId').sort({ order: 1 })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  await connectDB()
  const body = await req.json()
  const task = await Task.create(body)
  const populated = await task.populate('clientId')

  const io = (global as any).io
  if (io) io.to(body.boardId || 'default').emit('task-created', populated)

  return NextResponse.json(populated, { status: 201 })
}
