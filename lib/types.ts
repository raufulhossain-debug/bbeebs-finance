export interface Expense {
  name: string
  amount: number
  type: 'Non-Negotiable' | 'Negotiable'
}

export interface Debt {
  name: string
  balance: number
  original: number
  rate: number
  payment: number
  owner: 'BBs' | 'Beebs' | 'Joint'
}

export interface SavingsGoal {
  name: string
  target: number
  bbs: number
  beebs: number
  monthly_bbs: number
  monthly_beebs: number
}

export interface RetirementAccount {
  account_type: string
  balance: number
  monthly_contribution: number
  employer_match: number
}

export interface RetirementData {
  bbs: RetirementAccount
  beebs: RetirementAccount
  target_retirement_age: number
  current_age_bbs: number
  current_age_beebs: number
  desired_retirement_income: number
}

export interface Investment {
  name: string
  type: string
  shares: number
  price: number
  value: number
}

export interface Transaction {
  date: string
  description: string
  amount: number
  category: string
  owner: string
}

export interface MajorExpense {
  name: string
  amount: number
  date: string
}

export interface Profile {
  names: { bbs: string; beebs: string }
  city: string
  risk_tolerance: string
  fi_goal: string
}

export interface FinancialData {
  income: { bbs: number; beebs: number }
  monthly_expenses: { bbs: Expense[]; beebs: Expense[]; joint: Expense[] }
  credit_cards: Debt[]
  savings_goals: SavingsGoal[]
  retirement: RetirementData
  portfolio: Investment[]
  transactions: Transaction[]
  major_expenses: MajorExpense[]
  profile: Profile
}

export const DEFAULT_DATA: FinancialData = {
  income: { bbs: 0, beebs: 4511.08 },
  monthly_expenses: {
    bbs: [
      { name: 'Spotify', amount: 10.99, type: 'Non-Negotiable' },
      { name: 'iCloud', amount: 2.99, type: 'Non-Negotiable' },
    ],
    beebs: [
      { name: 'Blink Gym', amount: 26.13, type: 'Non-Negotiable' },
      { name: 'LKS Panda', amount: 150.0, type: 'Non-Negotiable' },
      { name: 'TradingView', amount: 16.28, type: 'Non-Negotiable' },
    ],
    joint: [
      { name: 'Rent', amount: 2500, type: 'Non-Negotiable' },
      { name: 'Groceries', amount: 600, type: 'Non-Negotiable' },
      { name: 'Utilities', amount: 150, type: 'Non-Negotiable' },
    ],
  },
  credit_cards: [
    { name: 'Citi 0%', balance: 5100, original: 5871, rate: 0, payment: 1275, owner: 'Beebs' },
    { name: 'Columbia Loans', balance: 15216, original: 15216, rate: 8, payment: 395, owner: 'Beebs' },
  ],
  savings_goals: [
    { name: 'Emergency Fund', target: 20000, bbs: 8000, beebs: 7000, monthly_bbs: 250, monthly_beebs: 250 },
    { name: 'House Down Payment', target: 50000, bbs: 11000, beebs: 11000, monthly_bbs: 400, monthly_beebs: 400 },
    { name: 'Vacation Fund', target: 10000, bbs: 1600, beebs: 1600, monthly_bbs: 100, monthly_beebs: 100 },
  ],
  retirement: {
    bbs: { account_type: 'Roth IRA', balance: 60000, monthly_contribution: 500, employer_match: 0 },
    beebs: { account_type: '401(k)', balance: 60000, monthly_contribution: 500, employer_match: 3.0 },
    target_retirement_age: 65,
    current_age_bbs: 28,
    current_age_beebs: 30,
    desired_retirement_income: 80000,
  },
  portfolio: [],
  transactions: [],
  major_expenses: [
    { name: 'Family Trip - Airfare', amount: 4000, date: '2025-12-25' },
    { name: 'Snowboarding Trip', amount: 1100, date: '2026-02-01' },
  ],
  profile: {
    names: { bbs: 'BBs', beebs: 'Beebs' },
    city: 'New York, NY',
    risk_tolerance: 'Moderate',
    fi_goal: 'FIRE by 55',
  },
}
