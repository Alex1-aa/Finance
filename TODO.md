# Alex TODO

## 1. Dashboard gives users a clear monthly financial overview
- Show current balance, total income, total spending, savings rate, and a monthly comparison using synthetic sample transactions only.
- Display a monthly cash-flow trend chart and category breakdown chart.
- Show budget health, savings-goal progress, and visible alerts for categories approaching or exceeding their limits.
- Keep the visual system aligned to the selected Mint Terminal direction: near-black foundations, vivid mint signals, compact analytical views, Space Grotesk plus monospaced financial figures.

## 2. Transactions support useful everyday workflows
- Add, edit, view, and delete income and expense transactions.
- Require a category, account, date, type, and positive amount; reject invalid amounts with clear inline feedback.
- Search and filter transactions by text, date range, category, and transaction type.
- Keep demo data local and synthetic while preserving decimal-safe string values at the domain boundary.

## 3. Budgets and savings goals are actionable
- Create and update monthly budgets by category.
- Calculate budget progress against the active month and distinguish healthy, watch, and over-limit states.
- Set and update savings goals with target amount and current progress.
- Surface configurable spending-threshold alerts in the dashboard.

## 4. Reporting and navigation are complete
- Provide a persistent workspace navigation for Dashboard, Transactions, Budgets, Goals, and Settings.
- Export the visible filtered transaction set as a correctly formatted CSV file.
- Support a compact mobile layout with a usable top bar and stacked data surfaces.
- Add `/manus-routes.json` with the complete route declaration for the single-page app.

## 5. Delivery checks and architecture notes are present
- Include a build script and serve the app on the configured Preview port.
- Keep future Express/Prisma/PostgreSQL boundaries explicit in types and plan documentation.
- Use only demo records; do not request or embed real financial information.
- Preserve a clear path to authenticated ownership checks, decimal numeric database columns, consistent dates, idempotent retries, and multi-currency support.
