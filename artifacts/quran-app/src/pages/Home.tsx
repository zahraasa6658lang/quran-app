import { useEffect } from 'react';
import { Link } from 'wouter';
import { useAppStore } from '@/store/use-app-store';
import { buildSchedule, getCurrentDay, yearProgress } from '@/lib/schedule';
import splashImg from '@/assets/splash-quran.jpg';

const SCHEDULE = buildSchedule();

export default function Home() {
  const {
    currentPage, dailyGoal, dailyProgress, checkStreak,
    startDate, startProgram,
    streak,
  } = useAppStore();

  useEffect(() => { checkStreak(); }, [checkStreak]);

  const pagesReadToday  = dailyProgress.pagesRead.length;
  const progressPercent = Math.min(100, (pagesReadToday / dailyGoal) * 100);

  // 365-day journey
  const currentDay  = getCurrentDay(startDate);
  const todayEntry  = currentDay ? SCHEDULE[currentDay - 1] : null;
  const yearPct     = currentDay ? yearProgress(currentDay) : 0;

  return (
    <div className="flex-1 flex flex-col items-center relative overflow-hidden bg-[#181C14]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={splashImg}
          alt="Quran Background"
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
      </div>

      <div className="flex-1 flex flex-col items-center w-full px-6 z-20 pt-10 pb-24 gap-6">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-5xl font-quran-alt text-primary mb-2 drop-shadow-md">القرآن الكريم</h1>
          <p className="text-base text-muted-foreground font-medium">تطبيق الحفظ والمراجعة</p>
        </div>

        {/* Daily ward progress ring */}
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
            <circle
              cx="50" cy="50" r="44"
              fill="transparent" stroke="currentColor" strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              className="text-accent transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-foreground">{pagesReadToday}</span>
            <span className="text-sm text-muted-foreground mt-0.5">من {dailyGoal} صفحة</span>
            <span className="text-xs text-primary mt-1 font-semibold">ورد اليوم</span>
          </div>
        </div>

        {/* 365-day journey summary card */}
        {startDate && currentDay && todayEntry ? (
          <div className="w-full max-w-sm bg-background/70 backdrop-blur-sm border border-border/40 rounded-2xl p-4 space-y-3" dir="rtl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary">رحلة السنة — اليوم {currentDay}</span>
              <span className="text-xs text-muted-foreground">{yearPct}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${yearPct}%` }} />
            </div>
            <p className="text-sm font-bold text-foreground text-center">
              {todayEntry.startPage === todayEntry.endPage
                ? `مهمة اليوم: صفحة ${todayEntry.startPage}`
                : `مهمة اليوم: الصفحات ${todayEntry.startPage} – ${todayEntry.endPage}`}
            </p>
            {streak > 0 && (
              <p className="text-xs text-center text-accent font-semibold">🔥 {streak} يوم متواصل — أحسنت!</p>
            )}
          </div>
        ) : !startDate ? (
          <div className="w-full max-w-sm bg-background/70 backdrop-blur-sm border border-primary/30 rounded-2xl p-4 text-center" dir="rtl">
            <p className="text-sm text-muted-foreground mb-3">ابدأ رحلة حفظ القرآن في 365 يوماً</p>
            <button
              onClick={startProgram}
              className="bg-primary text-primary-foreground text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
              data-testid="btn-home-start-program"
            >
              ابدأ البرنامج
            </button>
          </div>
        ) : null}

        {/* CTA */}
        <Link href="/quran" className="w-full max-w-[280px]">
          <div
            className="bg-primary hover:bg-primary/90 active:scale-95 transition-all text-primary-foreground rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 cursor-pointer"
            data-testid="btn-start-reading"
          >
            <span className="font-bold text-lg">ابدأ الحفظ</span>
            <span className="text-sm opacity-80 bg-black/20 px-2 py-0.5 rounded-md">صفحة {currentPage}</span>
          </div>
        </Link>
      </div>

      {/* Copyright */}
      <div className="w-full text-center py-6 z-20 mt-auto">
        <p className="text-xs text-muted-foreground opacity-70">
          © جميع الحقوق محفوظة - تطبيق القرآن الكريم للحفظ
        </p>
      </div>
    </div>
  );
}
