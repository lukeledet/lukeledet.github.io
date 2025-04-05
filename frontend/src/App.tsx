import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState<User | null>(null);
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
  }, []);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'keycloak',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user:read results:read',
          queryParams: {
            apikey: supabaseAnonKey
          }
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <header>
        <h1>Rowing Goals</h1>
        {user ? (
          <div>
            <p>Welcome, {user.user_metadata.preferred_username || user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin}>Login with Concept2</button>
        )}
      </header>
      
      {user && (
        <main>
          {/* TODO: Add goal setting and tracking components */}
          <p>Your goals will appear here</p>
        </main>
      )}
    </div>
  );
}

export default App; 