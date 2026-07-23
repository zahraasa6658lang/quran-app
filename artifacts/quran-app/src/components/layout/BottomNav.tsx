import { Link, useLocation } from 'wouter';
import { Home, BookOpen, Library, Target, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tasbih bead icon (custom SVG)
function TasbihIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5 C9 9 7 12 7 15" />
      <path d="M12 7.5 C15 9 17 12 17 15" />
      <ellipse cx="12" cy="17" rx="5" ry="4" />
      <path d="M10 15.5 L8.5 13" />
      <path d="M14 15.5 L15.5 13" />
      <circle cx="7.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="21" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/quran', label: 'القرآن', icon: BookOpen },
    { href: '/juz', label: 'الأجزاء', icon: Library },
    { href: '/ward', label: 'الورد', icon: Target },
    { href: '/tasbih', label: 'المسبحة', icon: TasbihIcon },
    { href: '/khatma', label: 'الختمة', icon: Heart },
    { href: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 min-w-[64px] py-1 cursor-pointer select-none no-underline">
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon size={20} className={isActive ? "fill-primary/20" : ""} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
