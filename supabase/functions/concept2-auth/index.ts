import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface Env {
  CONCEPT2_CLIENT_ID: string;
  CONCEPT2_CLIENT_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface UserInfoResponse {
  data: {
    id: number;
    email: string;
    username: string;
    name?: string;
  }
}

async function handleAuthRequest(url: URL): Promise<Response> {
  const state = url.searchParams.get('state');
  const redirectUri = url.searchParams.get('redirect_uri');
  
  const concept2AuthUrl = new URL('https://log.concept2.com/oauth/authorize');
  concept2AuthUrl.searchParams.set('client_id', Deno.env.get('CONCEPT2_CLIENT_ID') || '');
  concept2AuthUrl.searchParams.set('response_type', 'code');
  concept2AuthUrl.searchParams.set('state', state || '');
  concept2AuthUrl.searchParams.set('redirect_uri', redirectUri || '');
  concept2AuthUrl.searchParams.set('scope', 'user:read,results:read');
  
  return Response.redirect(concept2AuthUrl.toString(), 302);
}

async function handleTokenExchange(req: Request, url: URL): Promise<Response> {
  let code: string | null = null;
  let redirectUri: string | null = null;
  
  if (req.method === 'POST' && req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    code = params.get('code');
    redirectUri = params.get('redirect_uri');
  }
  
  // Fallback to URL params if not found in body
  if (!code) code = url.searchParams.get('code');
  if (!redirectUri) redirectUri = url.searchParams.get('redirect_uri');

  if (!code) throw new Error('No code provided');
  if (!redirectUri) throw new Error('No redirect_uri provided');

  const formData = new URLSearchParams();
  formData.append('client_id', Deno.env.get('CONCEPT2_CLIENT_ID') || '');
  formData.append('client_secret', Deno.env.get('CONCEPT2_CLIENT_SECRET') || '');
  formData.append('code', code);
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', redirectUri);

  const tokenResponse = await fetch('https://log.concept2.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get tokens: ${error}`);
  }

  const tokens: TokenResponse = await tokenResponse.json();

  return new Response(JSON.stringify(tokens), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function handleUserInfo(req: Request): Promise<Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('No authorization header provided');
  }

  const userResponse = await fetch('https://log.concept2.com/api/users/me', {
    headers: {
      'Authorization': authHeader,
    },
  });

  if (!userResponse.ok) {
    const error = await userResponse.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  const userData: UserInfoResponse = await userResponse.json();

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

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/$/, '');

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

    // Route requests to appropriate handlers
    if (path.includes('/protocol/openid-connect/auth')) {
      return handleAuthRequest(url);
    }

    if (path.includes('/protocol/openid-connect/token')) {
      return handleTokenExchange(req, url);
    }

    if (path.includes('/protocol/openid-connect/userinfo')) {
      return handleUserInfo(req);
    }

    return new Response('Not Found', { status: 404 });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 
