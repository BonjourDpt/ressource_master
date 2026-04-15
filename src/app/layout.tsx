import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AppShell } from "@/components/app-shell/AppShell";
import { AppToaster } from "@/components/app-shell/AppToaster";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import { DeveloperSetupError } from "@/components/developer-setup-error";
import { parseDeveloperDbSetupFailure } from "@/lib/developer-db-setup";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RESOURCE PLANNER",
  description: "Internal resource planning MVP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let resourceCount = 0;
  let projectCount = 0;

  try {
    [resourceCount, projectCount] = await Promise.all([
      db.resource.count({ where: { status: "ACTIVE" } }),
      db.project.count({ where: { status: "ACTIVE" } }),
    ]);
  } catch (err) {
    const failure = parseDeveloperDbSetupFailure(err);
    if (failure && process.env.NODE_ENV === "development") {
      return (
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <Script id="rm-theme-bootstrap" strategy="beforeInteractive">
              {THEME_BOOTSTRAP_SCRIPT}
            </Script>
            <DeveloperSetupError failure={failure} />
          </body>
        </html>
      );
    }
    if (failure && process.env.NODE_ENV === "production") {
      return (
        <html lang="en" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            style={{
              margin: 0,
              minHeight: "100vh",
              display: "grid",
              placeItems: "center",
              padding: "1.5rem",
              textAlign: "center",
            }}
          >
            <Script id="rm-theme-bootstrap" strategy="beforeInteractive">
              {THEME_BOOTSTRAP_SCRIPT}
            </Script>
            <p style={{ margin: 0, color: "var(--rm-muted)", maxWidth: "28rem" }}>
              The application could not connect to the database. Ensure DATABASE_URL is
              correct and migrations have been applied. See server logs and docs/SETUP.md
              in the repository.
            </p>
          </body>
        </html>
      );
    }
    throw err;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script id="rm-theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
        <AppShell resourceCount={resourceCount} projectCount={projectCount}>
          {children}
        </AppShell>
        <AppToaster />
      </body>
    </html>
  );
}
