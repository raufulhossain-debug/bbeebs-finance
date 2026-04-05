'use client'
import { useState } from 'react'
import { FinancialData } from '@/lib/types'
import { calcTotalRetirement, fmtCurrency, fmt } from '@/lib/calculations'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const ACCOUNT_TYPES = ['Roth IRA', '401(k)', 'Traditional IRA', 'SEP IRA', 'Simple IRA', 'Other']

function monteCarlo(bal: number, monthly: number, years: number, n = 300) {
  const results: number[] = []
  for (let s = 0; s < n; s++) {
    let b = bal
    for (let m = 0; m < years * 12; m++) {
      const r = (Math.random() * 0.24 - 0.06) / 12 + 0.07 / 12
      b = b * (1 + r) + monthly
    }
    results.push(Math.max(b, 0))
  }
  results.sort((a, b) => a - b)
  return { p10: results[Math.floor(n * 0.1)], p50: results[Math.floor(n * 0.5)], p90: results[Math.floor(n * 0.9)] }
}

export default function Retirement({ data, update }: { data: FinancialData; update: (d: FinancialData) => void }) {
  const { bbs, beebs } = data.profile.names
  const ret = data.retirement
  const [ran, setRan] = useState(false)
  const [mc, setMc] = useState<{ p10: number; p50: number; p90: number } | null>(null)

  const setRet = (path: string, val: string | number) => {
    const parts = path.split('.')
    const r = { ...ret }
    if (parts.length === 2) {
      (r as any)[parts[0]] = { ...(r as any)[parts[0]], [parts[1]]: val }
    } else {
      (r as any)[parts[0]] = val
    }
    update({ ...data, retirement: r })
  }

  const years = Math.max(1, ret.target_retirement_age - Math.max(ret.current_age_bbs, ret.current_age_beebs))
  const totalBal = ret.bbs.balance + ret.beebs.balance
  const totalMonthly = ret.bbs.monthly_contribution + ret.beebs.monthly_contribution
  const needed = ret.desired_retirement_income / 0.04

  // simple projection for chart
  const projData = Array.from({ length: years + 1 }, (_, yr) => {
    let bal = totalBal
    for (let m = 0; m < yr * 12; m++) bal = bal * (1 + 0.07 / 12) + totalMonthly
    return { year: yr, balance: Math.round(bal), needed: Math.round(needed) }
  })

  const runMC = () => {
    setMc(monteCarlo(totalBal, totalMonthly, years))
    setRan(true)
  }

  const onTrack = mc ? mc.p50 >= needed : projData[projData.length - 1]?.balance >= needed

  return (
    <div>
      <div className="sh">Retirement Planning</div>
      <div className="grid g3 mb12">
        <div className="card"><div className="card-title">Total Balance</div><div className="card-value">{fmtCurrency(calcTotalRetirement(data))}</div></div>
        <div className="card"><div className="card-title">Monthly Contributions</div><div className="card-value">{fmtCurrency(totalMonthly)}</div></div>
        <div className="card"><div className="card-title">Need (4% rule)</div><div className="card-value">{fmtCurrency(needed)}</div></div>
      </div>

      <div className="grid g2 mb12">
        {(['bbs', 'beebs'] as const).map(who => (
          <div key={who} className="card">
            <div className="card-title">{'👩'.repeat(who === 'bbs' ? 1 : 0)}{'👨'.repeat(who === 'beebs' ? 1 : 0)} {who === 'bbs' ? bbs : beebs}</div>
            <div className="form-row mt8">
              <div className="input-group">
                <label className="input-label">Account Type</label>
                <select className="select" value={ret[who].account_type} onChange={e => setRet(`${who}.account_type`, e.target.value)}>
                  {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Balance $</label>
                <input className="input" type="number" value={ret[who].balance} min={0} step={1000} onChange={e => setRet(`${who}.balance`, parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Monthly Contrib $</label>
                <input className="input" type="number" value={ret[who].monthly_contribution} min={0} step={50} onChange={e => setRet(`${who}.monthly_contribution`, parseFloat(e.target.value) || 0)} />
              </div>
              {ret[who].account_type === '401(k)' && (
                <div className="input-group">
                  <label className="input-label">Employer Match %</label>
                  <input className="input" type="number" value={ret[who].employer_match} min={0} step={0.5} onChange={e => setRet(`${who}.employer_match`, parseFloat(e.target.value) || 0)} />
                </div>
              )}
              <div className="input-group">
                <label className="input-label">Current Age</label>
                <input className="input" type="number" value={ret[`current_age_${who}` as 'current_age_bbs' | 'current_age_beebs']} min={18} max={80} onChange={e => setRet(`current_age_${who}`, parseInt(e.target.value) || 30)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid g2 mb12">
        <div className="input-group">
          <label className="input-label">Target Retirement Age</label>
          <input className="input" type="number" value={ret.target_retirement_age} min={40} max={80} onChange={e => setRet('target_retirement_age', parseInt(e.target.value) || 65)} />
        </div>
        <div className="input-group">
          <label className="input-label">Desired Annual Income $</label>
          <input className="input" type="number" value={ret.desired_retirement_income} min={0} step={5000} onChange={e => setRet('desired_retirement_income', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <div className="card mb12">
        <div className="card-title">Projection @ 7% return — {years} years</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} label={{ value: 'years', position: 'insideBottom', offset: -2, fill: 'var(--text3)', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
            <ReferenceLine y={needed} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'Need', fill: 'var(--red)', fontSize: 10, fontFamily: 'var(--mono)' }} />
            <Area type="monotone" dataKey="balance" stroke="#4f8ef7" fill="rgba(79,142,247,0.15)" strokeWidth={2} dot={false} name="Projected" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex ic g8 mb12">
        <button className="btn btn-primary" onClick={runMC}>Run Monte Carlo (300 scenarios)</button>
        {ran && mc && (
          <span className={`badge ${onTrack ? 'bg' : 'ba'}`}>{onTrack ? '✓ On track' : '⚠ May fall short'}</span>
        )}
      </div>

      {mc && (
        <div className="grid g3">
          <div className="card"><div className="card-title">P10 Bear Case</div><div className="card-value red" style={{ fontSize: 16 }}>{fmtCurrency(mc.p10)}</div></div>
          <div className="card"><div className="card-title">P50 Median</div><div className="card-value" style={{ fontSize: 16, color: mc.p50 >= needed ? 'var(--green)' : 'var(--amber)' }}>{fmtCurrency(mc.p50)}</div></div>
          <div className="card"><div className="card-title">P90 Bull Case</div><div className="card-value green" style={{ fontSize: 16 }}>{fmtCurrency(mc.p90)}</div></div>
        </div>
      )}
    </div>
  )
}
