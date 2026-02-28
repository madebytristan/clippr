import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

const CLERK_CONFIGURED =
  (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").length > 10 &&
  !(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "").includes("REPLACE_ME");

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: "#0d0d14" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <span className="text-white font-semibold text-lg">Clippr</span>
      </Link>

      {CLERK_CONFIGURED ? (
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#7c3aed",
              colorBackground: "#13131f",
              colorInputBackground: "#0d0d14",
              colorText: "#ffffff",
              colorTextSecondary: "#9ca3af",
              colorInputText: "#ffffff",
              colorNeutral: "#6b7280",
              colorDanger: "#ef4444",
              borderRadius: "0.75rem",
            },
            elements: {
              rootBox: "w-full max-w-md",
              card: "bg-[#13131f] border border-[#1e1e30] shadow-2xl",
              headerTitle: "text-white text-xl font-bold",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "bg-[#1a1a2a] border border-[#1e1e30] text-white hover:bg-[#1e1e30]",
              dividerLine: "bg-[#1e1e30]",
              dividerText: "text-gray-500 text-xs",
              formFieldLabel: "text-gray-300 text-sm",
              formFieldInput:
                "bg-[#0d0d14] border border-[#1e1e30] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/30",
              formButtonPrimary:
                "bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold",
              footerAction: "text-gray-500",
              footerActionLink: "text-[#a78bfa] hover:text-[#7c3aed]",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-[#a78bfa]",
            },
          }}
        />
      ) : (
        /* Placeholder shown when Clerk keys are not yet configured */
        <div className="w-full max-w-md bg-[#13131f] border border-[#1e1e30] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-accent-muted/40 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Sign In to Clippr</h2>
          <p className="text-gray-500 text-sm mb-6">
            Auth is ready — add your Clerk keys to activate sign-in.
          </p>
          <div className="text-left bg-[#0d0d14] rounded-xl border border-[#1e1e30] p-4 mb-6">
            <p className="text-xs text-gray-400 font-mono mb-2 text-gray-500">// .env.local</p>
            <p className="text-xs text-accent-light font-mono">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...</p>
            <p className="text-xs text-accent-light font-mono">CLERK_SECRET_KEY=sk_test_...</p>
          </div>
          <a
            href="https://dashboard.clerk.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-semibold"
          >
            Get Keys at clerk.com
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <p className="text-gray-600 text-xs mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-accent-light hover:text-white">Create one</Link>
          </p>
        </div>
      )}

      <p className="text-gray-600 text-xs mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-accent-light hover:text-white">Create one</Link>
      </p>
    </div>
  );
}
