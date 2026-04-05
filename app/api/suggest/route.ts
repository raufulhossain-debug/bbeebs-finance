import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { FinancialData } from '@/lib/types'
import {
  calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments,
  calcMonthlyLeftover, calcSavingsRate, calcNetWorth, calcTotalDebt
} from '@/lib/calculations'

export async function POST(req: Request) {
  try {
    const { data } = await req.json() as { data: FinancialData }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const inc = calcTotalIncome(data), exp = calcTotalExpenses(data)
    const dp = calcMonthlyDebtPayments(data), left = calcMonthlyLeftover(data)
    const sr = calcSavingsRate(data), nw = calcNetWorth(data)
    const names = data.profile.names
    const debtLines = data.credit_cards.map(c => `${c.name}: $${c.balance} balance @ ${c.rate}% APR, current payment $${c.payment}/mo`).join('\n')
    const goalLines = data.savings_goals.map(g => `${g.name}: $${g.bbs+g.beebs} saved / $${g.target} target, contributing $${g.monthly_bbs+g.monthly_beebs}/mo`).join('\n')

    const prompt = `You are a financial advisor for ${names.bbs} and ${names.beebs}. Generate specific actionable suggestions that can be applied with one click.

DATA:
- Income: $${inc.toFixed(2)} | Expenses: $${exp.toFixed(2)} | Debt payments: $${dp.toFixed(2)}
- Leftover: $${left.toFixed(2)} | Savings rate: ${sr.toFixed(1)}% | Net worth: $${nw.toFixed(0)}

DEBTS:\n${debtLines}
SAVINGS:\n${goalLines}
RETIREMENT:
- ${names.bbs}: ${data.retirement.bbs.account_type} $${data.retirement.bbs.balance}, $${data.retirement.bbs.monthly_contribution}/mo
- ${names.beebs}: ${data.retirement.beebs.account_type} $${data.retirement.beebs.balance}, $${data.retirement.beebs.monthly_contribution}/mo

Return ONLY a JSON array of 4-6 suggestions:
[{
  "id": "unique_string",
  "title": "Short title max 8 words",
  "description": "Why this helps and exact impact",
  "impact": "e.g. Saves $3,200 in interest",
  "priority": "high|medium|low",
  "action": {
    "type": "update_debt_payment|update_savings_goal|update_retirement|update_expense",
    "target": "exact name of debt/goal/account",
    "field": "payment|monthly_bbs|monthly_beebs|monthly_contribution|amount",
    "current_value": 0,
    "suggested_value": 0,
    "owner": "bbs|beebs|joint"
  }
}]

Rules: Only suggest changes realistic given $${left.toFixed(0)}/mo leftover. Use avalanche for debt. Prioritize emergency fund if under 3 months expenses. No markdown.`

    const response = await client.messages.create({
      model: 'claude-opus-4-5', max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content.find(b => b.type === 'text')?.text || '[]'
    const match = text.match(/\[[\s\S]*\]/)
    const suggestions = match ? JSON.parse(match[0]) : []
    return NextResponse.json({ suggestions })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
