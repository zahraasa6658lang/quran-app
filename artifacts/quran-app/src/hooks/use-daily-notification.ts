import { useEffect, useRef } from 'react';

function playReminderSound() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Gentle ascending chime — 4 notes
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
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch {}
}

function showBrowserNotification(notifTime: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification('القرآن الكريم — موعد الورد اليومي', {
      body: `حان وقت ورد القرآن الكريم (${notifTime})، لا تفوّت نصيبك اليوم.`,
      icon: '/favicon.svg',
    });
  }
}

/**
 * Checks every minute whether the current time matches the user-chosen
 * notification time.  When it matches it plays the reminder audio chime
 * and (if permission was granted) shows a browser notification.
 */
export function useDailyNotification(
  notifTime: string,   // "HH:MM"
  notifEnabled: boolean,
) {
  const firedRef = useRef<string | null>(null); // tracks last fired "HH:MM" to avoid double-fire

  useEffect(() => {
    if (!notifEnabled || !notifTime) return;

    const tick = () => {
      const now  = new Date();
      const hh   = String(now.getHours()).padStart(2, '0');
      const mm   = String(now.getMinutes()).padStart(2, '0');
      const current = `${hh}:${mm}`;

      if (current === notifTime && firedRef.current !== current) {
        firedRef.current = current;
        playReminderSound();
        showBrowserNotification(notifTime);
      }

      // Reset the guard when the minute changes so it can fire again next day
      if (current !== notifTime && firedRef.current === notifTime) {
        firedRef.current = null;
      }
    };

    tick(); // check immediately on mount / re-enable
    const id = setInterval(tick, 30_000); // every 30 s is precise enough
    return () => clearInterval(id);
  }, [notifTime, notifEnabled]);
}
