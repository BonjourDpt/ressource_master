import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AppShell } from "@/components/app-shell/AppShell";
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
  title: "Resource Master",
  description: "Internal resource planning MVP",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [resourceCount, projectCount] = await Promise.all([
    db.resource.count({ where: { status: "ACTIVE" } }),
    db.project.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell resourceCount={resourceCount} projectCount={projectCount}>
          {children}
        </AppShell>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--rm-surface-elevated)",
              border: "1px solid var(--rm-border)",
              color: "var(--rm-fg)",
            },
          }}
        />
      </body>
    </html>
  );
}
