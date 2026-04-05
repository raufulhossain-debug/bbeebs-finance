import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { FinancialData } from '@/lib/types'
import { calcTotalIncome, calcTotalExpenses, calcMonthlyDebtPayments, calcMonthlyLeftover, calcSavingsRate, calcNetWorth, calcTotalDebt } from '@/lib/calculations'

export async function POST(req: Request) {
  try {
    const { data } = await req.json() as { data: FinancialData }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const inc = calcTotalIncome(data), exp = calcTotalExpenses(data)
    const dp = calcMonthlyDebtPayments(data), left = calcMonthlyLeftover(data)
    const sr = calcSavingsRate(data), nw = calcNetWorth(data)
    const names = data.profile.names

    // Build exact name references
    const debtLines = data.credit_cards.map(c =>
      `  - name="${c.name}" balance=$${c.balance} rate=${c.rate}% payment=$${c.payment}/mo owner=${c.owner}`
    ).join('\n')

    const goalLines = data.savings_goals.map(g =>
      `  - name="${g.name}" saved=$${g.bbs+g.beebs} target=$${g.target} monthly_bbs=$${g.monthly_bbs} monthly_beebs=$${g.monthly_beebs}`
    ).join('\n')

    const expLines = ['bbs','beebs','joint'].flatMap(o =>
      (data.monthly_expenses as any)[o].map((e: any) => `  - owner=${o} name="${e.name}" amount=$${e.amount}`)
    ).join('\n')

    const prompt = `You are a financial advisor for ${names.bbs} and ${names.beebs}. Generate specific actionable suggestions that can be applied with one click.

FINANCIAL SNAPSHOT:
- Income: $${inc.toFixed(2)}/mo | Expenses: $${exp.toFixed(2)}/mo | Debt payments: $${dp.toFixed(2)}/mo
- Leftover: $${left.toFixed(2)}/mo | Savings rate: ${sr.toFixed(1)}% | Net worth: $${nw.toFixed(0)}

DEBTS (use exact name= values in your action.target):
${debtLines || '  - none'}

SAVINGS GOALS (use exact name= values in your action.target):
${goalLines || '  - none'}

EXPENSES (use exact name= and owner= values):
${expLines || '  - none'}

RETIREMENT ACCOUNTS:
  - ${names.bbs}: account_type="${data.retirement.bbs.account_type}" balance=$${data.retirement.bbs.balance} monthly_contribution=$${data.retirement.bbs.monthly_contribution} → use owner="bbs"
  - ${names.beebs}: account_type="${data.retirement.beebs.account_type}" balance=$${data.retirement.beebs.balance} monthly_contribution=$${data.retirement.beebs.monthly_contribution} → use owner="beebs"

CRITICAL: In your action.target field, you MUST use the EXACT name= value shown above. Do not paraphrase or abbreviate names.
For retirement actions, action.target must be the account_type value exactly (e.g. "${data.retirement.bbs.account_type}" or "${data.retirement.beebs.account_type}").

Return ONLY a JSON array of 4-6 suggestions, no markdown:
[{
  "id": "unique_string",
  "title": "Short title max 8 words",
  "description": "Why this helps and exact impact on their finances",
  "impact": "e.g. Saves $3,200 in interest",
  "priority": "high|medium|low",
  "action": {
    "type": "update_debt_payment|update_savings_goal|update_retirement|update_expense",
    "target": "EXACT name from the data above",
    "field": "payment|monthly_bbs|monthly_beebs|monthly_contribution|amount",
    "current_value": 0,
    "suggested_value": 0,
    "owner": "bbs|beebs|joint (required for update_retirement and update_expense)"
  }
}]

Only suggest changes achievable with $${left.toFixed(0)}/mo leftover. No markdown, output JSON only.`

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
