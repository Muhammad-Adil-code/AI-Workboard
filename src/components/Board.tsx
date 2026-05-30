'use client'
import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Task, Client, TaskStatus } from '@/types'
import { STATUS_CONFIG } from '@/lib/utils'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import TaskDetailModal from './TaskDetailModal'
import ClientPanel from './ClientPanel'
import AIDigest from './AIDigest'
import InsightsModal from './InsightsModal'
import { Plus, LayoutDashboard, Users, BarChart2 } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'review', 'done']

export default function Board() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addStatus, setAddStatus] = useState<TaskStatus>('todo')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showClients, setShowClients] = useState(true)
  const [showInsights, setShowInsights] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks?boardId=default')
    const data = await res.json()
    setTasks(data)
    setLoading(false)
  }, [])

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(data)
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchClients()
  }, [])

  const { emit } = useSocket('default', {
    'task-created': (task: Task) => setTasks(prev => [...prev, task]),
    'task-updated': (task: Task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)),
    'task-deleted': ({ _id }: { _id: string }) => setTasks(prev => prev.filter(t => t._id !== _id)),
    'task-moved': (data: any) => setTasks(prev => prev.map(t => t._id === data._id ? { ...t, status: data.status, order: data.order } : t)),
  })

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId as TaskStatus

    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus, order: destination.index } : t))

    await fetch(`/api/tasks/${draggableId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, order: destination.index }),
    })
    emit('task-moved', { _id: draggableId, status: newStatus, order: destination.index })
  }

  const addTask = async (taskData: Partial<Task>) => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    })
    fetchTasks()
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...updates } : t))
  }

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    setTasks(prev => prev.filter(t => t._id !== id))
  }

  const addClient = async (data: Partial<Client>) => {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const client = await res.json()
    setClients(prev => [...prev, client])
  }

  const updateClient = async (id: string, data: Partial<Client>) => {
    await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setClients(prev => prev.map(c => c._id === id ? { ...c, ...data } : c))
  }

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">WorkBoard</h1>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
              {tasks.length} tasks
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AIDigest tasks={tasks} clients={clients} />
            <button
              onClick={() => setShowInsights(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            >
              <BarChart2 size={14} /> Insights
            </button>
            <button
              onClick={() => setShowClients(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showClients ? 'bg-slate-100 text-slate-700' : 'border border-slate-200 text-slate-600'}`}
            >
              <Users size={14} /> Clients
            </button>
          </div>
        </header>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-5 h-full min-w-max">
                {COLUMNS.map(colId => {
                  const config = STATUS_CONFIG[colId]
                  const colTasks = getColumnTasks(colId)
                  return (
                    <div key={colId} className={`flex flex-col w-[288px] bg-white rounded-2xl border-t-4 ${config.color} shadow-sm`}>
                      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 text-sm">{config.title}</span>
                          <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">{colTasks.length}</span>
                        </div>
                        <button
                          onClick={() => { setAddStatus(colId); setShowAdd(true) }}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <Droppable droppableId={colId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 overflow-y-auto p-3 space-y-2.5 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                          >
                            {colTasks.map((task, index) => (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...prov.dragHandleProps}
                                    className={snap.isDragging ? 'rotate-1 scale-105' : ''}
                                  >
                                    <TaskCard
                                      task={task}
                                      onDelete={deleteTask}
                                      onClick={setSelectedTask}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  )
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {showClients && (
        <ClientPanel clients={clients} onAdd={addClient} onUpdate={updateClient} onDelete={async (id) => {
          await fetch(`/api/clients/${id}`, { method: 'DELETE' })
          setClients(prev => prev.filter(c => c._id !== id))
        }} />
      )}

      {showAdd && (
        <AddTaskModal
          clients={clients}
          defaultStatus={addStatus}
          onClose={() => setShowAdd(false)}
          onAdd={addTask}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
        />
      )}

      {showInsights && (
        <InsightsModal onClose={() => setShowInsights(false)} />
      )}
    </div>
  )
}
