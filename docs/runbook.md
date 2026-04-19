# OSAC runbook

## Local development

1. `pnpm install`
2. `OSAC_API_MODE=mock pnpm --filter @osac/osac-backend run dev`
3. `pnpm --filter @osac/osac-frontend run dev`
4. Open `http://localhost:5173`
5. For fulfillment proxy mode: `OSAC_API_MODE=dev FULFILLMENT_API_URL=https://<host>/api pnpm --filter @osac/osac-backend run dev`

## Storybook

- Run: `pnpm storybook`
- Build static: `pnpm build-storybook`

## Validation

- Lint: `pnpm lint`
- Test: `pnpm test`
- Build: `pnpm build`
- E2E: `pnpm e2e:ci`

## Container

- `podman build -t osac:latest -f Containerfile .`
- `podman run --rm -p 8080:8080 osac:latest`

## OpenShift

- Apply manifests from `deploy/dev` or `deploy/integration`.
