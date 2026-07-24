import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/use-app-store';
import { Target, CheckCircle2, Flame, Award, BookOpen, Bell, BellOff, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { buildSchedule, getCurrentDay, yearProgress } from '@/lib/schedule';
import { Link } from 'wouter';

const SCHEDULE = buildSchedule();

export default function DailyWard() {
  const {
    dailyGoal, dailyProgress, streak,
    setDailyGoal, checkStreak,
    startDate, startProgram,
    notifTime, notifEnabled, setNotifTime, setNotifEnabled,
  } = useAppStore();

  const [showCongrats, setShowCongrats] = useState(false);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);
  const [testPlayed, setTestPlayed] = useState(false);

  useEffect(() => { checkStreak(); }, [checkStreak]);

  const pagesReadToday = dailyProgress.pagesRead.length;
  const isGoalMet      = pagesReadToday >= dailyGoal;
  const progressPercent = Math.min(100, (pagesReadToday / dailyGoal) * 100);

  // 365-day journey
  const currentDay   = getCurrentDay(startDate);
  const todayEntry   = currentDay ? SCHEDULE[currentDay - 1] : null;
  const yearPct      = currentDay ? yearProgress(currentDay) : 0;

  useEffect(() => {
    if (isGoalMet && !hasPlayedChime) {
      setShowCongrats(true);
      setHasPlayedChime(true);
      playCelebrationChime();
    }
  }, [isGoalMet, hasPlayedChime]);

  function playCelebrationChime() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, t: number, dur: number) => {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + t);
        gain.gain.setValueAtTime(0, audioCtx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.3,   audioCtx.currentTime + t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + t);
        osc.stop(audioCtx.currentTime + t + dur);
      };
      playNote(523.25, 0,    0.4);
      playNote(659.25, 0.15, 0.4);
      playNote(783.99, 0.30, 0.6);
    } catch {}
  }

  function playReminderPreview() {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      [
        { freq: 330, start: 0,    dur: 0.9 },
        { freq: 392, start: 0.35, dur: 0.9 },
        { freq: 494, start: 0.70, dur: 0.9 },
        { freq: 587, start: 1.05, dur: 1.4 },
      ].forEach(({ freq, start, dur }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + start + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.05);
      });
      setTestPlayed(true);
      setTimeout(() => setTestPlayed(false), 3000);
    } catch {}
  }

  async function handleEnableNotif() {
    if (!notifEnabled) {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      setNotifEnabled(true);
      playReminderPreview();
    } else {
      setNotifEnabled(false);
    }
  }

  const goalOptions = [
    { value: 1,  label: 'صفحة واحدة' },
    { value: 2,  label: 'صفحتان' },
    { value: 5,  label: '٥ صفحات' },
    { value: 10, label: '١٠ صفحات (نصف جزء)' },
    { value: 20, label: '٢٠ صفحة (جزء كامل)' },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 pb-20" dir="rtl">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-accent/10 rounded-2xl text-accent">
          <Target size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">الورد اليومي</h2>
          <p className="text-muted-foreground text-sm">تابع إنجازك وحافظ على استمراريتك</p>
        </div>
      </div>

      {/* ── 365-DAY JOURNEY CARD ── */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-2xl p-5 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2">
            <span className="text-xl">📅</span> رحلة حفظ القرآن في سنة
          </h3>
          {!startDate && (
            <button
              onClick={startProgram}
              className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              data-testid="btn-start-program"
            >
              ابدأ الآن
            </button>
          )}
        </div>

        {startDate && currentDay ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground font-medium">اليوم رقم</span>
              <span className="text-2xl font-black text-primary">{currentDay} / 365</span>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${yearPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-left mb-3">{yearPct}% من رحلتك مكتملة</p>

            {todayEntry && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">مهمة اليوم</p>
                  <p className="text-base font-black text-amber-900 dark:text-amber-200">
                    {todayEntry.startPage === todayEntry.endPage
                      ? `حفظ الصفحة ${todayEntry.startPage}`
                      : `حفظ الصفحات ${todayEntry.startPage} – ${todayEntry.endPage}`}
                  </p>
                </div>
                <Link href={`/quran?page=${todayEntry.startPage}`}>
                  <button
                    className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                    data-testid="btn-go-today-pages"
                  >
                    <BookOpen size={14} />
                    اذهب
                  </button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            اضغط "ابدأ الآن" لبدء رحلة حفظ القرآن الكريم كاملاً في 365 يوماً بمعدل صفحتين يومياً.
          </p>
        )}
      </div>

      {/* ── DAILY PROGRESS ── */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mb-5 relative overflow-hidden">
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
              <Flame size={20} className={streak > 0 ? 'fill-primary text-primary' : ''} />
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
            ? '🎉 أتممت وردك اليوم، تقبل الله!'
            : `باقي ${Math.max(0, dailyGoal - pagesReadToday)} صفحة لإتمام الورد`}
        </p>
      </div>

      {/* ── NOTIFICATION TIME ── */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm mb-5 overflow-hidden">
        <div className="p-4 bg-primary/5 border-b border-border/50 flex items-center gap-3">
          <Bell size={18} className="text-primary" />
          <h3 className="font-bold text-foreground flex-1">إشعار الورد اليومي</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Time picker */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock size={16} />
              <span className="text-sm font-medium">وقت التذكير</span>
            </div>
            <input
              type="time"
              value={notifTime}
              onChange={(e) => setNotifTime(e.target.value)}
              className="bg-background border border-border rounded-xl px-3 py-2 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              data-testid="input-notif-time"
            />
          </div>

          {/* Enable / disable */}
          <button
            onClick={handleEnableNotif}
            data-testid="btn-toggle-notif"
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all',
              notifEnabled
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {notifEnabled ? (
              <><BellOff size={16} /> إيقاف التنبيه</>
            ) : (
              <><Bell size={16} /> تفعيل التنبيه الصوتي</>
            )}
          </button>

          {/* Test sound */}
          <button
            onClick={playReminderPreview}
            data-testid="btn-test-sound"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <Play size={14} />
            {testPlayed ? '✓ جرّبت الصوت' : 'استمع للصوت التنبيهي'}
          </button>

          {notifEnabled && (
            <p className="text-xs text-center text-primary font-medium bg-primary/5 rounded-xl px-3 py-2">
              ✓ سيصلك إشعار صوتي كل يوم على الساعة {notifTime}
            </p>
          )}
        </div>
      </div>

      {/* ── DAILY GOAL ── */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground mb-4">تغيير الهدف اليومي</h3>
        <div className="grid gap-2">
          {goalOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDailyGoal(opt.value)}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border transition-all text-right',
                dailyGoal === opt.value
                  ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                  : 'bg-card border-border/50 text-foreground hover:bg-accent/5'
              )}
              data-testid={`btn-goal-${opt.value}`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className={dailyGoal === opt.value ? 'text-primary' : 'text-muted-foreground'} />
                <span>{opt.label}</span>
              </div>
              {dailyGoal === opt.value && <CheckCircle2 size={20} />}
            </button>
          ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-auto pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground opacity-70">
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>

      {/* Congrats dialog */}
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
              data-testid="btn-congrats-close"
            >
              متابعة
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
