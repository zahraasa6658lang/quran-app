/**
 * PWA Install Banner
 * Shows automatically after 3 seconds to invite the user to install the app.
 * Remembers if dismissed so it won't nag again for 7 days.
 */
import { useEffect, useState } from 'react';
import { Download, X, Smartphone, WifiOff, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'pwa_install_dismissed_until';

function isDismissed() {
  try {
    const until = localStorage.getItem(DISMISSED_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch { return false; }
}

function dismiss7Days() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  } catch {}
}

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow]                     = useState(false);
  const [installed, setInstalled]           = useState(false);

  // capture beforeinstallprompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // also detect if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // show banner 3 seconds after prompt is captured (and not dismissed/installed)
  useEffect(() => {
    if (!deferredPrompt || installed || isDismissed()) return;
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, [deferredPrompt, installed]);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setShow(false);
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    dismiss7Days();
    setShow(false);
  }

  if (!show || installed) return null;

  return (
    <div
      dir="rtl"
      className={cn(
        'fixed bottom-20 inset-x-3 z-50 rounded-2xl shadow-2xl border border-primary/20',
        'bg-background/95 backdrop-blur-md',
        'animate-in slide-in-from-bottom-4 duration-500',
      )}
    >
      {/* Green accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary rounded-t-2xl" />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">القرآن الكريم</p>
              <p className="text-xs text-muted-foreground">تطبيق الحفظ والمراجعة</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        {/* Features row */}
        <div className="flex items-center gap-4 mb-4 px-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <WifiOff size={12} className="text-primary" />
            <span>يعمل بلا إنترنت</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Smartphone size={12} className="text-primary" />
            <span>على الشاشة الرئيسية</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell size={12} className="text-primary" />
            <span>إشعارات يومية</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-bold text-sm py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          data-testid="btn-pwa-install"
        >
          <Download size={16} />
          تثبيت التطبيق مجاناً
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-2 opacity-70">
          مجاني للأبد · لا انتهاء صلاحية · يعمل على جميع الأجهزة
        </p>
      </div>
    </div>
  );
}
