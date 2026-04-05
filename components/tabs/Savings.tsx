'use client'
import { useState } from 'react'
import { FinancialData, SavingsGoal } from '@/lib/types'
import { calcTotalSavings, fmtCurrency, fmt } from '@/lib/calculations'
import { addMonths, format, differenceInMonths } from 'date-fns'

export default function Savings({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const { bbs, beebs } = data.profile.names
  const total = calcTotalSavings(data)
  const target = data.savings_goals.reduce((s, g) => s + g.target, 0)
  const [startDates, setStartDates] = useState<Record<number, string>>({})

  const set = (i: number, field: keyof SavingsGoal, val: string | number) => {
    const goals = data.savings_goals.map((g, idx) => idx === i ? { ...g, [field]: val } : g)
    update({ ...data, savings_goals: goals })
  }

  const del = (i: number) => update({ ...data, savings_goals: data.savings_goals.filter((_, idx) => idx !== i) })

  const add = () => update({
    ...data,
    savings_goals: [...data.savings_goals, { name: 'New Goal', target: 10000, bbs: 0, beebs: 0, monthly_bbs: 50, monthly_beebs: 50 }]
  })

  const autoAccumulate = (i: number) => {
    const g = data.savings_goals[i]
    const startDate = startDates[i]
    if (!startDate) return
    const months = Math.max(0, differenceInMonths(new Date(), new Date(startDate)))
    const newBbs = Math.round(g.monthly_bbs * months)
    const newBeebs = Math.round(g.monthly_beebs * months)
    const goals = data.savings_goals.map((goal, idx) =>
      idx === i ? { ...goal, bbs: newBbs, beebs: newBeebs } : goal
    )
    update({ ...data, savings_goals: goals })
  }

  return (
    <div>
      <div className="sh">Savings Goals</div>
      <div className="grid g4 mb12">
        <div className="card"><div className="card-title">Total Saved</div><div className="card-value green">{fmtCurrency(total)}</div></div>
        <div className="card"><div className="card-title">Total Target</div><div className="card-value">{fmtCurrency(target)}</div></div>
        <div className="card"><div className="card-title">Overall Progress</div><div className="card-value">{fmt(Math.min(total / Math.max(target, 1) * 100, 100), 1)}%</div></div>
        <div className="card"><div className="card-title">Remaining</div><div className="card-value amber">{fmtCurrency(Math.max(target - total, 0))}</div></div>
      </div>

      {data.savings_goals.map((g, i) => {
        const cur = g.bbs + g.beebs
        const pct = Math.min(cur / Math.max(g.target, 1) * 100, 100)
        const rem = g.target - cur
        const monthly = g.monthly_bbs + g.monthly_beebs
        const months = monthly > 0 && rem > 0 ? Math.ceil(rem / monthly) : 0
        const eta = months > 0 ? format(addMonths(new Date(), months), 'MMM yyyy') : cur >= g.target ? '✓ Funded' : '—'

        return (
          <div key={i} className="card mb8">
            <div className="flex jb ic mb12">
              <div>
                <input className="input" style={{ width: 220, marginBottom: 6 }} value={g.name}
                  onChange={e => set(i, 'name', e.target.value)} />
                <div className="flex ic g8">
                  <span className={`badge ${pct >= 100 ? 'bg' : pct >= 50 ? 'bb' : 'ba'}`}>{fmt(pct, 0)}%</span>
                  <span className="xs">{fmtCurrency(cur)} / {fmtCurrency(g.target)}</span>
                  {eta && <span className="xs accent">→ {eta}</span>}
                </div>
              </div>
              <button className="btn btn-danger" onClick={() => del(i)}>✕</button>
            </div>

            <div className="prog-track mb12">
              <div className="prog-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--amber)' }} />
            </div>

            <div className="grid g2 mb8">
              <div>
                <div className="panel-label" style={{ marginBottom: 8 }}>👩 {bbs}</div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Saved $</label>
                    <input className="input" type="number" value={g.bbs} min={0} step={100}
                      onChange={e => set(i, 'bbs', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Monthly $</label>
                    <input className="input" type="number" value={g.monthly_bbs} min={0} step={50}
                      onChange={e => set(i, 'monthly_bbs', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
              <div>
                <div className="panel-label" style={{ marginBottom: 8 }}>👨 {beebs}</div>
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Saved $</label>
                    <input className="input" type="number" value={g.beebs} min={0} step={100}
                      onChange={e => set(i, 'beebs', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Monthly $</label>
                    <input className="input" type="number" value={g.monthly_beebs} min={0} step={50}
                      onChange={e => set(i, 'monthly_beebs', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="input-group mb12" style={{ maxWidth: 200 }}>
              <label className="input-label">Target $</label>
              <input className="input" type="number" value={g.target} min={0} step={1000}
                onChange={e => set(i, 'target', parseFloat(e.target.value) || 0)} />
            </div>

            {/* Auto-accumulate */}
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '10px 12px' }}>
              <div className="xs muted mb8">Auto-accumulate: calculate saved amount from a start date</div>
              <div className="flex ic g8">
                <div className="input-group" style={{ flex: 1 }}>
                  <label className="input-label">Saving since</label>
                  <input className="input" type="date" value={startDates[i] || ''}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setStartDates(prev => ({ ...prev, [i]: e.target.value }))} />
                </div>
                <div style={{ paddingTop: 16 }}>
                  <button
                    className="btn btn-ghost"
                    disabled={!startDates[i]}
                    onClick={() => autoAccumulate(i)}
                    style={{ borderColor: startDates[i] ? 'rgba(79,142,247,0.4)' : undefined, color: startDates[i] ? 'var(--accent)' : undefined }}
                  >
                    Calculate →
                  </button>
                </div>
                {startDates[i] && (
                  <div className="xs muted" style={{ paddingTop: 16 }}>
                    {Math.max(0, Math.floor((new Date().getTime() - new Date(startDates[i]).getTime()) / (1000 * 60 * 60 * 24 * 30.44)))} months × ${g.monthly_bbs + g.monthly_beebs}/mo
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      <button className="btn btn-ghost mt12" onClick={add}>+ Add goal</button>
    </div>
  )
}
