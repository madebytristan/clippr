"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

/**
 * A Sign Up / Open App CTA button used on landing + pricing pages.
 * Only rendered inside ClerkProvider.
 */
export function ClerkSignUpCTA({ className }: { className?: string }) {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link href="/app" className={className}>
        Open App
      </Link>
    );
  }
  return (
    <SignUpButton mode="modal">
      <button className={className}>Get Started</button>
    </SignUpButton>
  );
}

/**
 * Hero section auth CTA pair — Create Account (filled) + Log In (ghost).
 * Shows "Open App" when already signed in.
 */
export function ClerkHeroCTA() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;
  if (isSignedIn) {
    return (
      <Link
        href="/app"
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold"
      >
        Open App
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <SignUpButton mode="modal">
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold shadow-[0_0_20px_4px_rgba(124,58,237,0.35)]">
          Create Account
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </SignUpButton>
      <SignInButton mode="modal">
        <button className="px-6 py-2.5 rounded-full border border-surface-border text-sm text-gray-300 hover:border-accent/50 hover:text-white font-medium transition-colors">
          Log In
        </button>
      </SignInButton>
    </div>
  );
}

/** Sidebar bottom — shows UserButton when signed in, nothing when signed out */
export function ClerkSidebarUser() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded || !isSignedIn) return null;
  return <UserButton afterSignOutUrl="/" />;
}

/** Topbar right — shows Log In + Create Account when signed out, avatar + Open App when signed in */
export function ClerkTopbarButtons() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="w-32 h-7 rounded-lg bg-surface-border animate-pulse" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <Link
          href="/app"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold"
        >
          Open App
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <button className="px-3 py-1.5 rounded-lg border border-surface-border text-sm text-gray-300 hover:border-accent/50 hover:text-white font-medium transition-colors">
          Log In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-semibold transition-colors">
          Create Account
        </button>
      </SignUpButton>
    </div>
  );
}
