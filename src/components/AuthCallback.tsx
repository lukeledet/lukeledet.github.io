import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const { supabase } = useSupabase();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session which includes the provider token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No session found');
        }

        // Get the provider refresh token from the session
        const refreshToken = session.provider_refresh_token;

        if (!refreshToken) {
          throw new Error('No refresh token found in session');
        }

        // Store the refresh token
        const { error: tokenError } = await supabase
          .from('user_tokens')
          .upsert({
            user_id: session.user.id,
            concept2_refresh_token: refreshToken,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (tokenError) {
          throw tokenError;
        }

        // Successfully stored token, redirect to root
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, supabase]);

  return (
    <div>Completing login...</div>
  );
} 
