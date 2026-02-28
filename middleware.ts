import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLERK_CONFIGURED =
  (process.env.CLERK_SECRET_KEY ?? "").length > 10 &&
  !(process.env.CLERK_SECRET_KEY ?? "").includes("REPLACE_ME");

const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/account(.*)",
  "/editor(.*)",
  "/api/clip(.*)",
  "/api/download(.*)",
  "/api/transcript(.*)",
  "/api/clips(.*)",
]);

export default CLERK_CONFIGURED
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : (_req: NextRequest) => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
