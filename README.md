# Marketplace — Frontend

Bilingual (Arabic RTL / English LTR) storefront and dashboards for a **multi-vendor e-commerce marketplace**. Customers shop and check out, vendors manage products and orders, and admins run the platform, all in one server-rendered React app.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TanStack Start](https://img.shields.io/badge/TanStack-Start%20%2B%20Router-FF4154)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Playwright](https://img.shields.io/badge/e2e-Playwright-2EAD33?logo=playwright&logoColor=white)

> This app talks to the [Marketplace API](https://github.com/yousefmahrous/backend). Run the backend first.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Routes](#routes)
- [Internationalization](#internationalization)
- [End-to-End Testing](#end-to-end-testing)
- [Docker](#docker)
- [Continuous Integration](#continuous-integration)
- [Conventions](#conventions)
- [License](#license)

---

## Features

**Shopping**
- Product catalog with categories, variants, ratings, and live updates when products change
- Product detail pages with reviews and star ratings
- Cart, favorites, and a shipping dialog leading to **Stripe Checkout**
- Success and cancel pages after payment

**Account**
- Signup with email verification, login, forgot / reset / change password
- Order history, order shipment tracking, refund requests
- Support tickets with real-time messaging

**Vendors**
- Vendor application flow
- Product and variant management with cover image upload
- Order board with fulfillment updates (carrier and tracking)
- Earnings, payouts, and returns

**Admin**
- Products, categories, vendors, and platform orders
- Commission settings and payout recording
- Refund review and ticket management

**General**
- Arabic (RTL) and English (LTR) with a language switcher
- Role-based route guards (customer, vendor, admin)
- Accessible UI built on Radix primitives and shadcn/ui

---

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) (SSR) + TanStack Router (file-based routing) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix UI), lucide-react |
| Data fetching | TanStack Query, Axios |
| Forms & validation | React Hook Form, Zod |
| Real-time | socket.io-client |
| i18n | i18next, react-i18next |
| Charts | Recharts |
| Build | Vite 8, Nitro (`node-server` preset) |
| Quality | TypeScript, ESLint, Prettier |
| E2E testing | Playwright |

---

## Architecture

```
Route (src/routes)  →  Hook (src/hooks)  →  API module (src/api)  →  Backend
   UI & layout          TanStack Query        Axios + CSRF handling
```

- **API layer** (`src/api/client.ts`): a single Axios instance with credentials enabled. It automatically fetches and attaches the CSRF token on mutating requests, sends the current language in `x-lang`, normalizes errors into an `ApiError` (status, field errors, localized message), and triggers a logout flow on `401`.
- **Hooks**: each domain (`useCart`, `useProducts`, `useVendor`, …) wraps its API module with TanStack Query for caching and invalidation.
- **Real-time**: `useProductsRealtime` refreshes catalog queries when the server emits `products_updated`; `useTicketSocket` joins ticket rooms for live support chat.
- **Auth**: `AuthProvider` exposes the current user; `Guards.tsx` provides route guards for logged-in, vendor, and admin areas.

---

## Project Structure

```
.
├── e2e/                         # Playwright specs, auth setup, fixtures
├── public/
├── src/
│   ├── api/                     # One module per backend resource
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   ├── admin/ checkout/ orders/ products/ reviews/ vendor/
│   │   ├── Navbar.tsx  Guards.tsx  StateViews.tsx  LanguageSwitcher.tsx
│   ├── context/                 # Auth context
│   ├── hooks/                   # Data hooks and socket hooks
│   ├── i18n/                    # i18n setup, language cookie, ar/en locales
│   ├── lib/                     # Status helpers, error handling, utilities
│   ├── routes/                  # File-based routes (+ generated routeTree)
│   ├── schemas/                 # Zod schemas (auth, contact, product, shipping, ticket)
│   ├── router.tsx  server.ts  start.ts  styles.css
├── Dockerfile
├── playwright.config.ts
├── vite.config.ts
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js 22+** with npm, or [Bun](https://bun.sh) (the project ships a `bun.lock`, and CI uses Bun)
- The **backend API** running locally (default `http://localhost:3000`)

### Installation

```bash
git clone <your-frontend-repo-url>
cd <your-frontend-repo>

# with Bun (matches CI)
bun install

# or with npm
npm install
```

### Configure the environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### Start the dev server

```bash
bun run dev      # or: npm run dev
```

Open **http://localhost:8080**.

Make sure the backend's `CLIENT_URL_DEV` is set to this origin, otherwise CORS and cookies will be blocked.

---

## Environment Variables

| Variable | Required | Description |
| --- | :---: | --- |
| `VITE_API_URL` | ✅ | Base URL of the backend API, including `/api/v1`. Defaults to `http://localhost:3000/api/v1`. The Socket.IO URL is derived from it. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ➖ | Stripe publishable key. Checkout currently redirects to a Stripe-hosted page created by the backend. |

> `VITE_*` variables are embedded into the client bundle at build time. Only put public values in them.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `dev` | Start the Vite dev server |
| `build` | Production build (outputs `.output/`) |
| `build:dev` | Build in development mode |
| `preview` | Preview the production build |
| `lint` | Run ESLint |
| `typecheck` | Type-check with `tsc --noEmit` |
| `format` | Format the codebase with Prettier |

Run with `bun run <script>` or `npm run <script>`.

---

## Routes

Routes are file-based (`src/routes`). `routeTree.gen.ts` is auto-generated — do not edit it.

| Area | Paths |
| --- | --- |
| Public | `/`, `/products`, `/products/:id`, `/contact` |
| Auth | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password` |
| Customer | `/cart`, `/favorites`, `/orders`, `/account`, `/account/change-password`, `/tickets`, `/tickets/:id`, `/checkout/success`, `/checkout/cancel` |
| Vendor | `/vendor/apply`, `/vendor/products` (+ `new`, `:id/edit`), `/vendor/orders`, `/vendor/returns`, `/vendor/earnings` |
| Admin | `/admin/products` (+ `new`, `:id/edit`), `/admin/categories`, `/admin/vendors`, `/admin/orders`, `/admin/platform-orders`, `/admin/refunds`, `/admin/payouts`, `/admin/commission`, `/admin/tickets` |

---

## Internationalization

- Languages: **Arabic (default, RTL)** and **English (LTR)**; translations live in `src/i18n/locales/{ar,en}.json`.
- The chosen language is stored in a `lang` cookie so it can be read during server rendering, and it is sent to the API as `x-lang` so backend messages and emails match the UI.
- Add a language by creating a locale file and registering it in `src/i18n/i18n.ts`.

---

## End-to-End Testing

Playwright tests in `e2e/` cover signup, login guards, password recovery, catalog, cart, favorites, checkout, reviews, refunds, contact, account, and admin flows.

The suite has two authenticated projects (`chromium-customer`, `chromium-admin`) that reuse sessions created by `e2e/auth.setup.ts`.

### Run locally

1. Start PostgreSQL and Redis, then run the backend with rate limiting disabled and seed it:

   ```bash
   # in the backend repo
   npm run migrate:deploy
   npm run seed:e2e
   npm run dev:test
   ```

2. Create `e2e/fixtures/test-users.ts` (git-ignored) with the seeded accounts:

   ```ts
   export const CUSTOMER = { email: '<customer email>', password: '<password>' };
   export const ADMIN = { email: '<admin email>', password: '<password>' };
   ```

3. Run the tests:

   ```bash
   bunx playwright install chromium
   VITE_API_URL=http://localhost:3000/api/v1 bunx playwright test
   ```

Playwright starts the dev server on port 8080 automatically (or reuses a running one) and keeps screenshots and videos for failed tests.

---

## Docker

```bash
docker build --build-arg VITE_API_URL=https://api.example.com/api/v1 -t marketplace-web .
docker run -p 8080:8080 -e PORT=8080 marketplace-web
```

`VITE_API_URL` is a **build argument** because Vite bakes it into the bundle; rebuild the image to point at a different API. The container runs the Nitro server at `.output/server/index.mjs`.

---

## Continuous Integration

The **E2E** workflow (`.github/workflows/e2e.yml`) runs on pushes to `main` and manually. It provisions PostgreSQL and Redis, checks out and starts the backend, seeds the database, installs dependencies with Bun, generates the e2e fixtures from repository secrets, and runs Playwright. The Playwright report and the backend log are uploaded as artifacts.

Required repository secrets: `SESSION_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CONTACT_RECEIVER_EMAIL`, `B2_*`, `VITE_STRIPE_PUBLISHABLE_KEY`, `E2E_CUSTOMER_EMAIL`, `E2E_CUSTOMER_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

---

## Conventions

- File-based routing only: every file in `src/routes` is a route; the app shell lives in `src/routes/__root.tsx`.
- UI primitives come from shadcn/ui (`new-york` style, `slate` base); add new ones with the shadcn CLI.
- Use the `@/` alias for imports from `src`.
- All user-facing strings go through `t()` with keys in both locale files.
- Keep commits on the connected branch in a working state. If the project is synced with Lovable, avoid rewriting published git history (see `AGENTS.md`).
- Run `lint` and `typecheck` before opening a pull request.

---

## License

Add your license here (for example MIT) and include a `LICENSE` file.
