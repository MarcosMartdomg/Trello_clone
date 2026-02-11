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
                *,
                board_members (
                    user_id,
                    role,
                    profiles (full_name, avatar_url)
                ),
                columns (
                    *,
                    cards (
                        *,
                        activities (*)
                    )
                )
            `);

        if (error) throw error;
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

    // Members
    addBoardMember: async (boardId: string, userId: string) => {
        const { error } = await supabase
            .from('board_members')
            .insert([{ board_id: boardId, user_id: userId }]);
        if (error) throw error;
    },

    removeBoardMember: async (boardId: string, userId: string) => {
        const { error } = await supabase
            .from('board_members')
            .delete()
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
    }
};
