import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, Sparkles, FileText } from 'lucide-react'
import { useVanguardStore } from '../store/useVanguardStore'
import { useAI } from '../hooks/useAI'
import SeverityBadge from '../components/SeverityBadge'
import type { Finding } from '../store/useVanguardStore'

export default function AIConsultant() {
  const {
    chatMessages, isAiStreaming, activeFindingContext,
    setActiveFinding, clearChat, findings
  } = useVanguardStore()
  const { sendMessage, explainFinding } = useAI()
  const [input, setInput]  = useState('')
  const bottomRef          = useRef<HTMLDivElement>(null)
  const inputRef           = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isAiStreaming) return
    setInput('')
    sendMessage(text, activeFindingContext || undefined)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleExplain = (f: Finding) => {
    setActiveFinding(f)
    explainFinding(f)
  }

  const quickPrompts = [
    "What is the highest risk finding in my cloud right now?",
    "Explain how an attacker exploits an open S3 bucket",
    "How to remediate open SSH port 22 in AWS EC2?",
    "Generate an IAM least-privilege policy for Lambda",
  ]

  return (
    <div className="flex flex-col lg:flex-row h-[660px] rounded-3xl overflow-hidden glass-light-card border border-white/90 shadow-2xl max-w-6xl mx-auto">
      {/* ── Finding Context Sidebar ───────────────────────────────────────── */}
      <div className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-slate-50/70 flex flex-col">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">Cloud Vulnerabilities</div>
            <div className="text-[11px] text-slate-500">Click to add finding context</div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
            {findings.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-48 lg:max-h-none">
          {findings.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-10">Run a scan to load active findings</div>
          ) : findings.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFinding(activeFindingContext?.id === f.id ? null : f)}
              className={`w-full text-left p-3 rounded-2xl transition-all text-xs border ${
                activeFindingContext?.id === f.id
                  ? 'bg-white border-slate-900 text-slate-900 shadow-md font-medium'
                  : 'bg-white/40 border-transparent hover:bg-white text-slate-700 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <SeverityBadge severity={f.severity} size="sm" />
                <span className="font-mono text-[10px] text-slate-500 font-semibold">{f.service}</span>
              </div>
              <div className="font-semibold text-slate-900 leading-snug line-clamp-1">{f.title}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-32">{f.resource}</span>
                <span
                  onClick={(e) => { e.stopPropagation(); handleExplain(f) }}
                  className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  Analyze ⚡
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white/60 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Vanguard AI Security Copilot</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">
                  Gemini Pro
                </span>
              </div>
              <div className="text-[11px] text-slate-500">Autonomous Cloud Incident Architect & Policy Remediation AI</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFindingContext && (
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-800 shadow-sm">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span className="truncate max-w-36 text-[11px] font-medium">{activeFindingContext.title}</span>
                <button onClick={() => setActiveFinding(null)}>
                  <X className="w-3 h-3 text-slate-500 hover:text-slate-900" />
                </button>
              </div>
            )}
            {chatMessages.length > 0 && (
              <button onClick={clearChat} className="btn-pill-white text-xs py-1.5 px-3">
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-5 text-center max-w-md mx-auto"
            >
              <div className="w-14 h-14 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                <Bot className="w-7 h-7 text-slate-800" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ask Vanguard AI Security Architect</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Select a vulnerability from the left sidebar to add exact AWS context, or click a quick prompt below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {quickPrompts.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 hover:text-slate-950 transition-all shadow-sm group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 mb-1.5 group-hover:scale-110 transition-transform" />
                    <span className="line-clamp-2 font-medium">{q}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence>
                {chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                      msg.role === 'user'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white border border-slate-200/90 text-slate-800 shadow-sm'
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed font-normal">
                        {msg.content}
                        {msg.streaming && isAiStreaming && (
                          <span className="inline-block w-1.5 h-3.5 bg-slate-900 ml-1 animate-pulse align-middle" />
                        )}
                      </pre>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/80">
          {activeFindingContext && (
            <div className="text-[11px] font-mono text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Analyzing context: <strong>{activeFindingContext.title}</strong></span>
            </div>
          )}
          <div className="flex gap-2.5 items-center">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about remediation steps, threat analysis, IAM policies…"
              rows={1}
              className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-slate-500 shadow-sm transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isAiStreaming}
              className="btn-pill-dark text-xs py-2.5 px-5 shadow-md shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
