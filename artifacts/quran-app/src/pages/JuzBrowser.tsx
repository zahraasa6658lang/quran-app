import { Link } from 'wouter';
import { useAppStore } from '@/store/use-app-store';
import { BookMarked } from 'lucide-react';

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export default function JuzBrowser() {
  const { setCurrentPage } = useAppStore();

  return (
    <div className="flex-1 flex flex-col p-4 pb-20">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <BookMarked size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">الأجزاء</h2>
          <p className="text-muted-foreground text-sm">تصفح القرآن الكريم حسب الجزء</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {JUZ_START_PAGES.map((page, index) => {
          const juzNumber = index + 1;
          return (
            <Link 
              key={juzNumber} 
              href="/quran"
              onClick={() => setCurrentPage(page)}
            >
              <div className="bg-card hover:bg-accent/10 active:scale-95 transition-all border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm">
                <span className="text-xl font-bold text-primary">الجزء {juzNumber}</span>
                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md">
                  صفحة {page}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-8 pb-4 text-center">
        <p className="text-xs text-muted-foreground opacity-70">
          © تطبيق القرآن الكريم للحفظ | جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
