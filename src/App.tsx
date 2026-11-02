import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  CreditCard,
  Download,
  Edit3,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  accounts,
  budgets as seedBudgets,
  categories,
  monthlyPoints,
  savingsGoals as seedGoals,
  transactions as seedTransactions,
} from './data'
import type { Budget, SavingsGoal, Transaction, TransactionType } from './types'
import { getInitials, type User } from './auth'

type Page = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'settings'
type Toast = { message: string; tone?: 'success' | 'neutral' }

type FormState = {
  merchant: string
  amount: string
  type: TransactionType
  categoryId: string
  date: string
  note: string
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets', icon: WalletCards },
  { id: 'goals', label: 'Savings goals', icon: Target },
]

const money = (value: number | string, compact = false) => {
  const amount = typeof value === 'string' ? Number(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: compact && Math.abs(amount) > 999 ? 0 : 2,
    notation: compact && Math.abs(amount) > 999 ? 'compact' : 'standard',
  }).format(amount)
}

const shortMoney = (value: number) => money(value, true)

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  )

const formatFullDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  )

const initialForm: FormState = {
  merchant: '',
  amount: '',
  type: 'expense',
  categoryId: 'food',
  date: '2026-10-21',
  note: '',
}

function App({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const initials = getInitials(user.name)
  const [page, setPage] = useState<Page>('dashboard')
  const [isMobileNavOpen, setMobileNavOpen] = useState(false)
  const [transactionList, setTransactionList] = useState<Transaction[]>(seedTransactions)
  const [budgetList, setBudgetList] = useState<Budget[]>(seedBudgets)
  const [goalList, setGoalList] = useState<SavingsGoal[]>(seedGoals)
  const [period, setPeriod] = useState('2026-10')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [formError, setFormError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  const currentTransactions = useMemo(
    () => transactionList.filter((item) => item.date.startsWith(period)),
    [period, transactionList],
  )
  const totalIncome = currentTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const totalExpenses = currentTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)
  const availableBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const savingsRate = totalIncome
    ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
    : 0

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    return transactionList
      .filter((item) => item.date.startsWith(period))
      .filter((item) => categoryFilter === 'all' || item.categoryId === categoryFilter)
      .filter((item) => typeFilter === 'all' || item.type === typeFilter)
      .filter((item) => {
        if (!normalizedSearch) return true
        const category = categories.find((entry) => entry.id === item.categoryId)
        return [item.merchant, item.note, item.amount, category?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [categoryFilter, period, search, transactionList, typeFilter])

  const spendingByCategory = useMemo(
    () =>
      categories
        .filter((category) => category.type === 'expense')
        .map((category) => ({
          ...category,
          value: currentTransactions
            .filter((item) => item.categoryId === category.id)
            .reduce((sum, item) => sum + Number(item.amount), 0),
        }))
        .filter((category) => category.value > 0),
    [currentTransactions],
  )

  const openCreateModal = () => {
    setEditingTransaction(null)
    setForm(initialForm)
    setFormError('')
    setShowModal(true)
  }

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setForm({
      merchant: transaction.merchant,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: transaction.date,
      note: transaction.note ?? '',
    })
    setFormError('')
    setShowModal(true)
  }

  const showToast = (message: string, tone: Toast['tone'] = 'success') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3200)
  }

  const saveTransaction = () => {
    const amount = Number(form.amount)
    if (!form.merchant.trim())
      return setFormError('Add a merchant or source so this entry is easy to recognize.')
    if (!Number.isFinite(amount) || amount <= 0)
      return setFormError('Enter a positive amount greater than zero.')
    if (!form.categoryId || !form.date)
      return setFormError('Choose a category and date before saving.')

    if (editingTransaction) {
      setTransactionList((items) =>
        items.map((item) =>
          item.id === editingTransaction.id
            ? {
                ...item,
                merchant: form.merchant.trim(),
                amount: amount.toFixed(2),
                type: form.type,
                categoryId: form.categoryId,
                date: form.date,
                note: form.note.trim(),
              }
            : item,
        ),
      )
      showToast('Transaction updated')
    } else {
      setTransactionList((items) => [
        {
          id: `local-${Date.now()}`,
          merchant: form.merchant.trim(),
          amount: amount.toFixed(2),
          type: form.type,
          categoryId: form.categoryId,
          accountId: 'everyday',
          date: form.date,
          note: form.note.trim(),
        },
        ...items,
      ])
      showToast('Transaction added')
    }
    setShowModal(false)
  }

  const removeTransaction = (id: string) => {
    setTransactionList((items) => items.filter((item) => item.id !== id))
    setConfirmDeleteId(null)
    showToast('Transaction removed', 'neutral')
  }

  const exportCsv = () => {
    const header = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Account', 'Note']
    const rows = filteredTransactions.map((item) => [
      item.date,
      item.merchant,
      categories.find((category) => category.id === item.categoryId)?.name ?? '',
      item.type,
      item.amount,
      accounts.find((account) => account.id === item.accountId)?.name ?? '',
      item.note ?? '',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alex-transactions-${period}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast(`${filteredTransactions.length} transactions exported`)
  }

  const goTo = (nextPage: Page) => {
    setPage(nextPage)
    setMobileNavOpen(false)
  }

  const dashboardPeriodLabel = period === '2026-10' ? 'October 2026' : 'September 2026'

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMobileNavOpen ? 'is-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <span className="brand-name">Personal Finance</span>
            <span className="brand-tag">money, made legible.</span>
          </div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Primary navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => goTo(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {id === 'transactions' && <span className="nav-count">{transactionList.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-callout">
            <div className="callout-icon">
              <Sparkles size={15} />
            </div>
            <div>
              <strong>Monthly review</strong>
              <span>4 days until your next reset</span>
            </div>
          </div>
          <button
            className={`nav-item ${page === 'settings' ? 'active' : ''}`}
            onClick={() => goTo('settings')}
          >
            <Settings size={17} strokeWidth={1.8} />
            <span>Settings</span>
          </button>
          <div className="profile-row">
            <div className="avatar">{initials}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="sign-out-button"
              onClick={onSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <Menu size={20} />
          </button>
          <div className="crumbs">
            <span>Personal workspace</span>
            <ChevronRight size={14} />
            <strong>
              {page === 'dashboard'
                ? 'Overview'
                : (navItems.find((item) => item.id === page)?.label ?? 'Settings')}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="status-pill">
              <span className="status-dot" /> All systems normal
            </div>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={17} />
              <span />
            </button>
            <div className="top-avatar" title={user.name}>
              {initials}
            </div>
          </div>
        </header>

        <div className="page-content">
          {page === 'dashboard' && (
            <DashboardView
              firstName={user.name.split(/\s+/)[0]}
              dashboardPeriodLabel={dashboardPeriodLabel}
              period={period}
              setPeriod={setPeriod}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              availableBalance={availableBalance}
              savingsRate={savingsRate}
              spendingByCategory={spendingByCategory}
              currentTransactions={currentTransactions}
              budgetList={budgetList}
              goalList={goalList}
              onAdd={openCreateModal}
              onTransactions={() => goTo('transactions')}
              onBudgets={() => goTo('budgets')}
              onGoals={() => goTo('goals')}
            />
          )}
          {page === 'transactions' && (
            <TransactionsView
              period={period}
              setPeriod={setPeriod}
              search={search}
              setSearch={setSearch}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              filteredTransactions={filteredTransactions}
              onAdd={openCreateModal}
              onEdit={openEditModal}
              onDelete={setConfirmDeleteId}
              confirmDeleteId={confirmDeleteId}
              onConfirmDelete={removeTransaction}
              onExport={exportCsv}
            />
          )}
          {page === 'budgets' && (
            <BudgetsView
              budgetList={budgetList}
              setBudgetList={setBudgetList}
              onAdd={openCreateModal}
              showToast={showToast}
            />
          )}
          {page === 'goals' && (
            <GoalsView goalList={goalList} setGoalList={setGoalList} showToast={showToast} />
          )}
          {page === 'settings' && (
            <SettingsView user={user} onSignOut={onSignOut} showToast={showToast} />
          )}
        </div>
      </main>

      {showModal && (
        <TransactionModal
          form={form}
          setForm={setForm}
          error={formError}
          editing={Boolean(editingTransaction)}
          onClose={() => setShowModal(false)}
          onSave={saveTransaction}
        />
      )}
      {toast && (
        <div className={`toast ${toast.tone === 'neutral' ? 'toast-neutral' : ''}`}>
          <CheckCircle2 size={16} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

type DashboardProps = {
  firstName: string
  dashboardPeriodLabel: string
  period: string
  setPeriod: (value: string) => void
  totalIncome: number
  totalExpenses: number
  availableBalance: number
  savingsRate: number
  spendingByCategory: ((typeof categories)[number] & { value: number })[]
  currentTransactions: Transaction[]
  budgetList: Budget[]
  goalList: SavingsGoal[]
  onAdd: () => void
  onTransactions: () => void
  onBudgets: () => void
  onGoals: () => void
}

function DashboardView({
  firstName,
  dashboardPeriodLabel,
  period,
  setPeriod,
  totalIncome,
  totalExpenses,
  availableBalance,
  savingsRate,
  spendingByCategory,
  currentTransactions,
  budgetList,
  goalList,
  onAdd,
  onTransactions,
  onBudgets,
  onGoals,
}: DashboardProps) {
  const recent = [...currentTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const totalSpend = spendingByCategory.reduce((sum, item) => sum + item.value, 0)
  const largestCategory = spendingByCategory.reduce(
    (largest, item) => (item.value > largest.value ? item : largest),
    spendingByCategory[0],
  )
  const budgetSpent = budgetList.reduce((sum, item) => sum + Number(item.spent), 0)
  const budgetLimit = budgetList.reduce((sum, item) => sum + Number(item.limit), 0)
  const goal = goalList[0]

  return (
    <>
      <section className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">
            TUESDAY, OCTOBER 21, 2026 <span className="eyebrow-line" />
          </div>
          <h1>
            Good morning, {firstName}
            <span className="heading-period">.</span>
          </h1>
          <p>Your spending has a shape. Here’s the clearest view of it.</p>
        </div>
        <div className="heading-actions">
          <PeriodSelect period={period} setPeriod={setPeriod} />
          <button className="primary-button" onClick={onAdd}>
            <Plus size={17} /> Add transaction
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Monthly financial summary">
        <MetricCard
          label="Available balance"
          value={money(availableBalance)}
          meta="Across 2 accounts"
          accent="mint"
          icon={<CircleDollarSign size={17} />}
        />
        <MetricCard
          label="Money in"
          value={money(totalIncome)}
          meta="+4.8% vs last month"
          accent="blue"
          icon={<ArrowDownRight size={17} />}
        />
        <MetricCard
          label="Money out"
          value={money(totalExpenses)}
          meta="−7.2% vs last month"
          accent="amber"
          icon={<ArrowUpRight size={17} />}
        />
        <MetricCard
          label="Savings rate"
          value={`${savingsRate}%`}
          meta="Above your 25% target"
          accent="violet"
          icon={<TrendingUp size={17} />}
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel cashflow-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">CASH FLOW</div>
              <h2>Income vs. spending</h2>
            </div>
            <div className="legend">
              <span>
                <i className="legend-dot income-dot" /> Income
              </span>
              <span>
                <i className="legend-dot expense-dot" /> Spending
              </span>
              <button className="panel-menu">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
          <div className="chart-summary">
            <strong>{money(totalIncome - totalExpenses)}</strong>
            <span>
              net this month <span className="positive-copy">↑ 12.4%</span>
            </span>
          </div>
          <div className="area-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyPoints} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5CE1A4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#5CE1A4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6CA6FF" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#6CA6FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#273530" strokeDasharray="3 5" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#73817c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: '#73817c', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#5CE1A4"
                  strokeWidth={2}
                  fill="url(#incomeFill)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#6CA6FF"
                  strokeWidth={2}
                  fill="url(#expenseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footnote">
            <span>
              <i className="signal-line" /> You kept{' '}
              <strong>{money(totalIncome - totalExpenses, true)}</strong> more than you spent this
              month.
            </span>
            <button onClick={onTransactions}>
              View details <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="panel spending-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">OCTOBER BREAKDOWN</div>
              <h2>Where it went</h2>
            </div>
            <button className="panel-menu">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  <Cell key="empty" fill="#26332f" />
                  {spendingByCategory.map((item) => (
                    <Cell key={item.id} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{shortMoney(totalSpend)}</strong>
              <span>spent</span>
            </div>
          </div>
          <div className="category-list">
            {spendingByCategory.slice(0, 4).map((item) => (
              <div className="category-row" key={item.id}>
                <span className="category-name">
                  <i style={{ background: item.color }} />
                  {item.name}
                </span>
                <span className="category-value">
                  {money(item.value)}{' '}
                  <small>{totalSpend ? Math.round((item.value / totalSpend) * 100) : 0}%</small>
                </span>
              </div>
            ))}
          </div>
          <button className="text-button full-width" onClick={onTransactions}>
            View all spending <ArrowRight size={14} />
          </button>
        </div>

        <div className="panel budget-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">BUDGET HEALTH</div>
              <h2>
                {money(budgetSpent, true)}{' '}
                <span className="muted-heading">of {money(budgetLimit, true)}</span>
              </h2>
            </div>
            <button className="text-button" onClick={onBudgets}>
              Manage <ArrowRight size={14} />
            </button>
          </div>
          <div className="budget-progress">
            <span style={{ width: `${Math.min((budgetSpent / budgetLimit) * 100, 100)}%` }} />
          </div>
          <div className="budget-meta">
            <span>{Math.round((budgetSpent / budgetLimit) * 100)}% allocated</span>
            <strong>{money(budgetLimit - budgetSpent, true)} left</strong>
          </div>
          <div className="budget-alert">
            <div className="alert-icon">
              <CircleAlert size={16} />
            </div>
            <div>
              <strong>Housing is at its limit</strong>
              <span>Consider reviewing it before the next reset.</span>
            </div>
            <ChevronRight size={16} />
          </div>
        </div>

        <div className="panel goal-panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">NEXT MILESTONE</div>
              <h2>{goal?.name ?? 'Savings goal'}</h2>
            </div>
            <button className="panel-menu">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="goal-body">
            <div
              className="goal-ring"
              style={
                {
                  '--progress': `${goal ? Math.round((Number(goal.current) / Number(goal.target)) * 100) : 0}%`,
                  '--goal-color': goal?.color ?? '#5CE1A4',
                } as React.CSSProperties
              }
            >
              <div>
                <strong>
                  {goal ? Math.round((Number(goal.current) / Number(goal.target)) * 100) : 0}%
                </strong>
                <span>saved</span>
              </div>
            </div>
            <div className="goal-copy">
              <strong>{money(goal?.current ?? 0)}</strong>
              <span>of {money(goal?.target ?? 0)} target</span>
              <small>Target date · {goal?.due}</small>
            </div>
          </div>
          <button className="text-button full-width" onClick={onGoals}>
            See all goals <ArrowRight size={14} />
          </button>
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">ACTIVITY</div>
            <h2>Recent transactions</h2>
          </div>
          <button className="text-button" onClick={onTransactions}>
            See all <ArrowRight size={14} />
          </button>
        </div>
        <TransactionTable transactions={recent} compact />
      </section>
    </>
  )
}

function MetricCard({
  label,
  value,
  meta,
  accent,
  icon,
}: {
  label: string
  value: string
  meta: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <div className="metric-top">
        <span>{label}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <span className="metric-meta">{meta}</span>
    </div>
  )
}

function PeriodSelect({
  period,
  setPeriod,
}: {
  period: string
  setPeriod: (value: string) => void
}) {
  return (
    <label className="select-control period-control">
      <CalendarDays size={15} />
      <select value={period} onChange={(event) => setPeriod(event.target.value)}>
        <option value="2026-10">October 2026</option>
        <option value="2026-09">September 2026</option>
      </select>
      <ChevronDown size={14} />
    </label>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry) => (
        <span key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {money(entry.value ?? 0)}
        </span>
      ))}
    </div>
  )
}

type TransactionsProps = {
  period: string
  setPeriod: (value: string) => void
  search: string
  setSearch: (value: string) => void
  categoryFilter: string
  setCategoryFilter: (value: string) => void
  typeFilter: 'all' | TransactionType
  setTypeFilter: (value: 'all' | TransactionType) => void
  showFilters: boolean
  setShowFilters: (value: boolean) => void
  filteredTransactions: Transaction[]
  onAdd: () => void
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  confirmDeleteId: string | null
  onConfirmDelete: (id: string) => void
  onExport: () => void
}

function TransactionsView({
  period,
  setPeriod,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  typeFilter,
  setTypeFilter,
  showFilters,
  setShowFilters,
  filteredTransactions,
  onAdd,
  onEdit,
  onDelete,
  confirmDeleteId,
  onConfirmDelete,
  onExport,
}: TransactionsProps) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            LEDGER / {period === '2026-10' ? 'OCTOBER 2026' : 'SEPTEMBER 2026'}{' '}
            <span className="eyebrow-line" />
          </div>
          <h1>
            Transactions<span className="heading-period">.</span>
          </h1>
          <p>Every signal in one place. Search, review, and keep the ledger honest.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onExport}>
            <Download size={16} /> Export CSV
          </button>
          <button className="primary-button" onClick={onAdd}>
            <Plus size={17} /> Add transaction
          </button>
        </div>
      </section>
      <section className="panel ledger-panel">
        <div className="ledger-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchant, category, amount..."
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="toolbar-actions">
            <PeriodSelect period={period} setPeriod={setPeriod} />
            <button
              className={`filter-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={16} /> Filters{' '}
              {(categoryFilter !== 'all' || typeFilter !== 'all') && (
                <span className="filter-count">!</span>
              )}
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="filter-row">
            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories
                  .filter((category) => category.type === 'expense')
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Type
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as 'all' | TransactionType)}
              >
                <option value="all">All types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
            </label>
            <button
              className="clear-button"
              onClick={() => {
                setCategoryFilter('all')
                setTypeFilter('all')
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="ledger-summary">
          <span>
            <strong>{filteredTransactions.length}</strong> entries
          </span>
          <span className="summary-divider" />
          <span>Showing {period === '2026-10' ? 'October 2026' : 'September 2026'}</span>
        </div>
        <TransactionTable
          transactions={filteredTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
          confirmDeleteId={confirmDeleteId}
          onConfirmDelete={onConfirmDelete}
        />
      </section>
    </>
  )
}

function TransactionTable({
  transactions,
  compact = false,
  onEdit,
  onDelete,
  confirmDeleteId,
  onConfirmDelete,
}: {
  transactions: Transaction[]
  compact?: boolean
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: string) => void
  confirmDeleteId?: string | null
  onConfirmDelete?: (id: string) => void
}) {
  return (
    <div className={`transaction-table-wrap ${compact ? 'compact-table' : ''}`}>
      <table className="transaction-table">
        <thead>
          <tr>
            <th>Transaction</th>
            <th>Category</th>
            <th>Date</th>
            <th className="amount-column">Amount</th>
            {!compact && <th />}
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const category = categories.find((entry) => entry.id === item.categoryId)
            return (
              <tr key={item.id}>
                <td>
                  <div className="transaction-cell">
                    <span
                      className="transaction-icon"
                      style={{ color: category?.color, background: `${category?.color}18` }}
                    >
                      {category?.icon}
                    </span>
                    <span>
                      <strong>{item.merchant}</strong>
                      <small>{item.note || (item.type === 'income' ? 'Income' : 'Personal')}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="category-pill">
                    <i style={{ background: category?.color }} />
                    {category?.name}
                  </span>
                </td>
                <td className="date-cell">{formatDate(item.date)}</td>
                <td className={`amount-cell ${item.type}`}>
                  {item.type === 'income' ? '+' : '−'}
                  {money(item.amount)}
                </td>
                {!compact && (
                  <td className="row-actions">
                    {confirmDeleteId === item.id ? (
                      <div className="delete-confirm">
                        <button onClick={() => onConfirmDelete?.(item.id)}>Delete</button>
                        <button onClick={() => onDelete?.('')}>Keep</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => onEdit?.(item)} aria-label={`Edit ${item.merchant}`}>
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => onDelete?.(item.id)}
                          aria-label={`Delete ${item.merchant}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={18} />
          </div>
          <strong>No transactions found</strong>
          <span>Try another search or clear your filters.</span>
        </div>
      )}
    </div>
  )
}

function BudgetsView({
  budgetList,
  setBudgetList,
  onAdd,
  showToast,
}: {
  budgetList: Budget[]
  setBudgetList: (value: Budget[]) => void
  onAdd: () => void
  showToast: (message: string) => void
}) {
  const totalLimit = budgetList.reduce((sum, item) => sum + Number(item.limit), 0)
  const totalSpent = budgetList.reduce((sum, item) => sum + Number(item.spent), 0)
  const updateBudget = (id: string, value: string) =>
    setBudgetList(
      budgetList.map((budget) => (budget.id === id ? { ...budget, limit: value } : budget)),
    )
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            PLANNING / OCTOBER 2026 <span className="eyebrow-line" />
          </div>
          <h1>
            Budgets<span className="heading-period">.</span>
          </h1>
          <p>A little structure makes room for more of what matters.</p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            onClick={() => showToast('Budget creation is ready for your next category')}
          >
            <Plus size={17} /> New budget
          </button>
        </div>
      </section>
      <section className="budget-overview-grid">
        <div className="panel budget-total-card">
          <div className="panel-kicker">TOTAL ALLOCATED</div>
          <strong>{money(totalLimit)}</strong>
          <span>Across {budgetList.length} categories</span>
          <div className="large-budget-bar">
            <i style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }} />
          </div>
          <div className="budget-meta">
            <span>{money(totalSpent)} spent</span>
            <strong>{money(totalLimit - totalSpent)} remaining</strong>
          </div>
        </div>
        <div className="panel budget-insight">
          <div className="insight-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <div className="panel-kicker">A SMALL SIGNAL</div>
            <h3>Your food budget has room.</h3>
            <p>You’re at 58% with ten days left in the month. That’s a comfortable pace.</p>
          </div>
        </div>
      </section>
      <section className="panel budgets-list-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">CATEGORY LIMITS</div>
            <h2>Monthly budgets</h2>
          </div>
          <span className="panel-caption">Amounts in USD</span>
        </div>
        <div className="budget-list">
          {budgetList.map((budget) => {
            const category = categories.find((item) => item.id === budget.categoryId)!
            const ratio = Number(budget.spent) / Number(budget.limit)
            return (
              <div className="budget-list-row" key={budget.id}>
                <div className="budget-category">
                  <span
                    className="budget-category-icon"
                    style={{ color: category.color, background: `${category.color}16` }}
                  >
                    {category.icon}
                  </span>
                  <div>
                    <strong>{category.name}</strong>
                    <span>{money(budget.spent)} spent</span>
                  </div>
                </div>
                <div className="budget-line-wrap">
                  <div className="budget-progress">
                    <span
                      className={ratio >= 1 ? 'over' : ratio > 0.8 ? 'watch' : ''}
                      style={{
                        width: `${Math.min(ratio * 100, 100)}%`,
                        background: category.color,
                      }}
                    />
                  </div>
                  <span>{Math.round(ratio * 100)}%</span>
                </div>
                <label className="budget-input">
                  <span>$</span>
                  <input
                    type="number"
                    value={budget.limit}
                    onChange={(event) => updateBudget(budget.id, event.target.value)}
                  />
                  <span>/ mo</span>
                </label>
                <button className="panel-menu">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

function GoalsView({
  goalList,
  setGoalList,
  showToast,
}: {
  goalList: SavingsGoal[]
  setGoalList: (value: SavingsGoal[]) => void
  showToast: (message: string) => void
}) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            FORWARD MOTION / 2 ACTIVE GOALS <span className="eyebrow-line" />
          </div>
          <h1>
            Savings goals<span className="heading-period">.</span>
          </h1>
          <p>Give the next version of your life a number and a date.</p>
        </div>
        <div className="heading-actions">
          <button
            className="primary-button"
            onClick={() => showToast('New goal setup is ready to connect')}
          >
            <Plus size={17} /> New goal
          </button>
        </div>
      </section>
      <section className="goals-grid">
        {goalList.map((goal) => {
          const progress = Math.round((Number(goal.current) / Number(goal.target)) * 100)
          return (
            <div className="panel goal-card" key={goal.id}>
              <div className="goal-card-top">
                <span
                  className="goal-symbol"
                  style={{ color: goal.color, background: `${goal.color}16` }}
                >
                  <PiggyBank size={18} />
                </span>
                <button className="panel-menu">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <div className="panel-kicker">TARGET · {goal.due.toUpperCase()}</div>
              <h2>{goal.name}</h2>
              <div className="goal-card-amount">
                <strong>{money(goal.current)}</strong>
                <span>of {money(goal.target)}</span>
              </div>
              <div className="goal-progress">
                <span style={{ width: `${progress}%`, background: goal.color }} />
              </div>
              <div className="budget-meta">
                <span>{progress}% complete</span>
                <strong>{money(Number(goal.target) - Number(goal.current))} to go</strong>
              </div>
              <div className="goal-edit-row">
                <label>
                  Current balance
                  <input
                    value={goal.current}
                    onChange={(event) =>
                      setGoalList(
                        goalList.map((item) =>
                          item.id === goal.id ? { ...item, current: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="secondary-button small-button"
                  onClick={() => showToast(`${goal.name} updated`)}
                >
                  <Check size={15} /> Save
                </button>
              </div>
            </div>
          )
        })}
        <button
          className="add-goal-card"
          onClick={() => showToast('New goal setup is ready to connect')}
        >
          <span>
            <Plus size={20} />
          </span>
          <strong>Create a new goal</strong>
          <small>Trips, buffers, big ideas</small>
        </button>
      </section>
    </>
  )
}

function SettingsView({
  user,
  onSignOut,
  showToast,
}: {
  user: User
  onSignOut: () => void
  showToast: (message: string) => void
}) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            WORKSPACE / PREFERENCES <span className="eyebrow-line" />
          </div>
          <h1>
            Settings<span className="heading-period">.</span>
          </h1>
          <p>Make Personal Finance fit the way you think about money.</p>
        </div>
      </section>
      <section className="settings-grid">
        <div className="panel settings-panel">
          <div className="panel-kicker">PROFILE</div>
          <h2>Personal workspace</h2>
          <div className="profile-large">
            <div className="profile-large-avatar">{getInitials(user.name)}</div>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
            <button
              className="secondary-button small-button"
              onClick={() => showToast('Profile editing is ready to connect')}
            >
              <Edit3 size={14} /> Edit
            </button>
          </div>
          <div className="settings-field">
            <label>
              Workspace name
              <input defaultValue={`${user.name.split(/\s+/)[0]}'s personal finances`} />
            </label>
            <label>
              Base currency
              <select defaultValue="USD">
                <option>USD — US Dollar</option>
                <option>EUR — Euro</option>
                <option>GBP — Pound sterling</option>
              </select>
            </label>
          </div>
          <button className="secondary-button settings-sign-out" onClick={onSignOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
        <div className="panel settings-panel">
          <div className="panel-kicker">PREFERENCES</div>
          <h2>How Personal Finance speaks</h2>
          <div className="toggle-row">
            <div>
              <strong>Budget threshold alerts</strong>
              <span>Notify me when a category reaches 80%.</span>
            </div>
            <button className="toggle is-on" onClick={() => showToast('Budget alerts are on')}>
              <span />
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Weekly money note</strong>
              <span>A short summary every Monday morning.</span>
            </div>
            <button className="toggle is-on" onClick={() => showToast('Weekly note is on')}>
              <span />
            </button>
          </div>
          <div className="toggle-row">
            <div>
              <strong>Compact transaction rows</strong>
              <span>Fit more of the ledger on screen.</span>
            </div>
            <button className="toggle" onClick={() => showToast('Compact rows are off')}>
              <span />
            </button>
          </div>
        </div>
        <div className="panel settings-panel security-panel">
          <div className="settings-security-icon">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="panel-kicker">DATA & PRIVACY</div>
            <h2>Your demo data is safe here.</h2>
            <p>
              This workspace uses synthetic sample transactions. A production connection would
              enforce authenticated ownership checks, decimal-safe money fields, and encrypted
              transport.
            </p>
            <button className="text-button" onClick={() => showToast('Security details opened')}>
              Review data model <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

function TransactionModal({
  form,
  setForm,
  error,
  editing,
  onClose,
  onSave,
}: {
  form: FormState
  setForm: (value: FormState) => void
  error: string
  editing: boolean
  onClose: () => void
  onSave: () => void
}) {
  const availableCategories = categories.filter((category) => category.type === form.type)
  const update = (key: keyof FormState, value: string) => setForm({ ...form, [key]: value })
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <div className="panel-kicker">LEDGER ENTRY</div>
            <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>
            <p>Keep the details precise. Future-you will thank you.</p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="type-switch">
          <button
            className={form.type === 'expense' ? 'active' : ''}
            onClick={() => setForm({ ...form, type: 'expense', categoryId: 'food' })}
          >
            <ArrowUpRight size={15} /> Expense
          </button>
          <button
            className={form.type === 'income' ? 'active income-switch' : ''}
            onClick={() => setForm({ ...form, type: 'income', categoryId: 'salary' })}
          >
            <ArrowDownRight size={15} /> Income
          </button>
        </div>
        <div className="form-grid">
          <label className="wide-field">
            Merchant or source
            <input
              autoFocus
              value={form.merchant}
              onChange={(event) => update('merchant', event.target.value)}
              placeholder="e.g. Northstar Market"
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(event) => update('amount', event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => update('date', event.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={form.categoryId}
              onChange={(event) => update('categoryId', event.target.value)}
            >
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Account
            <select defaultValue="everyday">
              <option value="everyday">Everyday account · USD</option>
              <option value="savings">Rainy day savings · USD</option>
            </select>
          </label>
          <label className="wide-field">
            Note <span className="optional-label">optional</span>
            <input
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              placeholder="What was this for?"
            />
          </label>
        </div>
        {error && (
          <div className="form-error">
            <CircleAlert size={15} />
            {error}
          </div>
        )}
        <div className="modal-footer">
          <span className="secure-note">
            <ShieldIcon /> Demo data only
          </span>
          <div>
            <button className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" onClick={onSave}>
              {editing ? 'Save changes' : 'Add transaction'} <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ShieldIcon() {
  return (
    <span className="shield-icon">
      <Check size={10} />
    </span>
  )
}

export default App
