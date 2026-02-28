"use client";

import { useState } from "react";
import Link from "next/link";
import { ClerkSignUpCTA } from "@/components/ClerkAuthArea";
import AppShell from "@/components/AppShell";

const CLERK_CONFIGURED =
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").length > 10 &&
  !(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").includes("REPLACE_ME");

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanTier {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  originalMonthly: number;
  originalYearly: number;
  credits: number;
  highlight?: boolean;
  badge?: string;
  usage: {
    aiClipping: string;
    findMoments: string;
    subtitles: string;
    summaries: string;
    transcript: string;
  };
  features: string[];
}

// ── Plan data ─────────────────────────────────────────────────────────────────

const PLANS: PlanTier[] = [
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: 4.99,
    yearlyPrice: 1.74,
    originalMonthly: 13.99,
    originalYearly: 4.99,
    credits: 1500,
    usage: {
      aiClipping: "30 mins/mo",
      findMoments: "30 mins/mo",
      subtitles: "30 mins/mo",
      summaries: "30 mins/mo",
      transcript: "Unlimited",
    },
    features: [
      "Timeline-based editor",
      "Download clips (720p)",
      "Upload videos up to 500MB",
      "7-day clip storage",
      "5 projects",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 13.49,
    yearlyPrice: 4.72,
    originalMonthly: 26.99,
    originalYearly: 13.49,
    credits: 3500,
    highlight: true,
    badge: "Most Popular",
    usage: {
      aiClipping: "90 mins/mo",
      findMoments: "90 mins/mo",
      subtitles: "90 mins/mo",
      summaries: "90 mins/mo",
      transcript: "Unlimited",
    },
    features: [
      "Everything in Standard",
      "Download clips (1080p)",
      "Upload videos up to 2GB",
      "30-day clip storage",
      "Unlimited projects",
      "Priority processing",
      "API access",
    ],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    monthlyPrice: 69.99,
    yearlyPrice: 24.49,
    originalMonthly: 139.99,
    originalYearly: 69.99,
    credits: 20000,
    usage: {
      aiClipping: "600 mins/mo",
      findMoments: "600 mins/mo",
      subtitles: "600 mins/mo",
      summaries: "600 mins/mo",
      transcript: "Unlimited",
    },
    features: [
      "Everything in Pro",
      "Download clips (4K)",
      "Upload videos up to 10GB",
      "Unlimited storage",
      "Unlimited projects",
      "Dedicated processing queue",
      "Custom watermarks",
      "Team seats (up to 5)",
    ],
  },
];

// ── Check icon ────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 shrink-0 text-accent-light">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ── Usage row ─────────────────────────────────────────────────────────────────

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 font-medium">{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-10">

          {/* ── Page header ── */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Simple, Transparent Pricing</h1>
            <p className="text-gray-400 text-sm">Start free. Scale as you grow.</p>
          </div>

          {/* ── Billing toggle ── */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className={`text-sm font-medium ${!yearly ? "text-white" : "text-gray-500"}`}>Monthly</span>
            <button
              onClick={() => setYearly((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${yearly ? "bg-accent" : "bg-surface-border"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${yearly ? "translate-x-[22px]" : "translate-x-0.5"}`}
              />
            </button>
            <span className={`text-sm font-medium ${yearly ? "text-white" : "text-gray-500"}`}>Yearly</span>
            {yearly && (
              <span className="text-xs font-semibold text-accent-light bg-accent-muted/60 border border-accent/30 px-2 py-0.5 rounded-full">
                65% OFF
              </span>
            )}
          </div>

          {/* ── Main plan cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {PLANS.map((plan) => {
              const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
              const crossed = yearly ? plan.originalYearly : plan.originalMonthly;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 flex flex-col border ${
                    plan.highlight
                      ? "border-accent bg-surface-card ring-1 ring-accent/40"
                      : "border-surface-border bg-surface-card"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-semibold text-white bg-accent px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan name */}
                  <h2 className="text-base font-semibold text-white mb-3">{plan.name}</h2>

                  {/* Credits */}
                  <div className="text-xs text-gray-500 mb-4">
                    <span className="text-accent-light font-semibold text-sm">{plan.credits.toLocaleString()}</span>{" "}
                    credits / month
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-2">
                      <span
                        className="text-4xl font-bold text-white"
                        style={{
                          background: plan.highlight
                            ? "linear-gradient(135deg, #c084fc 0%, #a78bfa 50%, #7c3aed 100%)"
                            : undefined,
                          WebkitBackgroundClip: plan.highlight ? "text" : undefined,
                          WebkitTextFillColor: plan.highlight ? "transparent" : undefined,
                          backgroundClip: plan.highlight ? "text" : undefined,
                        }}
                      >
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-sm mb-1">/ mo</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-600 line-through text-sm">${crossed.toFixed(2)}/mo</span>
                      {yearly && (
                        <span className="text-xs text-accent-light">billed yearly</span>
                      )}
                    </div>
                  </div>

                  {/* Subscribe button */}
                  {CLERK_CONFIGURED ? (
                    <ClerkSignUpCTA
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center mb-6 transition-colors block ${
                        plan.highlight
                          ? "bg-accent hover:bg-accent-hover text-white"
                          : "border border-accent/40 text-accent-light hover:bg-accent-muted/30"
                      }`}
                    />
                  ) : (
                    <Link
                      href="/app"
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center mb-6 transition-colors block ${
                        plan.highlight
                          ? "bg-accent hover:bg-accent-hover text-white"
                          : "border border-accent/40 text-accent-light hover:bg-accent-muted/30"
                      }`}
                    >
                      Get Started
                    </Link>
                  )}

                  {/* Usage breakdown */}
                  <div className="border-t border-surface-border pt-4 mb-4">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-2">Usage</p>
                    <UsageRow label="AI Clipping" value={plan.usage.aiClipping} />
                    <UsageRow label="Find Moments" value={plan.usage.findMoments} />
                    <UsageRow label="AI Subtitles" value={plan.usage.subtitles} />
                    <UsageRow label="Summaries" value={plan.usage.summaries} />
                    <UsageRow label="Transcript" value={plan.usage.transcript} />
                  </div>

                  {/* Feature list */}
                  <div className="border-t border-surface-border pt-4 flex-1">
                    <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">Features</p>
                    <ul className="flex flex-col gap-2">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckIcon />
                          <span className="text-xs text-gray-400">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom row: Free + Enterprise ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Free tier */}
            <div className="rounded-2xl p-6 border border-surface-border bg-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Free</h3>
                <p className="text-sm text-gray-500">
                  <span className="text-accent-light font-semibold">200 credits</span> on signup — no card required
                </p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {[
                    "AI Clipping (5 mins/mo)",
                    "Find Moments (5 mins/mo)",
                    "Transcripts (Unlimited)",
                    "Download clips (720p)",
                    "1 project",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon />
                      <span className="text-xs text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                {CLERK_CONFIGURED ? (
                  <ClerkSignUpCTA className="block px-5 py-2.5 rounded-lg border border-surface-border text-sm font-semibold text-gray-300 hover:border-accent/40 hover:text-white text-center whitespace-nowrap" />
                ) : (
                  <Link
                    href="/app"
                    className="block px-5 py-2.5 rounded-lg border border-surface-border text-sm font-semibold text-gray-300 hover:border-accent/40 hover:text-white text-center whitespace-nowrap"
                  >
                    Free to Use
                  </Link>
                )}
              </div>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl p-6 border border-surface-border bg-surface-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Enterprise</h3>
                <p className="text-sm text-gray-500">Custom volume for your team or product</p>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {[
                    "Custom credits & usage limits",
                    "Dedicated infrastructure",
                    "SSO / SAML support",
                    "SLA & priority support",
                    "Custom integrations & API",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon />
                      <span className="text-xs text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <a
                  href="mailto:hello@clippr.ai"
                  className="block px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold text-center whitespace-nowrap"
                >
                  Contact Sales
                </a>
              </div>
            </div>

          </div>

          {/* ── Footer note ── */}
          <p className="text-center text-xs text-gray-600 mt-8">
            All plans include access to new features as they launch.
            Prices shown in USD. Cancel anytime.
          </p>

        </div>
      </main>
    </AppShell>
  );
}
