import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface Env {
  CONCEPT2_CLIENT_ID: string;
  CONCEPT2_CLIENT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, ''); // Remove trailing slash if present

  // Create detailed debug info
  const debugInfo = {
    url: url.toString(),
    path,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    searchParams: Object.fromEntries(url.searchParams.entries()),
    timestamp: new Date().toISOString()
  };

  // Log all request information
  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    // Check authorization for all endpoints except /auth
    if (!path.includes('/protocol/openid-connect/auth')) {
      const authHeader = req.headers.get('Authorization');
      const queryApiKey = url.searchParams.get('apikey');
      
      if (!authHeader && !queryApiKey) {
        throw new Error('Missing authorization header or API key');
      }
    }

    // Handle OpenID Connect paths
    if (path.includes('/protocol/openid-connect/auth')) {
      // Handle initial auth request from Supabase Keycloak provider
      const state = url.searchParams.get('state');
      const redirectUri = url.searchParams.get('redirect_uri');
      const scope = url.searchParams.get('scope');
      
      console.log('Auth request params:', { state, redirectUri, scope });
      
      const concept2AuthUrl = new URL('https://log.concept2.com/oauth/authorize');
      concept2AuthUrl.searchParams.set('client_id', Deno.env.get('CONCEPT2_CLIENT_ID') || '');
      concept2AuthUrl.searchParams.set('response_type', 'code');
      concept2AuthUrl.searchParams.set('state', state || '');
      concept2AuthUrl.searchParams.set('redirect_uri', redirectUri || '');
      concept2AuthUrl.searchParams.set('scope', 'user:read,results:read');
      
      console.log('Redirecting to:', concept2AuthUrl.toString());
      
      return Response.redirect(concept2AuthUrl.toString(), 302);
    }

    if (path.includes('/protocol/openid-connect/token')) {
      // Handle token exchange
      let code: string | null = null;
      let redirectUri: string | null = null;
      
      // Try to get code and redirect_uri from POST body first
      if (req.method === 'POST') {
        const contentType = req.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (contentType?.includes('application/x-www-form-urlencoded')) {
          const text = await req.text();
          console.log('Raw request body:', text);
          
          const params = new URLSearchParams(text);
          code = params.get('code');
          redirectUri = params.get('redirect_uri');
          
          console.log('Parsed form data:', {
            code,
            redirectUri,
            allParams: Object.fromEntries(params.entries())
          });
        }
      }
      
      // Fallback to URL params if not found in body
      if (!code) {
        code = url.searchParams.get('code');
      }
      if (!redirectUri) {
        redirectUri = url.searchParams.get('redirect_uri');
      }

      if (!code) {
        throw new Error('No code provided');
      }
      if (!redirectUri) {
        throw new Error('No redirect_uri provided');
      }

      console.log('Token exchange params:', { code, redirectUri });

      // Create form data for token request
      const formData = new URLSearchParams();
      formData.append('client_id', Deno.env.get('CONCEPT2_CLIENT_ID') || '');
      formData.append('client_secret', Deno.env.get('CONCEPT2_CLIENT_SECRET') || '');
      formData.append('code', code);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);

      console.log('Sending token request with params:', Object.fromEntries(formData.entries()));

      // Exchange code for tokens
      const tokenResponse = await fetch('https://log.concept2.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseText = await tokenResponse.text();
      console.log('Raw Concept2 response:', responseText);

      if (!tokenResponse.ok) {
        console.error('Token exchange failed:', responseText);
        throw new Error(`Failed to get tokens: ${responseText}`);
      }

      const tokens = JSON.parse(responseText);
      console.log('Parsed tokens:', tokens);

      // Format response for Supabase
      const formattedTokens = {
        access_token: tokens.access_token,
        token_type: tokens.token_type || 'Bearer',
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
      };

      console.log('Formatted tokens for Supabase:', formattedTokens);

      return new Response(JSON.stringify(formattedTokens), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (path.includes('/protocol/openid-connect/userinfo')) {
      // Get the access token from the Authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header provided');
      }

      // Get user info from Concept2
      const userResponse = await fetch('https://log.concept2.com/api/users/me', {
        headers: {
          'Authorization': authHeader,
        },
      });

      if (!userResponse.ok) {
        const error = await userResponse.text();
        console.error('User info failed:', error);
        throw new Error(`Failed to get user info: ${error}`);
      }

      const userData = await userResponse.json();
      console.log('Received user data from Concept2:', userData);

      // Return user info in format expected by Supabase Keycloak provider
      return new Response(JSON.stringify({
        sub: userData.data.id.toString(),
        email: userData.data.email || `${userData.data.username}@concept2.user`,
        email_verified: true,
        name: userData.data.name || userData.data.username,
        preferred_username: userData.data.username,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // If no matching path, return debug info
    return new Response(JSON.stringify({
      message: 'Debug response - no matching path',
      debug: debugInfo,
      env: {
        hasClientId: !!Deno.env.get('CONCEPT2_CLIENT_ID'),
        hasClientSecret: !!Deno.env.get('CONCEPT2_CLIENT_SECRET'),
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      debug: debugInfo
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 
