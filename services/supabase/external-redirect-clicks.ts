import { supabase } from '@/lib/supabaseClient';

type RedirectSource = 'partner_card' | 'program_match' | 'agent_chat';

export async function registerExternalRedirectClick(
  partnerId: string,
  redirectUrl: string,
  source: RedirectSource
): Promise<{ error: unknown }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('external_redirect_clicks')
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        redirect_url: redirectUrl,
        source,
      });

    return { error };
  } catch (error) {
    console.error('Unexpected error registering external redirect click:', error);
    return { error };
  }
}
