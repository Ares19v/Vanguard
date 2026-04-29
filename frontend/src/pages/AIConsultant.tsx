import { useState, useRef, useEffect, KeyboardEvent } from 'react'
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

  // Auto-scroll
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
    "What is the highest risk finding right now?",
    "Explain how an attacker would exploit an open RDP port",
    "What is CVSS and how does Vanguard score findings?",
    "How do I enable AWS GuardDuty in all regions?",
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Finding sidebar ─────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-border bg-panel flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="text-xs font-mono text-muted tracking-wider mb-1">FINDINGS</div>
          <div className="text-[10px] text-muted/60">Click to inject as context</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {findings.length === 0 ? (
            <div className="text-xs text-muted text-center py-8">Run a scan first</div>
          ) : findings.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFinding(activeFindingContext?.id === f.id ? null : f)}
              className={`w-full text-left p-2 rounded-lg transition-all text-xs border ${
                activeFindingContext?.id === f.id
                  ? 'bg-accent/15 border-accent/30 text-accent'
                  : 'border-transparent hover:bg-white/5 text-muted hover:text-bright'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <SeverityBadge severity={f.severity} />
              </div>
              <div className="font-medium leading-snug line-clamp-2 mt-1">{f.title}</div>
              <div className="flex gap-2 mt-1.5">
                <span className="font-mono text-[9px] text-muted/60">{f.service}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExplain(f) }}
                  className="text-[9px] font-mono text-teal hover:underline"
                >
                  Explain →
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border glass">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-6 h-6 text-accent" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <div>
              <div className="font-semibold text-bright">Vanguard AI</div>
              <div className="text-[10px] font-mono text-muted">Gemini 1.5 Pro · Cloud Security Architect</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeFindingContext && (
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-teal" />
                <span className="text-xs text-teal truncate max-w-40">{activeFindingContext.title}</span>
                <button onClick={() => setActiveFinding(null)}>
                  <X className="w-3 h-3 text-muted hover:text-bright" />
                </button>
              </div>
            )}
            {chatMessages.length > 0 && (
              <button onClick={clearChat} className="btn-ghost text-xs">Clear</button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {chatMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-xl font-bold text-bright">Vanguard AI</h2>
                <p className="text-sm text-muted mt-1 max-w-sm">
                  Senior cloud security architect. Select a finding to add context, or ask anything.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {quickPrompts.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="glass rounded-xl px-4 py-3 text-left text-xs text-muted hover:text-bright hover:border-accent/30 transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-accent mb-1" />
                    {q}
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
                      <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mr-2 mt-1">
                        <Bot className="w-3.5 h-3.5 text-accent" />
                      </div>
                    )}
                    <div className={msg.role === 'user' ? 'chat-user' : 'chat-ai'}>
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {msg.content}
                        {msg.streaming && isAiStreaming && (
                          <span className="inline-block w-1 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
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

        {/* Input bar */}
        <div className="px-6 py-4 border-t border-border glass">
          {activeFindingContext && (
            <div className="text-[10px] font-mono text-teal mb-2">
              📎 Context: {activeFindingContext.title}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vanguard about a finding, threat, or AWS security concept…"
              rows={2}
              className="flex-1 bg-white/5 border border-border rounded-xl px-4 py-3 text-sm text-bright placeholder-muted resize-none focus:outline-none focus:border-accent/50 font-sans"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isAiStreaming}
              className="btn-primary p-3 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] font-mono text-muted mt-1.5">
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}
