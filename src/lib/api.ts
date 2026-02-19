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

        const boardSelect = `
            id,
            name,
            type,
            owner_id,
            is_favorite,
            board_members (
                user_id,
                role,
                status,
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
        `;

        // Query 1: Boards the user owns (RLS handles this)
        const { data: ownedBoards, error: ownedError } = await supabase
            .from('boards')
            .select(boardSelect)
            .eq('owner_id', userId);

        if (ownedError) {
            console.error("api: fetchBoards owned error:", {
                message: ownedError.message,
                details: ownedError.details,
                hint: ownedError.hint,
                code: ownedError.code
            });
            throw ownedError;
        }

        // Query 2: Boards where user is an accepted member (join via board_members)
        const { data: membershipData, error: memberError } = await supabase
            .from('board_members')
            .select('board_id')
            .eq('user_id', userId)
            .eq('status', 'accepted');

        let sharedBoards: any[] = [];
        if (!memberError && membershipData && membershipData.length > 0) {
            const boardIds = membershipData.map((m: any) => m.board_id);
            const { data: shared, error: sharedError } = await supabase
                .from('boards')
                .select(boardSelect)
                .in('id', boardIds);

            if (sharedError) {
                console.error("api: fetchBoards shared error:", sharedError);
            } else {
                sharedBoards = shared || [];
            }
        }

        // Merge and deduplicate
        const ownedIds = new Set((ownedBoards || []).map((b: any) => b.id));
        const merged = [
            ...(ownedBoards || []),
            ...sharedBoards.filter((b: any) => !ownedIds.has(b.id))
        ];

        return merged as any[];
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

    transferBoardOwnership: async (boardId: string, newOwnerId: string) => {
        const { error } = await supabase
            .from('boards')
            .update({ owner_id: newOwnerId })
            .eq('id', boardId);
        if (error) throw error;
    },

    transferOwnership: async (boardId: string, newOwnerId: string) => {
        const { error } = await supabase
            .from('boards')
            .update({ owner_id: newOwnerId })
            .eq('id', boardId);
        if (error) throw error;
    },

    updateBoard: async (id: string, updates: any) => {
        const { error } = await supabase.from('boards').update(updates).eq('id', id);
        if (error) throw error;
    },

    toggleBoardFavorite: async (boardId: string, isFavorite: boolean) => {
        const { error } = await supabase
            .from('boards')
            .update({ is_favorite: isFavorite })
            .eq('id', boardId);
        if (error) throw error;
    },

    // Columns
    createColumn: async (boardId: string, title: string, position: number) => {
        const { data, error } = await supabase
            .from('columns')
            .insert([{ board_id: boardId, title, position, icon: 'circle' }])
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
    createCard: async (columnId: string, title: string, position: number) => {
        const payload = {
            column_id: columnId,
            title: title || 'New Card',
            position: position,
            description: '',
            priority: 'medium',
            labels: [],
            checklist: []
        };

        console.log("api: creating card with payload", payload);

        const { data, error } = await supabase
            .from('cards')
            .insert([payload])
            .select();

        if (error) {
            console.error("api: createCard error:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
        return data?.[0];
    },

    updateCard: async (id: string, updates: any) => {
        // Redundancy handling for labels/tags schema mismatch
        const finalUpdates = { ...updates };
        if (updates.labels && !updates.tags) finalUpdates.tags = updates.labels;
        if (updates.tags && !updates.labels) finalUpdates.labels = updates.tags;

        console.log(`api: updating card ${id} with:`, finalUpdates);
        const { error } = await supabase.from('cards').update(finalUpdates).eq('id', id);
        if (error) {
            console.error("api: updateCard error:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw error;
        }
    },

    deleteCard: async (id: string) => {
        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) throw error;
    },

    moveCard: async (cardId: string, columnId: string, position: number) => {
        const { error } = await supabase
            .from('cards')
            .update({ column_id: columnId, position })
            .eq('id', cardId);
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

    // Board Members & Invitations
    addBoardMember: async (boardId: string, userId: string) => {
        // Check if a record already exists (from prev declined/ghost invitation)
        const { data: existing, error: checkError } = await supabase
            .from('board_members')
            .select('id, status')
            .match({ board_id: boardId, user_id: userId })
            .maybeSingle();

        if (existing) {
            // Record exists — just update status back to 'pending'
            const { error } = await supabase
                .from('board_members')
                .update({ status: 'pending' })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            // No record — insert fresh
            const { data, error } = await supabase
                .from('board_members')
                .insert([{ board_id: boardId, user_id: userId, role: 'editor', status: 'pending' }])
                .select();
            if (error) throw error;
        }
    },

    inviteMember: async (boardId: string, userId: string) => {
        return api.addBoardMember(boardId, userId);
    },

    removeBoardMember: async (boardId: string, userId: string) => {
        const { error } = await supabase
            .from('board_members')
            .delete()
            .match({ board_id: boardId, user_id: userId });
        if (error) throw error;
    },

    removeMember: async (boardId: string, userId: string) => {
        return api.removeBoardMember(boardId, userId);
    },

    leaveBoard: async (boardId: string, userId: string, newOwnerId?: string) => {
        if (newOwnerId) {
            await api.transferBoardOwnership(boardId, newOwnerId);
        }
        await api.removeBoardMember(boardId, userId);
    },

    updateInvitationStatus: async (boardId: string, userId: string, status: 'accepted' | 'declined') => {
        const { error } = await supabase
            .from('board_members')
            .update({ status: status })
            .match({ board_id: boardId, user_id: userId });
        if (error) throw error;
    },

    deleteInvitation: async (inviteId: string) => {
        const { error } = await supabase
            .from('board_members')
            .delete()
            .eq('id', inviteId);
        if (error) throw error;
    },

    fetchInvitations: async (userId: string) => {
        const { data, error } = await supabase
            .from('board_members')
            .select(`
                id,
                board_id,
                user_id,
                status,
                boards!inner (
                    id,
                    name
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'pending');
        if (error) throw error;
        return data as any[];
    },

    createNotification: async (boardId: string, message: string) => {
        // Fallback to logActivity if no notifications table exists, 
        // or use a dedicated notifications table if preferred.
        // Based on previous context, this likely goes to activities.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await api.logActivity('', user.id, message, 'system', { boardId });
    },

    fetchProfiles: async (query: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5);
        if (error) throw error;
        return data;
    },

    searchUsers: async (query: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, email')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    },

    // Activities
    logActivity: async (cardId: string, userId: string, text: string, type: string, params: any = {}) => {
        const { error } = await supabase
            .from('activities')
            .insert([{
                card_id: cardId,
                user_id: userId,
                text,
                type,
                params,
                timestamp: new Date().toISOString()
            }]);
        if (error) {
            console.error("api: logActivity error", error);
        }
    }
};
