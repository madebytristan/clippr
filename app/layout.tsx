import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clippr — YouTube Auto-Clipper",
  description: "Auto-clip YouTube videos by section, generate transcripts, reframe for any aspect ratio.",
};

const CLERK_CONFIGURED =
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").length > 10 &&
  !(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").includes("REPLACE_ME");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (CLERK_CONFIGURED) {
    return (
      <ClerkProvider>
        <html lang="en">
          <body className="min-h-screen antialiased">{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
