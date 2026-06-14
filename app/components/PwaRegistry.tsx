"use client";

import { useEffect } from "react";

export default function PwaRegistry() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("EXPENZA PWA Active:", registration.scope);
        })
        .catch((error) => {
          console.error("EXPENZA PWA Registration Failed:", error);
        });
    }
  }, []);

  return null;
}