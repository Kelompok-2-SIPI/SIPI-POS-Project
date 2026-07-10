// Singleton module (bukan React state) supaya event `beforeinstallprompt` — yang
// browser hanya fire SEKALI dan sedini mungkin saat load — bisa ditangkap dari mana
// saja PwaRegister dimount (root layout, jadi selalu aktif di semua halaman), lalu
// dipakai belakangan oleh komponen lain (mis. halaman Akun) walau event-nya sudah
// lewat sebelum komponen itu di-mount.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari — properti non-standar, tidak ada di lib.dom.d.ts.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isInstalled(): boolean {
  return installed || isStandalone();
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

export function subscribePwaInstall(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  const promptEvent = deferredPrompt;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  deferredPrompt = null;
  notify();
  return choice.outcome;
}
