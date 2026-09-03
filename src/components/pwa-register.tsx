"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol === "https:" || window.location.hostname === "localhost") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("CelenganKita PWA ServiceWorker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("PWA ServiceWorker registration failed:", err);
        });
    }
  }, []);

  return null;
}
