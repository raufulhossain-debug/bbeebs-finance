'use client'
import { useState } from 'react'
import { FinancialData, Debt as DebtType } from '@/lib/types'
import { calcTotalDebt, calcMonthlyDebtPayments, monthsToPayoff, fmtCurrency, fmt } from '@/lib/calculations'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function runStrategy(cards: DebtType[], extra: number, strategy: 'avalanche' | 'snowball') {
  const cs = cards.filter(c => c.balance > 0).map(c => ({ ...c }))
  cs.sort((a, b) => strategy === 'avalanche' ? b.rate - a.rate : a.balance - b.balance)
  let month = 0, totalInterest = 0
  const timeline: { month: number; remaining: number }[] = []
  while (cs.some(c => c.balance > 0) && month < 600) {
    month++
    let freed = extra
    for (const c of cs) {
      if (c.balance <= 0) continue
      const interest = c.balance * (c.rate / 100 / 12)
      totalInterest += interest
      c.balance += interest - c.payment
      if (c.balance <= 0) { freed += -c.balance; c.balance = 0 }
    }
    for (const c of cs) {
      if (c.balance > 0) { c.balance -= freed; if (c.balance < 0) { freed = -c.balance; c.balance = 0 } else freed = 0; break }
    }
    timeline.push({ month, remaining: cs.reduce((s, c) => s + c.balance, 0) })
  }
  return { months: month, totalInterest, timeline }
}

export default function Debt({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const [extra, setExtra] = useState(0)
  const [open, setOpen] = useState<number | null>(0)

  const set = (i: number, field: keyof DebtType, val: string | number) => {
    const cards = data.credit_cards.map((c, idx) => idx === i ? { ...c, [field]: val } : c)
    update({ ...data, credit_cards: cards })
  }

  const addDebt = () => update({ ...data, credit_cards: [...data.credit_cards, { name: 'New Debt', balance: 0, original: 0, rate: 0, payment: 0, owner: 'Beebs' }] })
  const delDebt = (i: number) => update({ ...data, credit_cards: data.credit_cards.filter((_, idx) => idx !== i) })

  const av = runStrategy(data.credit_cards, extra, 'avalanche')
  const sw = runStrategy(data.credit_cards, extra, 'snowball')
  const maxM = Math.min(Math.max(av.months, sw.months), 240)
  const chartData = av.timeline.slice(0, maxM).map((a, i) => ({
    month: a.month,
    avalanche: Math.round(a.remaining),
    snowball: Math.round(sw.timeline[i]?.remaining ?? 0),
  }))

  return (
    <div>
      <div className="sh">Debt Optimizer</div>
      <div className="grid g2 mb12">
        <div className="card"><div className="card-title">Total Debt</div><div className="card-value red">{fmtCurrency(calcTotalDebt(data))}</div></div>
        <div className="card"><div className="card-title">Monthly Payments</div><div className="card-value">{fmtCurrency(calcMonthlyDebtPayments(data))}</div></div>
      </div>

      {data.credit_cards.map((card, i) => {
        const progress = card.original > 0 ? ((card.original - card.balance) / card.original * 100) : 0
        const payoff = monthsToPayoff(card.balance, card.rate, card.payment)
        return (
          <div key={i} className="expander mb8">
            <div className="exp-header" onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex ic g8">
                <span className="bold">{card.name}</span>
                <span className="badge ba">{fmtCurrency(card.balance)}</span>
                {card.rate > 0 && <span className="badge br">{card.rate}% APR</span>}
              </div>
              <div className="flex ic g8">
                {payoff && <span className="xs">{payoff < 24 ? `${payoff}mo` : `${Math.floor(payoff/12)}y ${payoff%12}m`}</span>}
                <span className="xs">{open === i ? '▲' : '▼'}</span>
              </div>
            </div>
            {open === i && (
              <div className="exp-body">
                <div className="form-row">
                  <div className="input-group" style={{ flex: 2 }}>
                    <label className="input-label">Name</label>
                    <input className="input" value={card.name} onChange={e => set(i, 'name', e.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Balance $</label>
                    <input className="input" type="number" value={card.balance} min={0} step={100} onChange={e => set(i, 'balance', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Original $</label>
                    <input className="input" type="number" value={card.original} min={0} step={100} onChange={e => set(i, 'original', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">APR %</label>
                    <input className="input" type="number" value={card.rate} min={0} step={0.1} onChange={e => set(i, 'rate', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Payment $</label>
                    <input className="input" type="number" value={card.payment} min={0} step={10} onChange={e => set(i, 'payment', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Owner</label>
                    <select className="select" value={card.owner} onChange={e => set(i, 'owner', e.target.value)}>
                      <option>BBs</option><option>Beebs</option><option>Joint</option>
                    </select>
                  </div>
                  <div style={{ paddingTop: 18 }}>
                    <button className="btn btn-danger" onClick={() => delDebt(i)}>✕</button>
                  </div>
                </div>
                {card.original > 0 && (
                  <div className="mt8">
                    <div className="flex jb xs mb8"><span>Paid off: {fmt(progress, 1)}%</span><span>{fmtCurrency(card.original - card.balance)} / {fmtCurrency(card.original)}</span></div>
                    <div className="prog-track"><div className="prog-fill" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button className="btn btn-ghost mb12" onClick={addDebt}>+ Add debt</button>

      <div className="sh">Strategy Comparison</div>
      <div className="flex ic g8 mb12">
        <span className="xs">Extra monthly payment: <strong>{fmtCurrency(extra)}</strong></span>
        <input type="range" min={0} max={2000} step={50} value={extra} onChange={e => setExtra(+e.target.value)} style={{ flex: 1, accentColor: 'var(--accent)' }} />
      </div>

      {data.credit_cards.length > 0 && (
        <>
          <div className="grid g3 mb12">
            <div className="card"><div className="card-title">❄️ Avalanche</div><div className="card-value" style={{ fontSize: 16 }}>{av.months < 600 ? `${av.months} months` : '50+ yrs'}</div><div className="card-sub">{fmtCurrency(av.totalInterest)} interest</div></div>
            <div className="card"><div className="card-title">⛄ Snowball</div><div className="card-value" style={{ fontSize: 16 }}>{sw.months < 600 ? `${sw.months} months` : '50+ yrs'}</div><div className="card-sub">{fmtCurrency(sw.totalInterest)} interest</div></div>
            <div className="card"><div className="card-title">Avalanche saves</div><div className="card-value green" style={{ fontSize: 16 }}>{fmtCurrency(Math.max(sw.totalInterest - av.totalInterest, 0))}</div><div className="card-sub">vs snowball</div></div>
          </div>
          {chartData.length > 0 && (
            <div className="card">
              <div className="card-title">Payoff Timeline</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} label={{ value: 'months', position: 'insideBottom', offset: -2, fill: 'var(--text3)', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }} />
                  <Line type="monotone" dataKey="avalanche" stroke="#4f8ef7" strokeWidth={2} dot={false} name="Avalanche" />
                  <Line type="monotone" dataKey="snowball" stroke="#9d7af5" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Snowball" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
