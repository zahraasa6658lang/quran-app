import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const DHIKR_LIST = [
  { id: 1, text: 'سبحان الله وبحمده سبحان الله العظيم', target: 100 },
  { id: 2, text: 'استغفر الله الذي لا إله إلا هو الحي القيوم وأتوب إليه', target: 100 },
  { id: 3, text: 'لا إله إلا الله وحده لا شريك له الملك وله الحمد يحيي ويميت وهو على كل شيء قدير', target: 100 },
  { id: 4, text: 'الحمد لله', target: 100 },
  { id: 5, text: 'الله أكبر', target: 100 },
  { id: 6, text: 'لا حول ولا قوة إلا بالله', target: 100 },
  {
    id: 7,
    text: 'اللهم صل وسلم وبارك على سيدنا محمد وعلى آله وصحبه وسلم تسليماً كثيراً وأجمعين كما صليت وسلمت وباركت على سيدنا إبراهيم وآله سيدنا إبراهيم إنك حميد مجيد',
    target: 100,
  },
];

const STORAGE_KEY = 'tasbih_counts';

function loadCounts(): number[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DHIKR_LIST.map(() => 0);
}

function saveCounts(counts: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  } catch {}
}

function playClickSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {}
}

function playCompleteSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [
      { freq: 440, start: 0, dur: 1.2 },
      { freq: 528, start: 0.4, dur: 1.2 },
      { freq: 660, start: 0.8, dur: 1.6 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  } catch {}
}

export default function Tasbih() {
  const [counts, setCounts] = useState<number[]>(loadCounts);
  const [activeIdx, setActiveIdx] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [ripple, setRipple] = useState(false);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveCounts(counts);
  }, [counts]);

  const current = counts[activeIdx] ?? 0;
  const target = DHIKR_LIST[activeIdx].target;
  const progress = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  const handleTap = useCallback(() => {
    if (isComplete) return;
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(30);

    setRipple(true);
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(false), 200);

    setCounts((prev) => {
      const next = [...prev];
      next[activeIdx] = next[activeIdx] + 1;
      if (next[activeIdx] >= target) {
        playCompleteSound();
        if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 2500);
      }
      return next;
    });
  }, [activeIdx, isComplete, target]);

  const handleReset = () => {
    setCounts((prev) => {
      const next = [...prev];
      next[activeIdx] = 0;
      return next;
    });
    setJustCompleted(false);
  };

  const handleResetAll = () => {
    const zeros = DHIKR_LIST.map(() => 0);
    setCounts(zeros);
    setJustCompleted(false);
  };

  const goNext = () => {
    setActiveIdx((i) => (i + 1) % DHIKR_LIST.length);
    setJustCompleted(false);
  };

  const goPrev = () => {
    setActiveIdx((i) => (i - 1 + DHIKR_LIST.length) % DHIKR_LIST.length);
    setJustCompleted(false);
  };

  const totalDone = counts.filter((c, i) => c >= DHIKR_LIST[i].target).length;

  // SVG circle for progress ring
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="flex flex-col min-h-[calc(100dvh-4rem)] pb-8 px-4 pt-4 gap-4"
      dir="rtl"
      data-testid="page-tasbih"
    >
      {/* Header */}
      <div className="text-center space-y-0.5">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
          المسبحة الرقمية
        </h1>
        <p className="text-xs text-muted-foreground">
          {totalDone} من {DHIKR_LIST.length} أذكار مكتملة
        </p>
      </div>

      {/* Dhikr Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          className="p-2 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
          data-testid="btn-prev-dhikr"
        >
          <ChevronRight size={20} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-muted-foreground font-medium">
            الذكر {activeIdx + 1} من {DHIKR_LIST.length}
          </span>
        </div>
        <button
          onClick={goNext}
          className="p-2 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
          data-testid="btn-next-dhikr"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Dhikr text */}
      <div className="text-center min-h-[72px] flex items-center justify-center px-2">
        <p
          className="text-xl font-bold leading-relaxed text-foreground"
          style={{ fontFamily: "'Scheherazade New', 'Amiri', serif", lineHeight: '1.9' }}
          data-testid="text-dhikr"
        >
          {DHIKR_LIST[activeIdx].text}
        </p>
      </div>

      {/* Tap Button with progress ring */}
      <div className="flex flex-col items-center justify-center gap-3 flex-1">
        <div className="relative flex items-center justify-center select-none">
          {/* SVG ring */}
          <svg width="260" height="260" className="absolute top-0 left-0 -rotate-90">
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke={isComplete ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
          </svg>

          {/* Main tap circle */}
          <button
            onClick={handleTap}
            disabled={isComplete}
            data-testid="btn-tasbih-tap"
            className={cn(
              'w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none',
              'transition-all duration-150 active:scale-95',
              'shadow-2xl border-4',
              isComplete
                ? 'bg-accent/20 border-accent text-accent cursor-default'
                : [
                    'bg-primary text-primary-foreground border-primary/80',
                    ripple && 'scale-[0.97]',
                  ],
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {justCompleted ? (
              <>
                <span className="text-4xl">✓</span>
                <span className="text-lg font-bold" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  أحسنت!
                </span>
              </>
            ) : isComplete ? (
              <>
                <span className="text-5xl font-black" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  {current}
                </span>
                <span className="text-sm opacity-80" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  اكتمل
                </span>
              </>
            ) : (
              <>
                <span
                  className="text-6xl font-black leading-none"
                  style={{ fontFamily: "'Cairo', sans-serif" }}
                  data-testid="count-display"
                >
                  {current}
                </span>
                <span className="text-sm opacity-70 mt-1" style={{ fontFamily: "'Cairo', sans-serif" }}>
                  اضغط للتسبيح
                </span>
              </>
            )}
          </button>
        </div>

        {/* target label */}
        <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
          {current} / {target}
        </p>
      </div>

      {/* Reset buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleReset}
          data-testid="btn-reset-current"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted text-sm font-medium transition-colors"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <RotateCcw size={14} />
          إعادة هذا الذكر
        </button>
        <button
          onClick={handleResetAll}
          data-testid="btn-reset-all"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-sm font-medium transition-colors"
          style={{ fontFamily: "'Cairo', sans-serif" }}
        >
          <RotateCcw size={14} />
          إعادة الكل
        </button>
      </div>

      {/* Dhikr selector dots */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {DHIKR_LIST.map((d, i) => {
          const done = counts[i] >= d.target;
          return (
            <button
              key={d.id}
              onClick={() => { setActiveIdx(i); setJustCompleted(false); }}
              data-testid={`btn-dhikr-dot-${i}`}
              className={cn(
                'w-3 h-3 rounded-full transition-all duration-200',
                i === activeIdx
                  ? 'w-6 bg-primary'
                  : done
                  ? 'bg-accent'
                  : 'bg-muted-foreground/30',
              )}
            />
          );
        })}
      </div>

      {/* Copyright */}
      <div className="text-center pb-2">
        <p className="text-[10px] text-muted-foreground/60" style={{ fontFamily: "'Cairo', sans-serif" }}>
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
