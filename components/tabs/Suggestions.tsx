'use client'
import { useState } from 'react'
import { FinancialData } from '@/lib/types'
import { fmtCurrency } from '@/lib/calculations'

interface Action {
  type: string
  target: string
  field: string
  current_value: number
  suggested_value: number
  owner?: string
}

interface Suggestion {
  id: string
  title: string
  description: string
  impact: string
  priority: 'high' | 'medium' | 'low'
  action: Action
}

function applyAction(data: FinancialData, action: Action): FinancialData {
  const d = JSON.parse(JSON.stringify(data)) as FinancialData

  if (action.type === 'update_debt_payment') {
    const card = d.credit_cards.find(c => c.name === action.target)
    if (card) card.payment = action.suggested_value
  }

  if (action.type === 'update_savings_goal') {
    const goal = d.savings_goals.find(g => g.name === action.target)
    if (goal) (goal as any)[action.field] = action.suggested_value
  }

  if (action.type === 'update_retirement') {
    const who = action.owner as 'bbs' | 'beebs'
    if (who && d.retirement[who]) {
      (d.retirement[who] as any)[action.field] = action.suggested_value
    }
  }

  if (action.type === 'update_expense') {
    const owner = (action.owner || 'joint') as 'bbs' | 'beebs' | 'joint'
    const exp = d.monthly_expenses[owner]?.find(e => e.name === action.target)
    if (exp) exp.amount = action.suggested_value
  }

  return d
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'var(--red)',
  medium: 'var(--amber)',
  low: 'var(--green)',
}

const PRIORITY_BG: Record<string, string> = {
  high: 'rgba(240,82,82,0.1)',
  medium: 'rgba(240,164,41,0.1)',
  low: 'rgba(63,207,127,0.1)',
}

export default function Suggestions({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchSuggestions = async () => {
    setLoading(true)
    setError('')
    setSuggestions([])
    setApplied(new Set())
    try {
      const r = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const { suggestions: s, error: e } = await r.json()
      if (e) setError(e)
      else setSuggestions(s || [])
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }

  const apply = (s: Suggestion) => {
    const newData = applyAction(data, s.action)
    update(newData)
    setApplied(prev => new Set([...prev, s.id]))
    setConfirming(null)
  }

  return (
    <div>
      <div className="flex jb ic mb12">
        <div className="sh" style={{ margin: 0, border: 'none', padding: 0 }}>AI Suggestions</div>
        <button className="btn btn-primary" onClick={fetchSuggestions} disabled={loading}>
          {loading ? 'Analyzing...' : suggestions.length ? '↻ Refresh' : '✦ Get Suggestions'}
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div className="loading-bar" style={{ margin: '0 auto 12px' }}><div className="loading-fill" /></div>
          <div className="xs dimmed">Claude is analyzing your finances...</div>
        </div>
      )}

      {error && <div className="xs red mb12">{error}</div>}

      {!loading && suggestions.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
          <div className="xs muted">Click "Get Suggestions" to have Claude analyze your finances and recommend specific changes you can apply instantly.</div>
        </div>
      )}

      {suggestions.map(s => {
        const isApplied = applied.has(s.id)
        const isConfirming = confirming === s.id

        return (
          <div key={s.id} className="card mb8" style={{
            borderColor: isApplied ? 'rgba(63,207,127,0.3)' : isConfirming ? 'rgba(79,142,247,0.4)' : 'var(--border)',
            background: isApplied ? 'rgba(63,207,127,0.05)' : 'var(--bg2)',
          }}>
            <div className="flex jb ic mb8">
              <div className="flex ic g8">
                <span className="badge" style={{
                  background: PRIORITY_BG[s.priority],
                  color: PRIORITY_COLORS[s.priority],
                }}>
                  {s.priority}
                </span>
                <span className="bold" style={{ fontSize: 13 }}>{s.title}</span>
              </div>
              <span className="xs" style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{s.impact}</span>
            </div>

            <div className="xs muted mb12" style={{ lineHeight: 1.6 }}>{s.description}</div>

            {/* Change preview */}
            <div style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '8px 12px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <span className="xs dimmed">{s.action.target}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--red)' }}>
                {typeof s.action.current_value === 'number' ? fmtCurrency(s.action.current_value) : s.action.current_value}
              </span>
              <span className="xs dimmed">→</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--green)' }}>
                {typeof s.action.suggested_value === 'number' ? fmtCurrency(s.action.suggested_value) : s.action.suggested_value}
              </span>
              <span className="xs dimmed" style={{ marginLeft: 'auto' }}>{s.action.field?.replace(/_/g, ' ')}</span>
            </div>

            {isApplied ? (
              <div className="xs green">✓ Applied</div>
            ) : isConfirming ? (
              <div className="flex g8">
                <span className="xs muted" style={{ flex: 1, alignSelf: 'center' }}>Apply this change to your dashboard?</span>
                <button className="btn btn-primary" onClick={() => apply(s)}>✓ Confirm</button>
                <button className="btn btn-ghost" onClick={() => setConfirming(null)}>Cancel</button>
              </div>
            ) : (
              <button className="btn btn-ghost" onClick={() => setConfirming(s.id)}
                style={{ borderColor: 'rgba(79,142,247,0.3)', color: 'var(--accent)' }}>
                Apply suggestion →
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
