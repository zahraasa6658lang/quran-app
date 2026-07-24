import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Layout } from '@/components/layout/Layout';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { useDailyNotification } from '@/hooks/use-daily-notification';
import { useAppStore } from '@/store/use-app-store';

// Pages
import Home from '@/pages/Home';
import QuranPage from '@/pages/QuranPage';
import JuzBrowser from '@/pages/JuzBrowser';
import DailyWard from '@/pages/DailyWard';
import KhatmaDua from '@/pages/KhatmaDua';
import Settings from '@/pages/Settings';
import Tasbih from '@/pages/Tasbih';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Runs hooks that need to stay alive across all pages */
function GlobalEffects() {
  const { notifTime, notifEnabled } = useAppStore();
  useDailyNotification(notifTime, notifEnabled);
  return null;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/quran" component={QuranPage} />
        <Route path="/juz" component={JuzBrowser} />
        <Route path="/ward" component={DailyWard} />
        <Route path="/khatma" component={KhatmaDua} />
        <Route path="/tasbih" component={Tasbih} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <GlobalEffects />
          <Router />
          <PwaInstallBanner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
