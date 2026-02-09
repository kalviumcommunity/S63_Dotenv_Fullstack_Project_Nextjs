/**
 * PWA utilities for service worker registration and management
 */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error);
        });
    });
  }
}

export function unregisterServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
    })
    .catch((error) => {
      console.error("[PWA] Service Worker unregistration failed:", error);
    });
}

export async function checkForUpdates() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return true;
  } catch (error) {
    console.error("[PWA] Update check failed:", error);
    return false;
  }
}
