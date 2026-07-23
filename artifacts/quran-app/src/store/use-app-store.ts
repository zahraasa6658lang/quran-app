import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type FontSize = 'sm' | 'md' | 'lg' | 'xl';
type Mode = 'reading' | 'listening';

interface DailyProgress {
  date: string;
  pagesRead: number[];
}

interface AppState {
  currentPage: number;
  mode: Mode;
  fontSize: FontSize;
  dailyGoal: number; // in pages
  dailyProgress: DailyProgress;
  streak: number;
  lastReadDate: string | null;
  setCurrentPage: (page: number) => void;
  setMode: (mode: Mode) => void;
  setFontSize: (size: FontSize) => void;
  setDailyGoal: (goal: number) => void;
  markPageRead: (page: number) => void;
  checkStreak: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentPage: 1,
      mode: 'reading',
      fontSize: 'lg',
      dailyGoal: 1,
      dailyProgress: {
        date: new Date().toISOString().split('T')[0],
        pagesRead: [],
      },
      streak: 0,
      lastReadDate: null,

      setCurrentPage: (page) => set({ currentPage: page }),
      setMode: (mode) => set({ mode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),

      markPageRead: (page) => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        let newProgress = { ...state.dailyProgress };
        let newStreak = state.streak;
        let newLastReadDate = state.lastReadDate;

        // Reset progress if it's a new day
        if (newProgress.date !== today) {
          newProgress = { date: today, pagesRead: [] };
          // Check if streak was broken (if lastReadDate was not yesterday)
          if (state.lastReadDate) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (state.lastReadDate !== yesterdayStr && state.lastReadDate !== today) {
              newStreak = 0;
            }
          }
        }

        if (!newProgress.pagesRead.includes(page)) {
          newProgress.pagesRead.push(page);
        }

        // Check if goal met today
        if (newProgress.pagesRead.length >= state.dailyGoal && state.lastReadDate !== today) {
          newStreak += 1;
          newLastReadDate = today;
        }

        set({
          dailyProgress: newProgress,
          streak: newStreak,
          lastReadDate: newLastReadDate,
        });
      },

      checkStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastReadDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (state.lastReadDate !== yesterdayStr && state.lastReadDate !== today) {
            set({ streak: 0 });
          }
        }
      }
    }),
    {
      name: 'quran-app-storage',
    }
  )
);
