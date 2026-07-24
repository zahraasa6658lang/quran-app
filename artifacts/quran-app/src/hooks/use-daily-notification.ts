/**
 * Fires a 4-note chime + browser Notification at the user-chosen time,
 * once per day, while the app is open.
 */
import { useEffect, useRef } from 'react';

function playReminderChime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
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
      gain.gain.linearRampToValueAtTime(0.22,  ctx.currentTime + start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch {}
}

function sendBrowserNotification() {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('القرآن الكريم 📖', {
        body: 'حان وقت وردك اليومي! لا تنسَ حظك من القرآن الكريم.',
        icon: '/manifest.json',
        tag: 'daily-ward',
        renotify: false,
      });
    }
  } catch {}
}

const FIRED_KEY = 'daily_notif_last_fired';

export function useDailyNotification(notifTime: string, notifEnabled: boolean) {
  const lastFiredRef = useRef<string>('');

  useEffect(() => {
    if (!notifEnabled || !notifTime) return;

    const interval = setInterval(() => {
      const now    = new Date();
      const hhmm   = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today  = now.toISOString().split('T')[0];
      const firedKey = `${today}_${notifTime}`;

      // Only fire once per (day × configured-time)
      const lastFired = localStorage.getItem(FIRED_KEY) ?? '';
      if (hhmm === notifTime && lastFired !== firedKey && lastFiredRef.current !== firedKey) {
        lastFiredRef.current = firedKey;
        try { localStorage.setItem(FIRED_KEY, firedKey); } catch {}
        playReminderChime();
        sendBrowserNotification();
      }
    }, 30_000); // check every 30 seconds

    return () => clearInterval(interval);
  }, [notifTime, notifEnabled]);
}
