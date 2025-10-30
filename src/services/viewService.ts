import { supabase } from '@/integrations/supabase/client';

export class ViewService {
  static async increment(ticketId: string): Promise<boolean> {
    try {
      let { error } = await (supabase as any).rpc('increment_ticket_views', { p_ticket_id: ticketId });
      if (error) {
        console.warn('increment_ticket_views RPC error:', error);
        // Fallback to existing function name if present in DB
        const fallback = await (supabase as any).rpc('increment_view_count', { ticket_id: ticketId });
        if (fallback.error) {
          console.error('increment_view_count RPC error:', fallback.error);
          // Last-resort non-atomic fallback: read-modify-write
          try {
            const { data: current, error: selErr } = await (supabase as any)
              .from('tickets')
              .select('views_count')
              .eq('id', ticketId)
              .single();
            if (selErr) throw selErr;
            const next = ((current as any)?.views_count ?? 0) + 1;
            const { error: updErr } = await (supabase as any)
              .from('tickets')
              .update({ views_count: next })
              .eq('id', ticketId);
            if (updErr) throw updErr;
          } catch (finalErr) {
            console.error('ViewService non-atomic fallback failed:', finalErr);
            return false;
          }
        }
      }
      return true;
    } catch (e) {
      console.error('ViewService.increment failed:', e);
      return false;
    }
  }
}


