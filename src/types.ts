export type TransactionType = 'expense' | 'income'
export type CategoryType = 'expense' | 'income'

export type Category = {
  id: string
  name: string
  type: CategoryType
  color: string
  icon: string
}

export type Account = {
  id: string
  name: string
  currency: string
  balance: string
}

export type Transaction = {
  id: string
  merchant: string
  note?: string
  categoryId: string
  accountId: string
  amount: string
  type: TransactionType
  date: string
}

export type Budget = {
  id: string
  categoryId: string
  limit: string
  spent: string
}

export type SavingsGoal = {
  id: string
  name: string
  target: string
  current: string
  due: string
  color: string
}

export type MonthPoint = {
  label: string
  income: number
  expenses: number
}
