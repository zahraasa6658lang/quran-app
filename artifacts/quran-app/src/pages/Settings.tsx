import { useAppStore } from '@/store/use-app-store';
import { Settings as SettingsIcon, Type, Headphones, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function Settings() {
  const { mode, fontSize, setMode, setFontSize, dailyProgress, streak } = useAppStore();

  const fontOptions = [
    { value: 'sm', label: 'صغير' },
    { value: 'md', label: 'متوسط' },
    { value: 'lg', label: 'كبير' },
    { value: 'xl', label: 'كبير جداً' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col p-4 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-muted rounded-2xl text-foreground">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">الإعدادات</h2>
          <p className="text-muted-foreground text-sm">تخصيص تجربة الحفظ والتلاوة</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground border-b border-border/50 pb-3">
            <BookOpen size={20} className="text-primary" />
            <span>وضع القراءة</span>
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Label htmlFor="mode-switch" className="text-base font-bold cursor-pointer">
                وضع الاستماع
              </Label>
              <span className="text-xs text-muted-foreground">
                التشغيل التلقائي للتلاوة عند فتح الصفحة
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className={mode === 'reading' ? "text-primary" : "text-muted-foreground"} />
              <Switch 
                id="mode-switch" 
                checked={mode === 'listening'} 
                onCheckedChange={(c) => setMode(c ? 'listening' : 'reading')}
                className="data-[state=checked]:bg-primary"
              />
              <Headphones size={16} className={mode === 'listening' ? "text-primary" : "text-muted-foreground"} />
            </div>
          </div>
        </section>

        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground border-b border-border/50 pb-3">
            <Type size={20} className="text-primary" />
            <span>حجم الخط</span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFontSize(opt.value)}
                className={cn(
                  "py-3 rounded-xl border font-medium transition-colors text-center",
                  fontSize === opt.value 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background border-border text-foreground hover:bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <div className="mt-6 p-6 bg-background rounded-xl border border-border/50 text-center">
            <p className={cn(
              "font-quran text-foreground leading-[2.5]",
              fontSize === 'sm' && "text-xl",
              fontSize === 'md' && "text-2xl",
              fontSize === 'lg' && "text-3xl",
              fontSize === 'xl' && "text-4xl"
            )}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
          </div>
        </section>

        <section className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-3">
            إحصائياتك
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-primary mb-1">{streak}</span>
              <span className="text-xs text-muted-foreground font-medium">أيام متتالية</span>
            </div>
            <div className="bg-background rounded-xl p-4 border border-border/50 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-accent mb-1">{dailyProgress.pagesRead.length}</span>
              <span className="text-xs text-muted-foreground font-medium">صفحات اليوم</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-auto pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground opacity-70">
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
