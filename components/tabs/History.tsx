'use client'
import { useEffect, useState } from 'react'
import { fmtCurrency, fmt } from '@/lib/calculations'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface Snapshot {
  snapshot_date: string
  net_worth: number
  total_savings: number
  total_retirement: number
  total_debt: number
  savings_rate: number
}

export default function History() {
  const [data, setData] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/history').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return <div className="loading-bar"><div className="loading-fill" /></div>

  if (data.length === 0) return (
    <div>
      <div className="sh">Net Worth History</div>
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <div className="xs muted">No history yet.</div>
        <div className="xs dimmed mt8">Your net worth will be automatically tracked each time you save. Check back after a few saves.</div>
      </div>
    </div>
  )

  const chartData = data.map(d => ({
    date: format(new Date(d.snapshot_date), 'MMM d'),
    'Net Worth': Math.round(d.net_worth),
    'Retirement': Math.round(d.total_retirement),
    'Debt': Math.round(-d.total_debt),
  }))

  const first = data[0], last = data[data.length - 1]
  const change = last.net_worth - first.net_worth

  return (
    <div>
      <div className="sh">Net Worth History</div>
      <div className="grid g3 mb12">
        <div className="card"><div className="card-title">Starting Net Worth</div><div className="card-value">{fmtCurrency(first.net_worth)}</div></div>
        <div className="card"><div className="card-title">Current Net Worth</div><div className="card-value">{fmtCurrency(last.net_worth)}</div></div>
        <div className="card"><div className="card-title">Total Change</div><div className="card-value" style={{ color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>{change >= 0 ? '+' : ''}{fmtCurrency(change)}</div></div>
      </div>

      <div className="card mb12">
        <div className="card-title">Net Worth Over Time</div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }} />
            <Area type="monotone" dataKey="Net Worth" stroke="#4f8ef7" fill="rgba(79,142,247,0.12)" strokeWidth={2} dot={data.length < 20} />
            <Area type="monotone" dataKey="Retirement" stroke="#9d7af5" fill="rgba(157,122,245,0.08)" strokeWidth={1.5} dot={false} />
            <Area type="monotone" dataKey="Debt" stroke="#f05252" fill="rgba(240,82,82,0.06)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Snapshots</div>
        <table className="table">
          <thead><tr><th>Date</th><th>Net Worth</th><th>Retirement</th><th>Debt</th><th>Savings Rate</th></tr></thead>
          <tbody>
            {data.slice().reverse().slice(0, 30).map((d, i) => (
              <tr key={i}>
                <td className="mono">{format(new Date(d.snapshot_date), 'MMM d, yyyy')}</td>
                <td className="mono" style={{ color: d.net_worth >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCurrency(d.net_worth)}</td>
                <td className="mono">{fmtCurrency(d.total_retirement)}</td>
                <td className="mono red">{fmtCurrency(d.total_debt)}</td>
                <td className="mono" style={{ color: d.savings_rate > 20 ? 'var(--green)' : d.savings_rate > 10 ? 'var(--amber)' : 'var(--red)' }}>{fmt(d.savings_rate, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
