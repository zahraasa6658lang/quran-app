import { useEffect } from 'react';
import { Link } from 'wouter';
import { useAppStore } from '@/store/use-app-store';
import splashImg from '@assets/generated_images/splash-quran.jpg';

export default function Home() {
  const { currentPage, dailyGoal, dailyProgress, checkStreak } = useAppStore();
  
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  const pagesReadToday = dailyProgress.pagesRead.length;
  const progressPercent = Math.min(100, (pagesReadToday / dailyGoal) * 100);

  return (
    <div className="flex-1 flex flex-col items-center relative overflow-hidden bg-[#181C14]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={splashImg} 
          alt="Quran Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 z-20 pt-12 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-quran-alt text-primary mb-4 drop-shadow-md">القرآن الكريم</h1>
          <p className="text-lg text-muted-foreground font-medium">تطبيق الحفظ والمراجعة</p>
        </div>

        {/* Progress Ring */}
        <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              className="text-accent transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-foreground">{pagesReadToday}</span>
            <span className="text-sm text-muted-foreground mt-1">من {dailyGoal} صفحة</span>
            <span className="text-xs text-primary mt-1 font-semibold">ورد اليوم</span>
          </div>
        </div>

        <Link href="/quran" className="w-full max-w-[280px]">
          <div className="bg-primary hover:bg-primary/90 active:scale-95 transition-all text-primary-foreground rounded-2xl py-4 flex items-center justify-center gap-3 shadow-lg shadow-primary/20 cursor-pointer">
            <span className="font-bold text-lg">ابدأ الحفظ</span>
            <span className="text-sm opacity-80 bg-black/20 px-2 py-0.5 rounded-md">صفحة {currentPage}</span>
          </div>
        </Link>
      </div>

      <div className="w-full text-center py-6 z-20 mt-auto">
        <p className="text-xs text-muted-foreground opacity-70">
          © جميع الحقوق محفوظة - تطبيق القرآن الكريم للحفظ
        </p>
      </div>
    </div>
  );
}
