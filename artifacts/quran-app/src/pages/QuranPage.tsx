import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAppStore } from '@/store/use-app-store';
import { useQuranPage } from '@/hooks/use-quran';
import { ChevronRight, ChevronLeft, Headphones, BookOpen, Play, Pause, Loader2, FastForward, Rewind } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuranPage() {
  const { currentPage, mode, fontSize, setMode, setCurrentPage, markPageRead } = useAppStore();
  const [, setLocation] = useLocation();
  const { data: pageData, isLoading, error } = useQuranPage(currentPage);

  const [playingIndex, setPlayingIndex] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mark page as read when visited
    markPageRead(currentPage);
  }, [currentPage, markPageRead]);

  // Audio cleanup on unmount or page change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentPage]);

  // Autoplay logic if in listening mode
  useEffect(() => {
    if (mode === 'listening' && (pageData?.ayahs?.length ?? 0) > 0) {
      if (playingIndex === -1) {
        playAyah(0);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
      setPlayingIndex(-1);
    }
  }, [mode, pageData]);

  const playAyah = (index: number) => {
    if (!pageData || index < 0 || index >= pageData.ayahs.length) {
      setIsPlaying(false);
      setPlayingIndex(-1);
      return;
    }

    const ayah = pageData.ayahs[index];
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.pause();
      audioRef.current.src = url;
    }

    audioRef.current.onended = () => {
      if (index + 1 < pageData.ayahs.length) {
        playAyah(index + 1);
      } else {
        // Finished page
        setIsPlaying(false);
        setPlayingIndex(-1);
      }
    };

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        setPlayingIndex(index);
        
        // Scroll ayah into view
        const el = document.getElementById(`ayah-${index}`);
        if (el && containerRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })
      .catch((e) => {
        console.error("Audio play failed:", e);
        setIsPlaying(false);
      });
  };

  const togglePlayPause = () => {
    if (!audioRef.current || playingIndex === -1) {
      playAyah(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const nextPage = () => {
    if (currentPage < 604) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF7] dark:bg-[#11141E]">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">جاري تحميل الصفحة...</p>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FDFBF7] dark:bg-[#11141E]">
        <p className="text-destructive font-bold text-lg mb-4">حدث خطأ أثناء تحميل الصفحة</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const surahNames = Array.from(new Set(pageData.ayahs.map(a => a.surah.name)));
  const juzNumber = pageData.ayahs[0]?.juz || 1;

  const fontClass = {
    'sm': 'text-xl leading-[2]',
    'md': 'text-2xl leading-[2.2]',
    'lg': 'text-[28px] leading-[2.4]',
    'xl': 'text-4xl leading-[2.5]'
  }[fontSize];

  return (
    <div className="flex-1 flex flex-col bg-[#FDFBF7] dark:bg-[#0A0D14] relative">
      {/* Top Bar */}
      <div className="absolute top-0 w-full h-14 bg-background/95 backdrop-blur z-30 border-b border-border/50 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-1 font-bold text-primary text-sm bg-primary/10 px-3 py-1.5 rounded-full">
          <span>الجزء {juzNumber}</span>
        </div>
        
        <div className="font-quran-alt text-xl text-foreground font-bold drop-shadow-sm">
          {surahNames.join(' - ')}
        </div>

        <button 
          onClick={() => setMode(mode === 'reading' ? 'listening' : 'reading')}
          className="p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {mode === 'reading' ? <BookOpen size={20} /> : <Headphones size={20} className="text-primary" />}
        </button>
      </div>

      {/* Main Quran Content */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 overflow-y-auto pt-20 pb-40 px-4 md:px-8 text-justify",
          "font-quran text-foreground",
          fontClass
        )}
        style={{ textJustify: 'inter-word' }}
      >
        <div className="max-w-2xl mx-auto border-[12px] border-double border-primary/10 p-6 md:p-10 rounded-xl bg-card shadow-inner min-h-full flex flex-col justify-center">
          <div className="inline">
            {pageData.ayahs.map((ayah, i) => {
              const isBismillah = ayah.text.includes("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ") && ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9;
              const textToShow = isBismillah ? ayah.text.replace("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ", "").trim() : ayah.text;
              
              const isAyahPlaying = playingIndex === i;

              return (
                <span key={ayah.number} id={`ayah-${i}`} className="inline">
                  {ayah.numberInSurah === 1 && (
                    <div className="w-full text-center my-6 flex flex-col items-center">
                      <div className="w-full h-[2px] bg-primary/20 mb-2"></div>
                      <span className="font-quran-alt text-2xl md:text-3xl font-bold text-primary">
                        {ayah.surah.name}
                      </span>
                      <div className="w-full h-[2px] bg-primary/20 mt-2"></div>
                      
                      {isBismillah && (
                        <div className="mt-4 mb-2 text-center text-foreground w-full">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </div>
                      )}
                    </div>
                  )}
                  
                  <span 
                    onClick={() => { if (mode === 'listening') playAyah(i); }}
                    className={cn(
                      "transition-colors duration-300",
                      mode === 'listening' ? "cursor-pointer hover:text-primary" : "",
                      isAyahPlaying ? "text-primary bg-primary/10 rounded-lg" : ""
                    )}
                  >
                    {textToShow}
                  </span>
                  
                  <span className="inline-flex items-center justify-center text-accent mx-1.5 md:mx-2 my-auto text-base md:text-lg select-none relative w-8 h-8 md:w-10 md:h-10">
                    <span className="absolute inset-0 border border-accent/40 rounded-full rotate-45 transform"></span>
                    <span className="absolute inset-[3px] border border-accent/30 rounded-full -rotate-45 transform"></span>
                    <span className="relative z-10 text-xs md:text-sm font-sans mt-0.5">{ayah.numberInSurah}</span>
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Audio Controls when in listening mode */}
      {mode === 'listening' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur border border-border shadow-xl rounded-full px-6 py-3 flex items-center gap-6 z-40">
          <button 
            onClick={() => playAyah(playingIndex + 1)}
            disabled={playingIndex >= pageData.ayahs.length - 1}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Rewind size={24} />
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
          </button>

          <button 
            onClick={() => playAyah(playingIndex - 1)}
            disabled={playingIndex <= 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <FastForward size={24} />
          </button>
        </div>
      )}

      {/* Bottom Page Nav */}
      <div className="absolute bottom-16 md:bottom-20 w-full flex items-center justify-between px-4 pb-2 z-30">
        <button 
          onClick={nextPage} 
          disabled={currentPage >= 604}
          className="p-3 bg-card border border-border rounded-full shadow-sm disabled:opacity-50 hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-2"
        >
          <ChevronRight size={24} />
          <span className="text-sm font-bold hidden sm:inline">الصفحة التالية</span>
        </button>

        <span className="font-bold text-muted-foreground bg-card border border-border px-4 py-1.5 rounded-full shadow-sm text-sm">
          {currentPage}
        </span>

        <button 
          onClick={prevPage} 
          disabled={currentPage <= 1}
          className="p-3 bg-card border border-border rounded-full shadow-sm disabled:opacity-50 hover:bg-accent/10 hover:text-accent transition-colors flex items-center gap-2"
        >
          <span className="text-sm font-bold hidden sm:inline">الصفحة السابقة</span>
          <ChevronLeft size={24} />
        </button>
      </div>
    </div>
  );
}
