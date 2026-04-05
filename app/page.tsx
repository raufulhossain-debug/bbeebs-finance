'use client'
import { useState, useEffect, useCallback } from 'react'
import { FinancialData, DEFAULT_DATA } from '@/lib/types'
import {
  calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments,
  calcMonthlyLeftover, calcSavingsRate, calcNetWorth,
  calcTotalDebt, calcTotalRetirement, calcTotalSavings,
  calcPortfolioValue, calcHealthScore, fmtCurrency, fmt
} from '@/lib/calculations'
import Overview from '@/components/tabs/Overview'
import AIAdvisor from '@/components/tabs/AIAdvisor'
import Income from '@/components/tabs/Income'
import Expenses from '@/components/tabs/Expenses'
import Debt from '@/components/tabs/Debt'
import Savings from '@/components/tabs/Savings'
import Retirement from '@/components/tabs/Retirement'
import Investments from '@/components/tabs/Investments'
import FIRE from '@/components/tabs/FIRE'
import History from '@/components/tabs/History'
import WhatIf from '@/components/tabs/WhatIf'

const TABS = [
  { id: 'overview', label: 'Overview', dot: '#4f8ef7' },
  { id: 'ai', label: 'AI Advisor', dot: '#9d7af5' },
  { id: 'income', label: 'Income', dot: '#3fcf7f' },
  { id: 'expenses', label: 'Expenses', dot: '#f0a429' },
  { id: 'debt', label: 'Debt', dot: '#f05252' },
  { id: 'savings', label: 'Savings Goals', dot: '#2dd4bf' },
  { id: 'retirement', label: 'Retirement', dot: '#f0a429' },
  { id: 'investments', label: 'Investments', dot: '#3fcf7f' },
  { id: 'whatif', label: 'What-If', dot: '#4f8ef7' },
  { id: 'fire', label: 'FIRE', dot: '#f05252' },
  { id: 'history', label: 'History', dot: '#8b8f99' },
]

export default function App() {
  const [data, setData] = useState<FinancialData>(DEFAULT_DATA)
  const [tab, setTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(d => { setData(d); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const save = useCallback(async (d: FinancialData) => {
    setSaving(true)
    try {
      await fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      showToast('Saved')
    } catch { showToast('Save failed') }
    setSaving(false)
  }, [])

  const update = useCallback((d: FinancialData) => {
    setData(d)
    save(d)
  }, [save])

  const inc = calcTotalIncome(data)
  const nw = calcNetWorth(data)
  const debt = calcTotalDebt(data)
  const sr = calcSavingsRate(data)
  const leftover = calcMonthlyLeftover(data)

  if (!loaded) return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="loading-bar"><div className="loading-fill" /></div>
      <div className="xs mt8" style={{ textAlign: 'center' }}>Loading your financial data...</div>
    </div>
  )

  return (
    <div className="app-shell">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="logo">
          <span className="live-dot" />
          BBs &amp; Beebs / Financial OS
        </div>
        <div className="topbar-metrics">
          <div className="topbar-metric">
            <div className="tm-label">Net Worth</div>
            <div className={`tm-value ${nw >= 0 ? 'green' : 'red'}`}>{fmtCurrency(nw)}</div>
          </div>
          <div className="topbar-metric">
            <div className="tm-label">Monthly Income</div>
            <div className="tm-value">{fmtCurrency(inc)}</div>
          </div>
          <div className="topbar-metric">
            <div className="tm-label">Leftover</div>
            <div className={`tm-value ${leftover >= 0 ? 'green' : 'red'}`}>{fmtCurrency(leftover)}</div>
          </div>
          <div className="topbar-metric">
            <div className="tm-label">Savings Rate</div>
            <div className={`tm-value ${sr > 20 ? 'green' : sr > 10 ? 'amber' : 'red'}`}>{fmt(sr, 1)}%</div>
          </div>
          <div className="topbar-metric">
            <div className="tm-label">Total Debt</div>
            <div className="tm-value amber">{fmtCurrency(debt)}</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" onClick={() => save(data)} disabled={saving}>
            {saving ? 'Saving...' : '↑ Save'}
          </button>
        </div>
      </div>

      <div className="layout">
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="panel-section">
            <div className="panel-label">Navigation</div>
            {TABS.map(t => (
              <div key={t.id} className={`nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                <div className="nav-dot" style={{ background: t.dot }} />
                {t.label}
              </div>
            ))}
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <div className="panel-label">Wealth Stack</div>
            <div className="stat-row"><span className="stat-lbl">Savings Goals</span><span className="stat-val">{fmtCurrency(calcTotalSavings(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Retirement</span><span className="stat-val">{fmtCurrency(calcTotalRetirement(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Investments</span><span className="stat-val">{fmtCurrency(calcPortfolioValue(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Total Debt</span><span className="stat-val red">{fmtCurrency(calcTotalDebt(data))}</span></div>
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <div className="panel-label">Health Score</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--mono)', fontWeight: 500, color: calcHealthScore(data) > 70 ? 'var(--green)' : calcHealthScore(data) > 45 ? 'var(--amber)' : 'var(--red)' }}>
              {fmt(calcHealthScore(data))}
            </div>
            <div className="xs mt8">
              {calcHealthScore(data) > 80 ? 'Excellent' : calcHealthScore(data) > 60 ? 'Good' : calcHealthScore(data) > 40 ? 'Fair' : 'Needs work'}
            </div>
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <div className="panel-label">Cash Flow</div>
            <div className="stat-row"><span className="stat-lbl">Income</span><span className="stat-val">{fmtCurrency(calcTotalIncome(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Expenses</span><span className="stat-val">{fmtCurrency(calcTotalExpenses(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Debt Pmts</span><span className="stat-val">{fmtCurrency(calcMonthlyDebtPayments(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Leftover</span><span className={`stat-val ${leftover >= 0 ? 'green' : 'red'}`}>{fmtCurrency(leftover)}</span></div>
          </div>
        </div>

        {/* CENTER */}
        <div className="center-panel">
          <div className="center-content">
            {tab === 'overview'     && <Overview data={data} />}
            {tab === 'ai'           && <AIAdvisor data={data} />}
            {tab === 'income'       && <Income data={data} update={update} />}
            {tab === 'expenses'     && <Expenses data={data} update={update} />}
            {tab === 'debt'         && <Debt data={data} update={update} />}
            {tab === 'savings'      && <Savings data={data} update={update} />}
            {tab === 'retirement'   && <Retirement data={data} update={update} />}
            {tab === 'investments'  && <Investments data={data} update={update} />}
            {tab === 'whatif'       && <WhatIf data={data} />}
            {tab === 'fire'         && <FIRE data={data} />}
            {tab === 'history'      && <History />}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
