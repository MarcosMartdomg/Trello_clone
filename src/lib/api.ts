import { supabase } from "./supabase";
import { KanbanColumn, KanbanCard, ActivityLog, Member } from "./kanban-data";

export const api = {
    // Helper to ensure profile exists (prevents FK errors)
    ensureProfile: async (userId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                full_name: user.user_metadata?.full_name || 'User',
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url || ''
            });
            if (error) console.error("api: error ensuring profile", error);
        } catch (e) {
            console.error("api: exception in ensureProfile", e);
        }
    },

    // Boards
    fetchBoards: async (userId: string) => {
        await api.ensureProfile(userId);
        const { data, error } = await supabase
            .from('boards')
            .select(`
                id,
                name,
                type,
                owner_id,
                is_favorite,
                board_members (
                    user_id,
                    role,
                    profiles (full_name, avatar_url)
                ),
                columns (
                    id,
                    title,
                    icon,
                    position,
                    cards (
                        id,
                        title,
                        description,
                        priority,
                        color,
                        due_date,
                        position,
                        labels,
                        checklist,
                        activities (
                            *,
                            profiles (id, full_name, avatar_url)
                        ),
                        card_members (
                            user_id,
                            profiles (full_name, avatar_url)
                        )
                    )
                )
            `);

        if (error) {
            console.error("api: fetchBoards error details:", error);
            throw error;
        }
        return data as any[];
    },

    createBoard: async (name: string, userId: string, type: 'personal' | 'shared') => {
        await api.ensureProfile(userId);
        const { data, error } = await supabase
            .from('boards')
            .insert([{ name, owner_id: userId, type }])
            .select()
            .single();

        if (error) throw error;

        // Create default columns
        const defaultColumns = [
            { board_id: data.id, title: 'To Do', icon: 'circle', position: 0 },
            { board_id: data.id, title: 'In Progress', icon: 'loader', position: 1 },
            { board_id: data.id, title: 'Done', icon: 'check-circle', position: 2 }
        ];

        await supabase.from('columns').insert(defaultColumns);
        return data;
    },

    deleteBoard: async (id: string) => {
        const { error } = await supabase.from('boards').delete().eq('id', id);
        if (error) throw error;
    },

    // Columns
    createColumn: async (boardId: string, title: string, position: number) => {
        const { data, error } = await supabase
            .from('columns')
            .insert([{ board_id: boardId, title, position }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateColumn: async (id: string, updates: any) => {
        const { error } = await supabase.from('columns').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteColumn: async (id: string) => {
        const { error } = await supabase.from('columns').delete().eq('id', id);
        if (error) throw error;
    },

    // Cards
    createCard: async (columnId: string, card: Partial<KanbanCard>, position: number) => {
        const { data, error } = await supabase
            .from('cards')
            .insert([{
                column_id: columnId,
                title: card.title,
                description: card.description,
                priority: card.priority,
                color: card.color,
                position,
                labels: card.labels || [],
                checklist: card.checklist || [],
                due_date: card.due_date
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateCard: async (id: string, updates: any) => {
        const { error } = await supabase.from('cards').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteCard: async (id: string) => {
        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) throw error;
    },

    // Card Members
    addCardMember: async (cardId: string, userId: string) => {
        const { error } = await supabase
            .from('card_members')
            .insert([{ card_id: cardId, user_id: userId }]);
        if (error) throw error;
    },

    removeCardMember: async (cardId: string, userId: string) => {
        const { error } = await supabase
            .from('card_members')
            .delete()
            .match({ card_id: cardId, user_id: userId });
        if (error) throw error;
    },

    // Board Members
    addBoardMember: async (boardId: string, userId: string) => {
        const { error } = await supabase
            .from('board_members')
            .insert([{ board_id: boardId, user_id: userId, status: 'pending' }]);
        if (error) throw error;
    },

    removeBoardMember: async (boardId: string, userId: string) => {
        const { error } = await supabase
            .from('board_members')
            .delete()
            .match({ board_id: boardId, user_id: userId });
        if (error) throw error;
    },

    fetchInvitations: async (userId: string) => {
        const { data, error } = await supabase
            .from('board_members')
            .select('*, boards(id, name, type, owner_id)')
            .match({ user_id: userId, status: 'pending' });
        if (error) throw error;
        return data;
    },

    updateInvitationStatus: async (boardId: string, userId: string, status: 'accepted' | 'declined') => {
        if (status === 'declined') {
            return api.removeBoardMember(boardId, userId);
        }
        const { error } = await supabase
            .from('board_members')
            .update({ status: 'accepted' })
            .match({ board_id: boardId, user_id: userId });
        if (error) throw error;
    },

    // Users
    searchUsers: async (query: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    },

    fetchProfiles: async (userIds: string[]) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

        if (error) throw error;
        return data;
    },

    // Toggle board favorite status
    toggleBoardFavorite: async (boardId: string, isFavorite: boolean) => {
        const { error } = await supabase
            .from('boards')
            .update({ is_favorite: isFavorite })
            .eq('id', boardId);

        if (error) {
            console.error("api: toggleBoardFavorite error:", error);
            throw error;
        }
    },

    // Notifications
    createNotification: async (boardId: string, message: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { error } = await supabase.from('board_activities').insert([{
                board_id: boardId,
                user_id: user.id,
                text: message,
                type: 'system'
            }]);
            if (error) console.error("api: error creating notification", error);
        } catch (e) {
            console.warn("api: board_activities table likely missing, notification suppressed.");
        }
    }
};
