import {
  argument,
  dag,
  func,
  object,
  type Directory,
} from "@dagger.io/dagger";

const DUMMY_DATABASE_URL =
  "postgresql://ci:ci@127.0.0.1:65432/ci?schema=public";

@object()
export class Ci {
  /**
   * One CI entrypoint; runs five sequential commands in the container:
   * npm ci → prisma generate → lint → typecheck → build.
   * From repo root (no `--source` needed): dagger call ci check
   */
  @func()
  async check(
    @argument({
      defaultPath: ".",
      ignore: [
        ".git",
        "**/node_modules",
        ".next",
        "dist",
        "build",
        ".turbo",
        "dagger/sdk",
      ],
    })
    source: Directory,
  ): Promise<void> {
    await dag
      .container()
      .from("node:20-bookworm-slim")
      .withWorkdir("/src")
      .withEnvVariable("DATABASE_URL", DUMMY_DATABASE_URL)
      .withEnvVariable("NEXT_TELEMETRY_DISABLED", "1")
      .withMountedDirectory("/src", source)
      .withExec(["npm", "ci"])
      .withExec(["npx", "prisma", "generate"])
      .withExec(["npm", "run", "lint"])
      .withExec(["npm", "run", "typecheck"])
      .withExec(["npm", "run", "build"])
      .sync();
  }
}
