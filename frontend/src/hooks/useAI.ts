import { useCallback } from 'react'
import { useVanguardStore } from '../store/useVanguardStore'
import type { Finding, ChatMessage } from '../store/useVanguardStore'



// uuid is available via react-router-dom's peer deps, but let's use a simple inline impl
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useAI() {
  const {
    addChatMessage,
    updateLastAssistantMessage,
    setAiStreaming,
    activeFindingContext,
  } = useVanguardStore()

  const sendMessage = useCallback(
    async (text: string, findingCtx?: Finding) => {
      const context = findingCtx || activeFindingContext

      const userMsg: ChatMessage = { role: 'user', content: text, id: genId() }
      addChatMessage(userMsg)

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        id: genId(),
        streaming: true,
      }
      addChatMessage(aiMsg)
      setAiStreaming(true)

      try {
        const body = {
          messages: [userMsg],
          finding_context: context || null,
        }

        const res = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.body) throw new Error('No response body')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const raw = decoder.decode(value, { stream: true })
          // SSE lines: "data: <text>\n\n"
          for (const line of raw.split('\n')) {
            const trimmed = line.replace(/^data:\s*/, '')
            if (trimmed && trimmed !== '[DONE]') {
              updateLastAssistantMessage(trimmed)
            }
          }
        }
      } catch (err) {
        updateLastAssistantMessage('\n\n⚠️ Error connecting to Vanguard AI.')
      } finally {
        setAiStreaming(false)
      }
    },
    [addChatMessage, updateLastAssistantMessage, setAiStreaming, activeFindingContext]
  )

  const explainFinding = useCallback(
    async (finding: Finding) => {
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: '',
        id: genId(),
        streaming: true,
      }
      addChatMessage(aiMsg)
      setAiStreaming(true)

      try {
        const res = await fetch(`/api/v1/ai/explain/${finding.id}`)
        if (!res.body) return
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const raw = decoder.decode(value, { stream: true })
          for (const line of raw.split('\n')) {
            const trimmed = line.replace(/^data:\s*/, '')
            if (trimmed && trimmed !== '[DONE]') {
              updateLastAssistantMessage(trimmed)
            }
          }
        }
      } finally {
        setAiStreaming(false)
      }
    },
    [addChatMessage, updateLastAssistantMessage, setAiStreaming]
  )

  return { sendMessage, explainFinding }
}
