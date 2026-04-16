---
name: Prisma config migration
overview: Silence the CI warning by moving the seed command from deprecated `package.json#prisma` to a root `prisma.config.ts`, staying on Prisma 6.19.x (no major upgrade required).
todos:
  - id: add-prisma-config
    content: Add root prisma.config.ts with schema, migrations.path, migrations.seed (tsx prisma/seed.ts)
    status: completed
  - id: remove-package-json-prisma
    content: Remove package.json "prisma" block
    status: completed
  - id: verify-cli
    content: Run prisma generate and prisma db seed to confirm no warning and same seed behavior
    status: completed
  - id: docs-devlog
    content: Update SETUP/FUTURE_IMPROVEMENTS as needed; append DEV_LOG per documentation-sync
    status: completed
isProject: false
---

# Migrate Prisma seed config off `package.json`

## What triggers the warning

[`package.json`](c:\Users\Laurene\Documents\GitHub\ressource_master\package.json) defines:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Prisma 6.19 prints a deprecation notice because this block will be removed in Prisma 7. Your schema already lives in [`prisma/schema.prisma`](c:\Users\Laurene\Documents\GitHub\ressource_master\prisma\schema.prisma); only the **seed** needs migrating.

The **“Update available 6.19.2 → 7.7.0”** box is separate: upgrading majors is optional for fixing the warning and should follow [Prisma’s upgrade guide](https://www.pris.ly/d/major-version-upgrade) when you choose to do it.

## Recommended change (stay on Prisma 6)

1. **Add** [`prisma.config.ts`](c:\Users\Laurene\Documents\GitHub\ressource_master\prisma.config.ts) at the repo root with the supported shape (see [Prisma config reference](https://www.prisma.io/docs/orm/reference/prisma-config-reference) and [seeding docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding)):

   - `schema: "prisma/schema.prisma"` (explicit path, matches your layout)
   - `migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" }` (same command as today)

   Use `import { defineConfig } from "prisma/config"` (ships with the `prisma` devDependency you already have).

   **Optional later:** Official examples often add `import "dotenv/config"` and `datasource: { url: env("DATABASE_URL") }` when you want the config file to own env wiring. Your datasource URL remains in the schema today; you can keep the minimal file first and only add those lines if local/CI seeding ever fails to see `DATABASE_URL`.

2. **Remove** the entire `"prisma": { ... }` block from [`package.json`](c:\Users\Laurene\Documents\GitHub\ressource_master\package.json).

3. **Verify locally (and in CI mentally):**

   - `npx prisma generate` — should run **without** the deprecation line.
   - `npm run prisma:seed` / `npx prisma db seed` — should still run `tsx prisma/seed.ts` (same behavior as before).

   No workflow changes are required in [`.github/workflows/ci-deploy.yml`](c:\Users\Laurene\Documents\GitHub\ressource_master\.github\workflows\ci-deploy.yml); it already runs `npx prisma generate` from the repo root.

4. **Docs / housekeeping**

   - [`docs/SETUP.md`](c:\Users\Laurene\Documents\GitHub\ressource_master\docs\SETUP.md) documents `npm run prisma:seed` only; a short note that seed is configured in `prisma.config.ts` avoids confusion for contributors.
   - [`docs/FUTURE_IMPROVEMENTS.md`](c:\Users\Laurene\Documents\GitHub\ressource_master\docs\FUTURE_IMPROVEMENTS.md) already mentions moving seed to `prisma.config.ts` “when upgrading to Prisma 7+” — update or remove that bullet once this is done.
   - Per workspace [documentation-sync](c:\Users\Laurene\Documents\GitHub\ressource_master\.cursor\skills\documentation-sync\SKILL.md): append a factual entry to [`docs/DEV_LOG.md`](c:\Users\Laurene\Documents\GitHub\ressource_master\docs\DEV_LOG.md) when implementing (touches Prisma/CI-adjacent tooling).

## TypeScript / tooling notes

- Root [`tsconfig.json`](c:\Users\Laurene\Documents\GitHub\ressource_master\tsconfig.json) already includes `**/*.ts`, so `prisma.config.ts` is picked up for editor/typecheck consistency.

## Out of scope (unless you ask)

- Bumping `prisma` / `@prisma/client` to 7.x — separate effort with breaking changes per Prisma’s major guide.
