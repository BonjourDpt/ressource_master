import type { DeveloperSetupFailure } from "@/lib/developer-db-setup";

type Props = {
  failure: DeveloperSetupFailure;
};

export function DeveloperSetupError({ failure }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem 1.5rem",
        maxWidth: "42rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <header>
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--rm-warning)",
          }}
        >
          Developer setup
        </p>
        <h1
          style={{
            margin: "0.35rem 0 0",
            fontSize: "1.25rem",
            fontWeight: 600,
            lineHeight: 1.35,
            color: "var(--rm-fg)",
          }}
        >
          {failure.title}
        </h1>
        <p style={{ margin: "0.75rem 0 0", color: "var(--rm-muted)", lineHeight: 1.55 }}>
          {failure.summary}
        </p>
      </header>

      <section>
        <h2
          style={{
            margin: 0,
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--rm-muted-subtle)",
          }}
        >
          Likely causes
        </h2>
        <ul
          style={{
            margin: "0.5rem 0 0",
            paddingLeft: "1.15rem",
            color: "var(--rm-muted)",
            lineHeight: 1.6,
          }}
        >
          {failure.causes.map((c) => (
            <li key={c} style={{ marginBottom: "0.35rem" }}>
              {c}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2
          style={{
            margin: 0,
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--rm-muted-subtle)",
          }}
        >
          What to do
        </h2>
        <ol
          style={{
            margin: "0.5rem 0 0",
            paddingLeft: "1.15rem",
            color: "var(--rm-fg)",
            lineHeight: 1.65,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            fontSize: "0.8125rem",
          }}
        >
          {failure.steps.map((s) => (
            <li key={s} style={{ marginBottom: "0.4rem" }}>
              {s}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
