import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Successfully authenticated, redirect to root
        navigate('/', { replace: true });
      } else {
        // No session found, redirect back to login
        console.error('No session found after auth callback');
        navigate('/');
      }
    }).catch((error) => {
      console.error('Error in auth callback:', error);
      navigate('/');
    });
  }, [navigate, supabase.auth]);

  return (
    <div>Completing login...</div>
  );
} 