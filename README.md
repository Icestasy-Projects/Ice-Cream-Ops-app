# Icestasy Ops — v0.2.0

Internal operations portal for **Icestasy**, an artisanal ice cream brand. The app manages the full production pipeline — from raw-material receipts in the kitchen through ice cream production in the factory to customer dispatch — with real-time stock tracking, cost visibility, and role-gated access for every team member.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (`@supabase/auth-helpers-nextjs`) |
| Styling | Tailwind CSS 3 |
| UI Components | Lucide React icons, react-hot-toast |
| Date utilities | date-fns |
| Excel exports | xlsx-js-style |
| QR | html5-qrcode, react-qr-code |
| Testing | Playwright |
| Hosting | Vercel |

---

## Role Hierarchy

```
super_admin
├── All kitchen routes
├── All factory routes
└── All admin routes

kitchen
├── /dashboards/raw-materials   RM Stock dashboard
├── /receive                    Receive ingredients
├── /make-prep                  Make Kitchen Mix
├── /kitchen/daily-rm           Daily RM Usage log
├── /transfer                   Transfer mix to factory
└── /formulations               View recipes (read-only)

factory
├── /dashboards/prep            Prep Stock dashboard
├── /make-tubs                  Make Tubs (fill FG)
├── /break-bulk                 Break 4L Bulks → 12 Sq / 50ml
├── /dashboards/finished-goods  FG Stock dashboard
└── /dispatch                   Dispatch orders
```

---

## Features

### Auth
- Email/password login with Supabase Auth
- Middleware-enforced session guard on all `/app/*` routes
- Forced password change on first login (`must_change_password` flag)
- Role lookup from `production.user_profiles` on every session

### Home Dashboard (`/dashboard`)
- Role-aware quick-action cards (Receive / Make Mix / Transfer / Make Tubs / Dispatch)
- Stock summary counters: RM items, Prep items in kitchen & factory, FG units
- Active stock alerts banner (critical / low)

### Kitchen Module

| Route | Feature |
|---|---|
| `/receive` | Log vendor deliveries — create/receive purchase orders; per-item cost tracking; spoilage recording; receipt history with expandable lines; RM expense analytics (monthly cost & qty table); Excel export |
| `/make-prep` | Select a prep product; enter quantity in **4L Bulks** (converts to litres and batches internally); live stock check with shortfall warnings per ingredient; confirm modal before commit |
| `/kitchen/daily-rm` | Daily RM consumption entry against today's prep batches; automatic variance detection (expected vs actual); variance log |
| `/transfer` | Transfer kitchen prep stock to factory; whole-stock or custom-qty mode |
| `/formulations` | Read-only ingredient recipe viewer per prep product; shows qty per batch and purpose |

### Factory Module

| Route | Feature |
|---|---|
| `/dashboards/prep` | Prep stock split by kitchen / factory location; weekly requirement vs on-hand status (critical / low / ok); search; CSV / Excel export |
| `/make-tubs` | Select SKU (flavour + pack format); shows available prep capacity; enter litres from prep + optional extra litres; records FG production and deducts prep ledger |
| `/break-bulk` | Breaks 4L Bulks into 12-Square packs (1 800 ml each) or 50ml Samples; calculates output units; deducts 4L Bulk stock and credits target format |
| `/dashboards/finished-goods` | FG stock by format section (4L Bulk → 12 Square → 50ml Samples); weekly demand status badges; expandable cost breakdown per flavour; search; Excel export |
| `/dispatch` | Lists pending approved/invoiced orders with per-line stock availability; confirm dispatch records `fg_dispatches` and deducts FG ledger; recent dispatch history |

### Dashboards

| Route | Feature |
|---|---|
| `/dashboards/raw-materials` | RM stock by category; weekly requirement status; reorder flag; search; export |
| `/dashboards/weekly-audit` | Full supply-chain audit: FG demand → prep batches needed → RM required; traces demand back 42 days via `sales.get_fg_weekly_req()` SQL RPC; warnings surfaced per SKU / prep product / RM item |

### Admin Module _(super\_admin only)_

| Route | Feature |
|---|---|
| `/admin/flavours` | Manage prep products (flavours), their batch yield, recipe ingredients and quantities |
| `/admin/rm-items` | Manage raw material items — name, SKU, unit, category, reorder level |
| `/admin/users` | Create / deactivate employee accounts; set role; force password reset |
| `/admin/cost-sheet` | Three tabs — CSV import, interactive cost sheet (grouped by flavour type), RM expense analytics |
| `/admin/opening-stock` | Seed opening stock balances |
| `/admin/sku-alignment` | Link sales SKUs to production flavours |
| `/admin/flavour-alignment` | Align flavour names across sales and production schemas |
| `/admin/rm-variances` | Review and resolve RM usage variances |
| `/admin/cleanup` | Delete SKUs by format (data maintenance) |

### Reports
- `/api/reports/stock-export` — full stock snapshot Excel export with colour-coded status cells
- `/api/reports/dispatch-export` — dispatch history Excel export

---

## Key Flows

### Kitchen: Making a Batch
1. Navigate to **Make Kitchen Mix**.
2. Select a prep product from the list.
3. Enter the number of **4L Bulks** to produce (e.g. 5 Bulks = 20 L).
4. The app calculates batches from litres ÷ `batch_yield_l` and checks each RM ingredient.
5. Shortfall warnings appear inline if any ingredient is short.
6. Confirm → `POST /api/make-prep` inserts into `prep_units`; database trigger deducts `rm_ledger`.

### Factory: Filling Tubs
1. Navigate to **Make Tubs**.
2. Select a flavour and pack format (SKU).
3. Enter litres from prep stock (`from_prep_l`) and any extra litres (`extra_l`).
4. Confirm → `POST /api/make-fg` deducts `prep_ledger` for `from_prep_l` and writes `fg_ledger` with `movement = 'produced'`.

### Factory: Dispatch
1. Navigate to **Dispatch Order**.
2. Pending orders (status `approved` / `invoiced` / `in_production`) are listed with per-line stock indicators.
3. Select an order and confirm → `POST /api/dispatch-order` writes `fg_dispatches` and deducts `fg_ledger`.

### Admin: Cost Sheet Import
1. Navigate to **Admin → Cost Sheet → Import tab**.
2. Upload the `Cost_Sheet_YYYY.csv` file.
3. The API matches CSV flavour names to `prep_products` (case-insensitive), then replaces all rows in `production.cost_sheet`.
4. Switch to **Sheet tab** to view and inline-edit individual ingredient rates.

---

## Database Schema

### Schemas
| Schema | Purpose |
|---|---|
| `production` | Kitchen & factory operations — stock, recipes, ledgers |
| `sales` | Orders, clients, SKUs, pricing |
| `auth` | Supabase Auth (managed) |

### Production Tables

| Table | Description |
|---|---|
| `user_profiles` | App users: role (`kitchen` / `factory` / `super_admin`), `must_change_password` |
| `rm_items` | Raw material master (name, unit, category, reorder level) |
| `rm_categories` | RM category lookup |
| `rm_costs` | Effective-dated cost per RM item |
| `rm_ledger` | All RM stock movements (receipts, consumption, adjustments) |
| `rm_receipts` / `rm_receipt_lines` | Purchase order receipts |
| `rm_purchase_orders` / `rm_purchase_order_lines` | Purchase orders to vendors |
| `vendors` | Supplier master |
| `prep_products` | Kitchen mix / prep products (flavour, batch yield in litres) |
| `prep_recipes` | Ingredient quantities per prep product batch |
| `prep_ledger` | Prep stock movements (produced, transferred, consumed) |
| `prep_units` | Individual prep batch records |
| `prep_transfers` | Kitchen → Factory transfer records |
| `fg_recipes` | Prep product → FG SKU linkage with litres per unit |
| `fg_extra_lines` | Extra RM lines (direct add) per FG SKU |
| `fg_ledger` | FG stock movements (produced, dispatched, adjustments) |
| `fg_units` | Individual FG production records |
| `fg_dispatches` | FG dispatch records per order |
| `fg_adjustments` | Manual FG stock adjustments |
| `fg_labels` / `fg_scan_log` | QR label generation and scan tracking |
| `cost_sheet` | Per-ingredient cost data per flavour (rate, qty per batch) |
| `stock_targets` | Min/par targets per item for alerts |
| `stock_alerts` | Active stock alert records |
| `daily_rm_entries` / `daily_rm_entry_lines` | Daily RM consumption log |
| `daily_rm_variances` | Expected vs actual RM usage variances |

### `production.cost_sheet` — Column Detail

| Column | Type | Description |
|---|---|---|
| `id` | bigint | PK |
| `flavour_type` | text | Category (Fruits, Nuts, Traditional, etc.) |
| `flavour_name` | text | Matches `prep_products.name` |
| `ingredient` | text | RM ingredient name |
| `purpose` | text | Role in recipe (base, mix-in, etc.) |
| `rate` | numeric | Cost per `rate_unit` |
| `rate_unit` | text | Unit the rate is expressed in |
| `qty_per_batch` | numeric | Quantity used per production batch |
| `rm_item_id` | bigint | FK → `rm_items.id` (nullable) |
| `updated_at` | timestamptz | Last updated |
| `updated_by` | uuid | FK → `auth.users.id` |

### Views

| View | Description |
|---|---|
| `production.v_rm_stock` | Current RM stock on hand (sum of `rm_ledger`) |
| `production.v_prep_stock` | Prep stock split by kitchen / factory location |
| `production.v_fg_stock` | Current FG stock on hand |
| `production.v_stock_alerts_rm/prep/fg` | Active alerts per stock layer |
| `production.v_stock_targets_rm/prep/fg` | Targets joined with current stock |

### Sales Tables (subset relevant to production)

| Table | Description |
|---|---|
| `sales.flavours` | Flavour master linked to `prep_products` via `flavour_id` |
| `sales.pack_formats` | Pack sizes (4L Bulk, 12 Square, 50ml Sample, etc.) |
| `sales.skus` | Flavour × Pack Format combinations |
| `sales.orders` / `sales.order_lines` | Customer orders driving weekly demand |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL       Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY      Service role key (server-side API routes only)
```

> All API routes that mutate data use a service-role client. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

---

## Local Development

```bash
npm install
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

App runs at `http://localhost:3000`.

### Tests

```bash
npm test            # Playwright headless
npm run test:ui     # Playwright interactive UI
npm run test:headed # Playwright with browser visible
```

---

## Deployment

| Branch | Environment |
|---|---|
| `main` | Production (Vercel auto-deploy) |
| `claude/*` | Feature branches — preview deployments on Vercel |

Set the three env vars above in Vercel → Project → Settings → Environment Variables for `Production` and `Preview`.

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    Authenticated route group
│   │   ├── layout.tsx            Auth guard + NavBar wrapper
│   │   ├── dashboard/            Home dashboard
│   │   ├── make-prep/            Kitchen mix production
│   │   ├── make-tubs/            Factory FG production
│   │   ├── break-bulk/           Break 4L Bulks into smaller formats
│   │   ├── receive/              RM receipts & purchase orders
│   │   ├── transfer/             Kitchen → Factory prep transfer
│   │   ├── dispatch/             Dispatch orders
│   │   ├── formulations/         Read-only recipe viewer
│   │   ├── kitchen/daily-rm/     Daily RM usage log
│   │   ├── dashboards/
│   │   │   ├── raw-materials/    RM stock + weekly req status
│   │   │   ├── prep/             Prep stock + weekly req status
│   │   │   ├── finished-goods/   FG stock + cost breakdown
│   │   │   └── weekly-audit/     Full supply-chain audit
│   │   └── admin/
│   │       ├── flavours/         Manage prep products & recipes
│   │       ├── rm-items/         Manage RM master data
│   │       ├── users/            Manage employee accounts
│   │       ├── cost-sheet/       Cost sheet import & viewer
│   │       ├── opening-stock/    Seed opening balances
│   │       ├── sku-alignment/    Link sales SKUs to production
│   │       ├── flavour-alignment/ Sync flavour names
│   │       ├── rm-variances/     Variance review
│   │       └── cleanup/          Data maintenance
│   ├── api/
│   │   ├── make-prep/            POST — record prep batch
│   │   ├── make-fg/              POST — record FG production
│   │   ├── dispatch-order/       GET pending orders / POST dispatch
│   │   ├── daily-rm-usage/       POST daily RM entry
│   │   ├── fg-capacity/          GET prep → FG capacity calc
│   │   ├── weekly-req/           GET weekly demand (FG/prep/RM)
│   │   ├── weekly-req/audit/     GET full audit with warnings
│   │   ├── reports/
│   │   │   ├── stock-export/     GET Excel stock snapshot
│   │   │   └── dispatch-export/  GET Excel dispatch history
│   │   └── admin/                Admin-only mutation endpoints
│   ├── auth/callback/            Supabase OAuth callback handler
│   ├── login/                    Login page
│   └── change-password/          First-login password change
├── components/
│   ├── NavBar.tsx                Sticky header with role-aware nav groups
│   ├── ScreenHeader.tsx          Page title + optional action buttons
│   ├── ConfirmModal.tsx          Reusable confirm dialog
│   ├── FuelGauge.tsx             Stock level gauge widget
│   └── LoadingSpinner.tsx        Centered spinner
├── hooks/
│   ├── useUser.ts                Current Supabase auth user + display name
│   └── useRole.ts                Fetches app role from user_profiles
├── lib/
│   ├── supabase.ts               Browser client (createClientComponentClient)
│   ├── supabase-server.ts        Server client (createServerComponentClient)
│   ├── roles.ts                  Role → nav items mapping + canAccess()
│   ├── utils.ts                  cn(), parseSupabaseError(), formatNumber(), unitLabel()
│   └── qr.ts                     QR code helpers
├── types/
│   └── database.ts               Generated Supabase DB types
└── middleware.ts                 Session redirect guard
supabase/
├── full_migration.sql            Canonical schema migration
├── flavours_and_break_bulk.sql   Flavour & break-bulk additions
├── purchase_orders.sql           PO schema
├── add_user_management.sql       User profiles schema
└── setup_user_roles.sql          RLS and role policies
```

---

## Key Patterns

### API Route — Auth + Service Role Client
```ts
// Every mutating API route follows this pattern
const supabase = createServerComponentClient({ cookies: () => cookieStore });
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

const admin = createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY); // bypasses RLS
```

### Role Guard in Client Components
```ts
const { role, loading } = useRole(); // fetches from production.user_profiles

if (!canAccess(role, '/admin/cost-sheet')) {
  return <div>Not authorised</div>;
}
```

### Weekly Demand via SQL RPC
```ts
// Avoids PostgREST row-count cap; computes weekly average over 42-day window
const { data } = await admin
  .schema('sales')
  .rpc('get_fg_weekly_req', { since_ts: since, window_weeks: 6 });
```

### FG Ledger Write Requires Session Config
```ts
// Database trigger checks this config var before allowing fg_ledger inserts
await admin.rpc('set_config', { parameter: 'icestasy.ledger_write_allowed', value: '1', is_local: true });
```

### Supabase Schema Prefix
```ts
// All production tables require explicit schema selection
supabase.schema('production').from('prep_products').select(...)
supabase.schema('sales').from('orders').select(...)
```

---

## Status

| Feature | Status |
|---|---|
| Email/password auth + forced password change | ✅ Done |
| Role-based navigation (kitchen / factory / super_admin) | ✅ Done |
| Receive ingredients (purchase orders + receipt log) | ✅ Done |
| Make Kitchen Mix (input in 4L Bulks) | ✅ Done |
| Daily RM usage log + variance detection | ✅ Done |
| Transfer prep to factory | ✅ Done |
| Formulations viewer | ✅ Done |
| Raw Materials stock dashboard | ✅ Done |
| Prep stock dashboard | ✅ Done |
| Make Tubs (FG production) | ✅ Done |
| Break Bulk (4L → 12 Sq / 50ml) | ✅ Done |
| Finished Goods stock dashboard | ✅ Done |
| Dispatch orders | ✅ Done |
| Weekly audit (FG → prep → RM demand chain) | ✅ Done |
| Weekly demand via SQL RPC (no row-cap) | ✅ Done |
| Cost Sheet — import + viewer + RM expenses | ✅ Done |
| Admin: manage flavours, RM items, users | ✅ Done |
| Admin: SKU & flavour alignment | ✅ Done |
| Stock export (Excel, colour-coded) | ✅ Done |
| Dispatch export (Excel) | ✅ Done |
| QR label generation & scan log | 🔄 In Progress |
| Opening stock seeding UI | ✅ Done |
| RM variance review UI | ✅ Done |
