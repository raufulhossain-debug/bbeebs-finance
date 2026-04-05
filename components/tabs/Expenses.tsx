'use client'
import { FinancialData, Expense } from '@/lib/types'
import { calcTotalExpenses, fmtCurrency } from '@/lib/calculations'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Owner = 'bbs' | 'beebs' | 'joint'

export default function Expenses({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const { bbs, beebs } = data.profile.names
  const sections: { key: Owner; label: string }[] = [
    { key: 'bbs', label: `👩 ${bbs}` },
    { key: 'beebs', label: `👨 ${beebs}` },
    { key: 'joint', label: '🏠 Joint' },
  ]

  const setExpense = (owner: Owner, i: number, field: keyof Expense, val: string | number) => {
    const exps = [...data.monthly_expenses[owner]]
    exps[i] = { ...exps[i], [field]: val }
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: exps } })
  }

  const addExpense = (owner: Owner) => {
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: [...data.monthly_expenses[owner], { name: 'New', amount: 0, type: 'Negotiable' }] } })
  }

  const delExpense = (owner: Owner, i: number) => {
    const exps = data.monthly_expenses[owner].filter((_, idx) => idx !== i)
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: exps } })
  }

  // chart data
  const allExp = sections.flatMap(s => data.monthly_expenses[s.key].map(e => ({ name: e.name, amount: e.amount, owner: s.label })))
  const chartData = allExp.filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount).slice(0, 12)

  return (
    <div>
      <div className="sh">Monthly Expenses</div>

      {sections.map(({ key, label }) => {
        const exps = data.monthly_expenses[key]
        const sub = exps.reduce((s, e) => s + e.amount, 0)
        return (
          <div key={key} className="expander mb8">
            <div className="exp-header">
              <span className="bold">{label}</span>
              <span className="xs" style={{ color: 'var(--accent)' }}>{fmtCurrency(sub)}/mo</span>
            </div>
            <div className="exp-body">
              {exps.map((e, i) => (
                <div key={i} className="form-row">
                  <div className="input-group" style={{ flex: 3 }}>
                    {i === 0 && <label className="input-label">Name</label>}
                    <input className="input" value={e.name} onChange={ev => setExpense(key, i, 'name', ev.target.value)} />
                  </div>
                  <div className="input-group" style={{ flex: 2 }}>
                    {i === 0 && <label className="input-label">Amount $</label>}
                    <input className="input" type="number" value={e.amount} min={0} step={1} onChange={ev => setExpense(key, i, 'amount', parseFloat(ev.target.value) || 0)} />
                  </div>
                  <div className="input-group" style={{ flex: 2 }}>
                    {i === 0 && <label className="input-label">Type</label>}
                    <select className="select" value={e.type} onChange={ev => setExpense(key, i, 'type', ev.target.value)}>
                      <option>Non-Negotiable</option>
                      <option>Negotiable</option>
                    </select>
                  </div>
                  <div style={{ paddingTop: i === 0 ? 18 : 0 }}>
                    <button className="btn btn-danger" onClick={() => delExpense(key, i)}>✕</button>
                  </div>
                </div>
              ))}
              <button className="btn btn-ghost mt8" onClick={() => addExpense(key)}>+ Add expense</button>
            </div>
          </div>
        )
      })}

      <div className="grid g2 mt12 mb12">
        <div className="card"><div className="card-title">Total Monthly</div><div className="card-value">{fmtCurrency(calcTotalExpenses(data), 2)}</div></div>
        <div className="card"><div className="card-title">Annual</div><div className="card-value">{fmtCurrency(calcTotalExpenses(data) * 12)}</div></div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="card-title">Top Expenses</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 8, bottom: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text2)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
              <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={['#4f8ef7','#3fcf7f','#f0a429'][i % 3]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
