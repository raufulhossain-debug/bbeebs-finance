'use client'
import { useState } from 'react'
import { FinancialData } from '@/lib/types'
import {
  calcTotalExpenses, calcTotalSavings, calcTotalRetirement,
  calcPortfolioValue, calcMonthlyLeftover, fireNumber, yearsToFire, fmtCurrency, fmt
} from '@/lib/calculations'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell } from 'recharts'

const RATES = [
  { label: 'Lean FIRE (3.5%)', rate: 0.035, color: '#3fcf7f' },
  { label: 'FIRE (4%)', rate: 0.04, color: '#4f8ef7' },
  { label: 'Fat FIRE (3%)', rate: 0.03, color: '#2dd4bf' },
  { label: 'FIRE 2.0 (3.33%)', rate: 0.0333, color: '#f0a429' },
]

export default function FIRE({ data }: { data: FinancialData }) {
  const [annualExp, setAnnualExp] = useState(calcTotalExpenses(data) * 12)
  const [currentSav, setCurrentSav] = useState(calcTotalSavings(data) + calcTotalRetirement(data) + calcPortfolioValue(data))
  const [annualSav, setAnnualSav] = useState(Math.max(calcMonthlyLeftover(data) * 12, 0))
  const [retRate, setRetRate] = useState(7)

  const fireN = fireNumber(annualExp, 0.04)
  const maxYrs = 50

  const projData = Array.from({ length: maxYrs + 1 }, (_, yr) => {
    let bal = currentSav
    for (let m = 0; m < yr * 12; m++) bal = bal * (1 + retRate / 100 / 12) + annualSav / 12
    return { year: yr, portfolio: Math.round(bal), fire: Math.round(fireN) }
  })

  const fireYear = projData.find(d => d.portfolio >= d.fire)?.year ?? null

  const savRateData = [10, 20, 30, 40, 50, 60, 70].map(sr => {
    const sav = annualExp * (sr / 100) / (1 - sr / 100)
    const yrs = yearsToFire(currentSav, sav, fireN, retRate / 100)
    return { sr: `${sr}%`, years: Math.min(yrs ?? 50, 50) }
  })

  return (
    <div>
      <div className="sh">FIRE Calculator — Financial Independence, Retire Early</div>

      <div className="grid g2 mb12">
        <div className="card">
          <div className="card-title mb12">Your Numbers</div>
          {[
            { label: 'Annual Expenses $', val: annualExp, set: setAnnualExp, step: 1000 },
            { label: 'Current Assets $', val: currentSav, set: setCurrentSav, step: 5000 },
            { label: 'Annual Savings $', val: annualSav, set: setAnnualSav, step: 1000 },
          ].map(f => (
            <div key={f.label} className="input-group mb8">
              <label className="input-label">{f.label}</label>
              <input className="input" type="number" value={f.val} min={0} step={f.step} onChange={e => f.set(parseFloat(e.target.value) || 0)} />
            </div>
          ))}
          <div className="mb8">
            <div className="flex jb xs mb8"><span>Expected return: {retRate}%</span></div>
            <input type="range" min={2} max={12} step={0.5} value={retRate} onChange={e => setRetRate(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </div>
        </div>

        <div className="card">
          <div className="card-title mb12">FIRE Numbers</div>
          {RATES.map(({ label, rate, color }) => {
            const fn = fireNumber(annualExp, rate)
            const yrs = yearsToFire(currentSav, annualSav, fn, retRate / 100)
            return (
              <div key={label} className="flex jb ic mb12">
                <div>
                  <div className="xs bold" style={{ color }}>{label}</div>
                  <div className="mono" style={{ fontSize: 15 }}>{fmtCurrency(fn)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 20, color: yrs && yrs < 20 ? 'var(--green)' : 'var(--amber)' }}>
                    {yrs ?? '40+'}
                  </div>
                  <div className="xs muted">years</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card mb12">
        <div className="card-title">Path to FIRE @ {retRate}% return</div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={projData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
            <ReferenceLine y={fireN} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'FIRE #', fill: 'var(--red)', fontSize: 10, fontFamily: 'var(--mono)' }} />
            {fireYear && <ReferenceLine x={fireYear} stroke="var(--green)" strokeDasharray="3 3" label={{ value: `🔥 Year ${fireYear}`, fill: 'var(--green)', fontSize: 10, fontFamily: 'var(--mono)' }} />}
            <Area type="monotone" dataKey="portfolio" stroke="#3fcf7f" fill="rgba(63,207,127,0.12)" strokeWidth={2} dot={false} name="Portfolio" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="card-title">Savings Rate → Years to FIRE</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={savRateData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <XAxis dataKey="sr" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => `${v} years`} />
            <Bar dataKey="years" radius={[3, 3, 0, 0]}>
              {savRateData.map((e, i) => <Cell key={i} fill={e.years < 15 ? '#3fcf7f' : e.years < 30 ? '#f0a429' : '#f05252'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {fireYear && (
        <div className="card mt12" style={{ background: 'rgba(63,207,127,0.06)', borderColor: 'rgba(63,207,127,0.2)' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="xs muted mb8">At your current trajectory</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--mono)', color: 'var(--green)' }}>🔥 {fireYear} years</div>
            <div className="xs muted mt8">FIRE number: {fmtCurrency(fireN)} · Projected: {fmtCurrency(projData[fireYear]?.portfolio ?? 0)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
