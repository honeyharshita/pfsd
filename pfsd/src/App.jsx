import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { LanguageProvider } from '@/components/shared/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/shared/LanguageContext';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function AppShell() {
  const { t } = useLanguage();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastReminderDate = localStorage.getItem('mindful_daily_reminder_toast_date');
    const reminderEnabled = localStorage.getItem('mindful_daily_checkin_enabled');

    const loadPersistentReminders = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/notifications/reminders?userEmail=anonymous');
        if (!response.ok) return;
        const data = await response.json();
        const reminders = Array.isArray(data?.reminders) ? data.reminders : [];
        reminders.forEach((item) => {
          toast({
            title: item.title || t('notifications.dailyCheckinTitle'),
            description: item.description || t('notifications.dailyCheckinDesc'),
          });
        });
        if (reminders.length > 0) {
          localStorage.setItem('mindful_daily_reminder_toast_date', today);
        }
      } catch {
        if (reminderEnabled === 'true' && lastReminderDate !== today) {
          toast({
            title: t('notifications.dailyCheckinTitle'),
            description: t('notifications.dailyCheckinDesc'),
          });
          localStorage.setItem('mindful_daily_reminder_toast_date', today);
        }
      }
    };

    loadPersistentReminders();
  }, [t]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppShell />
    </LanguageProvider>
  )
}

export default App
