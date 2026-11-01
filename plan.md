# Alex — implementation plan

## Product scope
Alex is a responsive personal finance workspace for synthetic demo data. The initial deliverable prioritizes the dashboard experience: monthly cash-flow review, category analysis, budgets, savings goals, transaction search, add/edit/delete flows, filters, alerts, and CSV export. The interface uses local state and a small service boundary so the demo is immediately usable without real financial credentials; the data model and component boundaries are shaped for a later Express/Prisma/PostgreSQL connection.

## Architecture
- `src/main.tsx` mounts the React app.
- `src/App.tsx` owns navigation, demo state, derived financial calculations, modal flows, and CSV export.
- `src/types.ts` holds the domain types mirroring users, accounts, categories, transactions, budgets, and savings goals.
- `src/data.ts` provides synthetic demo records and chart-ready sample series.
- `src/components/` contains focused UI pieces: shell navigation, stat cards, charts, transaction table, forms, and reusable controls.
- `src/styles.css` owns the Mint Terminal visual system and responsive layout.
- `public/manus-routes.json` declares the single-page route for Preview.
- The future server boundary is documented in the domain types and service helpers so Express endpoints can replace the local repository without changing the UI.

## Design direction — Mint Terminal

### Design movement
Modern financial terminal / editorial data workspace: near-black foundations, vivid mint signals, compact analytical panels, and strong hierarchy.

### Core principles
1. Make the important number impossible to miss: cash flow, balance, and budget risk sit above the fold.
2. Pair dense data with breathing room: compact tables and charts live inside generous framed surfaces.
3. Use mint as a signal, not decoration: positive movement, active states, and progress share the ownable accent.
4. Keep interaction local and reversible: add, edit, filter, and export without losing context.

### Color philosophy
The canvas is a blue-black graphite that reduces glare and makes analytical content feel focused. Soft slate panels separate work areas without introducing card clutter. Mint carries the brand signature and communicates healthy movement. Warm amber and coral are reserved for attention, budget pressure, and exceptions.

### Layout paradigm
A fixed left rail creates a persistent workspace index while the main canvas uses an asymmetric dashboard: a wide cash-flow story column, a narrow health column, and a full-width transaction stream below. On smaller screens the rail becomes a top utility bar and columns collapse into a deliberate reading order.

### Signature elements
- A mint “signal line” that threads through the brand mark, active nav, and chart highlights.
- Monospaced numeric readouts for money and dates, contrasting with a humanist sans for labels.
- Framed data surfaces with a faint inner glow and precise corner accents instead of heavy shadows.

### Interaction philosophy
Buttons state the action precisely (“Add transaction”, “Export CSV”, “Review budget”) and show immediate feedback through a compact toast. Filters keep their state in view. Forms validate positive amounts and required labels before committing. Destructive actions use a visible confirmation state rather than an accidental one-click removal.

### Animation
Use short 160–220ms opacity and transform transitions for panels, nav states, and modal entry. Charts draw in gently on first render but never continuously animate. Toasts enter from the lower right and auto-dismiss after a few seconds. Avoid decorative motion that competes with financial data.

### Typography system
Use Space Grotesk for headings and interface labels, with IBM Plex Mono for amounts, dates, and tabular figures. Headlines are tight and editorial; small labels use uppercase tracking sparingly. Large numeric values use tabular figures and a modest negative letter-spacing.

### Brand essence
A calm command center for people who want their money to feel legible — focused, candid, quietly confident.

### Brand voice
Direct, specific, and grounded in progress. Example lines: “Your spending has a shape. Let’s make it visible.” and “You’re on track for this month.”

### Wordmark & logo
A compact “A” monogram built from two offset mint signal bars, paired with the Alex wordmark. The offset bars imply a ledger row becoming a trend line.

### Signature brand color
Signal mint `#5CE1A4`.

## Data and future API notes
Money stays as decimal strings at the API/database boundary and is formatted only at the UI edge. Transaction dates are ISO date strings. Future server routes should enforce authenticated ownership on account/category joins, positive amount validation, idempotency keys for retries, and aggregate queries grouped by month/category. The demo deliberately contains no real financial information.

## Delivery shape
The website will run on the configured Preview port with a Vite-powered React entry, include a production build command, and expose `/manus-routes.json`. The current demo is client-side so reviewers can exercise the product immediately; the API/database integration seam remains explicit for the requested Express/Prisma/PostgreSQL roadmap.
