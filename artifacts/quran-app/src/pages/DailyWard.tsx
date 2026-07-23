import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Target, CheckCircle2, Flame, Award, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function DailyWard() {
  const { dailyGoal, dailyProgress, streak, setDailyGoal, checkStreak } = useAppStore();
  const [showCongrats, setShowCongrats] = useState(false);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);

  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const pagesReadToday = dailyProgress.pagesRead.length;
  const isGoalMet = pagesReadToday >= dailyGoal;
  const progressPercent = Math.min(100, (pagesReadToday / dailyGoal) * 100);

  useEffect(() => {
    if (isGoalMet && !hasPlayedChime) {
      setShowCongrats(true);
      setHasPlayedChime(true);
      playCelebrationChime();
    }
  }, [isGoalMet, hasPlayedChime]);

  const playCelebrationChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime + startTime);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime + startTime);
        oscillator.stop(audioCtx.currentTime + startTime + duration);
      };

      playNote(523.25, 0, 0.4); // C5
      playNote(659.25, 0.15, 0.4); // E5
      playNote(783.99, 0.3, 0.6); // G5
    } catch (e) {
      console.error('AudioContext not supported');
    }
  };

  const goalOptions = [
    { value: 1, label: 'صفحة واحدة' },
    { value: 2, label: 'صفحتان' },
    { value: 5, label: '٥ صفحات' },
    { value: 10, label: '١٠ صفحات (نصف جزء)' },
    { value: 20, label: '٢٠ صفحة (جزء كامل)' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-accent/10 rounded-2xl text-accent">
          <Target size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">الورد اليومي</h2>
          <p className="text-muted-foreground text-sm">تابع إنجازك وحافظ على استمراريتك</p>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-6 relative overflow-hidden">
        {isGoalMet && (
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent" />
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">إنجاز اليوم</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">{pagesReadToday}</span>
              <span className="text-lg text-muted-foreground">/ {dailyGoal} صفحة</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-1 text-primary mb-1">
              <Flame size={20} className={streak > 0 ? "fill-primary text-primary" : ""} />
              <span className="text-xl font-bold">{streak}</span>
            </div>
            <span className="text-xs font-medium text-primary/80">أيام متتالية</span>
          </div>
        </div>

        <div className="relative h-4 bg-muted rounded-full overflow-hidden mb-3">
          <div 
            className="absolute top-0 right-0 h-full bg-primary transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <p className="text-sm text-center text-muted-foreground font-medium">
          {isGoalMet 
            ? "🎉 أتممت وردك اليوم، تقبل الله!" 
            : `باقي ${Math.max(0, dailyGoal - pagesReadToday)} صفحة لإتمام الورد`}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground mb-4">تغيير الهدف اليومي</h3>
        <div className="grid gap-2">
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDailyGoal(opt.value)}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all text-right",
                dailyGoal === opt.value 
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-sm" 
                  : "bg-card border-border/50 text-foreground hover:bg-accent/5"
              )}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className={dailyGoal === opt.value ? "text-primary" : "text-muted-foreground"} />
                <span>{opt.label}</span>
              </div>
              {dailyGoal === opt.value && <CheckCircle2 size={20} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground opacity-70">
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>

      <Dialog open={showCongrats} onOpenChange={setShowCongrats}>
        <DialogContent className="sm:max-w-md text-center border-border/50 p-8 rounded-3xl">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <Award size={32} className="text-accent fill-accent/20" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground mb-2">تقبل الله طاعتك!</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              لقد أتممت وردك اليومي بنجاح. استمر في هذا العطاء، فالقرآن نور يضيء دربك.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            <button 
              onClick={() => setShowCongrats(false)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-4 rounded-xl transition-colors"
            >
              متابعة
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
