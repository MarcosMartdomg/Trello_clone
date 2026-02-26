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
    pendingRemovals: Set<string>;

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

    moveCard: (activeId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number) => Promise<void>;
    addCard: (columnId: string, card: Partial<KanbanCard>) => Promise<void>;
    updateCard: (cardId: string, updates: Partial<KanbanCard>) => Promise<void>;
    deleteCard: (cardId: string) => Promise<void>;
    addActivity: (cardId: string, text: string, type: ActivityLog['type']) => Promise<void>;
    loadCardActivities: (cardId: string) => Promise<void>;

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
            pendingRemovals: new Set(),

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
                    const processedData = data.filter((b: any) => !get().pendingRemovals.has(b.id));

                    const boards: Board[] = processedData.map((b: any) => ({
                        id: b.id,
                        name: b.name,
                        ownerId: b.owner_id,
                        isFavorite: b.is_favorite || false,
                        type: b.type || 'personal',
                        columns: b.columns?.map((c: any) => ({
                            id: c.id,
                            title: c.title,
                            icon: c.icon || 'circle',
                            boardId: c.board_id,
                            order: c.position,
                            cards: c.cards?.map((card: any) => ({
                                id: card.id,
                                title: card.title,
                                description: card.description,
                                columnId: card.column_id,
                                order: card.position,
                                priority: card.priority,
                                labels: card.labels || card.tags || [],
                                color: card.color,
                                due_date: card.due_date,
                                checklist: card.checklist || [],
                                members: card.card_members?.map((cm: any) => ({
                                    id: cm.user_id,
                                    name: cm.profiles?.full_name || 'Member',
                                    avatar: cm.profiles?.avatar_url || '',
                                    color: 'bg-primary/10' // Default color for avatar background
                                })) || [],
                                activity: card.activities?.map((a: any) => ({
                                    id: a.id,
                                    text: a.text || a.log_text || '',
                                    type: a.type || a.log_type || 'system',
                                    timestamp: a.created_at || a.timestamp,
                                    params: a.params || {},
                                    user: a.profiles ? {
                                        id: a.profiles.id,
                                        name: a.profiles.full_name,
                                        avatar: a.profiles.avatar_url
                                    } : undefined
                                })) || []
                            })).sort((a: any, b: any) => a.order - b.order) || []
                        })).sort((a: any, b: any) => a.order - b.order) || [],
                        members: b.board_members?.map((bm: any) => ({
                            id: bm.user_id,
                            name: bm.profiles?.full_name || 'Member',
                            avatar: bm.profiles?.avatar_url || '',
                            role: bm.role,
                            status: bm.status,
                            color: 'bg-primary/10'
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
                const { user } = (await supabase.auth.getUser()).data;
                if (!user) return;

                // Optimistic update
                const previousBoards = get().boards;
                const newPending = new Set(get().pendingRemovals);
                newPending.add(id);
                set({
                    boards: previousBoards.filter(b => b.id !== id),
                    pendingRemovals: newPending
                });

                if (get().activeBoardId === id) {
                    set({ activeBoardId: null, currentView: 'boards-list' });
                }

                try {
                    await api.deleteBoard(id);
                    get().fetchBoards(user.id);

                    // Clear after some time to allow server to be 100% updated
                    setTimeout(() => {
                        const clearedPending = new Set(get().pendingRemovals);
                        clearedPending.delete(id);
                        set({ pendingRemovals: clearedPending });
                    }, 5000);
                } catch (error) {
                    console.error('Error deleting board:', error);
                    const clearedPending = new Set(get().pendingRemovals);
                    clearedPending.delete(id);
                    set({ boards: previousBoards, pendingRemovals: clearedPending });
                }
            },

            leaveBoard: async (id: string, newOwnerId?: string) => {
                const { user } = (await supabase.auth.getUser()).data;
                if (!user) return;

                // Optimistic update: Remove from local state immediately
                const previousBoards = get().boards;
                const newPending = new Set(get().pendingRemovals);
                newPending.add(id);

                set((state) => ({
                    boards: state.boards.filter(b => b.id !== id),
                    activeBoardId: state.activeBoardId === id ? null : state.activeBoardId,
                    currentView: state.activeBoardId === id ? 'boards-list' : state.currentView,
                    pendingRemovals: newPending
                }));

                try {
                    await api.leaveBoard(id, user.id, newOwnerId);

                    // Re-sync with server in background
                    get().fetchBoards(user.id);

                    // Clear after some time to allow server to be 100% updated
                    setTimeout(() => {
                        const clearedPending = new Set(get().pendingRemovals);
                        clearedPending.delete(id);
                        set({ pendingRemovals: clearedPending });
                    }, 5000);

                    get().addNotification({
                        id: Math.random().toString(),
                        title: 'board.system',
                        message: 'board.notificationLeftBoardSuccess',
                        text: 'board.notificationLeftBoardSuccess',
                        type: 'system'
                    });
                } catch (error) {
                    console.error('Error leaving board:', error);
                    // Rollback on error
                    const clearedPending = new Set(get().pendingRemovals);
                    clearedPending.delete(id);
                    set({ boards: previousBoards, pendingRemovals: clearedPending });

                    get().addNotification({
                        id: Math.random().toString(),
                        title: 'common.error',
                        message: 'board.errorLeaving',
                        text: 'board.errorLeaving',
                        type: 'error'
                    });
                    throw error;
                }
            },

            transferOwnership: async (boardId: string, newOwnerId: string) => {
                try {
                    const { user } = (await supabase.auth.getUser()).data;
                    if (!user) return;
                    await api.transferBoardOwnership(boardId, newOwnerId);
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
                    const invitation = get().invitations.find((inv: any) => inv.board_id === boardId);
                    const boardName = invitation?.boards?.name || '';

                    await api.updateInvitationStatus(boardId, userId, 'accepted');

                    set((state) => ({
                        activeNotifications: state.activeNotifications.filter(
                            n => !(n.boardId === boardId && n.userId === userId)
                        )
                    }));

                    await get().fetchInvitations(userId);
                    await get().fetchBoards(userId);

                    get().addNotification({
                        id: Math.random().toString(),
                        title: 'board.system',
                        message: 'board.nowMember',
                        text: 'board.nowMember',
                        type: 'system',
                        boardName: boardName,
                        userId: userId
                    });
                } catch (error) {
                    console.error('Error accepting invitation:', error);
                }
            },

            declineInvitation: async (boardId: string, userId: string) => {
                try {
                    await api.updateInvitationStatus(boardId, userId, 'declined');

                    set((state) => ({
                        activeNotifications: state.activeNotifications.filter(
                            n => !(n.boardId === boardId && n.userId === userId)
                        )
                    }));

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

            moveCard: async (activeId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex) => {
                const { user } = (await supabase.auth.getUser()).data;
                if (!user) return;

                const previousBoards = get().boards;
                const activeBoard = previousBoards.find(b => b.id === get().activeBoardId);
                if (!activeBoard) return;

                // Optimistic update
                const newBoards = previousBoards.map(board => {
                    if (board.id !== get().activeBoardId) return board;

                    const newColumns = board.columns.map(col => {
                        const newCards = [...col.cards];
                        if (col.id === sourceColumnId) {
                            const [movedCard] = newCards.splice(sourceIndex, 1);
                            if (col.id === destinationColumnId) {
                                newCards.splice(destinationIndex, 0, movedCard);
                            }
                            return { ...col, cards: newCards.map((c, i) => ({ ...c, order: i })) };
                        }
                        if (col.id === destinationColumnId) {
                            const sourceCol = board.columns.find(c => c.id === sourceColumnId);
                            const movedCard = sourceCol?.cards[sourceIndex];
                            if (movedCard) {
                                newCards.splice(destinationIndex, 0, { ...movedCard, columnId: destinationColumnId });
                            }
                            return { ...col, cards: newCards.map((c, i) => ({ ...c, order: i })) };
                        }
                        return col;
                    });

                    return { ...board, columns: newColumns };
                });

                set({ boards: newBoards });

                try {
                    // Update server - we just send the new position and column
                    await api.moveCard(activeId, destinationColumnId, destinationIndex);

                    // If columns changed, log activity
                    if (sourceColumnId !== destinationColumnId) {
                        const sourceTitle = activeBoard.columns.find(c => c.id === sourceColumnId)?.title || '';
                        const destTitle = activeBoard.columns.find(c => c.id === destinationColumnId)?.title || '';
                        await api.logActivity(activeId, user.id, '', 'move', { from: sourceTitle, to: destTitle });
                    }

                    // Fetch to ensure sync is optional here if optimistic is reliable
                    // await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error moving card:', error);
                    set({ boards: previousBoards });
                }
            },

            addCard: async (columnId, card) => {
                const state = get();
                const activeBoard = state.boards.find(b => b.id === state.activeBoardId);
                const column = activeBoard?.columns.find(col => col.id === columnId);
                const position = column?.cards.length || 0;

                try {
                    const newCard = await api.createCard(columnId, card.title || 'New Card', position);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user && newCard) {
                        await api.logActivity(newCard.id, user.id, 'board.createdCard', 'create');
                        await get().fetchBoards(user.id);
                    }
                } catch (error) {
                    console.error('Error adding card:', error);
                }
            },

            updateCard: async (cardId, updates) => {
                const previousBoards = get().boards;

                // Optimistic update
                const newBoards = previousBoards.map(board => {
                    if (board.id !== get().activeBoardId) return board;
                    return {
                        ...board,
                        columns: board.columns.map(col => ({
                            ...col,
                            cards: col.cards.map(card =>
                                card.id === cardId ? { ...card, ...updates } : card
                            )
                        }))
                    };
                });

                set({ boards: newBoards });

                try {
                    const allCards = previousBoards.flatMap(b => b.columns.flatMap(c => c.cards));
                    const originalCard = allCards.find(c => c.id === cardId);

                    await api.updateCard(cardId, updates);
                    const { user } = (await supabase.auth.getUser()).data;

                    if (user && originalCard) {
                        // Title Changes
                        if (updates.title && updates.title !== originalCard.title) {
                            await api.logActivity(cardId, user.id, `Cambió el título de "${originalCard.title}" a "${updates.title}"`, 'edit');
                        }

                        // Description Changes
                        if (updates.description !== undefined && updates.description !== originalCard.description) {
                            await api.logActivity(cardId, user.id, 'Editó la descripción', 'edit');
                        }

                        // Checklist Changes
                        if (updates.checklist && Array.isArray(updates.checklist)) {
                            const oldLen = originalCard.checklist?.length || 0;
                            const newLen = updates.checklist.length;
                            if (newLen > oldLen) {
                                await api.logActivity(cardId, user.id, 'Añadió un elemento a la lista', 'edit');
                            } else if (newLen < oldLen) {
                                await api.logActivity(cardId, user.id, 'Eliminó un elemento de la lista', 'edit');
                            } else {
                                // Checking for completion toggle
                                const toggledItem = updates.checklist.find((item, idx) =>
                                    originalCard.checklist && originalCard.checklist[idx] && item.completed !== originalCard.checklist[idx].completed
                                );
                                if (toggledItem) {
                                    const action = toggledItem.completed ? 'Completó' : 'Desmarcó';
                                    await api.logActivity(cardId, user.id, `${action} "${toggledItem.text}"`, 'edit');
                                }
                            }
                        }

                        // Label Changes
                        if (updates.labels && Array.isArray(updates.labels)) {
                            const oldLabels = originalCard.labels || [];
                            if (updates.labels.length > oldLabels.length) {
                                const newLabel = updates.labels[updates.labels.length - 1];
                                await api.logActivity(cardId, user.id, `Añadió la etiqueta "${newLabel.text}"`, 'edit');
                            }
                        }

                        // Priority Changes
                        if (updates.priority && updates.priority !== originalCard.priority) {
                            await api.logActivity(cardId, user.id, `Cambió la prioridad a "${updates.priority}"`, 'edit');
                        }

                        // Refresh activities only
                        await get().loadCardActivities(cardId);
                    }
                } catch (error) {
                    console.error('Error updating card:', error);
                    set({ boards: previousBoards });
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

            addActivity: async (cardId, text, type) => {
                try {
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) {
                        await api.logActivity(cardId, user.id, text, type);
                        await get().fetchBoards(user.id);
                    }
                } catch (error) {
                    console.error('Error adding activity:', error);
                }
            },

            loadCardActivities: async (cardId: string) => {
                try {
                    const activities = await api.fetchCardActivities(cardId);
                    set((state) => ({
                        boards: state.boards.map(board => ({
                            ...board,
                            columns: board.columns.map(col => ({
                                ...col,
                                cards: col.cards.map(card => {
                                    if (card.id === cardId) {
                                        return {
                                            ...card,
                                            activity: activities.map(a => {
                                                // Handle profiles as both object and array depending on Supabase version/join depth
                                                const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                                                return {
                                                    id: a.id,
                                                    text: a.text || '',
                                                    type: a.type || 'system',
                                                    timestamp: a.created_at,
                                                    params: a.params || {},
                                                    user: profile ? {
                                                        id: profile.id,
                                                        name: profile.full_name,
                                                        avatar: profile.avatar_url
                                                    } : undefined
                                                };
                                            })
                                        };
                                    }
                                    return card;
                                })
                            }))
                        }))
                    }));
                } catch (error) {
                    console.error('Error loading card activities:', error);
                }
            },

            addCardMember: async (cardId, userId) => {
                try {
                    await api.addCardMember(cardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) {
                        await api.logActivity(cardId, user.id, 'Se unió a la tarjeta', 'addon');
                        await get().fetchBoards(user.id);
                        await get().loadCardActivities(cardId);
                    }
                } catch (error) {
                    console.error('Error adding card member:', error);
                }
            },

            removeCardMember: async (cardId, userId) => {
                try {
                    await api.removeCardMember(cardId, userId);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) {
                        await api.logActivity(cardId, user.id, 'Dejó la tarjeta', 'addon');
                        await get().fetchBoards(user.id);
                        await get().loadCardActivities(cardId);
                    }
                } catch (error) {
                    console.error('Error removing card member:', error);
                }
            },

            addColumn: async (title) => {
                try {
                    const boardId = get().activeBoardId;
                    if (!boardId) return;
                    const activeBoard = get().boards.find(b => b.id === boardId);
                    const position = activeBoard?.columns.length || 0;
                    await api.createColumn(boardId, title, position);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error adding column:', error);
                }
            },

            updateColumn: async (columnId, updates) => {
                const previousBoards = get().boards;
                
                // Optimistic update
                set((state) => ({
                    boards: state.boards.map(board => ({
                        ...board,
                        columns: board.columns.map(col => 
                            col.id === columnId ? { ...col, ...updates } : col
                        )
                    }))
                }));

                try {
                    await api.updateColumn(columnId, updates);
                    const { user } = (await supabase.auth.getUser()).data;
                    if (user) await get().fetchBoards(user.id);
                } catch (error) {
                    console.error('Error updating column:', error);
                    set({ boards: previousBoards });
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
                set((state) => ({
                    tagFilter: state.tagFilter.includes(tag)
                        ? state.tagFilter.filter((t) => t !== tag)
                        : [...state.tagFilter, tag],
                })),

            togglePriorityFilter: (priority: string) =>
                set((state) => ({
                    priorityFilter: state.priorityFilter.includes(priority)
                        ? state.priorityFilter.filter((p) => p !== priority)
                        : [...state.priorityFilter, priority],
                })),

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
