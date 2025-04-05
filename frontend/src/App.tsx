import { MantineProvider } from '@mantine/core';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { GoalDashboard } from './components/GoalDashboard';
import { Auth } from './components/Auth';
import { useSupabase } from './hooks/useSupabase';
import { useEffect, useState } from 'react';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

function AppContent() {
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

  return (
    <div className="container mx-auto px-4 py-8">
      {!user ? <Auth /> : <GoalDashboard />}
    </div>
  );
}

function App() {
  return (
    <MantineProvider>
      <SupabaseProvider>
        <AppContent />
      </SupabaseProvider>
    </MantineProvider>
  );
}

export default App; 