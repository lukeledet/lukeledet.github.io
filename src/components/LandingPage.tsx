import { Title, Text, Button, Stack, List, ThemeIcon, rem } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useSupabase } from '../hooks/useSupabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

export function LandingPage() {
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, navigate]);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLogin = async () => {
    try {
      // Use VITE_SITE_URL if available, otherwise default to window.location.origin
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'keycloak',
        options: {
          redirectTo: `${siteUrl}auth/callback`,
          scopes: 'user:read results:read',
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!loading && !user) {
    return (
      <Stack gap="xl" align="center" py={50}>
        <Stack gap="xs" ta="center" maw={600}>
          <Title>Track Your Rowing Progress</Title>
          <Text size="lg" c="dimmed">
            Connect with your Concept2 logbook to set and track your rowing goals.
            Monitor your progress over time and stay motivated to achieve more.
          </Text>
        </Stack>

        <Button size="lg" onClick={handleLogin}>
          Sign in with Concept2
        </Button>

        <Stack gap="md" maw={600}>
          <Title order={2}>Features</Title>
          <List
            spacing="sm"
            size="lg"
            icon={
              <ThemeIcon size={28} radius="xl" color="blue">
                <IconCheck style={{ width: rem(18) }} />
              </ThemeIcon>
            }
          >
            <List.Item>
              <Text fw={500}>Automatic Sync</Text>
              <Text c="dimmed">
                Your workouts are automatically synced from your Concept2 logbook
              </Text>
            </List.Item>
            <List.Item>
              <Text fw={500}>Multiple Goal Types</Text>
              <Text c="dimmed">
                Set goals for total distance or number of workouts
              </Text>
            </List.Item>
            <List.Item>
              <Text fw={500}>Flexible Time Periods</Text>
              <Text c="dimmed">
                Track goals on a weekly, monthly, or yearly basis
              </Text>
            </List.Item>
            <List.Item>
              <Text fw={500}>Progress Tracking</Text>
              <Text c="dimmed">
                Visual progress bars and comparison with previous periods
              </Text>
            </List.Item>
            <List.Item>
              <Text fw={500}>Time-Based Insights</Text>
              <Text c="dimmed">
                See how much time is left to achieve your current goals
              </Text>
            </List.Item>
          </List>
        </Stack>
      </Stack>
    );
  }

  return null;
}
