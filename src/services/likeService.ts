import { supabase } from '@/integrations/supabase/client';

export class LikeService {
  static async getLikes(ticketId: string): Promise<{ count: number; userLikes: boolean }> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;

      const { data, error } = await supabase
        .from('ticket_likes')
        .select('user_id')
        .eq('ticket_id', ticketId);

      if (error) throw error;

      const count = data?.length || 0;
      const userLikes = !!userId && (data || []).some((r) => r.user_id === userId);
      return { count, userLikes };
    } catch (e) {
      console.warn('LikeService.getLikes failed, returning fallback:', e);
      return { count: 0, userLikes: false };
    }
  }

  static async toggleLike(ticketId: string): Promise<{ success: boolean; liked: boolean }> {
    try {
      const userRes = await supabase.auth.getUser();
      const userId = userRes.data.user?.id;
      if (!userId) return { success: false, liked: false };

      // Check if like exists
      const { data: existing } = await supabase
        .from('ticket_likes')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('ticket_likes')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { success: true, liked: false };
      } else {
        const { error } = await supabase
          .from('ticket_likes')
          .insert({ ticket_id: ticketId, user_id: userId });
        if (error) throw error;
        return { success: true, liked: true };
      }
    } catch (e) {
      console.warn('LikeService.toggleLike failed:', e);
      return { success: false, liked: false };
    }
  }

  static subscribe(ticketId: string, onChange: () => void) {
    const channel = supabase
      .channel(`likes-${ticketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_likes', filter: `ticket_id=eq.${ticketId}` },
        onChange
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
}

// Note: Requires table `ticket_likes` with columns: id (uuid, pk, default uuid_generate_v4()),
// ticket_id (uuid, fk tickets.id), user_id (uuid, fk profiles.id), created_at (timestamp default now()).
// Unique constraint (ticket_id, user_id).


