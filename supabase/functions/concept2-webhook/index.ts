import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceRole);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const data = await req.json();

    console.log('Received webhook data:', data);

    switch (data.type) {
      case 'result-added':
      case 'result-updated':
        // First find the user by their concept2_id
        const { data: userData, error: userError } = await supabase
          .from('user_tokens')
          .select('user_id')
          .eq('concept2_user_id', data.result.user_id)
          .single();

        if (userError || !userData) {
          console.error('Error finding user:', userError);
          return new Response('User not found', { status: 404 });
        }

        const workout = {
          user_id: userData.user_id,
          concept2_id: data.result.id,
          workout_date: data.result.date,
          workout_meters: data.result.distance,
          rest_meters: data.result.rest_distance
        }

        // Use Supabase upsert
        const { error } = await supabase
          .from('workouts')
          .upsert(workout, {
            onConflict: 'user_id,concept2_id'
          });
        if (error) {
          console.error('Error upserting data:', error);
          return new Response('Error upserting data', { status: 500 });
        }
        console.log('Data upserted:', data);
        break;
      case 'result-deleted':
        // Delete workout by concept2_id
        const { error: deleteError } = await supabase
          .from('workouts')
          .delete()
          .eq('concept2_id', data.result_id);

        if (deleteError) {
          console.error('Error deleting workout:', deleteError);
          return new Response('Error deleting workout', { status: 500 });
        }
        console.log('Workout deleted:', data.result_id);
        break;
      default:
        return new Response('Event type not supported', { status: 400 });
    }

    return new Response('Webhook received', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
});
