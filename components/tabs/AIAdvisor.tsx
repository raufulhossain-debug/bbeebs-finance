'use client'
import { useState } from 'react'
import { FinancialData } from '@/lib/types'

const QUICK_PROMPTS = [
  'Full financial diagnosis', 'What should I prioritize?',
  'How do I pay off debt fastest?', "Am I saving enough for retirement?",
  "What's my FIRE timeline?", 'Should I invest or pay off debt?',
  'Create a monthly budget plan', 'How can I increase savings rate?',
]

type Msg = { role: 'user' | 'assistant'; content: string }

export default function AIAdvisor({ data }: { data: FinancialData }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const newMsgs: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)
    try {
      const r = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs, data }),
      })
      const { reply, error } = await r.json()
      setMessages(m => [...m, { role: 'assistant', content: reply || error || 'No response' }])
    } catch { setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Check your API key.' }]) }
    setLoading(false)
  }

  return (
    <div>
      <div className="sh">AI Financial Advisor</div>
      <div className="xs mb12">Your advisor has full access to your financial data. Ask anything.</div>

      <div className="qp-grid">
        {QUICK_PROMPTS.map(p => (
          <button key={p} className="qp" onClick={() => send(p)}>{p}</button>
        ))}
      </div>

      <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.role === 'user' ? 'user' : ''}`}>
            <div className="chat-sender">{m.role === 'user' ? 'You' : 'Advisor'}</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg">
            <div className="chat-sender">Advisor</div>
            <div className="loading-bar" style={{ margin: '8px 0', width: 80 }}><div className="loading-fill" /></div>
          </div>
        )}
      </div>

      <div className="flex g8">
        <input
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask anything about your finances..."
          disabled={loading}
        />
        <button className="btn btn-primary" onClick={() => send(input)} disabled={loading || !input.trim()}>
          Send
        </button>
        {messages.length > 0 && (
          <button className="btn btn-ghost" onClick={() => setMessages([])}>Clear</button>
        )}
      </div>
    </div>
  )
}
