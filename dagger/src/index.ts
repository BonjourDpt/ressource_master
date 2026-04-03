import {
  argument,
  dag,
  func,
  object,
  type Directory,
} from "@dagger.io/dagger";

/** App root mounted in Node; excludes local artefacts for smaller uploads and clearer caching. */
function nodeWithDeps(source: Directory) {
  return dag
    .container()
    .from("node:22-bookworm-slim")
    .withDirectory("/app", source, {
      exclude: ["node_modules", ".next", "dagger/node_modules"],
    })
    .withWorkdir("/app")
    .withMountedCache("/root/.npm", dag.cacheVolume("npm-ci-ressource-master"))
    .withExec(["npm", "ci"]);
}

@object()
export class RessourceMaster {
  @func()
  async lint(
    @argument({ defaultPath: "." }) source: Directory,
  ): Promise<string> {
    return await nodeWithDeps(source).withExec(["npm", "run", "lint"]).stdout();
  }

  @func()
  async typecheck(
    @argument({ defaultPath: "." }) source: Directory,
  ): Promise<string> {
    return await nodeWithDeps(source)
      .withExec(["npm", "run", "typecheck"])
      .stdout();
  }

  @func()
  async build(
    @argument({ defaultPath: "." }) source: Directory,
  ): Promise<string> {
    const postgres = dag
      .container()
      .from("postgres:16-alpine")
      .withEnvVariable("POSTGRES_USER", "ci")
      .withEnvVariable("POSTGRES_PASSWORD", "ci")
      .withEnvVariable("POSTGRES_DB", "ci")
      .withExposedPort(5432)
      .asService({ useEntrypoint: true });

    return await nodeWithDeps(source)
      .withServiceBinding("postgres", postgres)
      .withEnvVariable(
        "DATABASE_URL",
        "postgresql://ci:ci@postgres:5432/ci",
      )
      .withExec([
        "bash",
        "-lc",
        "set -euo pipefail && npx prisma migrate deploy && npx prisma generate && npm run build",
      ])
      .stdout();
  }

  @func()
  async ci(
    @argument({ defaultPath: "." }) source: Directory,
  ): Promise<string> {
    const [lintOut, typecheckOut, buildOut] = await Promise.all([
      this.lint(source),
      this.typecheck(source),
      this.build(source),
    ]);

    return [
      "=== lint ===",
      lintOut,
      "",
      "=== typecheck ===",
      typecheckOut,
      "",
      "=== build ===",
      buildOut,
    ].join("\n");
  }
}
