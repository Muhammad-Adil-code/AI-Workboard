import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT || '3001', 10)
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    socket.on('join-board', (boardId: string) => {
      socket.join(boardId)
    })

    socket.on('task-moved', (data) => {
      socket.to(data.boardId).emit('task-moved', data)
    })

    socket.on('task-created', (data) => {
      socket.to(data.boardId).emit('task-created', data)
    })

    socket.on('task-updated', (data) => {
      socket.to(data.boardId).emit('task-updated', data)
    })

    socket.on('task-deleted', (data) => {
      socket.to(data.boardId).emit('task-deleted', data)
    })

    socket.on('disconnect', () => {})
  })

  // expose io to API routes via global
  ;(global as any).io = io

  httpServer.listen(port, () => {
    console.log(`> WorkBoard ready on http://localhost:${port}`)
  })
})
