'use client'
import { FinancialData } from '@/lib/types'
import { calcTotalIncome, calcMonthlyLeftover, calcTotalExpenses, calcMonthlyDebtPayments, fmtCurrency } from '@/lib/calculations'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function Income({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const { bbs, beebs } = data.profile.names
  const total = calcTotalIncome(data)
  const exp = calcTotalExpenses(data)
  const dp = calcMonthlyDebtPayments(data)
  const left = calcMonthlyLeftover(data)

  const set = (who: 'bbs' | 'beebs', val: number) => update({ ...data, income: { ...data.income, [who]: val } })

  const pie = [
    { name: 'Expenses', value: exp, color: '#f05252' },
    { name: 'Debt Payments', value: dp, color: '#f0a429' },
    { name: 'Leftover', value: Math.max(left, 0), color: '#3fcf7f' },
  ].filter(d => d.value > 0)

  return (
    <div>
      <div className="sh">Monthly Income</div>
      <div className="grid g2 mb12">
        <div className="card">
          <div className="card-title">👩 {bbs} Income</div>
          <input className="input mt8" type="number" value={data.income.bbs} step={100} min={0}
            onChange={e => set('bbs', parseFloat(e.target.value) || 0)} />
        </div>
        <div className="card">
          <div className="card-title">👨 {beebs} Income</div>
          <input className="input mt8" type="number" value={data.income.beebs} step={100} min={0}
            onChange={e => set('beebs', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="grid g3 mb12">
        <div className="card"><div className="card-title">Monthly</div><div className="card-value">{fmtCurrency(total, 2)}</div></div>
        <div className="card"><div className="card-title">Annual</div><div className="card-value">{fmtCurrency(total * 12)}</div></div>
        <div className="card"><div className="card-title">Leftover</div><div className="card-value" style={{ color: left >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCurrency(left, 2)}</div></div>
      </div>

      {total > 0 && (
        <div className="card">
          <div className="card-title">Income Allocation</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {pie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex g16" style={{ justifyContent: 'center' }}>
            {pie.map(e => (
              <div key={e.name} className="flex ic g8">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                <span className="xs">{e.name}: {fmtCurrency(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
