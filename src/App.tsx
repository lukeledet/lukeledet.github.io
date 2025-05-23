import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { GoalDashboard } from './components/GoalDashboard';
import { LandingPage } from './components/LandingPage';
// PrivacyPolicy is now static HTML
import { Contact } from './components/Contact';
import { AuthCallback } from './components/AuthCallback';
import { Layout } from './components/Layout';
import { useSupabase } from './hooks/useSupabase';
import { useEffect, useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <SupabaseProvider>
      <MantineProvider
        defaultColorScheme="light"
        theme={{
          primaryColor: 'blue',
        }}
      >
        <Notifications />
        <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <GoalDashboard />
                </ProtectedRoute>
              } />
              {/* <Route path="/privacy" element={<PrivacyPolicy />} />  Removed, using static public/privacy.html */}
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </Layout>
        </div>
      </MantineProvider>
    </SupabaseProvider>
  );
}

export default App;
