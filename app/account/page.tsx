"use client";

export const dynamic = "force-dynamic";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-[#0f0f1a] p-5">
      <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5 border-b border-surface-border/50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-right break-all ${
          mono ? "font-mono text-[11px] text-gray-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // Loading skeleton
  if (!isLoaded) {
    return (
      <AppShell>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
            <div className="h-7 w-40 rounded-lg bg-surface-hover animate-pulse mb-6" />
            <div className="h-28 rounded-2xl bg-surface-hover animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-52 rounded-2xl bg-surface-hover animate-pulse" />
              <div className="h-52 rounded-2xl bg-surface-hover animate-pulse" />
            </div>
            <div className="h-28 rounded-2xl bg-surface-hover animate-pulse" />
            <div className="h-36 rounded-2xl bg-surface-hover animate-pulse" />
          </div>
        </main>
      </AppShell>
    );
  }

  if (!user) {
    router.push("/sign-in");
    return null;
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "—";
  const phone = user.phoneNumbers[0]?.phoneNumber ?? null;
  const createdAt = user.createdAt ? new Date(user.createdAt) : null;
  const isEmailVerified =
    user.primaryEmailAddress?.verification?.status === "verified";
  const googleAccount = user.externalAccounts.find(
    (a) => a.provider === "google"
  );

  // Plan / credits — replace with real billing data when available
  const creditsUsed = 3;
  const creditsTotal = 10;
  const creditsPct = Math.round((creditsUsed / creditsTotal) * 100);

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

          {/* Page heading */}
          <div>
            <h1 className="text-lg font-semibold text-white">My Account</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your profile, plan, and usage
            </p>
          </div>

          {/* ── Profile header ── */}
          <div className="rounded-2xl border border-surface-border bg-[#0f0f1a] p-5 flex items-center gap-5">
            {/* Avatar */}
            {user.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt={user.fullName ?? "Avatar"}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-accent/30 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/20 ring-2 ring-accent/30 flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-accent">
                  {(
                    user.firstName?.[0] ??
                    user.emailAddresses[0]?.emailAddress[0] ??
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold text-base">
                  {user.fullName || user.username || "Clippr User"}
                </span>
                {isEmailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3 h-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.307 4.491 4.491 0 01-1.307-3.497A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 truncate mt-0.5">{email}</p>
              {createdAt && (
                <p className="text-xs text-gray-600 mt-1">
                  Member since {formatDate(createdAt)}
                </p>
              )}
            </div>
          </div>

          {/* ── Two-col row: Account Details + Plan ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Account Details */}
            <SectionCard title="Account Details">
              <InfoRow label="First Name" value={user.firstName || "—"} />
              <InfoRow label="Last Name" value={user.lastName || "—"} />
              <InfoRow label="Email" value={email} />
              {user.username && (
                <InfoRow label="Username" value={`@${user.username}`} />
              )}
              {phone && <InfoRow label="Phone" value={phone} />}
              <InfoRow label="User ID" value={user.id} mono />
            </SectionCard>

            {/* Plan & Billing */}
            <SectionCard title="Plan & Billing">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-surface-border/50">
                  <span className="text-sm text-gray-500">Current Plan</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-hover text-gray-300 text-xs font-semibold uppercase tracking-wide">
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-surface-border/50">
                  <span className="text-sm text-gray-500">Billing Cycle</span>
                  <span className="text-sm text-gray-300">—</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-surface-border/50">
                  <span className="text-sm text-gray-500">Next Renewal</span>
                  <span className="text-sm text-gray-300">—</span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">Payment Method</span>
                  <span className="text-sm text-gray-300">—</span>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full mt-1 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold text-center transition-colors"
                >
                  Upgrade to Pro
                </Link>
              </div>
            </SectionCard>
          </div>

          {/* ── Credits ── */}
          <SectionCard title="AI Credits">
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold text-white tabular-nums">
                    {creditsUsed}
                  </span>
                  <span className="text-sm text-gray-500 ml-1.5">
                    / {creditsTotal} credits used this month
                  </span>
                </div>
                <span className="text-xs text-gray-500 pb-1">
                  Resets monthly
                </span>
              </div>

              {/* Progress track */}
              <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-violet-400 transition-all duration-500"
                  style={{ width: `${creditsPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {creditsTotal - creditsUsed} credits remaining
                </span>
                <Link
                  href="/pricing"
                  className="text-accent-light hover:underline"
                >
                  Get more credits
                </Link>
              </div>

              {/* Credit breakdown */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Clips Generated", value: "3" },
                  { label: "Transcripts", value: "0" },
                  { label: "Downloads", value: "2" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-surface-hover/60 px-3 py-2.5 text-center"
                  >
                    <p className="text-base font-bold text-white tabular-nums">
                      {value}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* ── Connected Accounts ── */}
          <SectionCard title="Connected Accounts">
            <div className="space-y-1">

              {/* Google */}
              <div className="flex items-center justify-between py-3 border-b border-surface-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Google</p>
                    <p className="text-xs text-gray-500">
                      {googleAccount
                        ? googleAccount.emailAddress
                        : "Not connected"}
                    </p>
                  </div>
                </div>
                {googleAccount ? (
                  <span className="text-xs text-emerald-400 font-medium">
                    Connected
                  </span>
                ) : (
                  <button className="text-xs text-accent-light hover:text-accent transition-colors">
                    Connect
                  </button>
                )}
              </div>

              {/* Email / Password */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-hover flex items-center justify-center shrink-0">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="w-4 h-4 text-gray-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Email</p>
                    <p className="text-xs text-gray-500">{email}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    isEmailVerified ? "text-emerald-400" : "text-yellow-400"
                  }`}
                >
                  {isEmailVerified ? "Verified" : "Unverified"}
                </span>
              </div>
            </div>
          </SectionCard>

          {/* ── Sign Out ── */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Sign Out</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sign out of your Clippr account on this device
              </p>
            </div>
            <button
              onClick={() => signOut(() => router.push("/"))}
              className="px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
            >
              Sign Out
            </button>
          </div>

        </div>
      </main>
    </AppShell>
  );
}
