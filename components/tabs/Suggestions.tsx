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

// Fuzzy find by name - case insensitive, partial match
function fuzzyFind<T extends { name: string }>(arr: T[], target: string): T | undefined {
  if (!arr || !target) return undefined
  const t = target.toLowerCase()
  return arr.find(x => x.name.toLowerCase() === t)
    || arr.find(x => x.name.toLowerCase().includes(t))
    || arr.find(x => t.includes(x.name.toLowerCase()))
}

function applyAction(data: FinancialData, action: Action): { data: FinancialData; applied: boolean; detail: string } {
  const d = JSON.parse(JSON.stringify(data)) as FinancialData

  if (action.type === 'update_debt_payment') {
    const card = fuzzyFind(d.credit_cards, action.target)
    if (card) {
      card.payment = action.suggested_value
      return { data: d, applied: true, detail: `${card.name} payment: $${action.current_value} → $${action.suggested_value}` }
    }
    return { data, applied: false, detail: `Could not find debt "${action.target}". Available: ${d.credit_cards.map(c => c.name).join(', ')}` }
  }

  if (action.type === 'update_savings_goal') {
    const goal = fuzzyFind(d.savings_goals, action.target)
    if (goal) {
      const old = (goal as any)[action.field]
      ;(goal as any)[action.field] = action.suggested_value
      return { data: d, applied: true, detail: `${goal.name} ${action.field}: $${old} → $${action.suggested_value}` }
    }
    return { data, applied: false, detail: `Could not find goal "${action.target}". Available: ${d.savings_goals.map(g => g.name).join(', ')}` }
  }

  if (action.type === 'update_retirement') {
    const who = (action.owner || 'beebs') as 'bbs' | 'beebs'
    if (d.retirement[who]) {
      const old = (d.retirement[who] as any)[action.field]
      ;(d.retirement[who] as any)[action.field] = action.suggested_value
      return { data: d, applied: true, detail: `${who} retirement ${action.field}: $${old} → $${action.suggested_value}` }
    }
  }

  if (action.type === 'update_expense') {
    const owner = (action.owner || 'joint') as 'bbs' | 'beebs' | 'joint'
    const exp = fuzzyFind(d.monthly_expenses[owner] || [], action.target)
    if (exp) {
      const old = exp.amount
      exp.amount = action.suggested_value
      return { data: d, applied: true, detail: `${exp.name} (${owner}): $${old} → $${action.suggested_value}` }
    }
    // Try all owners
    for (const o of ['bbs', 'beebs', 'joint'] as const) {
      const e = fuzzyFind(d.monthly_expenses[o] || [], action.target)
      if (e) {
        const old = e.amount
        e.amount = action.suggested_value
        return { data: d, applied: true, detail: `${e.name} (${o}): $${old} → $${action.suggested_value}` }
      }
    }
    return { data, applied: false, detail: `Could not find expense "${action.target}"` }
  }

  return { data, applied: false, detail: `Unknown action type: ${action.type}` }
}

const PRIORITY_COLORS: Record<string, string> = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--green)' }
const PRIORITY_BG: Record<string, string> = { high: 'rgba(240,82,82,0.1)', medium: 'rgba(240,164,41,0.1)', low: 'rgba(63,207,127,0.1)' }

export default function Suggestions({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [applied, setApplied] = useState<Map<string, string>>(new Map())
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchSuggestions = async () => {
    setLoading(true)
    setError('')
    setSuggestions([])
    setApplied(new Map())
    try {
      const r = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const { suggestions: s, error: e } = await r.json()
      if (e) setError(e)
      else setSuggestions(s || [])
    } catch (e) { setError(String(e)) }
    setLoading(false)
  }

  const apply = (s: Suggestion) => {
    const result = applyAction(data, s.action)
    if (result.applied) {
      update(result.data)
      setApplied(prev => new Map([...prev, [s.id, `✓ Applied: ${result.detail}`]]))
    } else {
      setApplied(prev => new Map([...prev, [s.id, `✕ Failed: ${result.detail}`]]))
    }
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

      <div className="xs muted mb12">Claude analyzes your full financial picture and suggests specific changes. Applied changes update your dashboard immediately and save automatically.</div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div className="loading-bar" style={{ margin: '0 auto 12px' }}><div className="loading-fill" /></div>
          <div className="xs dimmed">Analyzing your finances...</div>
        </div>
      )}

      {error && <div className="xs red mb12">{error}</div>}

      {!loading && suggestions.length === 0 && !error && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
          <div className="xs muted">Click "Get Suggestions" — Claude will analyze your data and recommend specific changes you can apply with one click.</div>
        </div>
      )}

      {suggestions.map(s => {
        const applyResult = applied.get(s.id)
        const isApplied = !!applyResult
        const didSucceed = applyResult?.startsWith('✓')
        const isConfirming = confirming === s.id

        return (
          <div key={s.id} className="card mb8" style={{
            borderColor: didSucceed ? 'rgba(63,207,127,0.3)' : isApplied ? 'rgba(240,82,82,0.3)' : isConfirming ? 'rgba(79,142,247,0.4)' : 'var(--border)',
          }}>
            <div className="flex jb ic mb8">
              <div className="flex ic g8">
                <span className="badge" style={{ background: PRIORITY_BG[s.priority], color: PRIORITY_COLORS[s.priority] }}>
                  {s.priority}
                </span>
                <span className="bold" style={{ fontSize: 13 }}>{s.title}</span>
              </div>
              <span className="xs" style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{s.impact}</span>
            </div>

            <div className="xs muted mb12" style={{ lineHeight: 1.6 }}>{s.description}</div>

            {/* Change preview */}
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="xs dimmed">{s.action.target}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--red)' }}>{fmtCurrency(s.action.current_value)}</span>
              <span className="xs dimmed">→</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--green)' }}>{fmtCurrency(s.action.suggested_value)}</span>
              <span className="xs dimmed" style={{ marginLeft: 'auto' }}>{s.action.field?.replace(/_/g, ' ')}</span>
            </div>

            {isApplied ? (
              <div className="xs" style={{ color: didSucceed ? 'var(--green)' : 'var(--red)' }}>{applyResult}</div>
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
