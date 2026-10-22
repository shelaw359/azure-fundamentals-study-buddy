// Single place that registers the app-shell service worker (/sw.js).
// Never registers in dev, inside an iframe, or on Lovable preview hosts.

const SW_URL = "/sw.js";

function isPreviewHost(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function inIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith(SW_URL)))
      .map((r) => r.unregister()),
  );
}

export async function registerAppServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const killSwitch = new URLSearchParams(window.location.search).get("sw") === "off";
  const refused =
    !import.meta.env.PROD || inIframe() || isPreviewHost(window.location.hostname) || killSwitch;

  try {
    if (refused) {
      await unregisterAppWorkers();
      return;
    }
    await navigator.serviceWorker.register(SW_URL, { scope: "/" });
  } catch (error) {
    console.warn("Service worker setup skipped", error);
  }
}
