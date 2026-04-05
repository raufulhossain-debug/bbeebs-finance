'use client'
import { useState } from 'react'
import { FinancialData } from '@/lib/types'
import {
  calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments,
  calcMonthlyLeftover, calcSavingsRate, calcTotalSavings,
  calcTotalRetirement, calcPortfolioValue, fmtCurrency, fmt
} from '@/lib/calculations'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function WhatIf({ data }: { data: FinancialData }) {
  const [incChange, setIncChange] = useState(0)
  const [expChange, setExpChange] = useState(0)
  const [extraDebt, setExtraDebt] = useState(0)
  const [extraSav, setExtraSav] = useState(0)
  const [retRate, setRetRate] = useState(7)
  const [years, setYears] = useState(10)

  const inc = calcTotalIncome(data)
  const exp = calcTotalExpenses(data)
  const dp  = calcMonthlyDebtPayments(data)
  const left = calcMonthlyLeftover(data)
  const sr  = calcSavingsRate(data)

  const newInc  = inc + incChange
  const newExp  = exp + expChange
  const newLeft = newInc - newExp - dp - extraDebt
  const newSr   = newInc > 0 ? (newLeft / newInc * 100) : 0

  const investable = calcTotalSavings(data) + calcTotalRetirement(data) + calcPortfolioValue(data)
  const curAnnual  = left * 12
  const newAnnual  = (newLeft + extraSav) * 12
  const mr = retRate / 100 / 12

  const baseVals: number[] = [investable]
  const scenVals: number[] = [investable]
  let bb = investable, sb = investable
  for (let yr = 0; yr < years; yr++) {
    for (let m = 0; m < 12; m++) { bb = bb * (1 + mr) + curAnnual / 12; sb = sb * (1 + mr) + newAnnual / 12 }
    baseVals.push(Math.round(bb))
    scenVals.push(Math.round(sb))
  }

  const chartData = baseVals.map((v, i) => ({ year: i, current: v, scenario: scenVals[i] }))
  const diff = scenVals[scenVals.length - 1] - baseVals[baseVals.length - 1]

  return (
    <div>
      <div className="sh">What-If Scenario Planner</div>

      <div className="grid g2 mb12">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Adjust Variables</div>
          {[
            { label: 'Income change (monthly $)', val: incChange, set: setIncChange, min: -5000, max: 20000, step: 100 },
            { label: 'Expense change (monthly $)', val: expChange, set: setExpChange, min: -3000, max: 5000, step: 50 },
            { label: 'Extra debt payment $', val: extraDebt, set: setExtraDebt, min: 0, max: 3000, step: 50 },
            { label: 'Extra savings $', val: extraSav, set: setExtraSav, min: 0, max: 5000, step: 50 },
            { label: `Return rate: ${retRate}%`, val: retRate, set: setRetRate, min: 2, max: 15, step: 0.5 },
            { label: `Project ${years} years`, val: years, set: setYears, min: 1, max: 40, step: 1 },
          ].map(s => (
            <div key={s.label} className="mb12">
              <div className="flex jb xs mb8"><span>{s.label}</span><span className="accent mono">{s.label.includes('rate') || s.label.includes('years') ? '' : (s.val >= 0 ? '+' : '')}{fmtCurrency(s.val)}</span></div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                onChange={e => s.set(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title mb12">Impact Summary</div>
          <div className="grid g2" style={{ gap: 8 }}>
            {[
              { label: 'New Income', old: fmtCurrency(inc), new_: fmtCurrency(newInc), delta: incChange },
              { label: 'New Expenses', old: fmtCurrency(exp), new_: fmtCurrency(newExp), delta: -expChange },
              { label: 'New Leftover', old: fmtCurrency(left), new_: fmtCurrency(newLeft), delta: newLeft - left },
              { label: 'New Savings Rate', old: `${fmt(sr, 1)}%`, new_: `${fmt(newSr, 1)}%`, delta: newSr - sr },
            ].map(k => (
              <div key={k.label} className="card" style={{ padding: 12 }}>
                <div className="card-title" style={{ fontSize: 8 }}>{k.label}</div>
                <div className="mono" style={{ fontSize: 14 }}>{k.new_}</div>
                <div className="xs" style={{ color: k.delta >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {k.delta >= 0 ? '▲' : '▼'} {typeof k.delta === 'number' && k.label.includes('%') ? `${fmt(Math.abs(k.delta), 1)}%` : fmtCurrency(Math.abs(k.delta))}
                </div>
              </div>
            ))}
          </div>

          <div className="card mt12" style={{ background: diff >= 0 ? 'rgba(63,207,127,0.06)' : 'rgba(240,82,82,0.06)', borderColor: diff >= 0 ? 'rgba(63,207,127,0.2)' : 'rgba(240,82,82,0.2)' }}>
            <div className="card-title">In {years} years</div>
            <div className="flex jb ic mt8">
              <div><div className="xs muted">Current path</div><div className="mono" style={{ fontSize: 16 }}>{fmtCurrency(baseVals[baseVals.length - 1])}</div></div>
              <div style={{ textAlign: 'right' }}><div className="xs muted">What-if</div><div className="mono" style={{ fontSize: 16, color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtCurrency(scenVals[scenVals.length - 1])}</div></div>
            </div>
            <div className="mt8 xs" style={{ textAlign: 'center', color: diff >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {diff >= 0 ? '+' : ''}{fmtCurrency(diff)} difference
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Wealth Projection — {years} Years @ {retRate}%</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }} />
            <Area type="monotone" dataKey="current" stroke="#f05252" fill="rgba(240,82,82,0.08)" strokeWidth={2} dot={false} strokeDasharray="4 4" name="Current path" />
            <Area type="monotone" dataKey="scenario" stroke="#3fcf7f" fill="rgba(63,207,127,0.12)" strokeWidth={2} dot={false} name="What-if" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
