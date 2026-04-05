'use client'
import { FinancialData } from '@/lib/types'
import { calcPortfolioValue, fmtCurrency } from '@/lib/calculations'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TYPES = ['Stock', 'ETF', 'Crypto', 'Bond', 'Mutual Fund', 'Real Estate', 'Other']
const COLORS = ['#4f8ef7', '#3fcf7f', '#f0a429', '#f05252', '#2dd4bf', '#9d7af5', '#8b8f99']

export default function Investments({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const total = calcPortfolioValue(data)

  const add = () => update({
    ...data,
    portfolio: [...data.portfolio, { name: '', type: 'Stock', shares: 0, price: 0, value: 0 }],
  })

  const set = (i: number, field: string, val: string | number) => {
    const p = data.portfolio.map((h, idx) => {
      if (idx !== i) return h
      const updated = { ...h, [field]: val }
      updated.value = updated.shares * updated.price
      return updated
    })
    update({ ...data, portfolio: p })
  }

  const del = (i: number) => update({ ...data, portfolio: data.portfolio.filter((_, idx) => idx !== i) })

  const byType = TYPES.map(t => ({
    name: t,
    value: data.portfolio.filter(h => h.type === t).reduce((s, h) => s + h.value, 0),
  })).filter(d => d.value > 0)

  return (
    <div>
      <div className="sh">Investment Portfolio</div>
      <div className="grid g2 mb12">
        <div className="card"><div className="card-title">Portfolio Value</div><div className="card-value green">{fmtCurrency(total, 2)}</div></div>
        <div className="card"><div className="card-title">Holdings</div><div className="card-value">{data.portfolio.length}</div></div>
      </div>

      <div className="card mb12">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Units</th><th>Price $</th><th>Value</th><th></th>
            </tr>
          </thead>
          <tbody>
            {data.portfolio.map((h, i) => (
              <tr key={i}>
                <td><input className="input" style={{ width: 140 }} value={h.name} onChange={e => set(i, 'name', e.target.value)} placeholder="e.g. VTSAX" /></td>
                <td>
                  <select className="select" style={{ width: 110 }} value={h.type} onChange={e => set(i, 'type', e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td><input className="input" style={{ width: 80 }} type="number" value={h.shares} min={0} step={0.01} onChange={e => set(i, 'shares', parseFloat(e.target.value) || 0)} /></td>
                <td><input className="input" style={{ width: 90 }} type="number" value={h.price} min={0} step={0.01} onChange={e => set(i, 'price', parseFloat(e.target.value) || 0)} /></td>
                <td><span className="mono" style={{ color: 'var(--green)' }}>{fmtCurrency(h.value, 2)}</span></td>
                <td><button className="btn btn-danger" onClick={() => del(i)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost mt12" onClick={add}>+ Add holding</button>
      </div>

      {byType.length > 0 && (
        <div className="card">
          <div className="card-title">Allocation by Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.portfolio.length === 0 && (
        <div className="xs" style={{ textAlign: 'center', marginTop: 40, color: 'var(--text3)' }}>
          No investments tracked yet. Add your first holding above.
        </div>
      )}
    </div>
  )
}
