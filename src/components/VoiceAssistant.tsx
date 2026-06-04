'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, X, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type State = 'idle' | 'listening' | 'processing' | 'speaking'

interface Message {
  role: 'user' | 'ai'
  text: string
}

interface Props {
  onBoardChange?: () => void
}

export default function VoiceAssistant({ onBoardChange }: Props) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<State>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const hourlyRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) { setSupported(false); return }

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (e: any) => {
        const current = Array.from(e.results).map((r: any) => r[0].transcript).join('')
        setTranscript(current)
        if (e.results[e.results.length - 1].isFinal) {
          handleCommand(current)
        }
      }

      recognition.onend = () => {
        if (state === 'listening') setState('idle')
      }

      recognition.onerror = () => setState('idle')
      recognitionRef.current = recognition
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Hourly auto-update
  useEffect(() => {
    if (open) {
      hourlyRef.current = setInterval(() => {
        handleCommand('Give me a quick update on my board', true)
      }, 60 * 60 * 1000)
    }
    return () => { if (hourlyRef.current) clearInterval(hourlyRef.current) }
  }, [open])

  const speak = useCallback((text: string, onDone?: () => void) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.0
    utter.pitch = 1.0
    utter.volume = 1.0
    // Pick a good voice if available
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
      || voices.find(v => v.lang.startsWith('en-US'))
    if (preferred) utter.voice = preferred
    utter.onend = () => { setState('idle'); onDone?.() }
    setState('speaking')
    synthRef.current.speak(utter)
  }, [])

  const handleCommand = useCallback(async (command: string, silent = false) => {
    if (!command.trim()) return
    setState('processing')
    setTranscript('')

    if (!silent) {
      setMessages(prev => [...prev, { role: 'user', text: command }])
    }

    try {
      const res = await fetch('/api/voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      })
      const data = await res.json()
      const reply = data.reply || "I'm here to help."

      setMessages(prev => [...prev, { role: 'ai', text: reply }])

      // Refresh board if a task was modified
      if (data.action && ['create_task', 'update_task_status', 'update_task_priority'].includes(data.action)) {
        onBoardChange?.()
      }

      speak(reply)
    } catch {
      const err = "Sorry, I couldn't process that."
      setMessages(prev => [...prev, { role: 'ai', text: err }])
      speak(err)
    }
  }, [speak, onBoardChange])

  const startListening = () => {
    if (!recognitionRef.current || state !== 'idle') return
    synthRef.current?.cancel()
    setState('listening')
    setTranscript('')
    recognitionRef.current.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setState('idle')
    setTranscript('')
  }

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => {
      const greeting = "Hey! I'm your WorkBoard assistant. Ask me anything about your tasks, or say 'add a task' to get started."
      setMessages([{ role: 'ai', text: greeting }])
      speak(greeting)
    }, 300)
  }

  const handleClose = () => {
    synthRef.current?.cancel()
    recognitionRef.current?.stop()
    setState('idle')
    setOpen(false)
  }

  const stateColor = {
    idle: 'bg-violet-600 hover:bg-violet-700',
    listening: 'bg-red-500 hover:bg-red-600 animate-pulse',
    processing: 'bg-amber-500',
    speaking: 'bg-emerald-500',
  }

  const stateLabel = {
    idle: 'Click to speak',
    listening: 'Listening...',
    processing: 'Thinking...',
    speaking: 'Speaking...',
  }

  return (
    <>
      {/* Header button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-all"
      >
        <Mic size={14} /> Voice AI
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: 480 }}>

          {/* Header */}
          <div className="bg-violet-600 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', state === 'idle' ? 'bg-violet-300' : 'bg-white animate-pulse')} />
              <span className="text-sm font-bold text-white">WorkBoard Voice AI</span>
            </div>
            <button onClick={handleClose} className="text-violet-200 hover:text-white"><X size={16} /></button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                )}>
                  {m.role === 'ai' && <Volume2 size={10} className="inline mr-1 text-violet-500" />}
                  {m.text}
                </div>
              </div>
            ))}

            {/* Live transcript */}
            {transcript && (
              <div className="flex justify-end">
                <div className="bg-violet-100 text-violet-700 rounded-2xl rounded-tr-sm px-3 py-2 text-sm italic max-w-[85%]">
                  {transcript}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick commands */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
            {["What's overdue?", "Board summary", "What's in progress?"].map(cmd => (
              <button key={cmd} onClick={() => handleCommand(cmd)}
                className="text-[10px] bg-slate-100 hover:bg-violet-50 hover:text-violet-600 text-slate-500 px-2 py-1 rounded-full font-semibold transition-colors">
                {cmd}
              </button>
            ))}
          </div>

          {/* Mic button */}
          <div className="px-4 pb-4 shrink-0">
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-slate-400 font-medium">{stateLabel[state]}</p>
              <button
                onMouseDown={startListening}
                onMouseUp={state === 'listening' ? stopListening : undefined}
                onTouchStart={startListening}
                onTouchEnd={state === 'listening' ? stopListening : undefined}
                disabled={state === 'processing'}
                className={cn(
                  'w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all disabled:opacity-50',
                  stateColor[state]
                )}
              >
                {state === 'listening'
                  ? <MicOff size={22} />
                  : <Mic size={22} />
                }
              </button>
              <p className="text-[10px] text-slate-400">Hold to speak, release to send</p>
            </div>
          </div>
        </div>
      )}

      {!supported && (
        <div className="text-xs text-red-500">Voice not supported in this browser. Use Chrome.</div>
      )}
    </>
  )
}
