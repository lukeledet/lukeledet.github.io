import { Button, Stack, Title, Alert } from '@mantine/core';
import { useSupabase } from '../hooks/useSupabase';
import { useState } from 'react';

export function Auth() {
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'keycloak',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user:read results:read',
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Failed to log in. Please try again.');
    }
  };

  return (
    <Stack gap="md" align="center" mt="xl">
      <Title order={2}>Welcome to Rowing Goals</Title>
      
      {error && (
        <Alert color="red" title="Error">
          {error}
        </Alert>
      )}

      <Button size="lg" onClick={handleLogin}>
        Sign in with Concept2
      </Button>
    </Stack>
  );
} 