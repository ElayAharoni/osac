# OSAC — VM-as-a-Service Frontend

OSAC is a fullstack demo application for an OpenShift-based VM-as-a-Service platform. It provides a multi-tenant UI built with React + PatternFly 6, backed by a Fastify BFF (Backend-for-Frontend) that can run against built-in mock data or proxy to a real upstream fulfillment API.

---

## Table of contents

- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick start (mock mode)](#quick-start-mock-mode)
- [Running modes explained](#running-modes-explained)
- [Demo personas and entry points](#demo-personas-and-entry-points)
- [What is implemented](#what-is-implemented)
- [What needs real integration or further testing](#what-needs-real-integration-or-further-testing)
- [Build and container](#build-and-container)
- [OpenShift deployment](#openshift-deployment)
- [Workspace scripts reference](#workspace-scripts-reference)
- [Project structure](#project-structure)

---

## Repository layout

```
osac/
├── apps/
│   ├── app-backend/        # Fastify BFF — serves API and embeds SPA in prod
│   ├── app-frontend/       # React SPA (PatternFly 6, React Router, TanStack Query)
│   └── e2e/                # Cypress end-to-end tests
├── libs/
│   ├── api-contracts/      # Shared TypeScript types + mock data
│   ├── config/             # Shared ESLint, Prettier, tsconfig base
│   └── ui-components/      # Shared PatternFly components (LightDarkToggle, VmStatusLabel, …)
├── deploy/
│   ├── dev/                # OpenShift manifests — development namespace
│   └── integration/        # OpenShift manifests — integration namespace
├── Containerfile           # Multi-stage build (SPA + BFF → single image)
└── package.json            # Root pnpm workspace scripts
```

---

## Prerequisites

| Tool    | Minimum version |
| ------- | --------------- |
| Node.js | 20              |
| pnpm    | 9               |

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

Install all workspace dependencies from the repo root:

```bash
pnpm install
```

---

## Quick start (mock mode)

Mock mode uses built-in fixture data — no external services needed.

Open **two terminals** from the repo root:

**Terminal 1 — BFF:**

```bash
pnpm dev:backend
# Server starts on http://localhost:3001
# Logs: {"msg":"OSAC BFF running at http://0.0.0.0:3001 [mode=mock]"}
```

**Terminal 2 — SPA:**

```bash
pnpm dev:frontend
# Vite dev server starts on http://localhost:5173
# All /api/* requests are proxied to :3001 automatically
```

Open [http://localhost:5173](http://localhost:5173).

---

## Running modes explained

### Mock mode (default)

The BFF serves all data from in-memory fixtures defined in `libs/api-contracts/src/mock-data.ts`. No upstream API is needed. VM state is persisted within the BFF process lifetime (restarting the BFF resets it).

```bash
# Explicit (same as default):
OSAC_API_MODE=mock pnpm dev:backend
```

Mocked endpoints:

| Endpoint                                           | Description                                   |
| -------------------------------------------------- | --------------------------------------------- |
| `GET /api/fulfillment/v1/compute_instances`        | List VMs (Northstar + Bluestone fixture data) |
| `POST /api/fulfillment/v1/compute_instances`       | Create VM (stored in process memory)          |
| `PATCH /api/fulfillment/v1/compute_instances/:id`  | Update VM power state / spec                  |
| `DELETE /api/fulfillment/v1/compute_instances/:id` | Delete VM                                     |
| `GET /api/fulfillment/v1/cluster_templates`        | List VM templates                             |
| `GET /api/fulfillment/v1/organizations`            | List tenant organizations                     |
| `GET /api/fulfillment/v1/virtual_networks`         | List virtual networks                         |
| `GET /api/fulfillment/v1/subnets`                  | List subnets                                  |
| `GET /api/fulfillment/v1/security_groups`          | List security groups                          |
| `GET /api/fulfillment/v1/capabilities`             | Auth capabilities stub                        |
| `GET /health`                                      | Health probe                                  |
| `GET /ready`                                       | Readiness probe                               |

### Dev mode (real upstream API)

The BFF acts as a transparent proxy to a real fulfillment API. The frontend code is **unchanged** — only the BFF environment changes.

```bash
OSAC_API_MODE=dev \
FULFILLMENT_API_URL=https://fulfillment.your-env.example.com \
pnpm dev:backend
```

The BFF forwards every `/api/fulfillment/v1/*` request to the upstream URL, passing through the `Authorization` header from the browser.

> **Note:** Authentication token acquisition is not yet implemented in the frontend (see [What needs real integration](#what-needs-real-integration-or-further-testing)).

### Environment variables reference (backend)

| Variable              | Default   | Description                                                                  |
| --------------------- | --------- | ---------------------------------------------------------------------------- |
| `PORT`                | `3001`    | BFF listen port                                                              |
| `HOST`                | `0.0.0.0` | BFF listen host                                                              |
| `LOG_LEVEL`           | `info`    | Fastify log level (`trace` / `debug` / `info` / `warn` / `error`)            |
| `OSAC_API_MODE`       | `mock`    | `mock` — built-in fixtures; `dev` — proxy to upstream                        |
| `FULFILLMENT_API_URL` | _(unset)_ | Required when `OSAC_API_MODE=dev`. Base URL of the upstream fulfillment API. |
| `NODE_ENV`            | _(unset)_ | Set to `production` in the container image                                   |

Copy `apps/app-backend/.env.example` to `apps/app-backend/.env` and adjust values for your environment.

---

## Demo personas and entry points

The welcome page (`/`) is a **booth operator entry screen**, not a customer-facing login. It uses **three role columns** (Provider Admin, Tenant Admin, Tenant User). Under **Tenant Admin** and **Tenant User**, pick **Northstar Bank** or **Bluestone Financial** to set `tenantId` + role, then continue to sign-in. **Provider Admin** uses **Enter** (Vertexa / cross-tenant context).

| Entry surface                    | Role            | What they see after login                                                            |
| -------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| **Provider Admin → Enter**       | `providerAdmin` | Cross-tenant dashboard, organizations, global templates, infrastructure topology      |
| **Tenant User → org button**     | `tenantUser`    | VM dashboard, My VMs, template catalog, recent activities                            |
| **Tenant Admin → org button**    | `tenantAdmin`   | Admin dashboard, users, quota, networks, template catalog                            |

All paths navigate to **`/sign-in`** in the **same tab**. Sign-in is a **single institutional screen** (`InstitutionalSignInPage`): copy, trusted-issuer alert, and accents follow the **selected tenant** via `components/login/institutionalBranding.ts` — there are no separate routed pages per bank.

You can also deep-link directly to a persona by appending a query parameter (cold load):

```
http://localhost:5173/?osac-entry=northstar-user
http://localhost:5173/?osac-entry=northstar-admin
http://localhost:5173/?osac-entry=evergreen-user
http://localhost:5173/?osac-entry=evergreen-admin
```

(`evergreen-*` is the **tenant id** for Bluestone Financial in code and config; the welcome UI labels it “Bluestone”.)

---

## What is implemented

### Frontend (React SPA)

| Area                               | Status | Notes                                                                 |
| ---------------------------------- | ------ | --------------------------------------------------------------------- |
| Welcome / role selection page      | ✅     | Three role columns; org buttons for tenant admin/user; Provider Enter |
| Institutional sign-in (`/sign-in`) | ✅     | One `InstitutionalSignInPage`; tenant-aware branding + `LoginForm`    |
| Application shell                  | ✅     | Masthead, role-based sidebar nav, breadcrumbs, light/dark toggle      |
| Tenant user dashboard              | ✅     | VM power-state stat cards, create VM                                 |
| My VMs — card view                 | ✅     | Power filter, search, card grid                                     |
| My VMs — table view                | ✅     | Compact sortable table                                              |
| VM detail drawer                   | ✅     | Overview, Networking, Conditions tabs; power actions                |
| Create VM wizard                   | ✅     | Modal wizard; steps under `components/vm/createVmWizard/`. POSTs to BFF. |
| Template catalog                   | ✅     | Searchable gallery, detail drawer, launches wizard                  |
| Recent activities feed             | ✅     | Derived from live VM list                                           |
| Tenant admin dashboard             | ✅     | Summary stats, navigation tiles                                     |
| Tenant admin — Users               | ✅     | Table of demo users                                                 |
| Tenant admin — Quota control       | ✅     | Resource consumption visualization                                  |
| Tenant admin — Networks            | ✅     | Network topology graph                                              |
| Provider admin dashboard           | ✅     | Cross-tenant summary, navigation tiles                              |
| Provider — Tenant organizations    | ✅     | Organization list                                                   |
| Provider — Infrastructure topology | ✅     | Platform-wide VM topology                                           |
| Provider — Global templates        | ✅     | Reuses template catalog (provisioning blocked for provider context) |
| Multi-tenant data isolation        | ✅     | Each tenant tab sees its own VM set                                 |
| Light / dark theme                 | ✅     | Per-tenant default, togglable in masthead                           |
| RBAC — nav and route guards        | ✅     | Nav items and routes are role-gated                                 |

### Backend (Fastify BFF)

| Area                      | Status | Notes                                                                |
| ------------------------- | ------ | -------------------------------------------------------------------- |
| Mock fulfillment routes   | ✅     | Full CRUD for VMs; read-only for templates, orgs, networks           |
| Upstream proxy (dev mode) | ✅     | Transparent forwarding with `Authorization` header passthrough       |
| Health / readiness probes | ✅     | `/health` and `/ready`                                               |
| SPA static file serving   | ✅     | Serves `public/` in production; SPA fallback for client-side routing |
| CORS                      | ✅     | Open in dev, disabled in production                                  |
| Event stream endpoint     | ✅     | `/api/events/v1/events` — mock SSE-style activity events             |
| Console access stub       | ✅     | `/api/osac/public/v1/console/*` — returns mock URLs                  |

### Shared libraries

| Library                                                          | Status |
| ---------------------------------------------------------------- | ------ |
| `@osac/api-contracts` — TypeScript types                         | ✅     |
| `@osac/api-contracts` — Mock data (VMs, templates, orgs, events) | ✅     |
| `@osac/ui-components` — `LightDarkToggle`                        | ✅     |
| `@osac/ui-components` — `VmStatusLabel`                          | ✅     |
| `@osac/ui-components` — `PlaceholderPage`                        | ✅     |
| `@osac/ui-components` — `NetworkTopologyPage`                    | ✅     |

---

## What needs real integration or further testing

The following areas work in mock mode but require additional work before connecting to a real environment:

### Authentication (highest priority)

- **No real auth token is acquired.** The institutional sign-in screen simulates a short loading delay then sets `isLoggedIn = true` client-side. No OIDC/OAuth flow, no JWT, no session cookie.
- **Integration needed:** Connect to the identity provider URL returned by `GET /api/fulfillment/v1/capabilities` (`authn.trustedTokenIssuers`). Implement PKCE or authorization-code flow. Attach the acquired token to all BFF requests.
- The BFF already passes `Authorization` headers through to the upstream in dev mode — the plumbing is ready once the frontend obtains a token.

### Per-tenant data scoping

- In mock mode, all tenants share the same `vmStore` in the BFF process. A real environment must scope requests by tenant (namespace, org ID, or equivalent). The frontend passes no tenant identifier in API calls today.
- **Integration needed:** Add a tenant header or use tenant-namespaced API paths. The BFF proxy must enforce tenant isolation or delegate it to the upstream.

### VM power actions (PATCH)

- Start / Stop / Restart in the VM detail drawer update local UI state only (`vmStates` Map in `VmListPage`). The `PATCH /api/fulfillment/v1/compute_instances/:id` endpoint exists in the BFF but is not called for power actions.
- **Integration needed:** Wire power action buttons to call `usePatchVm()` mutation with the new desired state, then poll or subscribe to status updates.

### VM deletion

- The delete endpoint exists in the BFF but there is no delete button in the UI.
- **Integration needed:** Add a Delete action to `VmActionsMenu`, call `DELETE /api/fulfillment/v1/compute_instances/:id`, then invalidate the query.

### VM creation — request body shape

- `CreateVmWizard` builds a local `ComputeInstance` object and POSTs it to the BFF. The mock BFF accepts `{ object: ComputeInstance }`. The real upstream may expect a different schema (e.g., `ComputeInstanceRequest` with only spec fields, no status).
- **Integration needed:** Confirm the upstream POST body schema and adjust `apps/app-frontend/src/api/client.ts` → `createComputeInstance()` accordingly.

### Quota page

- `AdminQuotaPage` displays static quota numbers from `libs/api-contracts/src/mock-data.ts`. There is no API call.
- **Integration needed:** Add a `/api/private/v1/quota` endpoint in the BFF and a `useQuota()` hook in the frontend.

### Users page

- `AdminUsersPage` shows a hardcoded list of demo users from mock data. There is no user management API.
- **Integration needed:** Add user list / invite / remove endpoints (private API) and wire the page to them.

### Real-time events / SSE

- The event stream endpoint (`/api/events/v1/events`) returns a static JSON array. A real implementation would use Server-Sent Events or WebSocket.
- **Integration needed:** Implement SSE streaming in the BFF and consume it with `EventSource` in the frontend.

### Network topology — real data

- `NetworkTopologyPage` groups VMs by their `spec.subnet` field. In mock data these are populated. A real environment must return `spec.subnet` (or equivalent) from the upstream.
- Test with real VMs to verify grouping logic.

### E2E tests — coverage

- Three Cypress specs exist: `welcome-and-role-selection`, `institutional-sign-in`, `application-shell-session`. They cover the happy path only.
- **Needed:** Specs for VM CRUD, wizard steps, admin flows, provider flows, and error states.

### Storybook

- `libs/ui-components` is configured for Storybook but no story files (`.stories.tsx`) exist.
- **Needed:** Stories for `LightDarkToggle`, `VmStatusLabel`, `PlaceholderPage`, `NetworkTopologyPage`.

### Placeholder pages

- Several sidebar nav items navigate to routes that render `<PlaceholderPage />`:
  - `/admin/storage` — Storage
  - `/admin/org-settings` — Organization settings
  - `/admin/security` — Security & Compliance (tenant)
  - `/provider/allocation` — Resource allocation
  - `/provider/security` — Security & Compliance (provider)
  - `/provider/settings` — Platform settings

---

## Build and container

### Production build (SPA + BFF compiled)

```bash
pnpm build
```

This runs `tsc` on the backend and `vite build` on the frontend. The SPA output lands in `apps/app-backend/public/` so the BFF can serve it.

### Container image

```bash
# Build
podman build -t osac:latest -f Containerfile .

# Run in mock mode
podman run --rm -p 8080:8080 -e OSAC_API_MODE=mock osac:latest

# Run in dev/proxy mode
podman run --rm -p 8080:8080 \
  -e OSAC_API_MODE=dev \
  -e FULFILLMENT_API_URL=https://fulfillment.your-env.example.com \
  osac:latest
```

The container exposes port `8080`. The BFF serves the SPA at `/` and the API at `/api/*`.

---

## OpenShift deployment

Manifests live in `deploy/dev/` and `deploy/integration/`.

```bash
# Create namespace
oc new-project osac-dev

# Apply all manifests
oc apply -f deploy/dev/

# Watch rollout
oc rollout status deployment/osac -n osac-dev
```

The `configmap.yaml` in each environment folder controls `OSAC_API_MODE`, `FULFILLMENT_API_URL`, and `LOG_LEVEL`. Edit it before applying to switch between mock and real API modes.

To expose the service externally:

```bash
oc expose svc/osac -n osac-dev
oc get route osac -n osac-dev
```

---

## Workspace scripts reference

Run all scripts from the **repo root**:

| Script                 | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `pnpm dev:backend`     | Start BFF in mock mode with hot-reload (`tsx watch`) |
| `pnpm dev:frontend`    | Start Vite dev server with HMR on `:5173`            |
| `pnpm build`           | Production build for all packages                    |
| `pnpm lint`                 | ESLint across all packages                              |
| `pnpm check:pf-primitives` | Guardrail: disallowed raw HTML for layout in `app-frontend` |
| `pnpm test`                 | Vitest unit tests across all packages                   |
| `pnpm storybook`            | Start Storybook for `@osac/ui-components`               |
| `pnpm build-storybook`      | Build static Storybook                                  |
| `pnpm e2e:ci`               | Run Cypress E2E tests headlessly                        |

---

## Project structure

```
libs/api-contracts/src/
  types.ts          # All shared TypeScript interfaces (ComputeInstance, ClusterTemplate, …)
  mock-data.ts      # Fixture data — VMs, templates, orgs, users, quota, events
  index.ts          # Re-exports everything

apps/app-frontend/src/
  App.tsx           # Routes: /, /sign-in, /* → AppShell when logged in
  api/
    client.ts       # Typed fetch functions → /api/fulfillment/v1/*
    hooks.ts        # TanStack Query hooks (useComputeInstances, useClusterTemplates, …)
  contexts/
    SessionContext.tsx  # Auth state, tenant/role, theme, topology handoff, persona selection
  pages/
    auth/
      WelcomePage.tsx     # Role columns + org entry (welcome-and-role-selection)
      SignInPage.tsx      # Wraps InstitutionalSignInPage (institutional-sign-in)
      index.ts            # Barrel re-exports
    shell/
      AppShell.tsx        # Authenticated chrome + nested routes
      ShellMasthead.tsx   # Masthead, sovereignty strip, toolbar, user menu
      ShellSidebar.tsx    # Role-based nav (see shellNav.ts)
      ShellBreadcrumb.tsx
      shellNav.ts         # Nav model per role
      shellRoutes.ts      # Placeholder routes for admin/provider
      index.ts
    tenant/               # Tenant user surfaces (VMaaS)
      DashboardPage.tsx, VmListPage.tsx, CatalogPage.tsx, RecentActivitiesPage.tsx
      index.ts
    admin/                # Tenant admin
      AdminDashboardPage.tsx, AdminUsersPage.tsx, AdminQuotaPage.tsx, AdminNetworksPage.tsx
      index.ts
    provider/             # Provider admin
      ProviderAdminDashboardPage.tsx, ProviderTenantOrgsPage.tsx, ProviderInfraTopologyPage.tsx
      index.ts
  components/
    layout/
      PageHeader.tsx      # Shared page title + optional description + actions
      index.ts
    dashboard/            # Tenant dashboard tiles / metrics (where used)
    login/
      InstitutionalSignInPage.tsx  # Single sign-in shell; uses institutionalBranding.ts
      LoginForm.tsx                # Shared email/password form
      institutionalBranding.ts     # Per-tenant strings and trusted-issuer copy
    vm/
      CreateVmWizard.tsx           # Modal orchestrator + ref handle (open / template / clone)
      createVmWizard/              # Wizard steps, types, constants, stepIds
      VmDetailDrawer.tsx, VmTable.tsx, VmActionsMenu.tsx, TemplateCard.tsx, …

apps/app-backend/src/
  index.ts          # Fastify server bootstrap
  routes/
    fulfillment.ts  # /api/fulfillment/v1/* — mock + proxy
    events.ts       # /api/events/v1/events — activity events
    console.ts      # /api/osac/public/v1/console/* — console access stub
```

**Routing recap:** `App.tsx` imports shell and auth pages from `pages/shell` and `pages/auth`. Logged-in routes live under `AppShell` (`pages/shell/AppShell.tsx`) and map to `tenant/*`, `admin/*`, and `provider/*` paths per role (see `docs/specs/ui-flows/application-shell-session.yaml` for the canonical matrix).
