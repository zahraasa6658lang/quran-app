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
  dailyGoal: number;
  dailyProgress: DailyProgress;
  streak: number;
  lastReadDate: string | null;
  // 365-day program
  startDate: string | null;
  // Notifications
  notifTime: string;
  notifEnabled: boolean;

  setCurrentPage: (page: number) => void;
  setMode: (mode: Mode) => void;
  setFontSize: (size: FontSize) => void;
  setDailyGoal: (goal: number) => void;
  markPageRead: (page: number) => void;
  checkStreak: () => void;
  startProgram: () => void;
  setNotifTime: (time: string) => void;
  setNotifEnabled: (enabled: boolean) => void;
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
      startDate: null,
      notifTime: '05:00',
      notifEnabled: false,

      setCurrentPage: (page) => set({ currentPage: page }),
      setMode: (mode) => set({ mode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setNotifTime: (notifTime) => set({ notifTime }),
      setNotifEnabled: (notifEnabled) => set({ notifEnabled }),

      startProgram: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (!state.startDate) set({ startDate: today });
      },

      markPageRead: (page) => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();

        let newProgress = { ...state.dailyProgress };
        let newStreak = state.streak;
        let newLastReadDate = state.lastReadDate;

        if (newProgress.date !== today) {
          newProgress = { date: today, pagesRead: [] };
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
        const state = get();
        if (state.lastReadDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          if (state.lastReadDate !== yesterdayStr && state.lastReadDate !== today) {
            set({ streak: 0 });
          }
        }
      },
    }),
    { name: 'quran-app-storage' }
  )
);
