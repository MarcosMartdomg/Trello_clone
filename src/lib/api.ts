import { supabase } from "./supabase";
import { KanbanColumn, KanbanCard, ActivityLog, Member } from "./kanban-data";

export const api = {
    // Helper to ensure profile exists (prevents FK errors)
    ensureProfile: async (userId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We use a non-blocking approach to not abort transactions if this fails
            supabase.from('profiles').upsert({
                id: userId,
                full_name: user.user_metadata?.full_name || 'User',
                avatar_url: user.user_metadata?.avatar_url || ''
            }).then(({ error }) => {
                if (error) {
                    console.error("api: error ensuring profile (non-blocking)", error.message);
                }
            });
        } catch (e) {
            console.error("api: exception in ensureProfile", e);
        }
    },

    // Boards
    fetchBoardList: async (userId: string) => {
        // Query 1: Owned boards
        const { data: owned, error: ownedError } = await supabase
            .from('boards')
            .select('id, name, type, owner_id, is_favorite')
            .eq('owner_id', userId);

        // Query 2: Shared boards (accepted membership)
        const { data: membershipData, error: memberError } = await supabase
            .from('board_members')
            .select('board_id, boards(id, name, type, owner_id, is_favorite)')
            .eq('user_id', userId)
            .eq('status', 'accepted');

        if (ownedError || memberError) {
            console.error("api: fetchBoardList error", { ownedError, memberError });
        }

        const shared = (membershipData || [])
            .map((m: any) => m.boards)
            .filter(Boolean);

        // Merge and deduplicate
        const ownedIds = new Set((owned || []).map((b: any) => b.id));
        const merged = [
            ...(owned || []),
            ...shared.filter((b: any) => !ownedIds.has(b.id))
        ];

        return merged;
    },

    fetchBoards: async (userId: string) => {
        api.ensureProfile(userId); // Don't await it

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
                    card_members (
                        user_id,
                        profiles (full_name, avatar_url)
                    )
                )
            )
        `;

        // Query 1: Owned boards
        const { data: owned, error: ownedError } = await supabase
            .from('boards')
            .select(boardSelect)
            .eq('owner_id', userId);

        // Query 2: Shared boards (get board IDs first)
        const { data: membershipData, error: memberError } = await supabase
            .from('board_members')
            .select('board_id')
            .eq('user_id', userId)
            .eq('status', 'accepted');

        if (ownedError) throw ownedError;

        let sharedBoards: any[] = [];
        if (membershipData && membershipData.length > 0) {
            const boardIds = membershipData.map((m: any) => m.board_id);
            const { data: shared, error: sharedError } = await supabase
                .from('boards')
                .select(boardSelect)
                .in('id', boardIds);

            if (!sharedError) sharedBoards = shared || [];
        }

        // Merge and deduplicate
        const ownedIds = new Set((owned || []).map((b: any) => b.id));
        const merged = [
            ...(owned || []),
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
        const { error } = await supabase.rpc('transfer_board_ownership', {
            board_id: boardId,
            new_owner_id: newOwnerId
        });

        if (error) {
            console.error("api: transferBoardOwnership RPC error:", {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }
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
        // Only send known DB columns - remove 'tags' if present (DB uses 'labels')
        const { tags, ...finalUpdates } = updates;

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
        // More robust check for existing records to prevent duplicates
        const { data: existing, error: checkError } = await supabase
            .from('board_members')
            .select('id, status')
            .match({ board_id: boardId, user_id: userId });

        if (checkError) {
            console.error("api: error checking for existing board member", checkError);
            throw checkError;
        }

        if (existing && existing.length > 0) {
            // Record(s) exist — update all to 'pending' to be safe
            const { error } = await supabase
                .from('board_members')
                .update({ status: 'pending' })
                .match({ board_id: boardId, user_id: userId });
            if (error) throw error;
        } else {
            // No record — insert fresh
            const { error } = await supabase
                .from('board_members')
                .insert([{ board_id: boardId, user_id: userId, role: 'editor', status: 'pending' }]);
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

        if (error) {
            const errorMsg = `api: removeBoardMember error: ${error.message}${error.code === '42501' ? ' (RLS Policy restriction)' : ''} (Code: ${error.code})`;
            console.error(errorMsg, {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                boardId,
                userId
            });
            throw new Error(errorMsg);
        } else {
            console.log(`api: Successfully removed record for board ${boardId} and user ${userId}`);
        }
    },

    removeMember: async (boardId: string, userId: string) => {
        return api.removeBoardMember(boardId, userId);
    },

    leaveBoard: async (boardId: string, userId: string, newOwnerId?: string) => {
        if (newOwnerId) {
            try {
                console.log(`api: Transferring ownership of board ${boardId} to ${newOwnerId}`);
                await api.transferBoardOwnership(boardId, newOwnerId);
            } catch (error: any) {
                const errorMsg = `api: leaveBoard transfer error: ${error.message} (Code: ${error.code})`;
                console.error(errorMsg, { error, boardId, userId, newOwnerId });
                throw new Error(errorMsg);
            }
        }

        try {
            console.log(`api: Dissociating user ${userId} from board ${boardId}`);

            // 1. Clean up card memberships in this board for this user
            // Optimization: Get all cards belonging to this board's columns
            const { data: columns } = await supabase
                .from('columns')
                .select('id')
                .eq('board_id', boardId);

            if (columns && columns.length > 0) {
                const columnIds = columns.map(c => c.id);
                const { data: cards } = await supabase
                    .from('cards')
                    .select('id')
                    .in('column_id', columnIds);

                if (cards && cards.length > 0) {
                    const cardIds = cards.map(c => c.id);
                    await supabase
                        .from('card_members')
                        .delete()
                        .in('card_id', cardIds)
                        .eq('user_id', userId);
                }
            }

            // 2. Remove from board_members
            await api.removeBoardMember(boardId, userId);

            console.log(`api: Successfully disconnected user ${userId} from board ${boardId}`);
        } catch (error: any) {
            const errorMsg = `api: leaveBoard removal/cleanup error: ${error.message} (Code: ${error.code})`;
            console.error(errorMsg, { error, boardId, userId });
            throw new Error(errorMsg);
        }
    },

    updateInvitationStatus: async (boardId: string, userId: string, status: 'accepted' | 'declined') => {
        // Match all potential duplicates to ensure state consistency
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
                params: params || {}
            }]);
        if (error) {
            console.error("api: logActivity error", error);
        }
    },

    fetchCardActivities: async (cardId: string) => {
        const { data, error } = await supabase
            .from('activities')
            .select(`
                *,
                profiles (id, full_name, avatar_url)
            `)
            .eq('card_id', cardId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("api: fetchCardActivities error", error);
            throw error;
        }
        return data as any[];
    }
};
