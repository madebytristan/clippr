"use client";

import dynamic from "next/dynamic";

// Dynamically imported with ssr: false so Clerk hooks only run in the browser
const AccountContent = dynamic(() => import("./content"), { ssr: false });

export default function AccountPage() {
  return <AccountContent />;
}
