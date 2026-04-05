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
import Suggestions from '@/components/tabs/Suggestions'

const TABS = [
  { id: 'overview',    label: 'Overview',         dot: '#4f8ef7' },
  { id: 'suggest',     label: '✦ AI Suggestions', dot: '#9d7af5' },
  { id: 'ai',          label: 'AI Advisor',        dot: '#6b5af5' },
  { id: 'income',      label: 'Income',            dot: '#3fcf7f' },
  { id: 'expenses',    label: 'Expenses',          dot: '#f0a429' },
  { id: 'debt',        label: 'Debt',              dot: '#f05252' },
  { id: 'savings',     label: 'Savings Goals',     dot: '#2dd4bf' },
  { id: 'retirement',  label: 'Retirement',        dot: '#f0a429' },
  { id: 'investments', label: 'Investments',       dot: '#3fcf7f' },
  { id: 'whatif',      label: 'What-If',           dot: '#4f8ef7' },
  { id: 'fire',        label: 'FIRE',              dot: '#f05252' },
  { id: 'history',     label: 'History',           dot: '#8b8f99' },
]

export default function App() {
  const [data, setData] = useState<FinancialData>(DEFAULT_DATA)
  const [tab, setTab] = useState('overview')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
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
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d)
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveStatus('error')
        showToast(`Save failed: ${json.error || res.status}`)
      } else {
        setSaveStatus('saved')
        showToast(json.warning ? `Saved (${json.warning})` : 'Saved ✓')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }
    } catch (e) {
      setSaveStatus('error')
      showToast(`Save failed: ${e}`)
    }
    setSaving(false)
  }, [])

  const update = useCallback((d: FinancialData) => {
    setData(d)
    save(d)
  }, [save])

  const inc      = calcTotalIncome(data)
  const nw       = calcNetWorth(data)
  const debt     = calcTotalDebt(data)
  const sr       = calcSavingsRate(data)
  const leftover = calcMonthlyLeftover(data)
  const score    = calcHealthScore(data)

  if (!loaded) return (
    <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="loading-bar"><div className="loading-fill" /></div>
      <div className="xs mt8" style={{ textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>
    </div>
  )

  const saveBtnStyle = {
    idle:   { borderColor: 'var(--border2)',              color: 'var(--text2)' },
    saving: { borderColor: 'var(--border2)',              color: 'var(--text3)' },
    saved:  { borderColor: 'rgba(63,207,127,0.5)',        color: 'var(--green)' },
    error:  { borderColor: 'rgba(240,82,82,0.5)',         color: 'var(--red)'   },
  }[saveStatus]

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
            <div className="tm-label">Income</div>
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
          <button
            className="btn btn-ghost"
            onClick={() => save(data)}
            disabled={saving}
            style={saveBtnStyle}
          >
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✕ Failed' : '↑ Save'}
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
            <div className="stat-row"><span className="stat-lbl">Savings</span><span className="stat-val">{fmtCurrency(calcTotalSavings(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Retirement</span><span className="stat-val">{fmtCurrency(calcTotalRetirement(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Investments</span><span className="stat-val">{fmtCurrency(calcPortfolioValue(data))}</span></div>
            <div className="stat-row"><span className="stat-lbl">Total Debt</span><span className="stat-val red">{fmtCurrency(calcTotalDebt(data))}</span></div>
          </div>

          <hr className="divider" />

          <div className="panel-section">
            <div className="panel-label">Health Score</div>
            <div style={{ fontSize: 32, fontFamily: 'var(--mono)', fontWeight: 500, color: score > 70 ? 'var(--green)' : score > 45 ? 'var(--amber)' : 'var(--red)' }}>
              {fmt(score)}
            </div>
            <div className="xs mt8" style={{ color: 'var(--text3)' }}>
              {score > 80 ? 'Excellent 🚀' : score > 60 ? 'Good 👍' : score > 40 ? 'Fair ⚠️' : 'Needs work 🚨'}
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
            {tab === 'overview'    && <Overview data={data} />}
            {tab === 'suggest'     && <Suggestions data={data} update={update} />}
            {tab === 'ai'          && <AIAdvisor data={data} />}
            {tab === 'income'      && <Income data={data} update={update} />}
            {tab === 'expenses'    && <Expenses data={data} update={update} />}
            {tab === 'debt'        && <Debt data={data} update={update} />}
            {tab === 'savings'     && <Savings data={data} update={update} />}
            {tab === 'retirement'  && <Retirement data={data} update={update} />}
            {tab === 'investments' && <Investments data={data} update={update} />}
            {tab === 'whatif'      && <WhatIf data={data} />}
            {tab === 'fire'        && <FIRE data={data} />}
            {tab === 'history'     && <History />}
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
