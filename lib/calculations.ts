import { FinancialData } from './types'

export const calcTotalIncome = (d: FinancialData) =>
  d.income.bbs + d.income.beebs

export const calcTotalExpenses = (d: FinancialData) =>
  Object.values(d.monthly_expenses).flat().reduce((sum, e) => sum + e.amount, 0)

export const calcTotalDebt = (d: FinancialData) =>
  d.credit_cards.reduce((sum, c) => sum + c.balance, 0)

export const calcMonthlyDebtPayments = (d: FinancialData) =>
  d.credit_cards.reduce((sum, c) => sum + c.payment, 0)

export const calcTotalRetirement = (d: FinancialData) =>
  d.retirement.bbs.balance + d.retirement.beebs.balance

export const calcTotalSavings = (d: FinancialData) =>
  d.savings_goals.reduce((sum, g) => sum + g.bbs + g.beebs, 0)

export const calcPortfolioValue = (d: FinancialData) =>
  d.portfolio.reduce((sum, h) => sum + h.value, 0)

export const calcNetWorth = (d: FinancialData) =>
  calcTotalSavings(d) + calcTotalRetirement(d) + calcPortfolioValue(d) - calcTotalDebt(d)

export const calcMonthlyLeftover = (d: FinancialData) =>
  calcTotalIncome(d) - calcTotalExpenses(d) - calcMonthlyDebtPayments(d)

export const calcSavingsRate = (d: FinancialData) => {
  const inc = calcTotalIncome(d)
  if (inc <= 0) return 0
  return (calcMonthlyLeftover(d) / inc) * 100
}

export const calcHealthScore = (d: FinancialData) => {
  const sr = calcSavingsRate(d)
  const leftover = calcMonthlyLeftover(d)
  const ret = calcTotalRetirement(d)
  const inc = calcTotalIncome(d)
  const debt = calcTotalDebt(d)
  const nw = calcNetWorth(d)
  let score = 0
  score += Math.min(30, sr * 1.5)
  score += leftover > 0 ? 20 : 0
  score += Math.min(20, (ret / Math.max(inc * 12, 1)) * 20)
  score += debt < inc * 6 ? 15 : debt < inc * 12 ? 7 : 0
  score += nw > 0 ? 15 : 0
  return Math.min(100, Math.max(0, score))
}

export const fireNumber = (annualExp: number, rate = 0.04) => annualExp / rate

export const yearsToFire = (
  current: number,
  annualSavings: number,
  target: number,
  ret = 0.07
) => {
  if (annualSavings <= 0) return null
  let bal = current
  for (let yr = 1; yr <= 100; yr++) {
    bal = bal * (1 + ret) + annualSavings
    if (bal >= target) return yr
  }
  return null
}

export const monthsToPayoff = (balance: number, rate: number, payment: number) => {
  if (payment <= 0) return null
  if (rate === 0) return Math.ceil(balance / payment)
  const mr = rate / 100 / 12
  if (payment <= balance * mr) return null
  return Math.ceil(-Math.log(1 - (balance * mr) / payment) / Math.log(1 + mr))
}

export const fmt = (v: number, decimals = 0) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(v)

export const fmtCurrency = (v: number, decimals = 0) => `$${fmt(v, decimals)}`
