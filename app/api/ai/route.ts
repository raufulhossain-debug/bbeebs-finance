import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { FinancialData } from '@/lib/types'
import {
  calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments,
  calcMonthlyLeftover, calcSavingsRate, calcNetWorth,
  calcTotalDebt, calcTotalRetirement, calcPortfolioValue, fmtCurrency, fmt
} from '@/lib/calculations'

function buildContext(d: FinancialData): string {
  const names = d.profile.names
  const inc = calcTotalIncome(d)
  const exp = calcTotalExpenses(d)
  const dp = calcMonthlyDebtPayments(d)
  const left = calcMonthlyLeftover(d)
  const sr = calcSavingsRate(d)
  const nw = calcNetWorth(d)
  const debt = calcTotalDebt(d)
  const ret = calcTotalRetirement(d)

  const debtLines = d.credit_cards
    .map(c => `  - ${c.name}: ${fmtCurrency(c.balance)} balance @ ${c.rate}% APR, ${fmtCurrency(c.payment)}/mo`)
    .join('\n')

  const goalLines = d.savings_goals
    .map(g => `  - ${g.name}: ${fmtCurrency(g.bbs + g.beebs)} / ${fmtCurrency(g.target)} (${fmt((g.bbs + g.beebs) / Math.max(g.target, 1) * 100)}%)`)
    .join('\n')

  return `You are an expert personal financial advisor for ${names.bbs} and ${names.beebs}, a married couple in ${d.profile.city}.

FINANCIAL SNAPSHOT:
- Monthly Income: ${fmtCurrency(inc, 2)} | Expenses: ${fmtCurrency(exp, 2)} | Debt Payments: ${fmtCurrency(dp, 2)}
- Monthly Leftover: ${fmtCurrency(left, 2)} | Savings Rate: ${fmt(sr, 1)}%
- Net Worth: ${fmtCurrency(nw)} | Total Debt: ${fmtCurrency(debt)}
- Retirement: ${fmtCurrency(ret)} | Investments: ${fmtCurrency(calcPortfolioValue(d))}
- Risk Tolerance: ${d.profile.risk_tolerance} | Goal: ${d.profile.fi_goal}

DEBTS:
${debtLines}

SAVINGS GOALS:
${goalLines}

RETIREMENT:
- ${names.bbs}: ${d.retirement.bbs.account_type} — ${fmtCurrency(d.retirement.bbs.balance)} balance, ${fmtCurrency(d.retirement.bbs.monthly_contribution)}/mo
- ${names.beebs}: ${d.retirement.beebs.account_type} — ${fmtCurrency(d.retirement.beebs.balance)} balance, ${fmtCurrency(d.retirement.beebs.monthly_contribution)}/mo
- Target retirement age: ${d.retirement.target_retirement_age}
- Desired annual income: ${fmtCurrency(d.retirement.desired_retirement_income)}

Be specific — use their actual numbers. Give prioritized, actionable advice. Reference them by name. Use emoji section headers. Be honest but encouraging.`
}

export async function POST(req: Request) {
  try {
    const { messages, data } = await req.json()
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1500,
      system: buildContext(data as FinancialData),
      messages,
    })

    const text = response.content.find(b => b.type === 'text')
    return NextResponse.json({ reply: text?.text || 'No response' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
