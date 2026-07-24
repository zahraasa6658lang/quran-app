import { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw, ChevronRight, ChevronLeft,
  Hand, Volume2, Play, Pause, StopCircle,
  Gauge,
} from 'lucide-react';
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
    text: 'اللهم صل وسلم وبارك على سيدنا محمد وعلى آله وصحبه وسلم تسليماً كثيراً',
    target: 100,
  },
];

type TasbihMode = 'manual' | 'voice';
type VoiceSpeed = 0.6 | 0.8 | 1.0 | 1.2;

const STORAGE_KEY = 'tasbih_counts';
const MODE_KEY    = 'tasbih_mode';

function loadCounts(): number[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DHIKR_LIST.map(() => 0);
}

function saveCounts(counts: number[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(counts)); } catch {}
}

/* ── audio helpers ── */
function playClickSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx  = new Ctx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
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
    [{ freq: 440, start: 0, dur: 1.2 }, { freq: 528, start: 0.4, dur: 1.2 }, { freq: 660, start: 0.8, dur: 1.6 }]
      .forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.25,  ctx.currentTime + start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
  } catch {}
}

/* ── speech synthesis helper ── */
function speakArabic(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) { resolve(); return; }
    window.speechSynthesis.cancel();
    const utt  = new SpeechSynthesisUtterance(text);
    utt.lang   = 'ar-SA';
    utt.rate   = rate;
    utt.pitch  = 0.9;

    // prefer an Arabic voice when available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang.startsWith('ar') && v.localService
    ) ?? voices.find((v) => v.lang.startsWith('ar'));
    if (arabicVoice) utt.voice = arabicVoice;

    utt.onend   = () => resolve();
    utt.onerror = () => resolve();
    window.speechSynthesis.speak(utt);
  });
}

/* ══════════════════════════════════════════════ */
export default function Tasbih() {
  const [counts,       setCounts]       = useState<number[]>(loadCounts);
  const [activeIdx,    setActiveIdx]    = useState(0);
  const [justCompleted,setJustCompleted]= useState(false);
  const [ripple,       setRipple]       = useState(false);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* mode */
  const [tasbihMode, setTasbihMode] = useState<TasbihMode>(
    () => (localStorage.getItem(MODE_KEY) as TasbihMode | null) ?? 'manual'
  );

  /* voice-mode state */
  const [voiceRunning,  setVoiceRunning]  = useState(false);
  const [voicePaused,   setVoicePaused]   = useState(false);
  const [voiceSpeed,    setVoiceSpeed]    = useState<VoiceSpeed>(0.8);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const voiceAbort = useRef(false);   // signals the loop to stop

  useEffect(() => { saveCounts(counts); }, [counts]);
  useEffect(() => { localStorage.setItem(MODE_KEY, tasbihMode); }, [tasbihMode]);

  // stop voice when switching mode or dhikr
  useEffect(() => { stopVoice(); }, [tasbihMode, activeIdx]); // eslint-disable-line

  const current    = counts[activeIdx] ?? 0;
  const target     = DHIKR_LIST[activeIdx].target;
  const progress   = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;

  /* ── bump counter (shared between manual & voice) ── */
  const bumpCount = useCallback(() => {
    let completed = false;
    setCounts((prev) => {
      const next = [...prev];
      if (next[activeIdx] >= target) return prev;
      next[activeIdx] += 1;
      if (next[activeIdx] >= target) completed = true;
      return next;
    });
    return completed;
  }, [activeIdx, target]);

  /* ── MANUAL tap ── */
  const handleTap = useCallback(() => {
    if (isComplete) return;
    playClickSound();
    if (navigator.vibrate) navigator.vibrate(30);
    setRipple(true);
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    rippleTimer.current = setTimeout(() => setRipple(false), 200);
    const done = bumpCount();
    if (done) {
      playCompleteSound();
      if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 2500);
    }
  }, [isComplete, bumpCount]);

  /* ── VOICE loop ── */
  async function startVoiceLoop() {
    voiceAbort.current = false;
    setVoiceRunning(true);
    setVoicePaused(false);

    const text = DHIKR_LIST[activeIdx].text;
    while (!voiceAbort.current) {
      // check if still below target
      let currentCount = 0;
      setCounts((prev) => { currentCount = prev[activeIdx]; return prev; });
      if (currentCount >= target) {
        playCompleteSound();
        if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 2500);
        break;
      }
      setIsSpeaking(true);
      await speakArabic(text, voiceSpeed);
      setIsSpeaking(false);
      if (voiceAbort.current) break;

      // tiny pause between repetitions
      await new Promise<void>((res) => {
        const t = setTimeout(res, voiceSpeed < 0.8 ? 900 : 600);
        const checkAbort = setInterval(() => { if (voiceAbort.current) { clearTimeout(t); clearInterval(checkAbort); res(); } }, 50);
      });
      if (voiceAbort.current) break;

      // bump
      playClickSound();
      if (navigator.vibrate) navigator.vibrate(20);
      const done = bumpCount();
      if (done) {
        playCompleteSound();
        if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 100]);
        setJustCompleted(true);
        setTimeout(() => setJustCompleted(false), 2500);
        break;
      }
    }
    setVoiceRunning(false);
    setVoicePaused(false);
    setIsSpeaking(false);
    window.speechSynthesis?.cancel();
  }

  function stopVoice() {
    voiceAbort.current = true;
    window.speechSynthesis?.cancel();
    setVoiceRunning(false);
    setVoicePaused(false);
    setIsSpeaking(false);
  }

  function togglePause() {
    if (!voiceRunning) return;
    if (!voicePaused) {
      window.speechSynthesis?.pause();
      setVoicePaused(true);
    } else {
      window.speechSynthesis?.resume();
      setVoicePaused(false);
    }
  }

  /* ── resets ── */
  const handleReset = () => {
    stopVoice();
    setCounts((prev) => { const n = [...prev]; n[activeIdx] = 0; return n; });
    setJustCompleted(false);
  };

  const handleResetAll = () => {
    stopVoice();
    setCounts(DHIKR_LIST.map(() => 0));
    setJustCompleted(false);
  };

  const goNext = () => { setActiveIdx((i) => (i + 1) % DHIKR_LIST.length); setJustCompleted(false); };
  const goPrev = () => { setActiveIdx((i) => (i - 1 + DHIKR_LIST.length) % DHIKR_LIST.length); setJustCompleted(false); };

  const totalDone = counts.filter((c, i) => c >= DHIKR_LIST[i].target).length;

  const radius          = 110;
  const circumference   = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const SPEEDS: { value: VoiceSpeed; label: string }[] = [
    { value: 0.6,  label: 'بطيء جداً' },
    { value: 0.8,  label: 'بطيء' },
    { value: 1.0,  label: 'عادي' },
    { value: 1.2,  label: 'سريع' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] pb-8 px-4 pt-4 gap-4" dir="rtl" data-testid="page-tasbih">

      {/* Header */}
      <div className="text-center space-y-0.5">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>
          المسبحة الرقمية
        </h1>
        <p className="text-xs text-muted-foreground">{totalDone} من {DHIKR_LIST.length} أذكار مكتملة</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-center">
        <div className="flex gap-1 bg-muted rounded-2xl p-1 w-full max-w-xs">
          <button
            onClick={() => setTasbihMode('manual')}
            data-testid="btn-mode-manual"
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tasbihMode === 'manual'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Hand size={15} />
            يدوي
          </button>
          <button
            onClick={() => setTasbihMode('voice')}
            data-testid="btn-mode-voice"
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all',
              tasbihMode === 'voice'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Volume2 size={15} />
            صوتي
          </button>
        </div>
      </div>

      {/* Dhikr navigation */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={goPrev} className="p-2 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors" data-testid="btn-prev-dhikr">
          <ChevronRight size={20} />
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-muted-foreground font-medium">الذكر {activeIdx + 1} من {DHIKR_LIST.length}</span>
        </div>
        <button onClick={goNext} className="p-2 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors" data-testid="btn-next-dhikr">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Dhikr text */}
      <div className="text-center min-h-[72px] flex items-center justify-center px-2">
        <p
          className={cn(
            'text-xl font-bold leading-relaxed text-foreground transition-all',
            isSpeaking && 'text-primary scale-[1.02]'
          )}
          style={{ fontFamily: "'Scheherazade New', 'Amiri', serif", lineHeight: '1.9' }}
          data-testid="text-dhikr"
        >
          {DHIKR_LIST[activeIdx].text}
        </p>
      </div>

      {/* ─────────────────────────────────────────
          MANUAL MODE: tap circle
      ──────────────────────────────────────── */}
      {tasbihMode === 'manual' && (
        <div className="flex flex-col items-center justify-center gap-3 flex-1">
          <div className="relative flex items-center justify-center select-none">
            <svg width="260" height="260" className="absolute top-0 left-0 -rotate-90">
              <circle cx="130" cy="130" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="130" cy="130" r={radius} fill="none"
                stroke={isComplete ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <button
              onClick={handleTap}
              disabled={isComplete}
              data-testid="btn-tasbih-tap"
              className={cn(
                'w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer select-none',
                'transition-all duration-150 active:scale-95 shadow-2xl border-4',
                isComplete
                  ? 'bg-accent/20 border-accent text-accent cursor-default'
                  : ['bg-primary text-primary-foreground border-primary/80', ripple && 'scale-[0.97]'],
              )}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {justCompleted ? (
                <><span className="text-4xl">✓</span><span className="text-lg font-bold" style={{ fontFamily: "'Cairo', sans-serif" }}>أحسنت!</span></>
              ) : isComplete ? (
                <><span className="text-5xl font-black" style={{ fontFamily: "'Cairo', sans-serif" }}>{current}</span><span className="text-sm opacity-80" style={{ fontFamily: "'Cairo', sans-serif" }}>اكتمل</span></>
              ) : (
                <><span className="text-6xl font-black leading-none" style={{ fontFamily: "'Cairo', sans-serif" }} data-testid="count-display">{current}</span><span className="text-sm opacity-70 mt-1" style={{ fontFamily: "'Cairo', sans-serif" }}>اضغط للتسبيح</span></>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>{current} / {target}</p>
        </div>
      )}

      {/* ─────────────────────────────────────────
          VOICE MODE
      ──────────────────────────────────────── */}
      {tasbihMode === 'voice' && (
        <div className="flex flex-col items-center gap-4 flex-1">

          {/* Progress circle (display only) */}
          <div className="relative flex items-center justify-center select-none">
            <svg width="260" height="260" className="absolute top-0 left-0 -rotate-90">
              <circle cx="130" cy="130" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="130" cy="130" r={radius} fill="none"
                stroke={isComplete ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>

            {/* Inner circle: status */}
            <div
              className={cn(
                'w-[220px] h-[220px] rounded-full flex flex-col items-center justify-center gap-2 border-4 shadow-2xl transition-all duration-300',
                isComplete
                  ? 'bg-accent/20 border-accent'
                  : isSpeaking
                  ? 'bg-primary/20 border-primary animate-pulse'
                  : 'bg-card border-border'
              )}
            >
              {justCompleted ? (
                <>
                  <span className="text-4xl">✓</span>
                  <span className="text-lg font-bold text-accent" style={{ fontFamily: "'Cairo', sans-serif" }}>أحسنت!</span>
                </>
              ) : isComplete ? (
                <>
                  <span className="text-5xl font-black text-accent" style={{ fontFamily: "'Cairo', sans-serif" }}>{current}</span>
                  <span className="text-sm text-accent" style={{ fontFamily: "'Cairo', sans-serif" }}>اكتمل</span>
                </>
              ) : (
                <>
                  <span className="text-6xl font-black leading-none text-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>{current}</span>
                  {isSpeaking ? (
                    <span className="text-xs text-primary font-bold animate-bounce" style={{ fontFamily: "'Cairo', sans-serif" }}>🔊 يقرأ...</span>
                  ) : voiceRunning && voicePaused ? (
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>⏸ متوقف مؤقتاً</span>
                  ) : voiceRunning ? (
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>⏳ يُحضّر...</span>
                  ) : (
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>اضغط تشغيل</span>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground" style={{ fontFamily: "'Cairo', sans-serif" }}>{current} / {target}</p>

          {/* Control buttons */}
          <div className="flex items-center justify-center gap-3 w-full max-w-xs">
            {!voiceRunning ? (
              <button
                onClick={startVoiceLoop}
                disabled={isComplete}
                data-testid="btn-voice-start"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all',
                  isComplete
                    ? 'bg-muted text-muted-foreground cursor-default'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                )}
              >
                <Play size={18} />
                تشغيل التسبيح
              </button>
            ) : (
              <>
                <button
                  onClick={togglePause}
                  data-testid="btn-voice-pause"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-300/40 font-bold text-sm hover:bg-amber-500/20 transition-colors"
                >
                  {voicePaused ? <Play size={16} /> : <Pause size={16} />}
                  {voicePaused ? 'استئناف' : 'إيقاف مؤقت'}
                </button>
                <button
                  onClick={stopVoice}
                  data-testid="btn-voice-stop"
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 font-bold text-sm hover:bg-destructive/20 transition-colors"
                >
                  <StopCircle size={16} />
                  إيقاف
                </button>
              </>
            )}
          </div>

          {/* Speed selector */}
          <div className="w-full max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <Gauge size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">سرعة القراءة</span>
            </div>
            <div className="flex gap-1.5">
              {SPEEDS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setVoiceSpeed(value)}
                  disabled={voiceRunning}
                  data-testid={`btn-speed-${value}`}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all',
                    voiceSpeed === value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/40 border-border/40 text-muted-foreground hover:bg-muted',
                    voiceRunning && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!('speechSynthesis' in window) && (
            <p className="text-xs text-destructive text-center px-4 bg-destructive/5 rounded-xl py-2">
              ⚠️ متصفحك لا يدعم القراءة الصوتية. جرّب Chrome أو Safari.
            </p>
          )}
        </div>
      )}

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
                'h-3 rounded-full transition-all duration-200',
                i === activeIdx ? 'w-6 bg-primary' : done ? 'w-3 bg-accent' : 'w-3 bg-muted-foreground/30'
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
