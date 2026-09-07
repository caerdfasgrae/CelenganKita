"use client";

import { useEffect } from "react";

/**
 * Background warmup client that fires a non-blocking request to /api/v1/ping
 * on initial page load, waking up the serverless function container so that
 * subsequent user actions and page transitions experience zero cold-start delay.
 */
export function WarmupClient() {
  useEffect(() => {
    // Only run once per session / window lifecycle
    try {
      if (typeof window !== "undefined" && !window.sessionStorage.getItem("__ck_warmed")) {
        window.sessionStorage.setItem("__ck_warmed", "1");
        fetch("/api/v1/ping", {
          method: "GET",
          keepalive: true,
          cache: "no-store",
        }).catch(() => {
          // Non-blocking, ignore network errors silently
        });
      }
    } catch {
      // Ignore storage restrictions if in private/incognito
    }
  }, []);

  return null;
}
