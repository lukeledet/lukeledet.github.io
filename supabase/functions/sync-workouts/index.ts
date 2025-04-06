import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
const CONCEPT2_TOKEN_URL = 'https://log.concept2.com/oauth/access_token';
const CONCEPT2_API_URL = 'https://log.concept2.com/api';
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    // Get the user ID from the request
    const { user_id, start_date } = await req.json();
    if (!user_id || !start_date) {
      return new Response(JSON.stringify({
        error: 'user_id and start_date are required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Get the user's refresh token
    const { data: tokenData, error: tokenError } = await supabaseAdmin.from('user_tokens').select('concept2_refresh_token').eq('user_id', user_id).single();
    if (tokenError || !tokenData?.concept2_refresh_token) {
      return new Response(JSON.stringify({
        error: 'No refresh token found'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Get a new access token
    const tokenResponse = await fetch(CONCEPT2_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenData.concept2_refresh_token,
        client_id: Deno.env.get('CONCEPT2_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('CONCEPT2_CLIENT_SECRET') ?? '',
        scope: 'user:read,results:read'
      })
    });
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      throw new Error('Failed to refresh access token');
    }
    const { access_token } = await tokenResponse.json();
    // Fetch first page to get pagination info
    const firstPageResponse = await fetch(`${CONCEPT2_API_URL}/users/me/results?type=rower&from=${start_date}&page=1`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    if (!firstPageResponse.ok) {
      const errorData = await firstPageResponse.text();
      console.error('First page fetch failed:', errorData);
      throw new Error('Failed to fetch workouts');
    }
    const firstPageData = await firstPageResponse.json();
    let allWorkouts = [
      ...firstPageData.data
    ];
    const totalPages = firstPageData.meta.pagination.total_pages;
    // Fetch remaining pages if any
    for(let page = 2; page <= totalPages; page++){
      const pageResponse = await fetch(`${CONCEPT2_API_URL}/users/me/results?type=rower&from=${start_date}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      if (!pageResponse.ok) {
        console.error(`Failed to fetch page ${page}`);
        continue;
      }
      const pageData = await pageResponse.json();
      allWorkouts = [
        ...allWorkouts,
        ...pageData.data
      ];
    }
    // Process all workouts
    const workouts = allWorkouts.map((workout) => {
      // Calculate total meters by adding workout and rest meters
      const workoutMeters = workout.distance || 0;  // Main workout meters
      const restMeters = workout.rest_distance || 0;  // Rest interval distance in meters

      return {
        id: workout.id,
        date: workout.date,
        meters: workoutMeters + restMeters
      };
    });
    // Store workouts in database
    const { error: upsertError } = await supabaseAdmin
      .from('workouts')
      .upsert(
        workouts.map((workout) => ({
          user_id,
          concept2_id: workout.id,
          workout_date: workout.date,
          meters: workout.meters
        })),
        {
          onConflict: 'user_id,concept2_id'
        }
      );
    if (upsertError) {
      throw upsertError;
    }
    return new Response(JSON.stringify({
      message: 'Workouts synced successfully',
      count: workouts.length,
      pages_processed: totalPages
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
