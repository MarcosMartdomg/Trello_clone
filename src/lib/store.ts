import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import { KanbanColumn, KanbanCard, ActivityLog, Member, Board, Priority } from './kanban-data';
import { api } from './api';

interface KanbanState {
    boards: Board[];
    activeBoardId: string | null;
    searchQuery: string;
    tagFilter: string[];
    priorityFilter: string[];
    language: 'es' | 'en';
    currentView: 'board' | 'my-tasks' | 'boards-list' | 'calendar' | 'inbox';
    isSearchOpen: boolean;
    invitations: any[];
    activeNotifications: any[];

    // Actions
    setCurrentView: (view: 'board' | 'my-tasks' | 'boards-list' | 'calendar' | 'inbox') => void;
    setSearchOpen: (isOpen: boolean) => void;
    resetUserSession: () => void;

    fetchBoards: (userId: string) => Promise<void>;
    createBoard: (name: string, userId: string, type?: 'personal' | 'shared') => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;
    leaveBoard: (id: string, newOwnerId?: string) => Promise<void>;
    transferOwnership: (boardId: string, newOwnerId: string) => Promise<void>;
    setActiveBoard: (id: string) => void;
    fetchInvitations: (userId: string) => Promise<void>;
    acceptInvitation: (boardId: string, userId: string) => Promise<void>;
    declineInvitation: (boardId: string, userId: string) => Promise<void>;
    updateBoardPriorities: (boardId: string, priorities: Priority[]) => void;
    addBoardMember: (boardId: string, userId: string) => Promise<void>;
    removeBoardMember: (boardId: string, userId: string) => Promise<void>;
    toggleBoardFavorite: (boardId: string, isFavorite: boolean) => Promise<void>;
    addNotification: (notification: any) => void;
    removeNotification: (id: string) => void;

    moveCard: (activeId: string, overId: string) => Promise<void>;
    addCard: (columnId: string, card: Partial<KanbanCard>) => Promise<void>;
    updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    addActivity: (cardId: string, text: string, type: ActivityLog['type']) => void;

    // Card Members
    addCardMember: (cardId: string, userId: string) => Promise<void>;
    removeCardMember: (cardId: string, userId: string) => Promise<void>;

    addColumn: (title: string) => Promise<void>;
    updateColumn: (columnId: string, updates: Partial<KanbanColumn>) => Promise<void>;
    deleteColumn: (columnId: string) => Promise<void>;
    setSearchQuery: (query: string) => void;
    toggleTagFilter: (tag: string) => void;
    togglePriorityFilter: (priority: string) => void;
    clearPriorityFilters: () => void;
    clearTagFilters: () => void;
    setLanguage: (lang: 'es' | 'en') => void;
}

export const useKanbanStore = create<KanbanState>()(
    persist(
        (set, get) => ({
            boards: [],
            activeBoardId: null,
            searchQuery: '',
            tagFilter: [],
            priorityFilter: [],
            language: 'es',
            currentView: 'board',
            isSearchOpen: false,
            invitations: [],
            activeNotifications: [],

            setCurrentView: (view: 'board' | 'my-tasks' | 'boards-list' | 'calendar' | 'inbox') => set({ currentView: view }),
            setSearchOpen: (isOpen: boolean) => set({ isSearchOpen: isOpen }),

            resetUserSession: () => set({
                boards: [],
                activeBoardId: null,
                invitations: [],
                activeNotifications: [],
                currentView: 'boards-list'
            }),

            fetchBoards: async (userId: string) => {
                try {
                    const data = await api.fetchBoards(userId);
                    const filteredData = data.filter((b: any) => {
                        if (b.owner_id === userId) return true;
                        return b.board_members?.some((bm: any) =>
                            bm.user_id === userId && bm.status === 'accepted'
                        );
                    });

                    const boards: Board[] = filteredData.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        ownerId: b.owner_id,
                        isFavorite: b.is_favorite || false,
                        type: b.type || 'personal',
                        columns: b.columns?.map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            boardId: c.board_id,
                            order: c.order_index,
                            cards: c.cards?.map((card: any) => ({
                                id: card.id,
                                title: card.title,
                                description: card.description,
                                columnId: card.column_id,
                                order: card.order_index,
                                priority: card.priority,
                                tags: card.tags || [],
                                color: card.color,
                                members: card.card_members?.map((cm: any) => cm.user_id) || [],
                                activity: card.activities?.map((a: any) => ({
                                    id: a.id,
                                    text: a.log_text,
                                    type: a.log_type,
                                    timestamp: a.created_at
                                })) || []
                            })).sort((a: any, b: any) => a.order - b.order) || []
                        })).sort((a: any, b: any) => a.order - b.order) || [],
                        members: b.board_members?.map((bm: any) => ({
                            id: bm.user_id,
                            email: bm.profiles?.email,
                            role: bm.role,
                            status: bm.status
                        })) || [],
                        priorities: b.board_priorities?.map((p: any) => ({
                            id: p.id,
                            label: p.label,
                            color: p.color
                        })) || []
                    }));

                    set({ boards });
                    if (boards.length > 0 && !get().activeBoardId) {
                        set({ activeBoardId: boards[0].id });
                    }
                } catch (error) {
                    console.error('Error fetching boards:', error);
                }
            },

            createBoard: async (name: string, userId: string, type: 'personal' | 'shared' = 'personal') => {
                try {
                    const newBoard = await api.createBoard(name, userId, type);
                    if (newBoard) {
                        await get().fetchBoards(userId);
                    }
                } catch (error) {
                    console.error('Error creating board:', error);
                }
            },

            deleteBoard: async (id: string) => {
                try {
                    const { user } = (await supabase.auth.getUser()).data;
                    if (!user) return;
                    await api.deleteBoard(id);
                    await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error deleting board:', error);
                }
            },

            leaveBoard: async (id: string, newOwnerId?: string) => {
                try {
                    const { user } = (await supabase.auth.getUser()).data;
                    if (!user) return;
                    await api.leaveBoard(id, user.id, newOwnerId);
                    await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error leaving board:', error);
                }
            },

            transferOwnership: async (boardId: string, newOwnerId: string) => {
                try {
                    const { user } = (await supabase.auth.getUser()).data;
                    if (!user) return;
                    await api.transferOwnership(boardId, newOwnerId);
                    await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error transferring ownership:', error);
                }
            },

            setActiveBoard: (id: string) => set({ activeBoardId: id }),

            fetchInvitations: async (userId: string) => {
                try {
                    const data = await api.fetchInvitations(userId);
                    set({ invitations: data });
                } catch (error) {
                    console.error('Error fetching invitations:', error);
                }
            },

            acceptInvitation: async (boardId: string, userId: string) => {
                try {
                    await api.updateInvitationStatus(boardId, userId, 'accepted');
                    await get().fetchInvitations(userId);
                    await get().fetchBoards(userId);
                    get().addNotification({
                        id: Math.random().toString(),
                        title: 'Invitación aceptada',
                        message: 'Ahora eres miembro del tablero',
                        type: 'success'
                    });
                } catch (error) {
                    console.error('Error accepting invitation:', error);
                }
            },

            declineInvitation: async (boardId: string, userId: string) => {
                try {
                    await api.updateInvitationStatus(boardId, userId, 'declined');
                    await get().fetchInvitations(userId);
                } catch (error) {
                    console.error('Error declining invitation:', error);
                }
            },

            updateBoardPriorities: (boardId: string, priorities: Priority[]) => {
                set((state) => ({
                    boards: state.boards.map(b => b.id === boardId ? { ...b, priorities } : b)
                }));
            },

            addBoardMember: async (boardId: string, userId: string) => {
                try {
                    await api.inviteMember(boardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error adding board member:', error);
                }
            },

            removeBoardMember: async (boardId: string, userId: string) => {
                try {
                    await api.removeMember(boardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error removing board member:', error);
                }
            },

            toggleBoardFavorite: async (boardId: string, isFavorite: boolean) => {
                try {
                    await api.toggleBoardFavorite(boardId, isFavorite);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error toggling favorite:', error);
                }
            },

            addNotification: (notification) => set((state) => ({
                activeNotifications: [...state.activeNotifications, { ...notification, id: notification.id || Math.random().toString() }]
            })),

            removeNotification: (id) => set((state) => ({
                activeNotifications: state.activeNotifications.filter(n => n.id !== id)
            })),

            moveCard: async (activeId, overId) => {
                // ... logic to move card (locally first for performance, then API)
                // This is a complex logic that involves reordering
                // For now, let's keep it simple or call API and refetch
                const { user } = (await supabase.auth.getUser()).data;
                if (user) await get().fetchBoards(user.id);
            },

            addCard: async (columnId, card) => {
                try {
                    await api.createCard(columnId, card);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error adding card:', error);
                }
            },

            updateCard: async (cardId, updates) => {
                try {
                    await api.updateCard(cardId, updates);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error updating card:', error);
                }
            },

            deleteCard: async (cardId) => {
                try {
                    await api.deleteCard(cardId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error deleting card:', error);
                }
            },

            addActivity: (cardId, text, type) => {
                // Implementation for activity logging
            },

            addCardMember: async (cardId, userId) => {
                try {
                    await api.addCardMember(cardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error adding card member:', error);
                }
            },

            removeCardMember: async (cardId, userId) => {
                try {
                    await api.removeCardMember(cardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error removing card member:', error);
                }
            },

            addColumn: async (title) => {
                try {
                    const boardId = get().activeBoardId;
                    if (!boardId) return;
                    await api.createColumn(boardId, title);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error adding column:', error);
                }
            },

            updateColumn: async (columnId, updates) => {
                try {
                    await api.updateColumn(columnId, updates);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error updating column:', error);
                }
            },

            deleteColumn: async (columnId) => {
                try {
                    await api.deleteColumn(columnId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error deleting column:', error);
                }
            },

            setSearchQuery: (query: string) => set({ searchQuery: query }),

            toggleTagFilter: (tag: string) =>
                set((state) => {
                    const exists = state.tagFilter.includes(tag);
                    return {
                        tagFilter: exists
                            ? state.tagFilter.filter((t) => t !== tag)
                            : [...state.tagFilter, tag],
                    };
                }),

            togglePriorityFilter: (priority: string) =>
                set((state) => {
                    const exists = state.priorityFilter.includes(priority);
                    return {
                        priorityFilter: exists
                            ? state.priorityFilter.filter((p) => p !== priority)
                            : [...state.priorityFilter, priority],
                    };
                }),

            clearPriorityFilters: () => set({ priorityFilter: [] }),
            clearTagFilters: () => set({ tagFilter: [] }),
            setLanguage: (lang: 'es' | 'en') => set({ language: lang }),
        }),
        {
            name: 'kanban-storage-vite',
            partialize: (state) => ({
                activeBoardId: state.activeBoardId,
                language: state.language,
                currentView: state.currentView,
            }),
        }
    )
);
