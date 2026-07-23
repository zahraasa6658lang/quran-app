import { useState, useRef } from 'react';
import { Heart, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KhatmaDua() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('https://cdn.islamic.network/quran/audio/128/ar.alafasy/6236.mp3');
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex-1 flex flex-col p-6 pb-24 bg-card min-h-full">
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-8 text-primary">
          <Heart size={32} className="fill-primary/20" />
        </div>
        
        <h1 className="text-3xl font-quran-alt text-primary mb-10 border-b border-primary/20 pb-6 w-full">
          دعاء ختم القرآن الكريم
        </h1>

        <div className="space-y-6 text-foreground/90 font-quran text-2xl md:text-3xl leading-[2.5] md:leading-[2.5] px-4">
          <p>
            اللَّهُمَّ ارْحَمْنِي بالقُرْءَانِ وَاجْعَلهُ لِي إِمَاماً وَنُوراً وَهُدًى وَرَحْمَةً
          </p>
          <p>
            اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَانَسِيتُ وَعَلِّمْنِي مِنْهُ مَاجَهِلْتُ وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَارَبَّ العَالَمِينَ
          </p>
          <p>
            اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ
          </p>
        </div>

        <button
          onClick={togglePlay}
          className={cn(
            "mt-12 flex items-center justify-center gap-3 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-md active:scale-95",
            isPlaying 
              ? "bg-accent text-accent-foreground shadow-accent/20" 
              : "bg-primary text-primary-foreground shadow-primary/20"
          )}
        >
          {isPlaying ? (
            <>
              <Pause size={24} fill="currentColor" />
              <span>إيقاف الدعاء</span>
            </>
          ) : (
            <>
              <Play size={24} fill="currentColor" className="ml-1" />
              <span>الاستماع للدعاء</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full text-center mt-12">
        <p className="text-xs text-muted-foreground opacity-70">
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
