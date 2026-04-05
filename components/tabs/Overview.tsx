'use client'
import { FinancialData } from '@/lib/types'
import {
  calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments,
  calcMonthlyLeftover, calcSavingsRate, calcNetWorth,
  calcTotalDebt, calcTotalRetirement, calcTotalSavings,
  calcPortfolioValue, calcHealthScore, fireNumber, fmtCurrency, fmt
} from '@/lib/calculations'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['#4f8ef7', '#3fcf7f', '#f0a429', '#f05252', '#2dd4bf', '#9d7af5']

export default function Overview({ data }: { data: FinancialData }) {
  const inc = calcTotalIncome(data)
  const exp = calcTotalExpenses(data)
  const dp  = calcMonthlyDebtPayments(data)
  const nw  = calcNetWorth(data)
  const sr  = calcSavingsRate(data)
  const debt = calcTotalDebt(data)
  const ret  = calcTotalRetirement(data)
  const sav  = calcTotalSavings(data)
  const inv  = calcPortfolioValue(data)
  const left = calcMonthlyLeftover(data)
  const score = calcHealthScore(data)
  const ef = data.savings_goals.find(g => g.name.toLowerCase().includes('emergency'))
  const efMonths = ef ? (ef.bbs + ef.beebs) / Math.max(exp, 1) : 0
  const fireN = fireNumber(exp * 12)
  const firePct = Math.min(100, (sav + ret + inv) / Math.max(fireN, 1) * 100)
  const dti = (debt / Math.max(inc * 12, 1)) * 100

  const cashFlow = [
    { name: 'Income', v: inc, fill: '#3fcf7f' },
    { name: 'Expenses', v: exp, fill: '#f05252' },
    { name: 'Debt Pmts', v: dp, fill: '#f0a429' },
    { name: 'Leftover', v: Math.max(left, 0), fill: '#4f8ef7' },
  ]

  const wealthBreakdown = [
    { name: 'Savings', value: sav },
    { name: 'Retirement', value: ret },
    { name: 'Investments', value: inv },
  ].filter(d => d.value > 0)

  return (
    <div>
      <div className="sh">Financial Overview</div>

      {/* KPI row */}
      <div className="grid g6 mb12">
        {[
          { label: 'Income', val: fmtCurrency(inc), color: 'var(--text)' },
          { label: 'Expenses', val: fmtCurrency(exp), color: 'var(--red)' },
          { label: 'Debt Pmts', val: fmtCurrency(dp), color: 'var(--amber)' },
          { label: 'Leftover', val: fmtCurrency(left), color: left >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Net Worth', val: fmtCurrency(nw), color: nw >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Savings Rate', val: `${fmt(sr, 1)}%`, color: sr > 20 ? 'var(--green)' : sr > 10 ? 'var(--amber)' : 'var(--red)' },
        ].map(k => (
          <div key={k.label} className="card">
            <div className="card-title">{k.label}</div>
            <div className="card-value" style={{ color: k.color, fontSize: 18 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid g2 mb12">
        <div className="card">
          <div className="card-title">Monthly Cash Flow</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text3)', fontFamily: 'var(--mono)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} />
              <Bar dataKey="v" radius={[3,3,0,0]}>
                {cashFlow.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">Wealth Breakdown</div>
          {wealthBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={wealthBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {wealthBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 4, fontSize: 11, fontFamily: 'var(--mono)' }} formatter={(v: any) => fmtCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="xs mt12" style={{ textAlign: 'center' }}>No wealth data yet</div>}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="sh">Quick Insights</div>
      <div className="grid g3">
        <div className="card">
          <div className="card-title">Emergency Fund</div>
          <div className="card-value" style={{ fontSize: 20, color: efMonths >= 6 ? 'var(--green)' : efMonths >= 3 ? 'var(--amber)' : 'var(--red)' }}>
            {fmt(efMonths, 1)} mo
          </div>
          <div className="card-sub">Target: 6 months ({fmtCurrency(exp * 6)})</div>
          <div className="prog-track mt8"><div className="prog-fill" style={{ width: `${Math.min(efMonths / 6 * 100, 100)}%`, background: efMonths >= 6 ? 'var(--green)' : efMonths >= 3 ? 'var(--amber)' : 'var(--red)' }} /></div>
        </div>
        <div className="card">
          <div className="card-title">Debt-to-Income</div>
          <div className="card-value" style={{ fontSize: 20, color: dti < 36 ? 'var(--green)' : dti < 50 ? 'var(--amber)' : 'var(--red)' }}>
            {fmt(dti, 1)}%
          </div>
          <div className="card-sub">Annual basis · target &lt;36%</div>
          <div className="prog-track mt8"><div className="prog-fill" style={{ width: `${Math.min(dti, 100)}%`, background: dti < 36 ? 'var(--green)' : dti < 50 ? 'var(--amber)' : 'var(--red)' }} /></div>
        </div>
        <div className="card">
          <div className="card-title">FIRE Progress</div>
          <div className="card-value" style={{ fontSize: 20, color: firePct > 50 ? 'var(--green)' : firePct > 25 ? 'var(--amber)' : 'var(--red)' }}>
            {fmt(firePct, 1)}%
          </div>
          <div className="card-sub">FIRE # = {fmtCurrency(fireN)} (4% rule)</div>
          <div className="prog-track mt8"><div className="prog-fill green" style={{ width: `${Math.min(firePct, 100)}%` }} /></div>
        </div>
      </div>
    </div>
  )
}

// re-export so Overview page can show inline suggestions preview
export { default as OverviewSuggestionsHint } from '../tabs/Suggestions'
