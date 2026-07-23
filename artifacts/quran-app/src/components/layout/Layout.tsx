import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { Download } from 'lucide-react';
import { useLocation } from 'wouter';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isInstallable, promptInstall } = usePwaInstall();
  const [location] = useLocation();

  // Do not show standard header on home page or reading page to maximize immersion
  const hideHeader = location === '/' || location === '/quran' || location === '/khatma';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground pb-[72px]">
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4">
          <h1 className="font-bold text-lg text-primary tracking-wide">القرآن الكريم</h1>
          
          {isInstallable && (
            <button
              onClick={promptInstall}
              className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              <span>تثبيت التطبيق</span>
            </button>
          )}
        </header>
      )}

      {/* For pages without header but we still want to show install prompt somewhere, maybe float it? */}
      {hideHeader && isInstallable && (
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={promptInstall}
            className="flex items-center gap-2 bg-background/80 backdrop-blur-md shadow-sm border border-border text-primary px-3 py-2 rounded-full text-sm font-semibold transition-all hover:bg-background"
          >
            <Download size={16} />
            <span>تثبيت</span>
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col w-full max-w-screen-md mx-auto relative">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
