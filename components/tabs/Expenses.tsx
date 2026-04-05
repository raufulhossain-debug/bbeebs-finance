'use client'
import { FinancialData, Expense } from '@/lib/types'
import { toMonthly, fmtCurrency } from '@/lib/calculations'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Owner = 'bbs' | 'beebs' | 'joint'

const FREQ_OPTIONS = ['monthly', 'quarterly', 'yearly'] as const
const FREQ_LABELS: Record<string, string> = { monthly: '/mo', quarterly: '/qtr', yearly: '/yr' }

export default function Expenses({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const { bbs, beebs } = data.profile.names
  const sections: { key: Owner; label: string }[] = [
    { key: 'bbs', label: `👩 ${bbs}` },
    { key: 'beebs', label: `👨 ${beebs}` },
    { key: 'joint', label: '🏠 Joint' },
  ]

  const setExpense = (owner: Owner, i: number, field: keyof Expense | 'frequency', val: string | number) => {
    const exps = [...data.monthly_expenses[owner]]
    exps[i] = { ...exps[i], [field]: val }
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: exps } })
  }

  const addExpense = (owner: Owner) => {
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: [...data.monthly_expenses[owner], { name: 'New', amount: 0, type: 'Negotiable', frequency: 'monthly' }] } })
  }

  const delExpense = (owner: Owner, i: number) => {
    const exps = data.monthly_expenses[owner].filter((_, idx) => idx !== i)
    update({ ...data, monthly_expenses: { ...data.monthly_expenses, [owner]: exps } })
  }

  const allExp = sections.flatMap(s =>
    data.monthly_expenses[s.key].map(e => ({
      name: e.name,
      monthly: toMonthly(e),
      amount: e.amount,
      freq: e.frequency || 'monthly',
      owner: s.label,
    }))
  )
  const chartData = allExp.filter(e => e.monthly > 0).sort((a, b) => b.monthly - a.monthly).slice(0, 12)
  const totalMonthly = allExp.reduce((s, e) => s + e.monthly, 0)

  return (
    <div>
      <div className="sh">Monthly Expenses</div>

      {sections.map(({ key, label }) => {
        const exps = data.monthly_expenses[key]
        const sub = exps.reduce((s, e) => s + toMonthly(e), 0)
        return (
          <div key={key} className="expander mb8">
            <div className="exp-header">
              <span className="bold">{label}</span>
              <span className="xs" style={{ color: 'var(--accent)' }}>{fmtCurrency(sub)}/mo</span>
            </div>
            <div className="exp-body">
              {/* Column headers */}
              <div className="form-row" style={{ marginBottom: 4 }}>
                <span className="input-label" style={{ flex: 3 }}>Name</span>
                <span className="input-label" style={{ flex: 2 }}>Amount</span>
                <span className="input-label" style={{ flex: 2 }}>Frequency</span>
                <span className="input-label" style={{ flex: 2 }}>Type</span>
                <span className="input-label" style={{ width: 32 }}></span>
              </div>
              {exps.map((e, i) => {
                const freq = e.frequency || 'monthly'
                const monthly = toMonthly(e)
                return (
                  <div key={i} className="form-row">
                    <div style={{ flex: 3 }}>
                      <input className="input" value={e.name}
                        onChange={ev => setExpense(key, i, 'name', ev.target.value)} />
                    </div>
                    <div style={{ flex: 2, position: 'relative' }}>
                      <input className="input" type="number" value={e.amount} min={0} step={1}
                        onChange={ev => setExpense(key, i, 'amount', parseFloat(ev.target.value) || 0)} />
                      {freq !== 'monthly' && (
                        <span style={{
                          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                          fontSize: 9, fontFamily: 'var(--mono)', color: 'var(--text3)'
                        }}>≈{fmtCurrency(monthly)}/mo</span>
                      )}
                    </div>
                    <div style={{ flex: 2 }}>
                      <select className="select" value={freq}
                        onChange={ev => setExpense(key, i, 'frequency', ev.target.value)}>
                        {FREQ_OPTIONS.map(f => (
                          <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 2 }}>
                      <select className="select" value={e.type}
                        onChange={ev => setExpense(key, i, 'type', ev.target.value)}>
                        <option>Non-Negotiable</option>
                        <option>Negotiable</option>
                      </select>
                    </div>
                    <div>
                      <button className="btn btn-danger" onClick={() => delExpense(key, i)}>✕</button>
                    </div>
                  </div>
                )
              })}
              <button className="btn btn-ghost mt8" onClick={() => addExpense(key)}>+ Add expense</button>
            </div>
          </div>
        )
      })}

      <div className="grid g3 mt12 mb12">
        <div className="card"><div className="card-title">Total Monthly</div><div className="card-value">{fmtCurrency(totalMonthly, 2)}</div></div>
        <div className="card"><div className="card-title">Quarterly</div><div className="card-value">{fmtCurrency(totalMonthly * 3)}</div></div>
        <div className="card"><div className="card-title">Annual</div><div className="card-value">{fmtCurrency(totalMonthly * 12)}</div></div>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <div className="card-title">Top Expenses (monthly equivalent)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 60, top: 8, bottom: 8 }}>
              <XAxis type="number" hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }}
                formatter={(v: any, _: any, props: any) => [
                  `${fmtCurrency(Number(v))}/mo${props.payload.freq !== 'monthly' ? ` (${fmtCurrency(props.payload.amount)}/${props.payload.freq === 'quarterly' ? 'qtr' : 'yr'})` : ''}`,
                  'Amount'
                ]}
              />
              <Bar dataKey="monthly" radius={[0, 3, 3, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={['#4f8ef7','#3fcf7f','#f0a429'][i % 3]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
