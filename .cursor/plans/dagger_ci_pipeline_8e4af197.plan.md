---
name: Dagger CI Pipeline
overview: Add a minimal Dagger-based CI that validates install, lint, typecheck, and build -- with a one-line app change to avoid requiring a live database at build time.
todos:
  - id: layout-dynamic
    content: Add `export const dynamic = 'force-dynamic'` to src/app/layout.tsx to prevent build-time DB access
    status: pending
  - id: typecheck-script
    content: Add `typecheck` script to package.json
    status: pending
  - id: dagger-module
    content: "Create Dagger module: dagger.json, dagger/src/index.ts, dagger/package.json, dagger/tsconfig.json"
    status: pending
  - id: github-actions
    content: Create .github/workflows/ci.yml with dagger-for-github action
    status: pending
  - id: gitignore
    content: Add dagger/sdk to .gitignore
    status: pending
isProject: false
---

# Dagger CI Pipeline

## Problem: `next build` requires a live database

The root layout (`[src/app/layout.tsx](src/app/layout.tsx)`, lines 28-31) runs Prisma queries at render time:

```typescript
const [resourceCount, projectCount] = await Promise.all([
  db.resource.count({ where: { status: "ACTIVE" } }),
  db.project.count({ where: { status: "ACTIVE" } }),
]);
```

If Next.js tries to prerender any route during `next build`, it executes this layout and hits the DB. Several pages (`resources/page.tsx`, `projects/page.tsx`, `planning/page.tsx`) also query the DB directly.

## Simplest fix: force all routes to be dynamic

Add one line to `src/app/layout.tsx`:

```typescript
export const dynamic = "force-dynamic";
```

This tells Next.js to skip prerendering for all routes under this layout. The build still compiles and typechecks all code, but never executes server components. This is the correct behavior for a resource management app with live data anyway.

With this change, `next build` needs only a generated Prisma client (from `prisma generate`), not a live database. `prisma generate` itself only reads the schema file -- it does not connect to the DB. A dummy `DATABASE_URL` is sufficient.

## CI checks (sequential)


| Step               | Command               | Why                                                     |
| ------------------ | --------------------- | ------------------------------------------------------- |
| 1. Install         | `npm ci`              | Validates lockfile and dependency resolution            |
| 2. Prisma generate | `npx prisma generate` | Generates the `@prisma/client` types (no DB connection) |
| 3. Lint            | `npm run lint`        | Catches ESLint / Next.js lint issues                    |
| 4. Typecheck       | `npm run typecheck`   | Catches type errors (`tsc --noEmit`)                    |
| 5. Build           | `npm run build`       | Catches build-time errors (imports, configs, etc.)      |


These four checks (install, lint, typecheck, build) catch the vast majority of breakages from autonomous development. No tests are added because none exist in the repo.

## Deliverables

### 1. App change: `[src/app/layout.tsx](src/app/layout.tsx)`

Add `export const dynamic = "force-dynamic"` before the default export to prevent build-time DB access.

### 2. Script addition: `[package.json](package.json)`

Add to scripts:

```json
"typecheck": "tsc --noEmit"
```

### 3. Dagger module (4 files)

- `**dagger.json**` -- root module config pointing to `dagger/` source with TypeScript SDK
- `**dagger/src/index.ts**` -- single `Ci` class with one `check(source: Directory)` function that runs the 5 steps sequentially in a `node:20-slim` container, with a dummy `DATABASE_URL`
- `**dagger/package.json**` -- declares `@dagger.io/dagger` dependency
- `**dagger/tsconfig.json**` -- minimal TS config for the module

The `source` Directory argument will use `defaultPath: "."` and `ignore` patterns for `.git`, `node_modules`, `.next`, `dist`, `build`, `.turbo` so heavy/generated folders are excluded from the build context.

Local invocation:

```bash
dagger call check
```

### 4. GitHub Actions workflow: `.github/workflows/ci.yml`

- Triggers on `push` to `main` and `pull_request`
- Uses `dagger/dagger-for-github@v8.3.0` with `version: "latest"`
- Checks out code, then runs `check --source .`
- No secrets needed (no DB, no cloud tokens)

### 5. Gitignore addition: `[.gitignore](.gitignore)`

Add `dagger/sdk` -- Dagger auto-generates SDK files there that should not be committed.

## Risks and assumptions

- `**export const dynamic` from layout**: This is a documented Next.js Route Segment Config option supported in layouts since Next.js 13. It should work in Next.js 16. If not, the fallback is adding it to each individual `page.tsx` (4 files).
- **Prisma generate with dummy URL**: `prisma generate` (v6.19+) does not connect to the database. A dummy `DATABASE_URL` is sufficient. If a future Prisma version validates the URL during generate, a quick fix is to add a schema-level `env` override.
- **No test step**: No tests exist. When tests are added later, a 6th step can be appended to the Dagger function.
- **Node.js version**: Using `node:20-slim` (LTS). If the project pins a different version, the Dagger base image should match.

